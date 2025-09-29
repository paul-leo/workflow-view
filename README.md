# Workflow Visualization Application

An interactive React-based workflow visualization application for displaying and exploring complex workflows.

## 🚀 Tech Stack

### Frontend Framework & Tools
- **React 19.1.1** - For building user interfaces
- **TypeScript 5.8.3** - Provides type safety and better development experience
- **Vite 7.1.7** - Fast build tool and development server

### Visualization & Interaction
- **React Flow 11.11.4** - Core node graph visualization library
- **D3.js Types** - Data visualization type support
- **Lucide React 0.544.0** - Modern icon library

### Development Tools
- **ESLint 9.36.0** - Code quality checking
- **TypeScript ESLint** - TypeScript-specific ESLint rules
- **Vite Plugin React** - React development support

### Deployment & Containerization
- **Docker** - Containerized deployment
- **GitHub Actions** - Automated CI/CD
- **Aliyun Container Registry** - Image storage

## 📋 Workflow Schema Design

### Core Data Structures

#### WorkflowNode Definition
```typescript
interface WorkflowNode {
  id: string;                    // Unique identifier
  title: string;                 // Node title
  type: 'task' | 'block' | 'condition' | 'start' | 'end' | 'agent' | 'tool' | 'trigger';
  status?: 'pending' | 'running' | 'completed' | 'error';  // Execution status
  description?: string;          // Node description
  children?: WorkflowNode[];     // Child nodes (supports nested structure)
  expanded?: boolean;            // Whether to expand child nodes
  position: Position;            // Node position coordinates
  width?: number;                // Node width
  height?: number;               // Node height
  parentId?: string;             // Parent node ID
  isCollapsible?: boolean;       // Whether collapsible to dot form
  collapsedRadius?: number;      // Dot radius when collapsed
  category?: string;             // Node category
  subtitle?: string;             // Node subtitle
}
```

#### Connection Definition
```typescript
interface Connection {
  id: string;                    // Connection unique identifier
  from: string;                  // Source node ID
  to: string;                    // Target node ID
  type?: 'success' | 'error' | 'default' | 'dashed';  // Connection type
  label?: string;                // Connection label
  animated?: boolean;            // Whether to show animation
  isSubConnection?: boolean;     // Whether it's a sub-connection (dashed style)
}
```

#### Workflow Definition
```typescript
interface Workflow {
  id: string;                    // Workflow unique identifier
  title: string;                 // Workflow title
  description?: string;          // Workflow description
  nodes: WorkflowNode[];         // Node list
  connections: Connection[];     // Connection list
}
```

### Node Types

| Type | Description | Icon | Usage |
|------|-------------|------|-------|
| `trigger` | Trigger | ⚡ | Workflow entry points, such as form submissions, scheduled tasks |
| `agent` | AI Agent | 🤖 | Intelligent agent nodes that can contain multiple tools |
| `tool` | Tool | ⚙️ | Specific execution tools, such as API calls, data processing |
| `task` | Task | ⚠️ | Regular task nodes |
| `condition` | Condition | ⚠️ | Conditional judgment nodes supporting branching flows |
| `block` | Block | 📁 | Collapsible node groups supporting nested structures |
| `start` | Start | ▶️ | Process start node |
| `end` | End | ✅ | Process end node |

### Status System

- **pending** - Waiting for execution
- **running** - Currently executing (shows progress animation)
- **completed** - Execution completed
- **error** - Execution failed

### Special Features

#### Collapsible Nodes
- Support collapsing complex node groups into dot form
- `isCollapsible: true` enables collapse functionality
- `expanded: false` sets to collapsed state
- Shows child node count when collapsed

#### Sub-connections
- `isSubConnection: true` marks as internal connections
- Uses dashed style to distinguish main flow from sub-flows
- Supports different connection types and animation effects

## ✨ Features

- 🎨 **Modern UI Design** - Dark theme support with beautiful visual effects
- 🔍 **Interactive Exploration** - Pan, zoom, and navigate through workflows
- 📱 **Responsive Layout** - Adapts to different screen sizes
- 🎯 **Smart Layout** - Automatic node positioning and connection path optimization
- 🔀 **Diverse Node Types** - Support for multiple node types and states
- 📊 **Status Visualization** - Real-time display of execution status and progress
- 🎮 **Interactive Controls** - Node expand/collapse, click events, and more
- 👀 **Read-only Display** - Focus on workflow visualization and exploration

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t workflow-view .

# Run container
docker run -p 3000:3000 workflow-view
```

The application will be available at `http://localhost:3000`

### Usage

1. **Explore Workflows**: Use mouse to pan and zoom around the workflow canvas
2. **Node Interaction**: Click on nodes to view details and expand/collapse collapsible blocks
3. **Switch Workflows**: Use the input panel to switch between different workflow examples:
   - Type "simple" or "task" to view the Simple Task Flow
   - Type "agent" or "ai" to view the AI Agent Workflow  
   - Type "collapsed" or "block" to view the Collapsed Block Workflow

## 主要类型（由小到大）

仅保留最核心的类型描述，按“节点 → 工作流 → 编辑器（节点渲染器 + 画布）”顺序展示。

### 1) 节点（`src/core/abstract/BaseNode.ts`）

```ts
export interface NodeExecutionContext {
  workflowId: string;
  nodeId: string;
  previousResults: Map<string, unknown>;
  originalSettings?: Record<string, unknown>;
}

export interface NodeExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
}

export interface NodeConfig { id: string; name: string; type: string }

export abstract class BaseNode<TIn extends Record<string, unknown>, TOut extends Record<string, unknown>, TSettings extends Record<string, unknown>> {
  readonly id: string;
  readonly config: NodeConfig;
  settings: TSettings;             // 解析后的设置
  readonly originalSettings: TSettings; // 原始设置（含表达式）
  abstract execute(inputs: TIn, ctx: NodeExecutionContext): Promise<NodeExecutionResult<TOut>>;
  resolveDynamicSettings(inputs: TIn, ctx: NodeExecutionContext): TSettings; // 表达式解析
}
```

- **要点**：以抽象类约束节点输入/输出/设置与执行；原始设置经表达式解析得到运行期设置。

### 2) 工作流（`src/core/abstract/BaseWorkflow.ts`）

```ts
export interface WorkflowConnection { id: string; sourceNodeId: string; targetNodeId: string; branchIndex?: number }
export interface WorkflowConfig { id: string; name: string }

export class BaseWorkflow {
  readonly config: WorkflowConfig;
  nodes: Map<string, BaseNode>;
  connections: Map<string, WorkflowConnection>;
  addNode(node: BaseNode): void;
  addConnection(conn: WorkflowConnection): void;
  execute(): Promise<Map<string, NodeExecutionResult>>; // 简单顺序执行示例
}
```

- **要点**：管理节点与连接，提供最小可用的执行流程（顺序执行 + 上下文传递）。

### 3) 节点渲染器（`src/components/nodes/BaseNodeRenderer.tsx`）

```ts
export interface NodeRendererProps {
  data: { id: string; name: string; type: string; status?: 'pending' | 'running' | 'completed' | 'error'; settings?: Record<string, unknown>; originalSettings?: Record<string, unknown> };
  selected?: boolean;
  onNodeClick?: (nodeId: string, nodeData: unknown) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface BaseNodeRendererProps extends NodeRendererProps {
  header?: { title?: string; icon?: React.ReactNode; backgroundColor?: string; showStatus?: boolean };
  content?: { title?: string; subtitle?: string; details?: React.ReactNode; customContent?: React.ReactNode };
  handles?: { showInput?: boolean; showOutput?: boolean; inputPosition?: import('reactflow').Position; outputPosition?: import('reactflow').Position; customHandles?: React.ReactNode };
  styling?: { borderColor?: string; backgroundColor?: string; minWidth?: number; maxWidth?: number; className?: string };
}

export const STATUS_COLORS = { pending: '#9CA3AF', running: '#3B82F6', completed: '#10B981', error: '#EF4444' } as const;
```

- **要点**：通用节点 UI 外壳，按 props 渲染头部/内容/连接点与状态；上层可按 `type` 选择具体渲染器。

### 4) 工作流画布（编辑器，`src/components/WorkflowCanvas.tsx`）

```ts
export type WorkflowJson = SerializedWorkflow; // 与后端序列化类型对齐

export interface WorkflowCanvasProps {
  workflowData: WorkflowJson;
  onNodeClick?: (nodeId: string, nodeData: WorkflowNodeData) => void;
  nodeStatuses?: Record<string, 'pending' | 'running' | 'completed' | 'error'>;
  className?: string;
  singleRow?: boolean;       // 单行自动布局
  showMiniMap?: boolean;     // 小地图
  showFlowControls?: boolean;// 画布控件
}
```

- **要点**：
  - 以 `SerializedWorkflow` 为输入，转换为 React Flow 节点/边并自动布局。
  - 通过 `nodeStatuses` 驱动可视化状态；`onNodeClick` 下发交互。
  - 支持工具节点虚线连接与分支标签等增强渲染。


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
