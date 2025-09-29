import React, { useState } from 'react';
import { Bot, ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { BaseNodeRenderer, type BaseNodeRendererProps } from './BaseNodeRenderer';
import './AgentNodeRenderer.css';

// Agent节点渲染器属性
export interface AgentNodeRendererProps extends Omit<BaseNodeRendererProps, 'header' | 'content'> {
  data: BaseNodeRendererProps['data'] & {
    settings?: {
      systemPrompt?: string;
      model?: string;
      enableTools?: boolean;
      maxToolCalls?: number;
    };
    tools?: Array<{
      id: string;
      name: string;
      description: string;
      category?: string;
      icon?: React.ReactNode;
    }>;
    toolCalls?: Array<{
      toolId: string;
      toolName: string;
      input: unknown;
      result: {
        success: boolean;
        data?: unknown;
        error?: Error;
      };
      timestamp: number;
    }>;
  };
}

/**
 * Agent节点专用渲染器
 * 显示AI智能体节点，支持工具展示和工具调用历史
 */
export const AgentNodeRenderer: React.FC<AgentNodeRendererProps> = (props) => {
  const { data, ...restProps } = props;
  const tools = data.tools || [];
  const settings = data.settings || {};
  
  // 工具列表折叠状态
  const [toolsExpanded, setToolsExpanded] = useState(false);

  // 渲染工具列表
  const renderToolsList = () => {
    if (!settings.enableTools || tools.length === 0) return null;

    return (
      <div className="agent-tools-section">
        <div 
          className="agent-tools-header" 
          onClick={() => setToolsExpanded(!toolsExpanded)}
        >
          <Wrench size={12} />
          <span className="tools-count">{tools.length} Tools</span>
          {toolsExpanded ? (
            <ChevronDown size={12} className="tools-toggle" />
          ) : (
            <ChevronRight size={12} className="tools-toggle" />
          )}
        </div>
        
        {toolsExpanded && (
          <div className="agent-tools-list">
            {tools.map((tool) => (
              <div key={tool.id} className="agent-tool-item">
                <div className="agent-tool-name">{tool.name}</div>
                {tool.category && (
                  <div className="agent-tool-category">{tool.category}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 渲染节点内容（简化显示）
  const renderAgentContent = () => {
    return (
      <div className="agent-node-content">
        {/* 工具列表（可折叠） */}
        {renderToolsList()}
        
        {/* 模型信息 */}
        {settings.model && (
          <div className="agent-model-compact">
            {settings.model}
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
        title: '', // 不显示文字标题，只用图标
        icon: <Bot size={20} />,
        backgroundColor: '#8B5CF6', // 紫色主题
        showStatus: true
      }}
      content={{
        title: data.name,
        subtitle: 'AI AGENT',
        customContent: renderAgentContent()
      }}
      handles={{
        showInput: true,
        showOutput: true
      }}
      styling={{
        borderColor: props.selected ? '#60A5FA' : '#374151',
        backgroundColor: '#1F2937',
        minWidth: 200,
        maxWidth: 240,
        className: 'agent-node-renderer'
      }}
      className={`agent-node ${props.className || ''}`}
    />
  );
};