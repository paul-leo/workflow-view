# 工作流展示系统使用说明

## 功能特性

### 🎯 核心功能
- **React-Flow风格展示**：采用现代化的节点连线可视化设计
- **交互式画布**：支持拖拽平移、滚轮缩放、节点选择
- **智能连接线**：平滑的贝塞尔曲线连接，支持动画效果
- **块展开/收起**：支持嵌套的子工作流，可点击展开或收起
- **状态指示**：不同状态用颜色和动画区分（pending、running、completed、error）
- **底部输入框**：支持通过指令控制工作流展示
- **响应式设计**：适配不同屏幕尺寸，支持暗色模式

### 🏗️ 节点类型
- `start`：开始节点 🚀
- `end`：结束节点 🏁
- `task`：任务节点 📋
- `condition`：条件判断节点 ❓
- `block`：可展开的块节点 📁/📂

### 🎨 状态类型
- `pending`：等待中（黄色）
- `running`：运行中（蓝色）
- `completed`：已完成（绿色）
- `error`：错误（红色）

## JSON 配置结构

```typescript
interface Position {
  x: number;                     // X坐标
  y: number;                     // Y坐标
}

interface WorkflowNode {
  id: string;                    // 唯一标识符
  title: string;                 // 节点标题
  type: 'task' | 'block' | 'condition' | 'start' | 'end';
  status?: 'pending' | 'running' | 'completed' | 'error';
  description?: string;          // 节点描述
  children?: WorkflowNode[];     // 子节点（仅block类型）
  expanded?: boolean;            // 是否展开（仅block类型）
  position: Position;            // 节点位置（必需）
  width?: number;                // 节点宽度
  height?: number;               // 节点高度
  icon?: string;                 // 自定义图标
  parentId?: string;             // 父节点ID
}

interface Connection {
  id: string;                    // 连接ID
  from: string;                  // 源节点ID
  to: string;                    // 目标节点ID
  type?: 'success' | 'error' | 'default';
  label?: string;                // 连接标签
  animated?: boolean;            // 是否显示动画
}

interface Workflow {
  id: string;                    // 工作流ID
  title: string;                 // 工作流标题
  description?: string;          // 工作流描述
  nodes: WorkflowNode[];         // 节点列表
  connections: Connection[];     // 连接列表（必需）
}
```

## 使用示例

### 1. 简单工作流
```json
{
  "id": "simple-workflow",
  "title": "简单任务流程",
  "nodes": [
    {
      "id": "task1",
      "title": "准备工作",
      "type": "task",
      "status": "completed",
      "description": "收集必要的资料和工具",
      "position": { "x": 100, "y": 150 },
      "width": 200,
      "height": 80
    },
    {
      "id": "task2", 
      "title": "执行任务",
      "type": "task",
      "status": "running",
      "description": "按照计划执行主要任务",
      "position": { "x": 350, "y": 150 },
      "width": 200,
      "height": 80
    }
  ],
  "connections": [
    {
      "id": "c1",
      "from": "task1",
      "to": "task2",
      "type": "success",
      "animated": true
    }
  ]
}
```

### 2. 带有嵌套块的复杂工作流
```json
{
  "id": "complex-workflow",
  "title": "用户注册流程", 
  "nodes": [
    {
      "id": "user-management",
      "title": "用户管理模块",
      "type": "block",
      "status": "running",
      "expanded": true,
      "children": [
        {
          "id": "create-user",
          "title": "创建用户账户", 
          "type": "task",
          "status": "completed"
        },
        {
          "id": "notification-block",
          "title": "通知服务",
          "type": "block",
          "expanded": false,
          "children": [
            {
              "id": "send-email",
              "title": "发送验证邮件",
              "type": "task",
              "status": "running"
            }
          ]
        }
      ]
    }
  ]
}
```

## 交互说明

### 画布交互
- **滚轮缩放**：使用鼠标滚轮放大/缩小画布
- **拖拽平移**：点击空白区域拖拽移动画布视图
- **节点选择**：点击节点进行选择，选中状态会高亮显示
- **重置视图**：点击工具栏的重置按钮回到默认视图

### 输入框命令
- 输入 "简单" 或 "simple"：切换到简单工作流
- 输入 "注册" 或 "复杂"：切换到用户注册工作流

### 节点交互
- **点击块节点**：展开/收起子节点
- **点击普通节点**：选择节点并触发点击事件
- **连接线动画**：运行中的连接会显示流动动画

## 自定义开发

### 添加新的节点类型
1. 在 `types/workflow.ts` 中扩展 `type` 联合类型
2. 在 `WorkflowNode.tsx` 的 `getNodeIcon` 函数中添加对应图标
3. 在 `WorkflowNode.css` 中添加对应样式

### 添加新的状态类型
1. 在 `types/workflow.ts` 中扩展 `status` 联合类型  
2. 在 CSS 中添加对应的状态样式类

### 自定义样式
- 修改 `WorkflowNode.css` 调整节点样式
- 修改 `WorkflowCanvas.css` 调整画布样式
- 修改 `InputPanel.css` 调整输入面板样式

## 技术栈
- **React 19** + **TypeScript**
- **CSS3** 动画和渐变
- **Vite** 构建工具
- **ESLint** 代码规范
