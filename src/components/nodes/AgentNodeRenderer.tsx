import React from 'react';
import { Bot } from 'lucide-react';
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

  // 渲染节点内容
  const renderAgentContent = () => {
    return (
      <div className="agent-node-content">
        {/* 简化的工具信息 */}
        {settings.enableTools && tools.length > 0 && (
          <div className="agent-tools-summary">
            <span className="tools-count">{tools.length} Tools</span>
          </div>
        )}
        
        {/* 模型信息（简化显示） */}
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
        title: 'AI Agent',
        icon: <Bot size={14} />,
        backgroundColor: '#8B5CF6',
        showStatus: true
      }}
      content={{
        customContent: renderAgentContent()
      }}
      styling={{
        className: 'agent-node-renderer'
      }}
    />
  );
};