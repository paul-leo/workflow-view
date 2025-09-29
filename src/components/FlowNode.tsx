import React from 'react';
import { Play, Pause, CheckCircle, XCircle, AlertCircle, FolderOpen, Folder } from 'lucide-react';
import type { WorkflowNode } from '../types/workflow';
import './FlowNode.css';

interface FlowNodeProps {
  node: WorkflowNode;
  onToggle?: (nodeId: string) => void;
  onClick?: (node: WorkflowNode) => void;
  isSelected?: boolean;
}

const FlowNode: React.FC<FlowNodeProps> = ({ 
  node, 
  onToggle, 
  onClick,
  isSelected = false 
}) => {
  const getNodeIcon = (type: string, expanded?: boolean) => {
    const iconProps = { size: 20, className: 'flow-node__type-icon' };
    
    switch (type) {
      case 'start':
        return <Play {...iconProps} />;
      case 'end':
        return <CheckCircle {...iconProps} />;
      case 'task':
        return <AlertCircle {...iconProps} />;
      case 'condition':
        return <AlertCircle {...iconProps} />;
      case 'block':
        return expanded ? <FolderOpen {...iconProps} /> : <Folder {...iconProps} />;
      default:
        return <AlertCircle {...iconProps} />;
    }
  };

  const getStatusIcon = (status?: string) => {
    const iconProps = { size: 16, className: 'flow-node__status-icon' };
    
    switch (status) {
      case 'running':
        return <Play {...iconProps} />;
      case 'completed':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'pending':
        return <Pause {...iconProps} />;
      default:
        return null;
    }
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(node);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'block' && node.children) {
      onToggle?.(node.id);
    }
  };

  return (
    <div
      className={`flow-node flow-node--positioned flow-node--${node.type} ${
        node.status ? `flow-node--status-${node.status}` : ''
      } ${isSelected ? 'flow-node--selected' : ''} ${
        onClick ? 'flow-node--clickable' : ''
      }`}
      onClick={handleNodeClick}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        width: `${node.width || 200}px`,
        height: node.height ? `${node.height}px` : 'auto'
      }}
    >
      {/* Connection Points */}
      <div className="flow-node__handle flow-node__handle--input" />
      <div className="flow-node__handle flow-node__handle--output" />
      
      {/* Node Header */}
      <div className="flow-node__header">
        <div className="flow-node__icon-container">
          {getNodeIcon(node.type, node.expanded)}
        </div>
        
        <div className="flow-node__title-container">
          <h3 className="flow-node__title">{node.title}</h3>
          {node.status && (
            <div className="flow-node__status">
              {getStatusIcon(node.status)}
              <span className="flow-node__status-text">{node.status}</span>
            </div>
          )}
        </div>

        {node.type === 'block' && node.children && (
          <button 
            className="flow-node__toggle"
            onClick={handleToggleClick}
            aria-label={node.expanded ? 'Collapse' : 'Expand'}
          >
            {node.expanded ? '▼' : '▶'}
          </button>
        )}
      </div>

      {/* Node Content */}
      {node.description && (
        <div className="flow-node__content">
          <p className="flow-node__description">{node.description}</p>
        </div>
      )}

      {/* Progress Indicator for Running Tasks */}
      {node.status === 'running' && (
        <div className="flow-node__progress">
          <div className="flow-node__progress-bar" />
        </div>
      )}
    </div>
  );
};

export default FlowNode;
