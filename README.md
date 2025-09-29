## 主要类型（由小到大）

仅保留最核心的类型，重点体现"如何设计"而非参数细节。

### 1) 节点（`src/core/abstract/BaseNode.ts`）

```ts
export interface NodeExecutionContext {
  workflowId: string;
  nodeId: string;
  previousResults: Map<string, unknown>;
}

export interface NodeExecutionResult<T = unknown> { success: boolean; data?: T }

export interface NodeConfig { id: string; name: string; type: string }

export abstract class BaseNode<TIn extends Record<string, unknown>, TOut extends Record<string, unknown>, TSettings extends Record<string, unknown>> {
  readonly id: string;
  readonly config: NodeConfig;          // 声明节点身份与类型
  settings: TSettings;                  // 运行期设置（由原始设置解析而来）
  abstract execute(inputs: TIn, ctx: NodeExecutionContext): Promise<NodeExecutionResult<TOut>>; // 纯函数式执行契约
}
```

- **设计**：通过抽象类约束输入/输出/设置与执行行为，节点成为最小可替换单元（开闭原则）。

### 2) 工作流（`src/core/abstract/BaseWorkflow.ts`）

```ts
export interface WorkflowConnection { sourceNodeId: string; targetNodeId: string; branchIndex?: number }
export interface WorkflowConfig { id: string; name: string }

export class BaseWorkflow {
  readonly config: WorkflowConfig;                 // 工作流元信息
  nodes: Map<string, BaseNode>;                   // 组合：节点集合
  connections: Map<string, WorkflowConnection>;   // 组合：连接集合
  addNode(node: BaseNode): void;
  addConnection(conn: WorkflowConnection): void;
  execute(): Promise<Map<string, NodeExecutionResult>>; // 编排：最小可用执行（顺序/上下文传递）
}
```

- **设计**：以组合与连接描述编排关系，执行引擎独立于节点实现（解耦执行与能力）。

### 3) 节点渲染器（`src/components/nodes/BaseNodeRenderer.tsx`）

```ts
export interface NodeRendererProps {
  data: { id: string; name: string; type: string; status?: 'pending' | 'running' | 'completed' | 'error' };
  selected?: boolean;
}

export interface BaseNodeRendererProps extends NodeRendererProps {
  header?: { title?: string; icon?: React.ReactNode; showStatus?: boolean };
  content?: { title?: string; subtitle?: string };
}
```

- **设计**：提供统一 UI 外壳，按 `type` 映射到具体渲染器，实现"能力与呈现"分离、可插拔扩展。

### 4) 工作流画布（编辑器，`src/components/WorkflowCanvas.tsx`）

```ts
export type WorkflowJson = SerializedWorkflow; // 以后端序列化为唯一事实源

export interface WorkflowCanvasProps {
  workflowData: WorkflowJson;                                        // 数据输入
  nodeStatuses?: Record<string, 'pending' | 'running' | 'completed' | 'error'>; // 可视状态
  onNodeClick?: (nodeId: string, data: unknown) => void;             // 交互回调
}
```

- **设计**：把"数据（序列化）→ 布局（自动）→ 呈现（渲染器）→ 交互（回调）"串联起来，前端仅消费模型，不耦合业务逻辑。