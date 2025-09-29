import React, { useState, useCallback, useRef } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { WorkflowCanvas, type WorkflowJson } from './WorkflowCanvas';
import { NodeRegistry } from '../core/utils/WorkflowSerializer';
import type { NodeExecutionContext, NodeExecutionResult } from '../core/abstract/BaseNode';
import './WorkflowExecutor.css';

// 执行状态
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

// 节点执行状态
export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'error';

// 执行结果
export interface ExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  result?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
}

// 组件属性
export interface WorkflowExecutorProps {
  workflowData: WorkflowJson;
  onExecutionStart?: () => void;
  onExecutionComplete?: (results: ExecutionResult[]) => void;
  onExecutionError?: (error: string) => void;
  onNodeExecutionUpdate?: (result: ExecutionResult) => void;
  className?: string;
}

export const WorkflowExecutor: React.FC<WorkflowExecutorProps> = ({
  workflowData,
  onExecutionStart,
  onExecutionComplete,
  onExecutionError,
  onNodeExecutionUpdate,
  className
}) => {
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const executionAbortController = useRef<AbortController | null>(null);

  // 更新节点状态
  const updateNodeStatus = useCallback((nodeId: string, status: NodeExecutionStatus) => {
    // 这里应该调用 WorkflowCanvas 的方法来更新节点状态
    // 由于我们没有直接的引用，我们通过状态管理来实现
    console.log(`Node ${nodeId} status updated to: ${status}`);
  }, []);

  // 执行单个节点（真实执行）
  const executeNode = useCallback(async (
    nodeData: { config: { id: string; name: string; type: string }; settings: Record<string, unknown>; originalSettings: Record<string, unknown> },
    previousResults: Map<string, unknown>
  ): Promise<NodeExecutionResult> => {
    console.log(`Executing node: ${nodeData.config.name} (${nodeData.config.type})`);
    
    // 从注册表获取节点构造函数
    const NodeConstructor = NodeRegistry.getNodeConstructor(nodeData.config.type);
    if (!NodeConstructor) {
      throw new Error(`Unknown node type: ${nodeData.config.type}`);
    }

    try {
      // 创建节点实例
      const nodeInstance = new NodeConstructor(nodeData.config.id, nodeData.settings);
      
      // 恢复原始设置（包含表达式）
      if (nodeData.originalSettings) {
        (nodeInstance as unknown as { originalSettings: Record<string, unknown> }).originalSettings = 
          nodeData.originalSettings;
      }

      // 构建执行上下文
      const executionContext: NodeExecutionContext = {
        workflowId: workflowData.config.id,
        nodeId: nodeData.config.id,
        previousResults: previousResults,
        originalSettings: nodeData.originalSettings
      };

      // 构建节点输入
      const nodeInputs: Record<string, unknown> = {};
      
      // 如果节点有动态设置，解析它们
      if (nodeInstance.originalSettings) {
        nodeInstance.settings = nodeInstance.resolveDynamicSettings(nodeInputs, executionContext);
      }

      // 执行节点
      const result = await nodeInstance.execute(nodeInputs, executionContext);
      
      console.log(`Node ${nodeData.config.name} executed successfully:`, result);
      return result;
      
    } catch (error) {
      console.error(`Node ${nodeData.config.name} execution failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }, [workflowData.config.id]);

  // 执行工作流
  const executeWorkflow = useCallback(async () => {
    const { nodes, connections } = workflowData;
    const results: ExecutionResult[] = [];
    const previousResults = new Map<string, unknown>();
    
    // 初始化节点注册表
    NodeRegistry.initializeBuiltinTypes();
    
    // 构建执行顺序（拓扑排序）
    const executionOrder = getExecutionOrder(nodes, connections);
    
    for (const nodeId of executionOrder) {
      // 检查是否被中止
      if (executionAbortController.current?.signal.aborted) {
        throw new Error('Execution aborted');
      }

      const nodeData = nodes.find(n => n.config.id === nodeId);
      if (!nodeData) continue;

      setCurrentNodeId(nodeId);
      updateNodeStatus(nodeId, 'running');

      const result: ExecutionResult = {
        nodeId,
        status: 'running',
        startTime: Date.now()
      };

      try {
        // 真实的节点执行
        const executionResult = await executeNode(nodeData, previousResults);
        
        result.status = 'completed';
        result.result = executionResult.data;
        result.endTime = Date.now();
        
        // 保存执行结果供后续节点使用
        if (executionResult.success && executionResult.data) {
          previousResults.set(nodeId, executionResult.data);
        }
        
        updateNodeStatus(nodeId, 'completed');
      } catch (error) {
        result.status = 'error';
        result.error = error instanceof Error ? error.message : String(error);
        result.endTime = Date.now();
        
        updateNodeStatus(nodeId, 'error');
        
        // 如果节点执行失败，停止整个工作流
        throw error;
      }

      results.push(result);
      setExecutionResults([...results]);

      if (onNodeExecutionUpdate) {
        onNodeExecutionUpdate(result);
      }

      // 添加执行间隔以便观察执行过程
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setExecutionStatus('completed');
    setCurrentNodeId(null);

    if (onExecutionComplete) {
      onExecutionComplete(results);
    }
  }, [workflowData, onExecutionComplete, onNodeExecutionUpdate, updateNodeStatus, executeNode]);

  // 开始执行工作流
  const startExecution = useCallback(async () => {
    if (executionStatus === 'running') return;

    setExecutionStatus('running');
    setExecutionResults([]);
    setCurrentNodeId(null);
    
    // 创建中止控制器
    executionAbortController.current = new AbortController();

    if (onExecutionStart) {
      onExecutionStart();
    }

    try {
      await executeWorkflow();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setExecutionStatus('error');
      if (onExecutionError) {
        onExecutionError(errorMessage);
      }
    }
  }, [executionStatus, onExecutionStart, onExecutionError, executeWorkflow]);

  // 暂停执行
  const pauseExecution = useCallback(() => {
    if (executionStatus === 'running') {
      setExecutionStatus('paused');
      if (executionAbortController.current) {
        executionAbortController.current.abort();
      }
    }
  }, [executionStatus]);

  // 停止执行
  const stopExecution = useCallback(() => {
    setExecutionStatus('idle');
    setCurrentNodeId(null);
    if (executionAbortController.current) {
      executionAbortController.current.abort();
    }
    
    // 重置所有节点状态
    workflowData.nodes.forEach(node => {
      updateNodeStatus(node.config.id, 'pending');
    });
  }, [workflowData.nodes, updateNodeStatus]);

  // 重置执行状态
  const resetExecution = useCallback(() => {
    setExecutionStatus('idle');
    setExecutionResults([]);
    setCurrentNodeId(null);
    
    // 重置所有节点状态
    workflowData.nodes.forEach(node => {
      updateNodeStatus(node.config.id, 'pending');
    });
  }, [workflowData.nodes, updateNodeStatus]);


  // 获取执行顺序（简化的拓扑排序）
  const getExecutionOrder = (nodes: unknown[], connections: unknown[]): string[] => {
    const nodeIds = (nodes as { config: { id: string } }[]).map(node => node.config.id);
    const inDegree = new Map<string, number>();
    const outEdges = new Map<string, string[]>();

    // 初始化
    nodeIds.forEach(id => {
      inDegree.set(id, 0);
      outEdges.set(id, []);
    });

    // 构建图
    (connections as { sourceNodeId: string; targetNodeId: string }[]).forEach(conn => {
      outEdges.get(conn.sourceNodeId)?.push(conn.targetNodeId);
      inDegree.set(conn.targetNodeId, (inDegree.get(conn.targetNodeId) || 0) + 1);
    });

    // 拓扑排序
    const result: string[] = [];
    const queue: string[] = [];

    // 找到入度为0的节点
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const children = outEdges.get(nodeId) || [];
      children.forEach(childId => {
        const newInDegree = (inDegree.get(childId) || 0) - 1;
        inDegree.set(childId, newInDegree);
        
        if (newInDegree === 0) {
          queue.push(childId);
        }
      });
    }

    return result;
  };



  return (
    <div className={`workflow-executor ${className || ''}`}>
      {/* 控制面板 */}
      <div className="workflow-controls">
        <div className="control-buttons">
          <button
            className={`control-btn ${executionStatus === 'running' ? 'active' : ''}`}
            onClick={startExecution}
            disabled={executionStatus === 'running'}
            title="开始执行"
          >
            <Play size={16} />
            开始
          </button>
          
          <button
            className="control-btn"
            onClick={pauseExecution}
            disabled={executionStatus !== 'running'}
            title="暂停执行"
          >
            <Pause size={16} />
            暂停
          </button>
          
          <button
            className="control-btn"
            onClick={stopExecution}
            disabled={executionStatus === 'idle'}
            title="停止执行"
          >
            <Square size={16} />
            停止
          </button>
          
          <button
            className="control-btn"
            onClick={resetExecution}
            title="重置"
          >
            <RotateCcw size={16} />
            重置
          </button>
        </div>

        <div className="execution-status">
          <span className={`status-indicator status-${executionStatus}`}>
            {getStatusText(executionStatus)}
          </span>
          {currentNodeId && (
            <span className="current-node">
              正在执行: {workflowData.nodes.find(n => n.config.id === currentNodeId)?.config.name}
            </span>
          )}
        </div>
      </div>

      {/* 工作流画布 */}
      <WorkflowCanvas
        workflowData={workflowData}
        onNodeClick={(nodeId, nodeData) => {
          console.log('Node clicked:', nodeId, nodeData);
        }}
        onNodeStatusChange={(nodeId, status) => {
          console.log('Node status changed:', nodeId, status);
        }}
      />

      {/* 执行结果面板 */}
      {executionResults.length > 0 && (
        <div className="execution-results">
          <h3>执行结果</h3>
          <div className="results-list">
            {executionResults.map((result) => (
              <div key={result.nodeId} className={`result-item status-${result.status}`}>
                <div className="result-header">
                  <span className="node-name">
                    {workflowData.nodes.find(n => n.config.id === result.nodeId)?.config.name}
                  </span>
                  <span className="result-status">{getStatusText(result.status)}</span>
                  {result.endTime && (
                    <span className="execution-time">
                      {result.endTime - result.startTime}ms
                    </span>
                  )}
                </div>
                {result.error && (
                  <div className="result-error">{result.error}</div>
                )}
                {result.result !== undefined && (
                  <div className="result-data">
                    <pre>{JSON.stringify(result.result, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 获取状态文本
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'idle': '待机',
    'running': '运行中',
    'paused': '已暂停',
    'completed': '已完成',
    'error': '错误',
    'pending': '等待中'
  };
  return statusMap[status] || status;
}
