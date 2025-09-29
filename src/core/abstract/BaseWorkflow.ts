import { BaseNode } from './BaseNode';
import type { NodeExecutionContext, NodeExecutionResult } from './BaseNode';

// 工作流连接定义
export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  type?: 'data' | 'control' | 'error';
  condition?: string; // 条件表达式，用于条件分支
  metadata?: Record<string, any>;
}

// 工作流执行状态
export type WorkflowExecutionStatus = 
  | 'idle' 
  | 'running' 
  | 'completed' 
  | 'error' 
  | 'paused' 
  | 'cancelled';

// 工作流执行结果
export interface WorkflowExecutionResult {
  executionId: string;
  status: WorkflowExecutionStatus;
  startTime: Date;
  endTime?: Date;
  results: Map<string, NodeExecutionResult>;
  errors: Array<{
    nodeId: string;
    error: Error;
    timestamp: Date;
  }>;
  metadata: Record<string, any>;
}

// 工作流配置
export interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  version: string;
  tags?: string[];
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

// 工作流执行选项
export interface WorkflowExecutionOptions {
  startNodeIds?: string[]; // 指定起始节点，如果不指定则自动查找
  maxConcurrency?: number; // 最大并发执行节点数
  timeout?: number; // 超时时间（毫秒）
  skipValidation?: boolean; // 是否跳过验证
  debugMode?: boolean; // 调试模式
  variables?: Record<string, any>; // 工作流变量
}

// 抽象工作流基类
export abstract class BaseWorkflow {
  public readonly config: WorkflowConfig;
  protected nodes: Map<string, BaseNode> = new Map();
  protected connections: Map<string, WorkflowConnection> = new Map();
  protected executionHistory: WorkflowExecutionResult[] = [];
  
  // 工作流状态
  public status: WorkflowExecutionStatus = 'idle';
  public currentExecution?: WorkflowExecutionResult;

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  // 添加节点
  public addNode(node: BaseNode): void {
    if (this.nodes.has(node.config.id)) {
      throw new Error(`Node with id '${node.config.id}' already exists in workflow`);
    }
    this.nodes.set(node.config.id, node);
  }

  // 移除节点
  public removeNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node with id '${nodeId}' not found in workflow`);
    }
    
    // 移除相关连接
    const connectionsToRemove = Array.from(this.connections.values())
      .filter(conn => conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId)
      .map(conn => conn.id);
    
    connectionsToRemove.forEach(connId => this.connections.delete(connId));
    
    // 移除节点
    this.nodes.delete(nodeId);
  }

  // 添加连接
  public addConnection(connection: WorkflowConnection): void {
    // 验证连接的有效性
    this.validateConnection(connection);
    
    if (this.connections.has(connection.id)) {
      throw new Error(`Connection with id '${connection.id}' already exists`);
    }
    
    this.connections.set(connection.id, connection);
  }

  // 移除连接
  public removeConnection(connectionId: string): void {
    if (!this.connections.has(connectionId)) {
      throw new Error(`Connection with id '${connectionId}' not found`);
    }
    this.connections.delete(connectionId);
  }

  // 验证连接的有效性
  private validateConnection(connection: WorkflowConnection): void {
    const sourceNode = this.nodes.get(connection.sourceNodeId);
    const targetNode = this.nodes.get(connection.targetNodeId);
    
    if (!sourceNode) {
      throw new Error(`Source node '${connection.sourceNodeId}' not found`);
    }
    
    if (!targetNode) {
      throw new Error(`Target node '${connection.targetNodeId}' not found`);
    }
    
    // 检查端口是否存在
    const sourcePort = sourceNode.outputPorts.get(connection.sourcePortId);
    const targetPort = targetNode.inputPorts.get(connection.targetPortId);
    
    if (!sourcePort) {
      throw new Error(
        `Output port '${connection.sourcePortId}' not found on node '${connection.sourceNodeId}'`
      );
    }
    
    if (!targetPort) {
      throw new Error(
        `Input port '${connection.targetPortId}' not found on node '${connection.targetNodeId}'`
      );
    }
    
    // 检查类型兼容性
    if (!targetNode.isInputCompatible(connection.targetPortId, sourcePort)) {
      throw new Error(
        `Type mismatch: Cannot connect ${sourcePort.type} to ${targetPort.type}`
      );
    }
    
    // 检查是否会形成循环
    if (this.wouldCreateCycle(connection)) {
      throw new Error('Connection would create a cycle in the workflow');
    }
  }

  // 检查是否会形成循环依赖
  private wouldCreateCycle(newConnection: WorkflowConnection): boolean {
    // 使用深度优先搜索检测环
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    // 临时添加新连接进行检测
    const tempConnections = new Map(this.connections);
    tempConnections.set(newConnection.id, newConnection);
    
    const hasCycleDFS = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      // 查找所有从当前节点出发的连接
      for (const connection of tempConnections.values()) {
        if (connection.sourceNodeId === nodeId) {
          if (hasCycleDFS(connection.targetNodeId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    // 从所有节点开始检测
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // 获取节点的所有输入连接
  public getNodeInputConnections(nodeId: string): WorkflowConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.targetNodeId === nodeId);
  }

  // 获取节点的所有输出连接
  public getNodeOutputConnections(nodeId: string): WorkflowConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.sourceNodeId === nodeId);
  }

  // 获取工作流的起始节点（没有输入连接的节点）
  public getStartNodes(): BaseNode[] {
    const nodesWithInputs = new Set(
      Array.from(this.connections.values()).map(conn => conn.targetNodeId)
    );
    
    return Array.from(this.nodes.values())
      .filter(node => !nodesWithInputs.has(node.config.id));
  }

  // 获取工作流的结束节点（没有输出连接的节点）
  public getEndNodes(): BaseNode[] {
    const nodesWithOutputs = new Set(
      Array.from(this.connections.values()).map(conn => conn.sourceNodeId)
    );
    
    return Array.from(this.nodes.values())
      .filter(node => !nodesWithOutputs.has(node.config.id));
  }

  // 拓扑排序，获取节点执行顺序
  public getExecutionOrder(): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    
    // 初始化
    for (const nodeId of this.nodes.keys()) {
      inDegree.set(nodeId, 0);
      adjList.set(nodeId, []);
    }
    
    // 构建图和计算入度
    for (const connection of this.connections.values()) {
      const source = connection.sourceNodeId;
      const target = connection.targetNodeId;
      
      adjList.get(source)!.push(target);
      inDegree.set(target, inDegree.get(target)! + 1);
    }
    
    // Kahn算法进行拓扑排序
    const queue: string[] = [];
    const result: string[] = [];
    
    // 将入度为0的节点加入队列
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      // 更新相邻节点的入度
      for (const neighbor of adjList.get(current)!) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    if (result.length !== this.nodes.size) {
      throw new Error('Workflow contains cycles and cannot be executed');
    }
    
    return result;
  }

  // 执行工作流
  public async execute(
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecutionResult = {
      executionId,
      status: 'running',
      startTime: new Date(),
      results: new Map(),
      errors: [],
      metadata: { ...options.variables }
    };
    
    this.currentExecution = execution;
    this.status = 'running';
    
    try {
      // 验证工作流
      if (!options.skipValidation) {
        this.validate();
      }
      
      // 准备执行上下文
      const context: NodeExecutionContext = {
        workflowId: this.config.id,
        nodeId: '', // 将在执行每个节点时设置
        executionId,
        previousResults: new Map(),
        metadata: execution.metadata
      };
      
      // 获取执行顺序
      const executionOrder = this.getExecutionOrder();
      
      // 按顺序执行节点
      for (const nodeId of executionOrder) {
        const node = this.nodes.get(nodeId)!;
        context.nodeId = nodeId;
        
        // 收集输入数据
        const inputs = await this.collectNodeInputs(nodeId, context);
        
        // 执行节点
        const result = await node.safeExecute(inputs, context);
        execution.results.set(nodeId, result);
        
        if (!result.success) {
          execution.errors.push({
            nodeId,
            error: result.error!,
            timestamp: new Date()
          });
          
          // 根据错误处理策略决定是否继续
          if (this.shouldStopOnError(nodeId, result.error!)) {
            execution.status = 'error';
            break;
          }
        } else {
          // 更新上下文中的结果
          context.previousResults.set(nodeId, result.data);
        }
      }
      
      if (execution.status === 'running') {
        execution.status = 'completed';
      }
      
    } catch (error) {
      execution.status = 'error';
      execution.errors.push({
        nodeId: 'workflow',
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: new Date()
      });
    } finally {
      execution.endTime = new Date();
      this.status = execution.status;
      this.executionHistory.push(execution);
      this.currentExecution = undefined;
    }
    
    return execution;
  }

  // 收集节点的输入数据
  private async collectNodeInputs(
    nodeId: string,
    context: NodeExecutionContext
  ): Promise<Record<string, any>> {
    const inputs: Record<string, any> = {};
    const inputConnections = this.getNodeInputConnections(nodeId);
    
    for (const connection of inputConnections) {
      const sourceResult = context.previousResults.get(connection.sourceNodeId);
      if (sourceResult && sourceResult[connection.sourcePortId] !== undefined) {
        inputs[connection.targetPortId] = sourceResult[connection.sourcePortId];
      }
    }
    
    return inputs;
  }

  // 验证工作流的完整性
  public validate(): void {
    if (this.nodes.size === 0) {
      throw new Error('Workflow must contain at least one node');
    }
    
    // 检查是否有孤立节点
    const connectedNodes = new Set<string>();
    for (const connection of this.connections.values()) {
      connectedNodes.add(connection.sourceNodeId);
      connectedNodes.add(connection.targetNodeId);
    }
    
    const isolatedNodes = Array.from(this.nodes.keys())
      .filter(nodeId => !connectedNodes.has(nodeId));
    
    if (isolatedNodes.length > 0 && this.nodes.size > 1) {
      console.warn(`Isolated nodes found: ${isolatedNodes.join(', ')}`);
    }
    
    // 验证所有连接
    for (const connection of this.connections.values()) {
      this.validateConnection(connection);
    }
  }

  // 错误处理策略
  protected shouldStopOnError(nodeId: string, error: Error): boolean {
    // 默认遇到错误就停止，子类可以重写此方法实现更复杂的错误处理
    return true;
  }

  // 获取工作流信息
  public getWorkflowInfo() {
    return {
      config: this.config,
      status: this.status,
      nodeCount: this.nodes.size,
      connectionCount: this.connections.size,
      nodes: Array.from(this.nodes.values()).map(node => node.getNodeInfo()),
      connections: Array.from(this.connections.values()),
      executionHistory: this.executionHistory.length
    };
  }

  // 克隆工作流
  public clone(newId?: string): BaseWorkflow {
    const cloned = Object.create(Object.getPrototypeOf(this));
    cloned.config = { ...this.config, id: newId || this.config.id };
    cloned.nodes = new Map();
    cloned.connections = new Map(this.connections);
    cloned.executionHistory = [];
    cloned.status = 'idle';
    
    // 克隆所有节点
    for (const [nodeId, node] of this.nodes) {
      cloned.nodes.set(nodeId, node.clone());
    }
    
    return cloned;
  }

  // 导出工作流定义
  public export(): object {
    return {
      config: this.config,
      nodes: Array.from(this.nodes.values()).map(node => ({
        ...node.getNodeInfo(),
        className: node.constructor.name
      })),
      connections: Array.from(this.connections.values())
    };
  }

  // 暂停工作流执行
  public pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
    }
  }

  // 恢复工作流执行
  public resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
    }
  }

  // 取消工作流执行
  public cancel(): void {
    if (this.status === 'running' || this.status === 'paused') {
      this.status = 'cancelled';
      if (this.currentExecution) {
        this.currentExecution.status = 'cancelled';
        this.currentExecution.endTime = new Date();
      }
    }
  }
}
