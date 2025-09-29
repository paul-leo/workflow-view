import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';
import { BaseWorkflow } from '../abstract/BaseWorkflow';

// 工作流节点的输入类型
export interface WorkflowNodeInput extends Record<string, unknown> {
  // 传递给子工作流的数据
  data?: unknown;
  // 可以传递特定的参数给子工作流
  parameters?: Record<string, unknown>;
}

// 工作流节点的输出类型
export interface WorkflowNodeOutput extends Record<string, unknown> {
  // 子工作流的执行结果
  workflowResults: Map<string, unknown>;
  // 最终输出数据（通常是最后一个节点的结果）
  finalOutput?: unknown;
  // 执行统计信息
  executionStats: {
    totalNodes: number;
    successfulNodes: number;
    failedNodes: number;
    executionTime: number;
  };
}

// 工作流节点的设置类型
export interface WorkflowNodeSettings extends Record<string, unknown> {
  // 子工作流的配置
  subWorkflow: BaseWorkflow;
  // 是否并行执行（如果子工作流支持）
  parallel?: boolean;
  // 超时设置（毫秒）
  timeout?: number;
  // 错误处理策略
  errorStrategy?: 'stop' | 'continue' | 'retry';
  // 重试次数
  maxRetries?: number;
  // 输入映射配置
  inputMapping?: Record<string, string>; // 将父工作流的数据映射到子工作流
  // 输出映射配置
  outputMapping?: Record<string, string>; // 从子工作流提取特定数据
}

// 工作流节点实现 - Block概念
export class WorkflowNode extends BaseNode<WorkflowNodeInput, WorkflowNodeOutput, WorkflowNodeSettings> {
  constructor(id: string, settings: WorkflowNodeSettings) {
    super(
      {
        id,
        name: '子工作流',
        type: 'workflow-block'
      },
      settings
    );
  }

  public async execute(
    inputs: WorkflowNodeInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<WorkflowNodeOutput>> {
    const startTime = Date.now();
    
    try {
      const { subWorkflow, inputMapping, outputMapping, timeout, errorStrategy, maxRetries = 0 } = this.settings;
      
      console.log(`执行子工作流: ${subWorkflow.config.name} (ID: ${subWorkflow.config.id})`);

      // 1. 准备子工作流的输入数据
      const subWorkflowInputs = this.prepareSubWorkflowInputs(inputs, inputMapping);
      
      // 2. 设置子工作流的执行上下文
      this.setupSubWorkflowContext(subWorkflow, context, subWorkflowInputs);
      
      // 3. 执行子工作流（支持重试）
      let workflowResults: Map<string, NodeExecutionResult>;
      let attempts = 0;
      
      while (attempts <= maxRetries) {
        try {
          // 执行子工作流（带超时控制）
          if (timeout) {
            workflowResults = await this.executeWithTimeout(subWorkflow, timeout);
          } else {
            workflowResults = await subWorkflow.execute();
          }
          break; // 成功执行，跳出重试循环
        } catch (error) {
          attempts++;
          if (attempts > maxRetries) {
            throw error; // 超过重试次数，抛出错误
          }
          console.warn(`子工作流执行失败，重试 ${attempts}/${maxRetries}:`, error);
          await this.delay(1000 * attempts); // 指数退避
        }
      }

      // 4. 处理执行结果
      const executionStats = this.calculateExecutionStats(workflowResults!, startTime);
      
      // 5. 检查是否有失败的节点
      const hasFailures = Array.from(workflowResults!.values()).some(result => !result.success);
      
      if (hasFailures && errorStrategy === 'stop') {
        const failedNodes = Array.from(workflowResults!.entries())
          .filter(([, result]) => !result.success)
          .map(([nodeId]) => nodeId);
        
        throw new Error(`子工作流中的节点执行失败: ${failedNodes.join(', ')}`);
      }

      // 6. 提取最终输出
      const finalOutput = this.extractFinalOutput(workflowResults!, outputMapping);
      
      // 7. 构建输出数据
      const outputData: WorkflowNodeOutput = {
        workflowResults: new Map(Array.from(workflowResults!.entries()).map(([k, v]) => [k, v.data])),
        finalOutput,
        executionStats
      };

      return {
        success: true,
        data: outputData
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          workflowResults: new Map(),
          executionStats: {
            totalNodes: this.settings.subWorkflow.nodes.size,
            successfulNodes: 0,
            failedNodes: this.settings.subWorkflow.nodes.size,
            executionTime
          }
        }
      };
    }
  }

  // 准备子工作流的输入数据
  private prepareSubWorkflowInputs(
    inputs: WorkflowNodeInput, 
    inputMapping?: Record<string, string>
  ): Record<string, unknown> {
    if (!inputMapping) {
      return inputs;
    }

    const mappedInputs: Record<string, unknown> = {};
    
    for (const [targetKey, sourceKey] of Object.entries(inputMapping)) {
      const value = this.getValueByPath(inputs, sourceKey);
      if (value !== undefined) {
        mappedInputs[targetKey] = value;
      }
    }

    return mappedInputs;
  }

  // 设置子工作流的执行上下文
  private setupSubWorkflowContext(
    subWorkflow: BaseWorkflow,
    parentContext: NodeExecutionContext,
    inputs: Record<string, unknown>
  ): void {
    // 简化实现：只记录上下文设置
    console.log(`设置子工作流上下文: 父工作流=${parentContext.workflowId}, 输入数据键=${Object.keys(inputs).join(', ')}`);
    console.log(`子工作流节点数量: ${subWorkflow.nodes.size}`);
  }

  // 带超时的执行
  private async executeWithTimeout(
    subWorkflow: BaseWorkflow, 
    timeout: number
  ): Promise<Map<string, NodeExecutionResult>> {
    return Promise.race([
      subWorkflow.execute(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`子工作流执行超时 (${timeout}ms)`)), timeout);
      })
    ]);
  }

  // 计算执行统计信息
  private calculateExecutionStats(
    results: Map<string, NodeExecutionResult>, 
    startTime: number
  ): WorkflowNodeOutput['executionStats'] {
    const totalNodes = results.size;
    const successfulNodes = Array.from(results.values()).filter(r => r.success).length;
    const failedNodes = totalNodes - successfulNodes;
    const executionTime = Date.now() - startTime;

    return {
      totalNodes,
      successfulNodes,
      failedNodes,
      executionTime
    };
  }

  // 提取最终输出
  private extractFinalOutput(
    results: Map<string, NodeExecutionResult>,
    outputMapping?: Record<string, string>
  ): unknown {
    if (!outputMapping) {
      // 如果没有输出映射，返回最后一个成功节点的结果
      const successfulResults = Array.from(results.entries())
        .filter(([, result]) => result.success && result.data);
      
      if (successfulResults.length > 0) {
        return successfulResults[successfulResults.length - 1][1].data;
      }
      return null;
    }

    // 根据输出映射提取数据
    const extractedData: Record<string, unknown> = {};
    
    for (const [targetKey, sourceKey] of Object.entries(outputMapping)) {
      const value = this.extractValueFromResults(results, sourceKey);
      if (value !== undefined) {
        extractedData[targetKey] = value;
      }
    }

    return extractedData;
  }

  // 从结果中提取值
  private extractValueFromResults(results: Map<string, NodeExecutionResult>, path: string): unknown {
    const parts = path.split('.');
    if (parts.length < 2) return undefined;
    
    const nodeId = parts[0];
    const fieldPath = parts.slice(1);
    
    const nodeResult = results.get(nodeId);
    if (!nodeResult?.success || !nodeResult.data) return undefined;
    
    return this.getValueByPath(nodeResult.data, fieldPath.join('.'));
  }

  // 根据路径获取值
  private getValueByPath(obj: unknown, path: string): unknown {
    if (!path || !obj || typeof obj !== 'object') return obj;
    
    const parts = path.split('.');
    let current: unknown = obj;
    
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    
    return current;
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 工作流节点构建器 - 便于创建复杂的工作流节点
export class WorkflowNodeBuilder {
  private config: Partial<WorkflowNodeSettings> = {};
  private nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  // 设置子工作流
  public setSubWorkflow(workflow: BaseWorkflow): this {
    this.config.subWorkflow = workflow;
    return this;
  }

  // 设置输入映射
  public setInputMapping(mapping: Record<string, string>): this {
    this.config.inputMapping = mapping;
    return this;
  }

  // 设置输出映射
  public setOutputMapping(mapping: Record<string, string>): this {
    this.config.outputMapping = mapping;
    return this;
  }

  // 设置超时
  public setTimeout(timeout: number): this {
    this.config.timeout = timeout;
    return this;
  }

  // 设置错误策略
  public setErrorStrategy(strategy: 'stop' | 'continue' | 'retry', maxRetries?: number): this {
    this.config.errorStrategy = strategy;
    if (maxRetries !== undefined) {
      this.config.maxRetries = maxRetries;
    }
    return this;
  }

  // 构建工作流节点
  public build(): WorkflowNode {
    if (!this.config.subWorkflow) {
      throw new Error('子工作流是必需的');
    }

    const settings: WorkflowNodeSettings = {
      subWorkflow: this.config.subWorkflow,
      parallel: this.config.parallel ?? false,
      timeout: this.config.timeout ?? 30000,
      errorStrategy: this.config.errorStrategy ?? 'stop',
      maxRetries: this.config.maxRetries ?? 0,
      inputMapping: this.config.inputMapping,
      outputMapping: this.config.outputMapping
    };

    return new WorkflowNode(this.nodeId, settings);
  }
}
