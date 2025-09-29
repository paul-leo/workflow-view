import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';

export interface WorkflowEdgeData {
  label?: string;
  status?: 'pending' | 'active' | 'completed' | 'error';
  animated?: boolean;
}

export const WorkflowEdge: React.FC<EdgeProps<WorkflowEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  // 根据状态确定边的样式
  const getEdgeStyle = () => {
    const baseStyle = {
      strokeWidth: selected ? 3 : 2,
      ...style
    };

    if (data?.status) {
      switch (data.status) {
        case 'active':
          return {
            ...baseStyle,
            stroke: '#3B82F6',
            strokeWidth: 3,
            animation: 'pulse 2s infinite'
          };
        case 'completed':
          return {
            ...baseStyle,
            stroke: '#10B981',
            strokeWidth: 2
          };
        case 'error':
          return {
            ...baseStyle,
            stroke: '#EF4444',
            strokeWidth: 2,
            strokeDasharray: '5,5'
          };
        case 'pending':
        default:
          return {
            ...baseStyle,
            stroke: '#9CA3AF',
            strokeWidth: 2
          };
      }
    }

    return baseStyle;
  };

  return (
    <>
      <path
        id={id}
        style={getEdgeStyle()}
        className={`react-flow__edge-path ${data?.animated ? 'animated' : ''}`}
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 500,
              background: '#FFFFFF',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #E5E7EB',
              color: '#6B7280',
              pointerEvents: 'all'
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
