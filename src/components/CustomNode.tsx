import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
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
  Plus,
  Minus
} from 'lucide-react';
import { type WorkflowNode } from '../types/workflow';
import './CustomNode.css';

interface CustomNodeData extends WorkflowNode {
  onToggle?: (nodeId: string) => void;
  onClick?: (node: WorkflowNode) => void;
  parentId?: string;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const getNodeIcon = (type: string) => {
    const iconProps = { size: 16, className: 'node-icon' };
    
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
        return data.expanded ? <FolderOpen {...iconProps} /> : <Folder {...iconProps} />;
      case 'start':
        return <Play {...iconProps} />;
      case 'end':
        return <CheckCircle {...iconProps} />;
      default:
        return <AlertCircle {...iconProps} />;
    }
  };

  const getStatusIcon = (status?: string) => {
    const iconProps = { size: 12, className: 'status-icon' };
    
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

  const handleNodeClick = () => {
    data.onClick?.(data);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.isCollapsible && data.children) {
      data.onToggle?.(data.id);
    }
  };

  // Collapsed state (circle)
  if (data.isCollapsible && !data.expanded) {
    return (
      <div
        className={`custom-node custom-node--collapsed custom-node--${data.type} ${
          data.status ? `custom-node--status-${data.status}` : ''
        } ${selected ? 'custom-node--selected' : ''}`}
        onClick={handleToggle}
      >
        <Handle type="target" position={Position.Left} className="custom-handle" />
        <Handle type="source" position={Position.Right} className="custom-handle" />
        
        <div className="collapsed-content">
          {getNodeIcon(data.type)}
          {data.children && (
            <div className="collapsed-count">{data.children.length}</div>
          )}
        </div>
        
        <button className="expand-button" title={`Expand ${data.title}`}>
          <Plus size={10} />
        </button>
      </div>
    );
  }

  // Expanded state (rectangle)
  return (
    <div
      className={`custom-node custom-node--expanded custom-node--${data.type} ${
        data.status ? `custom-node--status-${data.status}` : ''
      } ${selected ? 'custom-node--selected' : ''}`}
      onClick={handleNodeClick}
    >
      <Handle type="target" position={Position.Left} className="custom-handle" />
      <Handle type="source" position={Position.Right} className="custom-handle" />
      
      <div className="node-header">
        <div className="node-icon-container">
          {getNodeIcon(data.type)}
        </div>
        
        <div className="node-content">
          <div className="node-title">{data.title}</div>
          {data.subtitle && (
            <div className="node-subtitle">{data.subtitle}</div>
          )}
          {data.status && (
            <div className="node-status">
              {getStatusIcon(data.status)}
              <span className="status-text">{data.status}</span>
            </div>
          )}
        </div>

        {data.isCollapsible && data.children && (
          <button 
            className="collapse-button"
            onClick={handleToggle}
            title="Collapse to dot"
          >
            <Minus size={12} />
          </button>
        )}
      </div>

      {data.category && (
        <div className="node-category">{data.category}</div>
      )}

      {data.status === 'running' && (
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      )}
    </div>
  );
};

export default memo(CustomNode);
