import React from 'react';
import { Wrench, Zap, Calculator, Search, Code2, FileText, Clock } from 'lucide-react';
import { BaseNodeRenderer, type BaseNodeRendererProps } from './BaseNodeRenderer';
import './ToolNodeRenderer.css';

// 工具节点渲染器属性
export interface ToolNodeRendererProps extends Omit<BaseNodeRendererProps, 'header' | 'content'> {
  data: BaseNodeRendererProps['data'] & {
    toolInfo?: {
      id: string;
      name: string;
      description: string;
      category?: string;
      parentAgentId?: string;
    };
  };
}

// 工具图标映射
const getToolIcon = (toolId: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'calculator': <Calculator size={14} />,
    'web-search': <Search size={14} />,
    'code-executor': <Code2 size={14} />,
    'text-processor': <FileText size={14} />,
    'time-tool': <Clock size={14} />,
  };
  
  return iconMap[toolId] || <Zap size={14} />;
};

// 工具分类颜色映射
const getCategoryColor = (category?: string) => {
  const colorMap: Record<string, string> = {
    '数学': '#F59E0B',
    '搜索': '#3B82F6',
    '开发': '#10B981',
    '文本': '#8B5CF6',
    '工具': '#6B7280',
  };
  
  return colorMap[category || ''] || '#6B7280';
};

/**
 * 工具节点专用渲染器
 * 显示工具节点，用虚线连接到父 Agent 节点
 */
export const ToolNodeRenderer: React.FC<ToolNodeRendererProps> = (props) => {
  const { data, ...restProps } = props;
  const toolInfo = data.toolInfo;

  if (!toolInfo) {
    return (
      <BaseNodeRenderer
        {...restProps}
        data={data}
        header={{
          title: '未知工具',
          icon: <Wrench size={14} />,
          backgroundColor: '#6B7280',
          showStatus: true
        }}
        content={{
          title: data.name,
          subtitle: '工具信息缺失'
        }}
        styling={{
          className: 'tool-node-renderer tool-node-error'
        }}
      />
    );
  }

  const categoryColor = getCategoryColor(toolInfo.category);
  const toolIcon = getToolIcon(toolInfo.id);

  // 渲染工具内容
  const renderToolContent = () => {
    return (
      <div className="tool-node-content">
        {/* 工具描述 */}
        <div className="tool-description">
          {toolInfo.description}
        </div>

        {/* 工具分类 */}
        {toolInfo.category && (
          <div className="tool-category">
            <div 
              className="tool-category-badge"
              data-category={toolInfo.category}
            >
              {toolInfo.category}
            </div>
          </div>
        )}

        {/* 父 Agent 信息 */}
        {toolInfo.parentAgentId && (
          <div className="tool-parent-info">
            <span className="tool-parent-label">来自:</span>
            <span className="tool-parent-name">{toolInfo.parentAgentId}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseNodeRenderer
      {...restProps}
      data={data}
      header={{
        title: toolInfo.name,
        icon: toolIcon,
        backgroundColor: categoryColor,
        showStatus: true
      }}
      content={{
        customContent: renderToolContent()
      }}
      handles={{
        showInput: false,  // 工具节点不需要输入连接点
        showOutput: false  // 工具节点不需要输出连接点
      }}
      styling={{
        borderColor: props.selected ? categoryColor : '#E5E7EB',
        backgroundColor: '#FFFFFF',
        minWidth: 180,
        maxWidth: 220,
        className: 'tool-node-renderer'
      }}
      className={`tool-node ${props.className || ''}`}
    />
  );
};
