import React from 'react';
import type { WorkflowNode as WorkflowNodeType } from '../types/workflow';
import './WorkflowNode.css';

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  onToggle?: (nodeId: string) => void;
  onClick?: (node: WorkflowNodeType) => void;
  level?: number;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({ 
  node, 
  onToggle, 
  onClick,
  level = 0 
}) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start': return '🚀';
      case 'end': return '🏁';
      case 'task': return '📋';
      case 'condition': return '❓';
      case 'block': return node.expanded ? '📂' : '📁';
      default: return '⚪';
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
    <div className={`workflow-node-container ${level > 0 ? `workflow-node-container--level-${Math.min(level, 5)}` : ''}`}>
      <div 
        className={`workflow-node workflow-node--${node.type} ${
          node.status ? `workflow-node--status-${node.status}` : ''
        } ${onClick ? 'workflow-node--clickable' : ''}`}
        onClick={handleNodeClick}
      >
        <div className="workflow-node__header">
          <div className="workflow-node__icon">
            {node.icon || getNodeIcon(node.type)}
          </div>
          
          <div className="workflow-node__content">
            <h3 className="workflow-node__title">{node.title}</h3>
            {node.description && (
              <p className="workflow-node__description">{node.description}</p>
            )}
          </div>

          {node.type === 'block' && node.children && (
            <button 
              className="workflow-node__toggle"
              onClick={handleToggleClick}
              aria-label={node.expanded ? 'Collapse' : 'Expand'}
            >
              {node.expanded ? '▼' : '▶'}
            </button>
          )}
        </div>

        {node.status && (
          <div className={`workflow-node__status workflow-node__status--${node.status}`}>
            {node.status}
          </div>
        )}
      </div>

      {node.type === 'block' && node.expanded && node.children && (
        <div className="workflow-node__children">
          {node.children.map((child) => (
            <WorkflowNode
              key={child.id}
              node={child}
              onToggle={onToggle}
              onClick={onClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowNode;
