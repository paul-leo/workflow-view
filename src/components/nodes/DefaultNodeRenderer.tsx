import React from 'react';
import { Square, HelpCircle } from 'lucide-react';
import { BaseNodeRenderer, NodeRendererUtils } from './BaseNodeRenderer';

// 节点渲染器属性接口
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

/**
 * 默认节点渲染器
 * 当没有为特定节点类型注册专用渲染器时使用
 */
export const DefaultNodeRenderer: React.FC<NodeRendererProps> = (props) => {
  const { data } = props;

  // 渲染节点详细信息
  const renderDetails = () => {
    if (!data.settings || Object.keys(data.settings).length === 0) {
      return (
        <div className="node-detail">
          <span className="node-detail-label">类型:</span>{' '}
          <span className="node-detail-value">{data.type}</span>
        </div>
      );
    }

    // 显示前几个设置项
    const settingsEntries = Object.entries(data.settings).slice(0, 3);
    
    return (
      <div className="default-node-details">
        <div className="node-detail">
          <span className="node-detail-label">类型:</span>{' '}
          <span className="node-detail-value">{data.type}</span>
        </div>
        {settingsEntries.map(([key, value]) => (
          <div key={key} className="node-detail">
            <span className="node-detail-label">{formatSettingKey(key)}:</span>{' '}
            <span className="node-detail-value">
              {formatSettingValue(value)}
            </span>
          </div>
        ))}
        {Object.keys(data.settings).length > 3 && (
          <div className="node-detail">
            <span className="node-detail-value">
              ...还有 {Object.keys(data.settings).length - 3} 项配置
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseNodeRenderer
      {...props}
      header={{
        title: getNodeTypeLabel(data.type),
        icon: <Square size={14} />,
        backgroundColor: '#6B7280',
        showStatus: true
      }}
      content={{
        title: data.name,
        details: renderDetails()
      }}
      styling={{
        className: 'default-node-renderer'
      }}
    />
  );
};

// 获取节点类型的显示标签
function getNodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'timer-trigger': '定时器',
    'http-request': 'HTTP',
    'code': '代码',
    'condition': '条件',
    'agent': 'AI',
    'workflow': '工作流',
    'unknown': '未知'
  };
  return labels[type] || type.toUpperCase();
}

// 格式化设置键名
function formatSettingKey(key: string): string {
  const keyLabels: Record<string, string> = {
    'url': 'URL',
    'method': '方法',
    'timeout': '超时',
    'interval': '间隔',
    'condition': '条件',
    'code': '代码',
    'model': '模型',
    'systemPrompt': '系统提示',
    'headers': '请求头',
    'body': '请求体',
    'bodyTemplate': '请求体模板'
  };
  
  return keyLabels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// 格式化设置值
function formatSettingValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '未设置';
  }
  
  if (typeof value === 'string') {
    // 对于长字符串，截断显示
    if (value.length > 30) {
      return NodeRendererUtils.truncateText(value, 30);
    }
    return value;
  }
  
  if (typeof value === 'number') {
    // 对于时间间隔，格式化为易读形式
    if (value > 1000 && value % 1000 === 0) {
      return NodeRendererUtils.formatDuration(value);
    }
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  
  if (Array.isArray(value)) {
    return `[${value.length} 项]`;
  }
  
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `{${keys.length} 项}`;
  }
  
  return String(value);
}

/**
 * 未知类型节点渲染器
 * 用于渲染完全未知的节点类型
 */
export const UnknownNodeRenderer: React.FC<NodeRendererProps> = (props) => {
  const { data } = props;

  const renderWarning = () => (
    <div className="unknown-node-warning">
      <HelpCircle size={16} className="warning-icon" />
      <span>未知的节点类型: {data.type}</span>
    </div>
  );

  return (
    <BaseNodeRenderer
      {...props}
      header={{
        title: '未知节点',
        icon: <HelpCircle size={14} />,
        backgroundColor: '#F59E0B',
        showStatus: true
      }}
      content={{
        title: data.name || '未命名节点',
        subtitle: `类型: ${data.type}`,
        details: renderWarning()
      }}
      styling={{
        className: 'unknown-node-renderer',
        borderColor: '#F59E0B'
      }}
    />
  );
};

// 样式组件
const DefaultNodeStyles = () => (
  <style>{`
    .default-node-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .unknown-node-warning {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px;
      background: #FEF3C7;
      border: 1px solid #F59E0B;
      border-radius: 4px;
      color: #92400E;
      font-size: 11px;
    }
    
    .unknown-node-warning .warning-icon {
      flex-shrink: 0;
    }
    
    .unknown-node-renderer {
      border-color: #F59E0B !important;
    }
    
    .unknown-node-renderer:hover {
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2) !important;
    }
  `}</style>
);

// 导出样式组件以便在需要时使用
export { DefaultNodeStyles };
