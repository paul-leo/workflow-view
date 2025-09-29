import { BaseNode } from './BaseNode';
import type { NodeExecutionContext, NodeExecutionResult } from './BaseNode';

// 工作流连接定义
export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

// 工作流配置
export interface WorkflowConfig {
  id: string;
  name: string;
}

// 抽象工作流基类
export class BaseWorkflow {
  public readonly config: WorkflowConfig;
  public nodes: Map<string, BaseNode> = new Map();
  public connections: Map<string, WorkflowConnection> = new Map();

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  // 添加节点
  public addNode(node: BaseNode): void {
    this.nodes.set(node.config.id, node);
  }

  // 添加连接
  public addConnection(connection: WorkflowConnection): void {
    this.connections.set(connection.id, connection);
  }

  // 执行工作流
  public async execute(): Promise<Map<string, NodeExecutionResult>> {
    const results = new Map<string, NodeExecutionResult>();
    const context: NodeExecutionContext = {
      workflowId: this.config.id,
      nodeId: '',
      previousResults: new Map()
    };

    // 简单顺序执行所有节点
    for (const [nodeId, node] of this.nodes) {
      context.nodeId = nodeId;
      
      // 收集输入数据
      const inputs = this.collectNodeInputs(nodeId, context);
      
      // 执行节点
      const result = await node.execute(inputs, context);
      results.set(nodeId, result);
      
      // 保存结果供后续节点使用
      if (result.success && result.data) {
        context.previousResults.set(nodeId, result.data);
      }
    }

    return results;
  }

  // 收集节点输入数据
  private collectNodeInputs(nodeId: string, context: NodeExecutionContext): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};
    
    // 查找指向此节点的连接
    for (const connection of this.connections.values()) {
      if (connection.targetNodeId === nodeId) {
        const sourceData = context.previousResults.get(connection.sourceNodeId);
        if (sourceData) {
          Object.assign(inputs, sourceData);
        }
      }
    }
    
    return inputs;
  }
}
