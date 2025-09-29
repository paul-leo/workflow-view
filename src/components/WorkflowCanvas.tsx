import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType
} from 'reactflow';
import type {
  Node,
  Edge,
  NodeTypes,
  EdgeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';
import { WorkflowNode } from './WorkflowNode';
import type { WorkflowNodeData } from './WorkflowNode';
import { WorkflowEdge } from './WorkflowEdge';
import type { SerializedWorkflow } from '../core/utils/WorkflowSerializer';
import './WorkflowCanvas.css';

// 重新导出类型以保持兼容性
export type WorkflowJson = SerializedWorkflow;

// 组件属性接口
export interface WorkflowCanvasProps {
  workflowData: WorkflowJson;
  onNodeClick?: (nodeId: string, nodeData: WorkflowNodeData) => void;
  onNodeStatusChange?: (nodeId: string, status: 'pending' | 'running' | 'completed' | 'error') => void;
  nodeStatuses?: Record<string, 'pending' | 'running' | 'completed' | 'error'>;
  className?: string;
}

// 自定义节点类型
const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode
};

// 自定义边类型
const edgeTypes: EdgeTypes = {
  workflowEdge: WorkflowEdge
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflowData,
  onNodeClick,
  nodeStatuses = {},
  className
}) => {
  // 将JSON数据转换为ReactFlow格式
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = workflowData.nodes.map((nodeData, index) => {
      // 简单的自动布局算法
      const x = (index % 3) * 300;
      const y = Math.floor(index / 3) * 200;

      const reactFlowNode: Node = {
        id: nodeData.config.id,
        type: 'workflowNode',
        position: { x, y },
        data: {
          id: nodeData.config.id,
          name: nodeData.config.name,
          type: nodeData.config.type,
          settings: nodeData.settings,
          originalSettings: nodeData.originalSettings,
          status: nodeStatuses[nodeData.config.id] || 'pending'
        } as WorkflowNodeData
      };

      return reactFlowNode;
    });

    const edges: Edge[] = workflowData.connections.map((connection) => ({
      id: connection.id,
      source: connection.sourceNodeId,
      target: connection.targetNodeId,
      type: 'workflowEdge',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#6B7280'
      },
      style: {
        stroke: '#6B7280',
        strokeWidth: 2
      }
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [workflowData, nodeStatuses]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // 节点点击处理
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id, node.data as WorkflowNodeData);
    }
  }, [onNodeClick]);

  // 注意：节点状态现在通过 nodeStatuses prop 传递，不再需要本地状态更新

  return (
    <div className={`workflow-canvas ${className || ''}`}>
      <div className="workflow-canvas-header">
        <h2 className="workflow-title">{workflowData.config.name}</h2>
        {workflowData.metadata?.description && (
          <p className="workflow-description">{workflowData.metadata.description}</p>
        )}
      </div>

      <div className="workflow-canvas-content">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Strict}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false
          }}
          defaultEdgeOptions={{
            type: 'workflowEdge',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#6B7280'
            }
          }}
        >
          <Background 
            color="#E5E7EB" 
            gap={20} 
            size={1}
          />
          <Controls 
            position="top-left"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <MiniMap 
            position="bottom-right"
            nodeColor={(node) => {
              const nodeData = node.data as WorkflowNodeData;
              const colors = {
                'timer-trigger': '#10B981',
                'http-request': '#3B82F6',
                'code': '#8B5CF6',
                'condition': '#F59E0B',
                'agent': '#EF4444'
              };
              return colors[nodeData.type as keyof typeof colors] || '#6B7280';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </div>
  );
};
