import React from 'react';
import { 
  Square, 
  Play, 
  Globe, 
  Code2, 
  Bot, 
  GitBranch, 
  Clock, 
  Zap, 
  Database,
  Settings,
  FileText,
  CheckCircle
} from 'lucide-react';
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

// 获取节点类型对应的图标
function getNodeTypeIcon(type: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    'timer-trigger': <Clock size={20} />,
    'http-request': <Globe size={20} />,
    'code': <Code2 size={20} />,
    'agent': <Bot size={20} />,
    'condition': <GitBranch size={20} />,
    'trigger': <Play size={20} />,
    'task': <Settings size={20} />,
    'start': <Play size={20} />,
    'end': <CheckCircle size={20} />,
    'tool': <Zap size={20} />,
    'database': <Database size={20} />,
    'document': <FileText size={20} />,
    'unknown': <Square size={20} />
  };
  
  return iconMap[type] || <Square size={20} />;
}

// 获取节点类型对应的颜色
function getNodeTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    'timer-trigger': '#10B981', // 绿色
    'http-request': '#3B82F6',  // 蓝色
    'code': '#8B5CF6',          // 紫色
    'agent': '#EF4444',         // 红色
    'condition': '#F59E0B',     // 黄色
    'trigger': '#10B981',       // 绿色
    'task': '#6B7280',          // 灰色
    'start': '#10B981',         // 绿色
    'end': '#EF4444',           // 红色
    'tool': '#F59E0B',          // 黄色
    'database': '#3B82F6',      // 蓝色
    'document': '#8B5CF6',      // 紫色
    'unknown': '#6B7280'        // 灰色
  };
  
  return colorMap[type] || '#6B7280';
}

/**
 * 默认节点渲染器
 * 当没有为特定节点类型注册专用渲染器时使用
 */
export const DefaultNodeRenderer: React.FC<NodeRendererProps> = (props) => {
  const { data } = props;
  const nodeIcon = getNodeTypeIcon(data.type);
  const nodeColor = getNodeTypeColor(data.type);

  return (
    <BaseNodeRenderer
      {...props}
      header={{
        title: '', // 不显示文字标题，只用图标
        icon: nodeIcon,
        backgroundColor: nodeColor,
        showStatus: true
      }}
      content={{
        title: data.name,
        subtitle: getNodeTypeLabel(data.type)
      }}
      styling={{
        className: 'default-node-renderer',
        minWidth: 160,
        maxWidth: 200
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
    // If constructor found, try to get friendly names
    const typeLabels: Record<string, string> = {
      'timer-trigger': 'Timer Trigger',
      'http-request': 'HTTP Request',
      'code': 'Code Execution',
      'agent': 'AI Agent',
      'condition': 'Condition'
    };
    
    return typeLabels[type] || type.toUpperCase();
  }
  
  // Fallback to default labels
  const fallbackLabels: Record<string, string> = {
    'trigger': 'Trigger',
    'task': 'Task',
    'condition': 'Condition',
    'start': 'Start',
    'end': 'End',
    'agent': 'AI Agent',
    'tool': 'Tool',
    'unknown': 'Unknown'
  };
  
  return fallbackLabels[type] || type.toUpperCase();
}