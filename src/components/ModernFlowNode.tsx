import React from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FolderOpen, 
  Folder,
  Bot,
  Settings,
  Zap,
  Plus
} from 'lucide-react';
import type { WorkflowNode } from '../types/workflow';
import './ModernFlowNode.css';

interface ModernFlowNodeProps {
  node: WorkflowNode;
  onToggle?: (nodeId: string) => void;
  onClick?: (node: WorkflowNode) => void;
  isSelected?: boolean;
}

const ModernFlowNode: React.FC<ModernFlowNodeProps> = ({ 
  node, 
  onToggle, 
  onClick,
  isSelected = false 
}) => {
  const getNodeIcon = (type: string) => {
    const iconProps = { size: 20, className: 'modern-flow-node__type-icon' };
    
    switch (type) {
      case 'trigger':
        return <Zap {...iconProps} />;
      case 'agent':
        return <Bot {...iconProps} />;
      case 'tool':
        return <Settings {...iconProps} />;
      case 'task':
        return <AlertCircle {...iconProps} />;
      case 'condition':
        return <AlertCircle {...iconProps} />;
      case 'block':
        return node.expanded ? <FolderOpen {...iconProps} /> : <Folder {...iconProps} />;
      case 'start':
        return <Play {...iconProps} />;
      case 'end':
        return <CheckCircle {...iconProps} />;
      default:
        return <AlertCircle {...iconProps} />;
    }
  };

  const getStatusIcon = (status?: string) => {
    const iconProps = { size: 12, className: 'modern-flow-node__status-icon' };
    
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
    if (node.isCollapsible && node.children) {
      onToggle?.(node.id);
    }
  };

  // 如果节点是可折叠的且未展开，显示为圆形
  const isCollapsed = node.isCollapsible && !node.expanded;

  if (isCollapsed) {
    return (
      <div
        className={`modern-flow-node modern-flow-node--collapsed modern-flow-node--${node.type} ${
          node.status ? `modern-flow-node--status-${node.status}` : ''
        } ${isSelected ? 'modern-flow-node--selected' : ''}`}
        onClick={handleToggleClick}
        style={{
          left: `${node.position.x}px`,
          top: `${node.position.y}px`,
          width: `${(node.collapsedRadius || 30) * 2}px`,
          height: `${(node.collapsedRadius || 30) * 2}px`
        }}
      >
        {/* Connection Points for Collapsed Node */}
        <div className="modern-flow-node__handle modern-flow-node__handle--input" />
        <div className="modern-flow-node__handle modern-flow-node__handle--output" />
        
        <div className="modern-flow-node__collapsed-content">
          <div className="modern-flow-node__collapsed-icon">
            {getNodeIcon(node.type)}
          </div>
          {node.children && (
            <div className="modern-flow-node__collapsed-count">
              {node.children.length}
            </div>
          )}
        </div>
        
        {/* Expand Button */}
        <button className="modern-flow-node__expand-button" title={`Expand ${node.title}`}>
          <Plus size={12} />
        </button>
      </div>
    );
  }

  // 展开状态的节点
  return (
    <div
      className={`modern-flow-node modern-flow-node--expanded modern-flow-node--${node.type} ${
        node.status ? `modern-flow-node--status-${node.status}` : ''
      } ${isSelected ? 'modern-flow-node--selected' : ''} ${
        onClick ? 'modern-flow-node--clickable' : ''
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
      <div className="modern-flow-node__handle modern-flow-node__handle--input" />
      <div className="modern-flow-node__handle modern-flow-node__handle--output" />
      
      {/* Node Header */}
      <div className="modern-flow-node__header">
        <div className="modern-flow-node__icon-container">
          {getNodeIcon(node.type, node.category)}
        </div>
        
        <div className="modern-flow-node__title-container">
          <h3 className="modern-flow-node__title">{node.title}</h3>
          {node.subtitle && (
            <p className="modern-flow-node__subtitle">{node.subtitle}</p>
          )}
          {node.status && (
            <div className="modern-flow-node__status">
              {getStatusIcon(node.status)}
              <span className="modern-flow-node__status-text">{node.status}</span>
            </div>
          )}
        </div>

        {node.isCollapsible && node.children && (
          <button 
            className="modern-flow-node__collapse-button"
            onClick={handleToggleClick}
            aria-label="Collapse node"
            title="Collapse to dot"
          >
            <Folder size={16} />
          </button>
        )}
      </div>

      {/* Node Content */}
      {node.description && (
        <div className="modern-flow-node__content">
          <p className="modern-flow-node__description">{node.description}</p>
        </div>
      )}

      {/* Category Badge */}
      {node.category && (
        <div className="modern-flow-node__category">
          {node.category}
        </div>
      )}

      {/* Progress Indicator for Running Tasks */}
      {node.status === 'running' && (
        <div className="modern-flow-node__progress">
          <div className="modern-flow-node__progress-bar" />
        </div>
      )}
    </div>
  );
};

export default ModernFlowNode;
