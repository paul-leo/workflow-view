import React, { useCallback, useMemo, useEffect } from 'react';
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
  nodeStatuses?: Record<string, 'pending' | 'running' | 'completed' | 'error'>;
  className?: string;
  // UI 控制
  singleRow?: boolean;        // 单行自动布局
  showMiniMap?: boolean;      // 是否显示小地图
  showFlowControls?: boolean; // 是否显示 ReactFlow 的控件
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
  className,
  singleRow = true,
  showMiniMap = false,
  showFlowControls = false
}) => {
  // 将JSON数据转换为ReactFlow格式
  const { initialNodes, initialEdges } = useMemo(() => {
    // 1) 构建图结构
    const nodeIds = workflowData.nodes.map(n => n.config.id);
    const inDegree = new Map<string, number>();
    const outMap = new Map<string, { targetId: string; branchIndex?: number }[]>();
    nodeIds.forEach(id => { inDegree.set(id, 0); outMap.set(id, []); });
    for (const c of workflowData.connections) {
      if (!nodeIds.includes(c.sourceNodeId) || !nodeIds.includes(c.targetNodeId)) continue;
      outMap.get(c.sourceNodeId)?.push({ targetId: c.targetNodeId, branchIndex: c.branchIndex });
      inDegree.set(c.targetNodeId, (inDegree.get(c.targetNodeId) || 0) + 1);
    }

    // 2) 选择入口（入度为0）；如果没有，选第一个
    const roots = nodeIds.filter(id => (inDegree.get(id) || 0) === 0);
    const queue: string[] = roots.length > 0 ? [...roots] : [nodeIds[0]];

    // 3) 层次布局：默认单行，遇到多分支则上下堆叠
    const COL_WIDTH = 320;
    const ROW_HEIGHT = 180;
    const position = new Map<string, { x: number; y: number }>();
    const visited = new Set<string>();

    // 将根节点按单行放置
    queue.forEach((id, idx) => {
      if (!position.has(id)) {
        const x = singleRow ? idx * COL_WIDTH : (idx % 3) * 300;
        const y = singleRow ? 0 : Math.floor(idx / 3) * 200;
        position.set(id, { x, y });
      }
    });

    while (queue.length > 0) {
      const src = queue.shift()!;
      if (visited.has(src)) continue;
      visited.add(src);
      const srcPos = position.get(src) || { x: 0, y: 0 };
      const outs = (outMap.get(src) || []).slice().sort((a, b) => (a.branchIndex ?? 0) - (b.branchIndex ?? 0));
      if (outs.length === 0) continue;

      if (outs.length === 1) {
        const t = outs[0].targetId;
        if (!position.has(t)) position.set(t, { x: srcPos.x + COL_WIDTH, y: srcPos.y });
        if (!visited.has(t)) queue.push(t);
      } else {
        // 多分支：上下方式展开
        const count = outs.length;
        const mid = (count - 1) / 2;
        outs.forEach((o, idx) => {
          const t = o.targetId;
          const yOffset = (idx - mid) * ROW_HEIGHT;
          if (!position.has(t)) position.set(t, { x: srcPos.x + COL_WIDTH, y: srcPos.y + yOffset });
          if (!visited.has(t)) queue.push(t);
        });
      }
    }

    // 4) 生成 ReactFlow 节点（回填未布局的节点）
    const nodes: Node[] = workflowData.nodes.map((nodeData, index) => {
      const pos = position.get(nodeData.config.id) || {
        x: singleRow ? index * COL_WIDTH : (index % 3) * 300,
        y: singleRow ? 0 : Math.floor(index / 3) * 200
      };

      const reactFlowNode: Node = {
        id: nodeData.config.id,
        type: 'workflowNode',
        position: pos,
        data: {
          id: nodeData.config.id,
          name: nodeData.config.name,
          type: nodeData.config.type,
          settings: nodeData.settings,
          originalSettings: nodeData.originalSettings,
          status: nodeStatuses[nodeData.config.id] || 'pending',
          // 为 Agent 节点添加工具信息
          ...(nodeData.config.type === 'agent' && 'tools' in nodeData ? {
            tools: (nodeData as { tools: unknown[] }).tools
          } : {})
        } as WorkflowNodeData
      };

      return reactFlowNode;
    });

    // 5) 生成最终节点列表（工具节点由 AgentNodeRenderer 内部处理）
    const allNodes = nodes;

    // 建立节点类型索引，用于为分支边添加可读标签
    const nodeTypeById = new Map<string, string>(
      workflowData.nodes.map(n => [n.config.id, n.config.type])
    );

    const edges: Edge[] = workflowData.connections.map((connection) => {
      const sourceType = nodeTypeById.get(connection.sourceNodeId);
      let label: string | undefined;
      if (typeof connection.branchIndex === 'number') {
        const bi = connection.branchIndex ?? 0;
        if (sourceType === 'condition') {
          label = bi === 0 ? 'false' : bi === 1 ? 'true' : `B${bi}`;
        } else {
          label = `B${bi}`;
        }
      }

      return {
        id: connection.id,
        source: connection.sourceNodeId,
        target: connection.targetNodeId,
        type: 'workflowEdge',
        data: label ? { label } : undefined,
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
      } as Edge;
    });

    // 生成最终边列表（工具连接由 AgentNodeRenderer 内部处理）
    const allEdges = edges;

    return { initialNodes: allNodes, initialEdges: allEdges };
  }, [workflowData, nodeStatuses, singleRow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // 同步节点状态更新到画布
  useEffect(() => {
    setNodes(prev =>
      prev.map(node => ({
        ...node,
        data: {
          ...(node.data as WorkflowNodeData),
          status: nodeStatuses[node.id] || 'pending'
        }
      }))
    );
  }, [nodeStatuses, setNodes]);

  // 节点点击处理
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id, node.data as WorkflowNodeData);
    }
  }, [onNodeClick]);

  // 节点状态通过 nodeStatuses prop 传递并自动同步到画布

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
          {showFlowControls && (
            <Controls 
              position="top-left"
              showZoom={true}
              showFitView={true}
              showInteractive={false}
            />
          )}
          {showMiniMap && (
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
          )}
        </ReactFlow>
      </div>
    </div>
  );
};
