import React from 'react';
import { DefaultNodeRenderer } from './nodes/DefaultNodeRenderer';
import type { NodeRendererProps } from './nodes/DefaultNodeRenderer';

// 节点数据接口
export interface WorkflowNodeData {
  id: string;
  name: string;
  type: string;
  status?: 'pending' | 'running' | 'completed' | 'error';
  settings?: Record<string, unknown>;
  originalSettings?: Record<string, unknown>;
}

// 节点属性接口 - 兼容ReactFlow
export interface WorkflowNodeProps extends NodeRendererProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

/**
 * 工作流节点组件 - 使用默认渲染器
 */
export const WorkflowNode: React.FC<WorkflowNodeProps> = (props) => {
  return <DefaultNodeRenderer {...props} />;
};

