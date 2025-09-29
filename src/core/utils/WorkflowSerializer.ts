import { BaseWorkflow, type WorkflowConnection, type WorkflowConfig } from '../abstract/BaseWorkflow';
import { BaseNode, type NodeConfig } from '../abstract/BaseNode';
import { TimerTriggerNode } from '../nodes/TimerTriggerNode';
import { HttpRequestNode } from '../nodes/HttpRequestNode';
import { CodeNode } from '../nodes/CodeNode';
import { AgentNode } from '../nodes/AgentNode';
import { ConditionNode } from '../nodes/ConditionNode';

// 序列化后的工作流 JSON 接口
export interface SerializedWorkflow {
  config: WorkflowConfig;
  nodes: SerializedNode[];
  connections: WorkflowConnection[];
  metadata?: {
    version: string;
    createdAt: string;
    updatedAt: string;
    description?: string;
  };
}

// 序列化后的节点接口
export interface SerializedNode {
  config: NodeConfig;
  settings: Record<string, unknown>;
  originalSettings: Record<string, unknown>;
}

// 节点构造函数类型（注册表内部使用统一签名）
type AnySettings = Record<string, unknown>;
type NodeConstructorAny = new (
  id: string,
  settings: AnySettings
) => BaseNode;

// 节点类型注册表
export class NodeRegistry {
  private static nodeTypes = new Map<string, NodeConstructorAny>();

  // 注册节点类型
  static registerNodeType<TSettings extends AnySettings>(
    nodeType: string,
    constructor: new (id: string, settings: TSettings) => BaseNode
  ): void {
    this.nodeTypes.set(nodeType, constructor as unknown as NodeConstructorAny);
  }

  // 获取节点构造函数
  static getNodeConstructor(nodeType: string): NodeConstructorAny | undefined {
    return this.nodeTypes.get(nodeType);
  }

  // 获取所有注册的节点类型
  static getRegisteredTypes(): string[] {
    return Array.from(this.nodeTypes.keys());
  }

  // 检查节点类型是否已注册
  static isRegistered(nodeType: string): boolean {
    return this.nodeTypes.has(nodeType);
  }

  // 初始化内置节点类型
  static initializeBuiltinTypes(): void {
    this.registerNodeType('timer-trigger', TimerTriggerNode);
    this.registerNodeType('http-request', HttpRequestNode);
    this.registerNodeType('code', CodeNode);
    this.registerNodeType('agent', AgentNode);
    this.registerNodeType('condition', ConditionNode);
  }
}

// 工作流序列化器
export class WorkflowSerializer {
  /**
   * 将工作流实例序列化为 JSON
   */
  static toJSON(workflow: BaseWorkflow): SerializedWorkflow {
    // 序列化节点
    const serializedNodes: SerializedNode[] = [];
    for (const [nodeId, node] of workflow.nodes) {
      serializedNodes.push({
        config: {
          id: nodeId,
          name: node.config.name,
          type: node.config.type
        },
        settings: this.deepClone(node.settings),
        originalSettings: this.deepClone(node.originalSettings)
      });
    }

    // 序列化连接
    const serializedConnections: WorkflowConnection[] = [];
    for (const connection of workflow.connections.values()) {
      serializedConnections.push({
        id: connection.id,
        sourceNodeId: connection.sourceNodeId,
        targetNodeId: connection.targetNodeId
      });
    }

    // 构建序列化结果
    const serialized: SerializedWorkflow = {
      config: {
        id: workflow.config.id,
        name: workflow.config.name
      },
      nodes: serializedNodes,
      connections: serializedConnections,
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: `Serialized workflow: ${workflow.config.name}`
      }
    };

    return serialized;
  }

  /**
   * 从 JSON 反序列化为工作流实例
   */
  static fromJSON(serializedWorkflow: SerializedWorkflow): BaseWorkflow {
    // 确保节点类型已注册
    NodeRegistry.initializeBuiltinTypes();

    // 创建工作流实例
    const workflow = new BaseWorkflow(serializedWorkflow.config);

    // 反序列化节点
    for (const serializedNode of serializedWorkflow.nodes) {
      const nodeConstructor = NodeRegistry.getNodeConstructor(serializedNode.config.type);
      if (!nodeConstructor) {
        throw new Error(`Unknown node type: ${serializedNode.config.type}`);
      }

      try {
        // 创建节点实例
        const node = new nodeConstructor(
          serializedNode.config.id,
          serializedNode.settings
        );

        // 恢复原始设置（包含表达式）
        if (serializedNode.originalSettings) {
          (node as unknown as { originalSettings: Record<string, unknown> }).originalSettings =
            this.deepClone(serializedNode.originalSettings);
        }

        workflow.addNode(node);
      } catch (error) {
        throw new Error(
          `Failed to create node ${serializedNode.config.id} of type ${serializedNode.config.type}: ${error}`
        );
      }
    }

    // 反序列化连接
    for (const connection of serializedWorkflow.connections) {
      workflow.addConnection(connection);
    }

    return workflow;
  }

  /**
   * 验证序列化的工作流 JSON
   */
  static validate(serializedWorkflow: unknown): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!serializedWorkflow || typeof serializedWorkflow !== 'object') {
      errors.push('Invalid workflow: must be an object');
      return { valid: false, errors };
    }

    const workflow = serializedWorkflow as Record<string, unknown>;

    // 验证基本结构
    if (!workflow.config || typeof workflow.config !== 'object') {
      errors.push('Missing or invalid config');
    } else {
      const config = workflow.config as Record<string, unknown>;
      if (!config.id || typeof config.id !== 'string') {
        errors.push('Config missing required field: id');
      }
      if (!config.name || typeof config.name !== 'string') {
        errors.push('Config missing required field: name');
      }
    }

    if (!Array.isArray(workflow.nodes)) {
      errors.push('Missing or invalid nodes array');
    } else {
      // 验证节点
      for (let i = 0; i < workflow.nodes.length; i++) {
        const node = workflow.nodes[i];
        if (!node || typeof node !== 'object') {
          errors.push(`Node at index ${i} is invalid`);
          continue;
        }

        const nodeObj = node as Record<string, unknown>;
        if (!nodeObj.config || typeof nodeObj.config !== 'object') {
          errors.push(`Node at index ${i} missing config`);
        } else {
          const nodeConfig = nodeObj.config as Record<string, unknown>;
          if (!nodeConfig.id || typeof nodeConfig.id !== 'string') {
            errors.push(`Node at index ${i} missing config.id`);
          }
          if (!nodeConfig.type || typeof nodeConfig.type !== 'string') {
            errors.push(`Node at index ${i} missing config.type`);
          } else {
            // 检查节点类型是否已注册
            NodeRegistry.initializeBuiltinTypes();
            if (!NodeRegistry.isRegistered(nodeConfig.type as string)) {
              errors.push(`Node at index ${i} has unknown type: ${nodeConfig.type}`);
            }
          }
        }

        if (!nodeObj.settings || typeof nodeObj.settings !== 'object') {
          errors.push(`Node at index ${i} missing settings`);
        }
      }
    }

    if (!Array.isArray(workflow.connections)) {
      errors.push('Missing or invalid connections array');
    } else {
      // 验证连接
      for (let i = 0; i < workflow.connections.length; i++) {
        const connection = workflow.connections[i];
        if (!connection || typeof connection !== 'object') {
          errors.push(`Connection at index ${i} is invalid`);
          continue;
        }

        const connObj = connection as Record<string, unknown>;
        if (!connObj.id || typeof connObj.id !== 'string') {
          errors.push(`Connection at index ${i} missing id`);
        }
        if (!connObj.sourceNodeId || typeof connObj.sourceNodeId !== 'string') {
          errors.push(`Connection at index ${i} missing sourceNodeId`);
        }
        if (!connObj.targetNodeId || typeof connObj.targetNodeId !== 'string') {
          errors.push(`Connection at index ${i} missing targetNodeId`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 格式化输出 JSON（美化格式）
   */
  static toFormattedJSON(workflow: BaseWorkflow, indent: number = 2): string {
    const serialized = this.toJSON(workflow);
    return JSON.stringify(serialized, null, indent);
  }

  /**
   * 从 JSON 字符串解析工作流
   */
  static fromJSONString(jsonString: string): BaseWorkflow {
    try {
      const parsed = JSON.parse(jsonString);
      return this.fromJSON(parsed);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`);
    }
  }

  /**
   * 深拷贝对象
   */
  private static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }

  /**
   * 比较两个工作流是否相等
   */
  static equals(workflow1: BaseWorkflow, workflow2: BaseWorkflow): boolean {
    const json1 = this.toJSON(workflow1);
    const json2 = this.toJSON(workflow2);

    // 移除时间戳字段进行比较
    if (json1.metadata) {
      json1.metadata = {
        ...json1.metadata,
        createdAt: json1.metadata.createdAt ?? '',
        updatedAt: json1.metadata.updatedAt ?? ''
      };
    }
    if (json2.metadata) {
      json2.metadata = {
        ...json2.metadata,
        createdAt: json2.metadata.createdAt ?? '',
        updatedAt: json2.metadata.updatedAt ?? ''
      };
    }

    return JSON.stringify(json1) === JSON.stringify(json2);
  }

  /**
   * 获取工作流摘要信息
   */
  static getSummary(workflow: BaseWorkflow): {
    nodeCount: number;
    connectionCount: number;
    nodeTypes: Record<string, number>;
    hasErrors: boolean;
    errors: string[];
  } {
    const nodeTypes: Record<string, number> = {};
    const errors: string[] = [];

    // 统计节点类型
    for (const node of workflow.nodes.values()) {
      const type = node.config.type;
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
    }

    // 检查连接有效性
    for (const connection of workflow.connections.values()) {
      if (!workflow.nodes.has(connection.sourceNodeId)) {
        errors.push(`Connection ${connection.id} references non-existent source node: ${connection.sourceNodeId}`);
      }
      if (!workflow.nodes.has(connection.targetNodeId)) {
        errors.push(`Connection ${connection.id} references non-existent target node: ${connection.targetNodeId}`);
      }
    }

    return {
      nodeCount: workflow.nodes.size,
      connectionCount: workflow.connections.size,
      nodeTypes,
      hasErrors: errors.length > 0,
      errors
    };
  }
}

// 工作流导入导出工具类
export class WorkflowImportExport {
  /**
   * 导出工作流为 JSON 文件内容
   */
  static exportToFile(workflow: BaseWorkflow): {
    filename: string;
    content: string;
    mimeType: string;
  } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `workflow-${workflow.config.id}-${timestamp}.json`;
    const content = WorkflowSerializer.toFormattedJSON(workflow);

    return {
      filename,
      content,
      mimeType: 'application/json'
    };
  }

  /**
   * 从文件内容导入工作流
   */
  static importFromFile(fileContent: string): BaseWorkflow {
    try {
      const parsed = JSON.parse(fileContent);
      
      // 验证格式
      const validation = WorkflowSerializer.validate(parsed);
      if (!validation.valid) {
        throw new Error(`Invalid workflow format: ${validation.errors.join(', ')}`);
      }

      return WorkflowSerializer.fromJSON(parsed);
    } catch (error) {
      throw new Error(`Failed to import workflow: ${error}`);
    }
  }

  /**
   * 创建工作流模板
   */
  static createTemplate(
    id: string,
    name: string,
    description?: string
  ): SerializedWorkflow {
    return {
      config: {
        id,
        name
      },
      nodes: [],
      connections: [],
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: description || `Template for ${name}`
      }
    };
  }

  /**
   * 合并多个工作流（节点ID会自动重命名以避免冲突）
   */
  static mergeWorkflows(
    targetWorkflow: BaseWorkflow,
    sourceWorkflows: BaseWorkflow[],
    options: {
      nodeIdPrefix?: string;
      preserveOriginalIds?: boolean;
    } = {}
  ): BaseWorkflow {
    const { nodeIdPrefix = 'merged', preserveOriginalIds = false } = options;
    
    // 序列化目标工作流
    const targetSerialized = WorkflowSerializer.toJSON(targetWorkflow);
    
    // 跟踪已使用的节点ID
    const usedNodeIds = new Set(targetSerialized.nodes.map(n => n.config.id));
    
    // 合并源工作流
    for (let i = 0; i < sourceWorkflows.length; i++) {
      const sourceSerialized = WorkflowSerializer.toJSON(sourceWorkflows[i]);
      const idMap = new Map<string, string>(); // 原ID -> 新ID的映射
      
      // 处理节点
      for (const node of sourceSerialized.nodes) {
        let newNodeId = node.config.id;
        
        if (!preserveOriginalIds || usedNodeIds.has(newNodeId)) {
          // 生成新的节点ID
          let counter = 1;
          do {
            newNodeId = `${nodeIdPrefix}_${i}_${node.config.id}_${counter}`;
            counter++;
          } while (usedNodeIds.has(newNodeId));
        }
        
        idMap.set(node.config.id, newNodeId);
        usedNodeIds.add(newNodeId);
        
        // 添加节点
        targetSerialized.nodes.push({
          ...node,
          config: {
            ...node.config,
            id: newNodeId
          }
        });
      }
      
      // 处理连接（更新节点ID引用）
      for (const connection of sourceSerialized.connections) {
        const newSourceId = idMap.get(connection.sourceNodeId);
        const newTargetId = idMap.get(connection.targetNodeId);
        
        if (newSourceId && newTargetId) {
          targetSerialized.connections.push({
            ...connection,
            id: `${nodeIdPrefix}_${i}_${connection.id}`,
            sourceNodeId: newSourceId,
            targetNodeId: newTargetId
          });
        }
      }
    }
    
    // 更新元数据
    if (targetSerialized.metadata) {
      targetSerialized.metadata.updatedAt = new Date().toISOString();
      targetSerialized.metadata.description = 
        (targetSerialized.metadata.description || '') + 
        ` (merged with ${sourceWorkflows.length} workflows)`;
    }
    
    return WorkflowSerializer.fromJSON(targetSerialized);
  }
}
