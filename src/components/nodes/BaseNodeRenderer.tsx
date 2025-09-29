import React from 'react';
import { Handle, Position } from 'reactflow';
import { AlertCircle } from 'lucide-react';
import './BaseNodeRenderer.css';

// 基础节点渲染器属性接口
export interface NodeRendererProps {
  data: {
    id: string;
    name: string;
    type: string;
    status?: 'pending' | 'running' | 'completed' | 'error';
    settings?: Record<string, unknown>;
    originalSettings?: Record<string, unknown>;
  };
  selected?: boolean;
  onNodeClick?: (nodeId: string, nodeData: unknown) => void;
  className?: string;
  style?: React.CSSProperties;
}

// 节点状态到颜色的映射
export const STATUS_COLORS = {
  'pending': '#9CA3AF',    // gray
  'running': '#3B82F6',    // blue
  'completed': '#10B981',  // green
  'error': '#EF4444'       // red
} as const;

// 基础节点渲染器属性
export interface BaseNodeRendererProps extends NodeRendererProps {
  // 节点头部配置
  header?: {
    title?: string;
    icon?: React.ReactNode;
    backgroundColor?: string;
    showStatus?: boolean;
  };
  // 节点内容配置
  content?: {
    title?: string;
    subtitle?: string;
    details?: React.ReactNode;
    customContent?: React.ReactNode;
  };
  // 连接点配置
  handles?: {
    showInput?: boolean;
    showOutput?: boolean;
    inputPosition?: Position;
    outputPosition?: Position;
    customHandles?: React.ReactNode;
  };
  // 样式配置
  styling?: {
    borderColor?: string;
    backgroundColor?: string;
    minWidth?: number;
    maxWidth?: number;
    className?: string;
  };
}

/**
 * 基础节点渲染器组件
 * 提供通用的节点渲染结构，可以被其他特定类型的节点渲染器继承和扩展
 */
export const BaseNodeRenderer: React.FC<BaseNodeRendererProps> = ({
  data,
  selected = false,
  onNodeClick,
  className = '',
  style = {},
  header = {},
  content = {},
  handles = {},
  styling = {}
}) => {
  // 默认配置
  const defaultHeader = {
    title: data.name,
    showStatus: true,
    backgroundColor: '#6B7280',
    ...header
  };

  const defaultContent = {
    title: data.name,
    ...content
  };

  const defaultHandles = {
    showInput: true,
    showOutput: true,
    inputPosition: Position.Left,
    outputPosition: Position.Right,
    ...handles
  };

  const defaultStyling = {
    borderColor: selected ? defaultHeader.backgroundColor : '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 200,
    maxWidth: 280,
    ...styling
  };

  // 获取状态颜色
  const statusColor = data.status ? STATUS_COLORS[data.status] : undefined;

  // 节点点击处理
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onNodeClick) {
      onNodeClick(data.id, data);
    }
  };

  // 渲染状态指示器
  const renderStatusIndicator = () => {
    if (!defaultHeader.showStatus || !data.status) return null;

    return (
      <div 
        className={`base-node-status status-${data.status}`}
        title={getStatusLabel(data.status)}
      >
        {data.status === 'running' && <div className="status-spinner" />}
        {data.status === 'error' && <AlertCircle size={12} />}
      </div>
    );
  };

  // 渲染节点头部
  const renderHeader = () => {
    if (!defaultHeader.title && !defaultHeader.icon && !defaultHeader.showStatus) {
      return null;
    }

    return (
      <div 
        className="base-node-header"
        style={{ backgroundColor: defaultHeader.backgroundColor }}
      >
        {defaultHeader.icon && (
          <div className="base-node-icon">
            {defaultHeader.icon}
          </div>
        )}
        {defaultHeader.title && (
          <span className="base-node-header-title">
            {defaultHeader.title}
          </span>
        )}
        {renderStatusIndicator()}
      </div>
    );
  };

  // 渲染节点内容
  const renderContent = () => {
    if (defaultContent.customContent) {
      return (
        <div className="base-node-content">
          {defaultContent.customContent}
        </div>
      );
    }

    return (
      <div className="base-node-content">
        {defaultContent.title && (
          <div className="base-node-content-title">
            {defaultContent.title}
          </div>
        )}
        {defaultContent.subtitle && (
          <div className="base-node-content-subtitle">
            {defaultContent.subtitle}
          </div>
        )}
        {defaultContent.details && (
          <div className="base-node-content-details">
            {defaultContent.details}
          </div>
        )}
      </div>
    );
  };

  // 渲染连接点
  const renderHandles = () => {
    if (defaultHandles.customHandles) {
      return defaultHandles.customHandles;
    }

    return (
      <>
        {defaultHandles.showInput && (
          <Handle
            type="target"
            position={defaultHandles.inputPosition!}
            className="base-node-handle base-node-handle-input"
          />
        )}
        {defaultHandles.showOutput && (
          <Handle
            type="source"
            position={defaultHandles.outputPosition!}
            className="base-node-handle base-node-handle-output"
          />
        )}
      </>
    );
  };

  return (
    <div 
      className={`base-node-renderer ${selected ? 'selected' : ''} ${className} ${defaultStyling.className || ''}`}
      style={{
        borderColor: defaultStyling.borderColor,
        backgroundColor: statusColor ? `${statusColor}10` : defaultStyling.backgroundColor,
        minWidth: defaultStyling.minWidth,
        maxWidth: defaultStyling.maxWidth,
        ...style
      }}
      onClick={handleClick}
    >
      {renderHandles()}
      {renderHeader()}
      {renderContent()}
    </div>
  );
};

// 获取状态标签
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': '等待中',
    'running': '运行中',
    'completed': '已完成',
    'error': '错误'
  };
  return labels[status] || status;
}

// 导出一些有用的工具函数
export const NodeRendererUtils = {
  getStatusLabel,
  STATUS_COLORS,
  
  // 格式化持续时间
  formatDuration: (ms: number): string => {
    const seconds = ms / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    
    if (hours >= 1) {
      return `${Math.round(hours)}小时`;
    } else if (minutes >= 1) {
      return `${Math.round(minutes)}分钟`;
    } else {
      return `${Math.round(seconds)}秒`;
    }
  },

  // 截断文本
  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // 截断URL显示
  truncateUrl: (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch {
      return NodeRendererUtils.truncateText(url, 25);
    }
  }
};
