import React, { useState, useCallback, useEffect } from 'react';
import { WorkflowExecutor } from './components/WorkflowExecutor';
import { WorkflowSerializer } from './core/utils/WorkflowSerializer';
import type { WorkflowJson } from './components/WorkflowCanvas';
import { Upload, AlertCircle, Copy, Check, Send } from 'lucide-react';
import './App.css';

// 导入示例工作流
import dataScraping from './core/examples/data-scraping-workflow.json';
import contentGeneration from './core/examples/content-generation-workflow.json';
import orderProcessing from './core/examples/order-processing-workflow.json';
import agentWorkflow from './core/examples/agent-workflow-example.json';

// 工作流示例配置
const EXAMPLE_WORKFLOWS = [
  {
    id: 'agent-workflow',
    name: 'AI Agent Tool Demo Workflow',
    description: 'Demonstrates how AI Agent nodes use multiple tools for intelligent processing',
    data: agentWorkflow
  },
  {
    id: 'data-scraping',
    name: 'Data Scraping & Analysis Workflow',
    description: 'Automatically scrape Bitcoin price data, analyze it and send alerts when price fluctuations exceed threshold',
    data: dataScraping
  },
  {
    id: 'content-generation',
    name: 'Content Generation Workflow',
    description: 'Automated workflow for generating high-quality content based on user input',
    data: contentGeneration
  },
  {
    id: 'order-processing',
    name: 'Order Processing Workflow',
    description: 'Automated order processing flow including validation, payment and shipping',
    data: orderProcessing
  }
] as const;

// 读取文件为文本的辅助函数
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}

function App() {
  const [workflowData, setWorkflowData] = useState<WorkflowJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [chatMessage, setChatMessage] = useState<string>('');

  // 加载示例工作流
  const loadExampleWorkflow = useCallback((workflowId: string) => {
    try {
      const workflow = EXAMPLE_WORKFLOWS.find(w => w.id === workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // 验证JSON格式
      const validation = WorkflowSerializer.validate(workflow.data);
      if (!validation.valid) {
        throw new Error(`Invalid workflow format: ${validation.errors.join(', ')}`);
      }
      
      setWorkflowData(workflow.data as WorkflowJson);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load example workflow');
    }
  }, []);

  // 初始随机选择一个示例并加载
  useEffect(() => {
    const random = EXAMPLE_WORKFLOWS[0];
    loadExampleWorkflow(random.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file');
      return;
    }

    setError(null);

    try {
      const content = await readFileAsText(file);
      const parsed = JSON.parse(content);
      
      // 验证格式
      const validation = WorkflowSerializer.validate(parsed);
      if (!validation.valid) {
        throw new Error(`Invalid workflow format: ${validation.errors.join(', ')}`);
      }
      
      setWorkflowData(parsed as WorkflowJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow file');
    }
  }, []);


  // 执行事件处理
  const handleExecutionStart = useCallback(() => {
    console.log('Workflow execution started');
  }, []);

  const handleExecutionComplete = useCallback((results: unknown[]) => {
    console.log('Workflow execution completed:', results);
  }, []);

  const handleExecutionError = useCallback((error: string) => {
    console.error('Workflow execution error:', error);
    setError(`Execution error: ${error}`);
  }, []);

  // 复制工作流JSON到剪贴板
  const copyWorkflowJson = useCallback(async () => {
    if (!workflowData) return;

    try {
      const jsonString = JSON.stringify(workflowData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopiedToClipboard(true);
      
      // 3秒后重置复制状态
      setTimeout(() => {
        setCopiedToClipboard(false);
      }, 3000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [workflowData]);

  // 处理聊天消息发送
  const handleChatSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    // TODO: 处理聊天消息
    console.log('Chat message:', chatMessage);
    setChatMessage('');
  }, [chatMessage]);

  return (
    <div className="app">
      <div className="app-main">
        <div className="app-toolbar">
          <div className="toolbar-actions">
            <button
              className={`toolbar-btn ${copiedToClipboard ? 'success' : ''}`}
              onClick={copyWorkflowJson}
              title="复制工作流JSON"
            >
              {copiedToClipboard ? <Check size={16} /> : <Copy size={16} />}
              {copiedToClipboard ? '已复制' : '复制JSON'}
            </button>
            <label className="toolbar-btn upload-like">
              <Upload size={16} /> 导入JSON
              <input type="file" accept=".json" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
        {error && (
          <div className="error-message inline">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {workflowData && (
          <div className="workflow-container">
            <WorkflowExecutor
              workflowData={workflowData}
              showControls={false}
              showMiniMap={false}
              singleRow={true}
              onExecutionStart={handleExecutionStart}
              onExecutionComplete={handleExecutionComplete}
              onExecutionError={handleExecutionError}
            />
          </div>
        )}
        <div className="chat-container">
          <form onSubmit={handleChatSubmit} className="chat-form">
            <div className="chat-input-wrapper">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="输入消息..."
                className="chat-input"
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!chatMessage.trim()}
                title="发送消息"
                aria-label="发送消息"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;