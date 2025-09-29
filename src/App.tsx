import React, { useState, useCallback } from 'react';
import { WorkflowExecutor } from './components/WorkflowExecutor';
import { WorkflowSerializer } from './core/utils/WorkflowSerializer';
import type { WorkflowJson } from './components/WorkflowCanvas';
import { Upload, FileText, AlertCircle, Copy, Check } from 'lucide-react';
import './App.css';

// 导入示例工作流
import dataScraping from './core/examples/data-scraping-workflow.json';
import contentGeneration from './core/examples/content-generation-workflow.json';
import orderProcessing from './core/examples/order-processing-workflow.json';

// 工作流示例配置
const EXAMPLE_WORKFLOWS = [
  {
    id: 'data-scraping',
    name: '数据抓取与分析工作流',
    description: '自动抓取比特币价格数据，进行分析并在价格波动超过阈值时发送警报通知',
    data: dataScraping
  },
  {
    id: 'content-generation',
    name: '内容生成工作流',
    description: '基于用户输入生成高质量内容的自动化工作流',
    data: contentGeneration
  },
  {
    id: 'order-processing',
    name: '订单处理工作流',
    description: '自动化订单处理流程，包括验证、支付和发货',
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
  const [loading, setLoading] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

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

  // 处理文件上传
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file');
      return;
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理拖拽上传
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
    if (file && file.name.endsWith('.json')) {
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    } else {
      setError('Please drop a JSON file');
    }
  }, [handleFileUpload]);

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

  return (
    <div className="app">
      {!workflowData ? (
        <div className="app-welcome">
          <div className="welcome-content">
            <h1 className="welcome-title">工作流可视化执行器</h1>
            <p className="welcome-description">
              上传工作流JSON文件或加载示例工作流来开始可视化和执行
            </p>

            {/* 文件上传区域 */}
            <div
              className="upload-area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="upload-input"
                id="workflow-upload"
                disabled={loading}
              />
              <label htmlFor="workflow-upload" className="upload-label">
                <Upload size={48} className="upload-icon" />
                <span className="upload-text">
                  {loading ? '加载中...' : '点击上传或拖拽JSON文件到这里'}
                </span>
                <span className="upload-hint">支持 .json 格式的工作流文件</span>
              </label>
            </div>

            {/* 示例工作流选择 */}
            <div className="example-section">
              <h3>或者选择示例工作流：</h3>
              <div className="example-workflows">
                {EXAMPLE_WORKFLOWS.map((workflow) => (
                  <div key={workflow.id} className="workflow-card">
                    <div className="workflow-card-content">
                      <h4 className="workflow-card-title">{workflow.name}</h4>
                      <p className="workflow-card-description">{workflow.description}</p>
                    </div>
                    <button
                      className="workflow-card-btn"
                      onClick={() => loadExampleWorkflow(workflow.id)}
                      disabled={loading}
                    >
                      <FileText size={16} />
                      加载
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="app-main">
          <div className="app-toolbar">
            <button
              className={`toolbar-btn ${copiedToClipboard ? 'success' : ''}`}
              onClick={copyWorkflowJson}
              title="复制工作流JSON"
            >
              {copiedToClipboard ? <Check size={16} /> : <Copy size={16} />}
              {copiedToClipboard ? '已复制' : '复制JSON'}
            </button>
            <button
              className="toolbar-btn secondary"
              onClick={() => setWorkflowData(null)}
              title="返回首页"
            >
              返回首页
            </button>
          </div>
          <WorkflowExecutor
            workflowData={workflowData}
            onExecutionStart={handleExecutionStart}
            onExecutionComplete={handleExecutionComplete}
            onExecutionError={handleExecutionError}
          />
        </div>
      )}
    </div>
  );
}

export default App;