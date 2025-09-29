import React from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath,
  type EdgeProps
} from 'reactflow';
import { Zap } from 'lucide-react';
import './ToolConnectionEdge.css';

export interface ToolConnectionEdgeData {
  toolName?: string;
  toolCategory?: string;
  isActive?: boolean;
}

export type ToolConnectionEdgeProps = EdgeProps<ToolConnectionEdgeData>;

/**
 * 工具连接边组件
 * 用虚线连接 AgentNode 和 ToolNode
 */
export const ToolConnectionEdge: React.FC<ToolConnectionEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeDasharray: '8 4', // 虚线样式
          strokeWidth: 2,
          stroke: data?.isActive ? '#8B5CF6' : '#9CA3AF',
          opacity: data?.isActive ? 1 : 0.6,
          animation: data?.isActive ? 'tool-connection-pulse 2s ease-in-out infinite' : 'none'
        }}
        className={`tool-connection-edge ${selected ? 'selected' : ''} ${data?.isActive ? 'active' : ''}`}
      />
      
      {/* 边标签 */}
      {data?.toolName && (
        <EdgeLabelRenderer>
          <div
            className="tool-connection-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
            }}
          >
            <div className="tool-connection-badge">
              <Zap size={10} />
              <span>{data.toolName}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
