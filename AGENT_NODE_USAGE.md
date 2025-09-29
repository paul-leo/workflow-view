# AgentNode 工具支持使用指南

## 概述

AgentNode 现在支持挂载多个工具，让 AI 智能体能够调用各种工具来完成复杂任务。本指南将介绍如何使用这些新功能。

## 🚀 新功能特性

### ✅ 已实现的功能

- **工具管理系统**：支持添加、移除和管理多个工具
- **内置工具库**：提供 5 个常用工具（计算器、搜索、代码执行、文本处理、时间工具）
- **独立工具节点**：工具作为独立节点渲染到 ReactFlow 画布中
- **虚线连接**：Agent 节点与工具节点通过虚线连接
- **工具节点渲染器**：专门的 ToolNodeRenderer，支持分类颜色和状态显示
- **工具调用历史**：显示最近的工具调用结果
- **类型安全**：完整的 TypeScript 类型支持

### 🎨 视觉效果

- **紫色主题**：Agent 节点使用紫色主题色
- **独立工具节点**：工具作为独立的虚线边框节点显示在 Agent 右侧
- **分类颜色**：不同类别的工具使用不同颜色标识
- **虚线连接**：Agent 与工具节点之间的虚线连接，带有工具名称标签
- **动画效果**：连接线有脉冲动画效果
- **状态指示**：显示工具调用成功/失败状态

## 📚 使用方法

### 1. 创建带工具的 Agent 节点

```typescript
import { AgentNode } from './src/core/nodes/AgentNode';
import { getAllBuiltinTools } from './src/core/tools/BuiltinTools';

// 创建 Agent 节点
const agent = new AgentNode('my-agent', {
  systemPrompt: '你是一个智能助手，可以使用工具来帮助用户。',
  model: 'gpt-4',
  enableTools: true,      // 启用工具支持
  maxToolCalls: 5         // 最大工具调用次数
});

// 添加所有内置工具
const tools = getAllBuiltinTools();
tools.forEach(tool => agent.addTool(tool));

// 或者添加特定工具
import { CalculatorTool, WebSearchTool } from './src/core/tools/BuiltinTools';
agent.addTool(CalculatorTool);
agent.addTool(WebSearchTool);
```

### 2. 在工作流 JSON 中配置

```json
{
  "id": "agent-1",
  "config": {
    "id": "agent-1",
    "name": "智能助手",
    "type": "agent"
  },
  "settings": {
    "systemPrompt": "你是一个智能助手...",
    "model": "gpt-4",
    "enableTools": true,
    "maxToolCalls": 10
  },
  "tools": [
    {
      "id": "calculator",
      "name": "计算器",
      "description": "执行数学运算",
      "category": "数学"
    },
    {
      "id": "web-search",
      "name": "网络搜索",
      "description": "搜索网络信息",
      "category": "搜索"
    }
  ]
}
```

## 🛠️ 内置工具

### 1. 计算器工具 (CalculatorTool)
- **功能**：执行基本数学运算
- **参数**：`expression` - 数学表达式
- **示例**：`"2 + 3 * 4"` → `14`

### 2. 网络搜索工具 (WebSearchTool)
- **功能**：模拟网络搜索
- **参数**：`query` - 搜索关键词，`limit` - 结果数量
- **示例**：搜索 "人工智能" 返回相关结果

### 3. 代码执行器 (CodeExecutorTool)
- **功能**：安全执行 JavaScript 代码
- **参数**：`code` - 代码片段，`timeout` - 超时时间
- **安全限制**：禁止危险操作，沙箱环境

### 4. 文本处理器 (TextProcessorTool)
- **功能**：文本统计、格式化、转换
- **操作**：`count`, `uppercase`, `lowercase`, `reverse`, `summary`
- **示例**：统计文本字数、转换大小写等

### 5. 时间工具 (TimeTool)
- **功能**：时间获取、格式化、计算
- **操作**：`current`, `format`, `add`, `diff`
- **示例**：获取当前时间、计算时间差等

## 🎨 自定义工具

### 创建自定义工具

```typescript
import { z } from 'zod';
import type { Tool } from './src/core/types/Tool';

const MyCustomTool: Tool = {
  id: 'my-tool',
  name: '我的工具',
  description: '这是一个自定义工具',
  category: '自定义',
  icon: MyIcon, // React 组件
  parameters: z.object({
    input: z.string().describe('输入参数')
  }),
  
  async execute(input, context) {
    // 实现工具逻辑
    return {
      result: `处理结果: ${input.input}`,
      timestamp: Date.now()
    };
  }
};

// 添加到 Agent 节点
agent.addTool(MyCustomTool);
```

## 🖼️ 渲染器自定义

AgentNodeRenderer 自动处理工具的显示：

- **工具列表**：显示前 3 个工具，超出显示 "+N 更多"
- **工具连接点**：右侧虚线连接点，最多显示 3 个
- **调用历史**：显示最近 2 次工具调用结果
- **状态指示**：成功/失败图标

## 📝 工作流示例

查看 `/src/core/examples/agent-workflow-example.json` 获取完整的工作流配置示例。

## 🔧 开发调试

### 运行示例

```typescript
// 在浏览器控制台中
import { executeAgentExample } from './src/core/examples/agent-usage-demo';
executeAgentExample();
```

### 查看工具调用

```typescript
const result = await agent.execute(input, context);
if (result.data?.toolCalls) {
  console.log('工具调用:', result.data.toolCalls);
}
```

## 🎯 最佳实践

1. **合理设置 maxToolCalls**：避免无限循环调用
2. **提供清晰的 systemPrompt**：指导 AI 何时使用工具
3. **工具分类管理**：使用 category 字段组织工具
4. **错误处理**：检查工具调用结果的 success 字段
5. **性能考虑**：大量工具时考虑按需加载

## 🚧 后续计划

- [ ] LLM 提供者接口实现
- [ ] 更多内置工具
- [ ] 工具权限管理
- [ ] 工具调用链可视化
- [ ] 工具性能监控

## 📞 支持

如有问题或建议，请查看代码中的详细注释或提交 Issue。
