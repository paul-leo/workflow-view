import React, { useState, useEffect } from 'react';
import { Bot, Wrench, Zap, CheckCircle, XCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { BaseNodeRenderer, type BaseNodeRendererProps } from './BaseNodeRenderer';
import { useWorkflowContext } from '../WorkflowContext';
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
  const toolCalls = data.toolCalls || [];
  const settings = data.settings || {};
  
  // 获取工作流上下文中的工具管理方法
  const { addToolNodes, removeToolNodes, updateToolNodeStatus } = useWorkflowContext();
  
  // 控制工具节点显示状态
  const [showToolNodes, setShowToolNodes] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  // 处理工具节点显示/隐藏切换
  const handleToggleToolNodes = () => {
    if (showToolNodes) {
      removeToolNodes(data.id);
      setShowToolNodes(false);
    } else {
      addToolNodes(data.id, tools);
      setShowToolNodes(true);
    }
  };

  // 处理工具激活状态切换
  const handleToolClick = (toolId: string) => {
    const isActive = activeTools.includes(toolId);
    const newActiveTools = isActive 
      ? activeTools.filter(id => id !== toolId)
      : [...activeTools, toolId];
    
    setActiveTools(newActiveTools);
    updateToolNodeStatus(data.id, toolId, !isActive);
  };

  // 当组件卸载时清理工具节点
  useEffect(() => {
    return () => {
      if (showToolNodes) {
        removeToolNodes(data.id);
      }
    };
  }, [data.id, removeToolNodes, showToolNodes]);

  // 渲染工具列表
  const renderTools = () => {
    if (tools.length === 0) return null;

    return (
      <div className="agent-tools-section">
        <div className="agent-tools-header">
          <Wrench size={12} />
          <span>工具 ({tools.length})</span>
        </div>
        <div className="agent-tools-list">
          {tools.slice(0, 3).map((tool) => (
            <div 
              key={tool.id} 
              className={`agent-tool-item ${activeTools.includes(tool.id) ? 'active' : ''} clickable`}
              onClick={() => handleToolClick(tool.id)}
            >
              <div className="agent-tool-icon">
                {tool.icon || <Zap size={10} />}
              </div>
              <div className="agent-tool-info">
                <div className="agent-tool-name">{tool.name}</div>
                {tool.category && (
                  <div className="agent-tool-category">{tool.category}</div>
                )}
              </div>
              {activeTools.includes(tool.id) && (
                <div className="agent-tool-status">
                  <CheckCircle size={10} className="active" />
                </div>
              )}
            </div>
          ))}
          {tools.length > 3 && (
            <div className="agent-tools-more">
              +{tools.length - 3} 更多
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染最近的工具调用
  const renderRecentToolCalls = () => {
    if (toolCalls.length === 0) return null;

    const recentCalls = toolCalls.slice(-2); // 显示最近2次调用

    return (
      <div className="agent-tool-calls-section">
        <div className="agent-tool-calls-header">
          <Clock size={12} />
          <span>最近调用</span>
        </div>
        <div className="agent-tool-calls-list">
          {recentCalls.map((call, index) => (
            <div key={`${call.toolId}-${call.timestamp}-${index}`} className="agent-tool-call-item">
              <div className="agent-tool-call-status">
                {call.result.success ? (
                  <CheckCircle size={10} className="success" />
                ) : (
                  <XCircle size={10} className="error" />
                )}
              </div>
              <div className="agent-tool-call-name">{call.toolName}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染节点内容
  const renderAgentContent = () => {
    return (
      <div className="agent-node-content">
        {/* 模型信息 */}
        {settings.model && (
          <div className="agent-model-info">
            <span className="agent-model-label">模型:</span>
            <span className="agent-model-name">{settings.model}</span>
          </div>
        )}

        {/* 工具状态 */}
        {settings.enableTools && (
          <div className="agent-tools-status">
            <Wrench size={12} />
            <span>工具已启用</span>
            {settings.maxToolCalls && (
              <span className="agent-max-calls">
                (最多 {settings.maxToolCalls} 次)
              </span>
            )}
            {tools.length > 0 && (
              <button 
                className="agent-tool-nodes-toggle"
                onClick={handleToggleToolNodes}
                title={showToolNodes ? '隐藏工具节点' : '显示工具节点'}
              >
                {showToolNodes ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showToolNodes ? '隐藏工具' : '显示工具'}</span>
              </button>
            )}
          </div>
        )}

        {/* 工具列表（显示可用工具） */}
        {renderTools()}

        {/* 最近工具调用 */}
        {renderRecentToolCalls()}
      </div>
    );
  };


  return (
    <BaseNodeRenderer
      {...restProps}
      data={data}
      header={{
        title: data.name,
        icon: <Bot size={16} />,
        backgroundColor: '#8B5CF6', // 紫色主题
        showStatus: true
      }}
      content={{
        customContent: renderAgentContent()
      }}
      handles={{
        showInput: true,
        showOutput: true
      }}
      styling={{
        borderColor: props.selected ? '#8B5CF6' : '#E5E7EB',
        backgroundColor: '#FFFFFF',
        minWidth: 280,
        maxWidth: 320,
        className: 'agent-node-renderer'
      }}
      className={`agent-node ${props.className || ''}`}
    />
  );
};
