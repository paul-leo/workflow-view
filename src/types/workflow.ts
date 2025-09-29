export interface Position {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  title: string;
  type: 'task' | 'block' | 'condition' | 'start' | 'end' | 'agent' | 'tool' | 'trigger';
  status?: 'pending' | 'running' | 'completed' | 'error';
  description?: string;
  children?: WorkflowNode[];
  expanded?: boolean;
  position: Position;
  icon?: string;
  width?: number;
  height?: number;
  parentId?: string;
  // 新增属性支持块的圆点形式
  isCollapsible?: boolean;  // 是否可折叠
  collapsedRadius?: number; // 折叠时的圆点半径
  category?: string;        // 节点分类
  subtitle?: string;        // 副标题
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  type?: 'success' | 'error' | 'default' | 'dashed';
  label?: string;
  animated?: boolean;
  isSubConnection?: boolean;  // 是否是子连接（虚线）
}

export interface Workflow {
  id: string;
  title: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: Connection[];
}

export interface WorkflowViewProps {
  workflow: Workflow;
  onNodeClick?: (node: WorkflowNode) => void;
  onNodeToggle?: (nodeId: string) => void;
}
