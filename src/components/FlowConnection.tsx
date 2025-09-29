import React from 'react';
import type { Connection, WorkflowNode } from '../types/workflow';
import './FlowConnection.css';

interface FlowConnectionProps {
  connection: Connection;
  fromNode: WorkflowNode;
  toNode: WorkflowNode;
}

const FlowConnection: React.FC<FlowConnectionProps> = ({
  connection,
  fromNode,
  toNode
}) => {
  // Calculate connection points
  const fromX = fromNode.position.x + (fromNode.width || 200);
  const fromY = fromNode.position.y + ((fromNode.height || 80) / 2);
  const toX = toNode.position.x;
  const toY = toNode.position.y + ((toNode.height || 80) / 2);

  // Create smooth curve path
  const createPath = () => {
    const deltaX = toX - fromX;
    const deltaY = toY - fromY;
    
    // Control points for bezier curve
    const controlPointOffset = Math.abs(deltaX) * 0.5;
    const cp1x = fromX + controlPointOffset;
    const cp1y = fromY;
    const cp2x = toX - controlPointOffset;
    const cp2y = toY;

    return `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;
  };

  // Calculate label position
  const labelX = (fromX + toX) / 2;
  const labelY = (fromY + toY) / 2;

  return (
    <g className={`flow-connection flow-connection--${connection.type || 'default'} ${
      connection.isSubConnection ? 'flow-connection--sub' : ''
    }`}>
      {/* Connection Path */}
      <path
        className={`flow-connection__path ${
          connection.animated ? 'flow-connection__path--animated' : ''
        } ${connection.isSubConnection ? 'flow-connection__path--dashed' : ''}`}
        d={createPath()}
        fill="none"
        stroke="currentColor"
        strokeWidth={connection.isSubConnection ? "1" : "2"}
        markerEnd={`url(#arrowhead${connection.isSubConnection ? '-sub' : ''})`}
        strokeDasharray={connection.isSubConnection ? "4 4" : "none"}
      />
      
      {/* Connection Label */}
      {connection.label && (
        <g className="flow-connection__label">
          <rect
            x={labelX - 30}
            y={labelY - 12}
            width="60"
            height="24"
            rx="12"
            className="flow-connection__label-bg"
          />
          <text
            x={labelX}
            y={labelY + 4}
            textAnchor="middle"
            className="flow-connection__label-text"
          >
            {connection.label}
          </text>
        </g>
      )}
      
      {/* Animated Dots for Running Connections */}
      {connection.animated && (
        <circle
          className="flow-connection__dot"
          r={connection.isSubConnection ? "2" : "4"}
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={createPath()}
          />
        </circle>
      )}
    </g>
  );
};

// Arrow marker definition component
export const ConnectionMarkers: React.FC = () => (
  <defs>
    <marker
      id="arrowhead"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon
        points="0 0, 10 3.5, 0 7"
        className="flow-connection__arrow"
      />
    </marker>
    
    <marker
      id="arrowhead-sub"
      markerWidth="8"
      markerHeight="6"
      refX="7"
      refY="3"
      orient="auto"
    >
      <polygon
        points="0 0, 8 3, 0 6"
        fill="#6b7280"
        opacity="0.7"
      />
    </marker>
    
    <marker
      id="arrowhead-success"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon
        points="0 0, 10 3.5, 0 7"
        fill="#10b981"
      />
    </marker>
    
    <marker
      id="arrowhead-error"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon
        points="0 0, 10 3.5, 0 7"
        fill="#ef4444"
      />
    </marker>
  </defs>
);

export default FlowConnection;
