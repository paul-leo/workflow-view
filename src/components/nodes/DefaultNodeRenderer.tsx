import React from 'react';
import { Square } from 'lucide-react';
import { BaseNodeRenderer } from './BaseNodeRenderer';
import { NodeRegistry } from '../../core/utils/WorkflowSerializer';

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

  // 渲染节点详细信息（简化版）
  const renderDetails = () => {
    // 只显示节点类型，更简洁
    return (
      <div className="default-node-details-compact">
        <div className="node-type-compact">
          {data.type}
        </div>
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
  // 首先尝试从注册表获取节点构造函数
  NodeRegistry.initializeBuiltinTypes();
  const NodeConstructor = NodeRegistry.getNodeConstructor(type);
  
  if (NodeConstructor) {
    // 如果找到了构造函数，尝试获取更友好的名称
    const typeLabels: Record<string, string> = {
      'timer-trigger': '定时触发',
      'http-request': 'HTTP请求',
      'code': '代码执行',
      'agent': 'AI智能体',
      'condition': '条件判断'
    };
    
    return typeLabels[type] || type.toUpperCase();
  }
  
  // 回退到默认标签
  const fallbackLabels: Record<string, string> = {
    'trigger': '触发器',
    'task': '任务',
    'condition': '条件',
    'start': '开始',
    'end': '结束',
    'agent': 'AI智能体',
    'tool': '工具',
    'unknown': '未知'
  };
  
  return fallbackLabels[type] || type.toUpperCase();
}