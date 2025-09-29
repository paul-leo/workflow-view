import React, { createContext, useContext } from 'react';

// 工具管理方法接口
export interface ToolManagementMethods {
  addToolNodes: (agentId: string, tools: Array<{
    id: string;
    name: string;
    description: string;
    category?: string;
  }>) => void;
  removeToolNodes: (agentId: string) => void;
  updateToolNodeStatus: (agentId: string, toolId: string, isActive: boolean) => void;
}

// 工作流上下文
export interface WorkflowContextValue extends ToolManagementMethods {}

// 创建 Context
export const WorkflowContext = createContext<WorkflowContextValue | null>(null);

// Context Provider 组件
export interface WorkflowProviderProps {
  children: React.ReactNode;
  value: WorkflowContextValue;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children, value }) => {
  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Hook 用于获取工作流上下文
export const useWorkflowContext = (): WorkflowContextValue => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflowContext must be used within a WorkflowProvider');
  }
  return context;
};
