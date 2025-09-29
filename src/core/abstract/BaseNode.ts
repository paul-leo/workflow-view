// 简化的节点端口定义

// 节点执行上下文
export interface NodeExecutionContext {
  workflowId: string;
  nodeId: string;
  executionId: string;
  previousResults: Map<string, unknown>;
  metadata: Record<string, unknown>;
}

// 节点执行结果
export interface NodeExecutionResult<TOutput = unknown> {
  success: boolean;
  data?: TOutput;
  error?: Error;
  metadata?: Record<string, unknown>;
  nextNodes?: string[]; // 指定下一个要执行的节点ID
}

// 节点端口定义
export interface NodePort {
  id: string;
  name: string;
  type: string; // 简化为字符串类型
  required: boolean;
  description?: string;
}

// 节点输入端口
export interface InputPort extends NodePort {
  defaultValue?: unknown;
  allowMultiple?: boolean; // 是否允许多个连接
}

// 节点输出端口
export interface OutputPort extends NodePort {
  // 简化的输出端口
}

// 节点配置接口
export interface NodeConfig {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  version: string;
  icon?: string;
  color?: string;
  tags?: string[];
}

// 抽象基础节点类
export abstract class BaseNode<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput extends Record<string, unknown> = Record<string, unknown>,
  TSettings extends Record<string, unknown> = Record<string, unknown>
> {
  public readonly config: NodeConfig;
  public readonly inputPorts: Map<string, InputPort>;
  public readonly outputPorts: Map<string, OutputPort>;
  public settings: TSettings;
  
  // 节点状态
  public status: 'idle' | 'running' | 'completed' | 'error' | 'paused' = 'idle';
  public lastExecutionTime?: Date;
  public executionCount: number = 0;

  constructor(
    config: NodeConfig,
    settings: TSettings
  ) {
    this.config = config;
    this.settings = settings;
    this.inputPorts = new Map();
    this.outputPorts = new Map();
    
    // 子类需要在构造函数中调用 this.defineInputs() 和 this.defineOutputs()
    this.defineInputs();
    this.defineOutputs();
  }

  // 抽象方法：定义输入端口
  protected abstract defineInputs(): void;
  
  // 抽象方法：定义输出端口
  protected abstract defineOutputs(): void;
  
  // 抽象方法：节点执行逻辑
  public abstract execute(
    inputs: TInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<TOutput>>;

  // 添加输入端口的辅助方法
  protected addInputPort(
    id: keyof TInput,
    port: Omit<InputPort, 'id'>
  ): void {
    this.inputPorts.set(id as string, {
      id: id as string,
      ...port
    });
  }

  // 添加输出端口的辅助方法
  protected addOutputPort(
    id: keyof TOutput,
    port: Omit<OutputPort, 'id'>
  ): void {
    this.outputPorts.set(id as string, {
      id: id as string,
      ...port
    });
  }

  // 检查输入端口是否兼容
  public isInputCompatible(portId: string, sourcePort: OutputPort): boolean {
    const inputPort = this.inputPorts.get(portId);
    if (!inputPort) return false;
    
    // 简单的类型兼容性检查
    return inputPort.type === sourcePort.type || 
           sourcePort.type === 'any' || 
           inputPort.type === 'any';
  }

  // 获取节点信息
  public getNodeInfo() {
    return {
      config: this.config,
      status: this.status,
      inputPorts: Array.from(this.inputPorts.values()),
      outputPorts: Array.from(this.outputPorts.values()),
      settings: this.settings,
      executionCount: this.executionCount,
      lastExecutionTime: this.lastExecutionTime
    };
  }

  // 克隆节点（用于工作流模板）
  public clone(newId?: string): BaseNode<TInput, TOutput, TSettings> {
    const cloned = Object.create(Object.getPrototypeOf(this));
    cloned.config = { ...this.config, id: newId || this.config.id };
    cloned.settings = JSON.parse(JSON.stringify(this.settings));
    cloned.inputPorts = new Map(this.inputPorts);
    cloned.outputPorts = new Map(this.outputPorts);
    cloned.status = 'idle';
    cloned.executionCount = 0;
    cloned.lastExecutionTime = undefined;
    return cloned;
  }

  // 更新节点状态
  protected updateStatus(status: typeof this.status): void {
    this.status = status;
    if (status === 'completed') {
      this.executionCount++;
      this.lastExecutionTime = new Date();
    }
  }

  // 简化的执行方法
  public async safeExecute(
    inputs: TInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<TOutput>> {
    try {
      this.updateStatus('running');
      
      // 直接执行节点逻辑
      const result = await this.execute(inputs, context);
      
      this.updateStatus(result.success ? 'completed' : 'error');
      return result;
      
    } catch (error) {
      this.updateStatus('error');
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}
