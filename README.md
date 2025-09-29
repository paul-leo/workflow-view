# Workflow Visualization Application

一个基于 React 的交互式工作流可视化应用，支持复杂工作流的展示、编辑和管理。

## 🚀 技术栈

### 前端框架与工具
- **React 19.1.1** - 用于构建用户界面
- **TypeScript 5.8.3** - 提供类型安全和更好的开发体验
- **Vite 7.1.7** - 快速的构建工具和开发服务器

### 可视化与交互
- **React Flow 11.11.4** - 核心的节点图可视化库
- **D3.js Types** - 数据可视化类型支持
- **Lucide React 0.544.0** - 现代化的图标库

### 开发工具
- **ESLint 9.36.0** - 代码质量检查
- **TypeScript ESLint** - TypeScript 专用的 ESLint 规则
- **Vite Plugin React** - React 开发支持

### 部署与容器化
- **Docker** - 容器化部署
- **GitHub Actions** - 自动化 CI/CD
- **Aliyun Container Registry** - 镜像存储

## 📋 Workflow Schema 设计

### 核心数据结构

#### WorkflowNode 节点定义
```typescript
interface WorkflowNode {
  id: string;                    // 唯一标识符
  title: string;                 // 节点标题
  type: 'task' | 'block' | 'condition' | 'start' | 'end' | 'agent' | 'tool' | 'trigger';
  status?: 'pending' | 'running' | 'completed' | 'error';  // 执行状态
  description?: string;          // 节点描述
  children?: WorkflowNode[];     // 子节点（支持嵌套结构）
  expanded?: boolean;            // 是否展开子节点
  position: Position;            // 节点位置坐标
  width?: number;                // 节点宽度
  height?: number;               // 节点高度
  parentId?: string;             // 父节点ID
  isCollapsible?: boolean;       // 是否可折叠为圆点
  collapsedRadius?: number;      // 折叠时的圆点半径
  category?: string;             // 节点分类
  subtitle?: string;             // 副标题
}
```

#### Connection 连接定义
```typescript
interface Connection {
  id: string;                    // 连接唯一标识
  from: string;                  // 源节点ID
  to: string;                    // 目标节点ID
  type?: 'success' | 'error' | 'default' | 'dashed';  // 连接类型
  label?: string;                // 连接标签
  animated?: boolean;            // 是否显示动画
  isSubConnection?: boolean;     // 是否为子连接（虚线样式）
}
```

#### Workflow 工作流定义
```typescript
interface Workflow {
  id: string;                    // 工作流唯一标识
  title: string;                 // 工作流标题
  description?: string;          // 工作流描述
  nodes: WorkflowNode[];         // 节点列表
  connections: Connection[];     // 连接列表
}
```

### 节点类型说明

| 类型 | 说明 | 图标 | 用途 |
|------|------|------|------|
| `trigger` | 触发器 | ⚡ | 工作流入口点，如表单提交、定时任务等 |
| `agent` | AI代理 | 🤖 | 智能代理节点，可包含多个工具 |
| `tool` | 工具 | ⚙️ | 具体的执行工具，如API调用、数据处理等 |
| `task` | 任务 | ⚠️ | 普通任务节点 |
| `condition` | 条件 | ⚠️ | 条件判断节点，支持分支流程 |
| `block` | 块 | 📁 | 可折叠的节点组，支持嵌套结构 |
| `start` | 开始 | ▶️ | 流程开始节点 |
| `end` | 结束 | ✅ | 流程结束节点 |

### 状态系统

- **pending** - 等待执行
- **running** - 正在执行（显示进度动画）
- **completed** - 执行完成
- **error** - 执行失败

### 特殊功能

#### 可折叠节点
- 支持将复杂的节点组折叠为圆点形式
- `isCollapsible: true` 启用折叠功能
- `expanded: false` 设置为折叠状态
- 折叠时显示子节点数量

#### 子连接
- `isSubConnection: true` 标记为内部连接
- 使用虚线样式区分主流程和子流程
- 支持不同的连接类型和动画效果

## ✨ 功能特性

- 🎨 **现代化UI设计** - 支持深色主题，精美的视觉效果
- 🔄 **实时交互** - 节点拖拽、缩放、平移等交互操作
- 📱 **响应式布局** - 适配不同屏幕尺寸
- 🎯 **智能布局** - 自动节点布局和连接路径优化
- 🔀 **多样化节点** - 支持多种节点类型和状态
- 📊 **状态可视化** - 实时显示执行状态和进度
- 🎮 **交互控制** - 支持节点展开/折叠、点击事件等

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
