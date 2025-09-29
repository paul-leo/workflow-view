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
