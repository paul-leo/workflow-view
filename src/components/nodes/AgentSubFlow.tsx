import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  ConnectionMode
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import { Zap, Calculator, Search, Code2, FileText, Clock } from 'lucide-react';
import 'reactflow/dist/style.css';
import './AgentSubFlow.css';

// 工具节点数据接口
interface ToolNodeData {
  id: string;
  name: string;
  description: string;
  category?: string;
  isActive?: boolean;
}

// 工具图标映射
const getToolIcon = (toolId: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'calculator': <Calculator size={12} />,
    'web-search': <Search size={12} />,
    'code-executor': <Code2 size={12} />,
    'text-processor': <FileText size={12} />,
    'time-tool': <Clock size={12} />,
  };
  
  return iconMap[toolId] || <Zap size={12} />;
};

// 工具分类颜色 (暂时注释掉，未使用)
// const getCategoryColor = (category?: string) => {
//   const colorMap: Record<string, string> = {
//     '数学': '#F59E0B',
//     '搜索': '#3B82F6',
//     '开发': '#10B981',
//     '文本': '#8B5CF6',
//     '工具': '#6B7280',
//   };
//   
//   return colorMap[category || ''] || '#6B7280';
// };

// 自定义工具节点组件
const ToolNode: React.FC<{ data: ToolNodeData }> = ({ data }) => {
  return (
    <div 
      className={`agent-subflow-tool-node ${data.isActive ? 'active' : ''}`}
      data-category={data.category}
    >
      <div 
        className="tool-node-header"
        data-category={data.category}
      >
        <div className="tool-node-icon">
          {getToolIcon(data.id)}
        </div>
        <div className="tool-node-name">{data.name}</div>
      </div>
      <div className="tool-node-description">
        {data.description}
      </div>
      {data.category && (
        <div 
          className="tool-node-category"
          data-category={data.category}
        >
          {data.category}
        </div>
      )}
    </div>
  );
};

// 节点类型定义
const nodeTypes = {
  toolNode: ToolNode,
};

// Agent 子流组件属性
export interface AgentSubFlowProps {
  agentId: string;
  tools: Array<{
    id: string;
    name: string;
    description: string;
    category?: string;
  }>;
  activeTools?: string[]; // 当前激活的工具ID列表
  onToolClick?: (toolId: string) => void;
  className?: string;
}

/**
 * Agent 子流组件
 * 在 Agent 节点内部显示工具的小型 ReactFlow
 */
export const AgentSubFlow: React.FC<AgentSubFlowProps> = ({
  agentId,
  tools,
  activeTools = [],
  onToolClick,
  className = ''
}) => {
  // 生成节点和边
  const { initialNodes, initialEdges } = useMemo(() => {
    if (tools.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    // 创建 Agent 中心节点
    const agentNode: Node = {
      id: 'agent-center',
      type: 'default',
      position: { x: 100, y: 100 },
      data: { 
        label: (
          <div className="agent-center-node">
            <div className="agent-center-icon">🤖</div>
            <div className="agent-center-label">Agent</div>
          </div>
        )
      },
      style: {
        background: '#8B5CF6',
        color: 'white',
        border: '2px solid #8B5CF6',
        borderRadius: '50%',
        width: 60,
        height: 60,
        fontSize: '10px'
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    };

    // 创建工具节点
    const toolNodes: Node[] = tools.map((tool, index) => {
      const angle = (index / tools.length) * 2 * Math.PI;
      const radius = 120;
      const x = 100 + Math.cos(angle) * radius;
      const y = 100 + Math.sin(angle) * radius;

      return {
        id: `tool-${tool.id}`,
        type: 'toolNode',
        position: { x, y },
        data: {
          ...tool,
          isActive: activeTools.includes(tool.id)
        } as ToolNodeData,
        sourcePosition: Position.Left,
        targetPosition: Position.Right
      };
    });

    // 创建虚线连接
    const toolEdges: Edge[] = tools.map((tool) => ({
      id: `edge-agent-${tool.id}`,
      source: 'agent-center',
      target: `tool-${tool.id}`,
      type: 'default',
      style: {
        strokeDasharray: '6 4',
        strokeWidth: 2,
        stroke: activeTools.includes(tool.id) ? '#8B5CF6' : '#9CA3AF',
        opacity: activeTools.includes(tool.id) ? 1 : 0.6
      },
      animated: activeTools.includes(tool.id),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: activeTools.includes(tool.id) ? '#8B5CF6' : '#9CA3AF'
      },
      label: tool.name,
      labelStyle: {
        fontSize: '8px',
        fill: '#6B7280'
      }
    }));

    const allNodes = [agentNode, ...toolNodes];
    
    return { 
      initialNodes: allNodes, 
      initialEdges: toolEdges 
    };
  }, [tools, activeTools, agentId]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // 节点点击处理
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'toolNode' && onToolClick) {
      const toolId = node.id.replace('tool-', '');
      onToolClick(toolId);
    }
  }, [onToolClick]);

  if (tools.length === 0) {
    return (
      <div className="agent-subflow-empty">
        <div className="empty-message">暂无工具</div>
      </div>
    );
  }

  return (
    <div className={`agent-subflow-container ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Strict}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
          minZoom: 0.5,
          maxZoom: 1.5
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnScroll={false}
        panOnDrag={false}
        preventScrolling={true}
      >
        <Background 
          color="#F3F4F6" 
          gap={10} 
          size={0.5}
        />
      </ReactFlow>
    </div>
  );
};
