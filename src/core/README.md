# n8n 风格工作流抽象类系统

这是一个完整的工作流引擎抽象类系统，支持类型安全、运行时验证和灵活的节点连接。

## 🏗️ 核心架构

### 1. 抽象基类

#### `BaseNode<TInput, TOutput, TSettings>`
- **泛型约束**：使用 TypeScript 泛型确保输入输出类型安全
- **运行时验证**：集成 Zod 进行运行时类型检查
- **端口系统**：定义输入输出端口，支持类型兼容性检查
- **生命周期管理**：包含执行前后钩子和状态管理

#### `BaseWorkflow`
- **节点管理**：添加、移除、验证节点
- **连接管理**：管理节点间的数据流连接
- **执行引擎**：支持拓扑排序和并发执行
- **错误处理**：灵活的错误处理策略

## 🔗 连接关系表示

### 连接系统设计
```typescript
interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;    // 输出端口ID
  targetNodeId: string;
  targetPortId: string;    // 输入端口ID
  type?: 'data' | 'control' | 'error';
  condition?: string;      // 条件表达式
  metadata?: Record<string, any>;
}
```

### 关键特性
1. **端口级连接**：精确到端口的连接，而不是节点级
2. **类型兼容性检查**：自动验证连接的类型兼容性
3. **循环检测**：防止创建循环依赖
4. **条件连接**：支持基于条件的动态路由

## 🛡️ 运行时类型系统

### 问题解决方案

**问题**：TypeScript 类型在运行时不存在，无法进行运行时验证。

**解决方案**：使用 Zod 库创建运行时 Schema：

```typescript
// 创建运行时 Schema
const userSchema = createRuntimeSchema(z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email()
}));

// 运行时验证
const validatedData = userSchema.validate(inputData);
```

### 核心特性
1. **类型安全**：编译时和运行时双重保护
2. **自动验证**：节点执行时自动验证输入输出
3. **错误提示**：详细的验证错误信息
4. **性能优化**：缓存验证结果

## 🤖 节点类型系统

### AgentNode - AI 智能体节点
```typescript
class AgentNode extends BaseNode<AgentNodeInput, AgentNodeOutput, AgentNodeSettings> {
  // 支持工具集成
  addTool(tool: Tool): void
  
  // LLM 提供者接口
  setLLMProvider(provider: LLMProvider): void
}
```

**特性**：
- 工具系统集成
- LLM 提供者抽象
- 推理过程记录
- 令牌使用统计

### ConditionNode - 条件判断节点
```typescript
class ConditionNode extends BaseNode<ConditionNodeInput, ConditionNodeOutput, ConditionNodeSettings> {
  // 支持多种条件类型
  // - 简单条件：JSON 格式
  // - JavaScript 表达式
  // - JSONPath 查询
}
```

**特性**：
- 多种条件表达式类型
- 安全的表达式求值
- 分支路由支持

## 🔧 使用示例

### 1. 创建自定义节点
```typescript
class MyCustomNode extends BaseNode<MyInput, MyOutput, MySettings> {
  protected defineInputs(): void {
    this.addInputPort<string>('message', {
      name: 'Input Message',
      type: 'string',
      schema: createRuntimeSchema(z.string()),
      required: true
    });
  }

  protected defineOutputs(): void {
    this.addOutputPort<string>('result', {
      name: 'Processed Result',
      type: 'string',
      schema: createRuntimeSchema(z.string()),
      required: true
    });
  }

  public async execute(inputs: MyInput, context: NodeExecutionContext): Promise<NodeExecutionResult<MyOutput>> {
    // 实现节点逻辑
    return {
      success: true,
      data: { result: `Processed: ${inputs.message}` }
    };
  }
}
```

### 2. 构建工作流
```typescript
const workflow = new BaseWorkflow({
  id: 'my-workflow',
  name: 'My Custom Workflow',
  version: '1.0.0'
});

// 添加节点
const node1 = new MyCustomNode('node-1');
const node2 = new MyCustomNode('node-2');

workflow.addNode(node1);
workflow.addNode(node2);

// 创建连接
workflow.addConnection({
  id: 'conn-1',
  sourceNodeId: 'node-1',
  sourcePortId: 'result',
  targetNodeId: 'node-2',
  targetPortId: 'message',
  type: 'data'
});
```

### 3. 执行工作流
```typescript
const result = await workflow.execute({
  variables: {
    'node-1': { message: 'Hello, World!' }
  },
  maxConcurrency: 2,
  timeout: 60000
});

console.log('执行状态:', result.status);
console.log('节点结果:', result.results);
```

## 🛠️ 工具系统

### 工具接口
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute(input: any, context: NodeExecutionContext): Promise<any>;
}
```

### 内置工具
- **WebSearchTool**：网络搜索工具
- **CalculatorTool**：数学计算工具

### 自定义工具
```typescript
class MyTool implements Tool {
  name = 'my-tool';
  description = 'My custom tool';
  parameters = z.object({
    input: z.string()
  });

  async execute(input: any, context: NodeExecutionContext): Promise<any> {
    // 工具逻辑实现
    return { result: `Processed: ${input.input}` };
  }
}
```

## 🚀 高级特性

### 1. 并发执行
- 自动检测可并行执行的节点
- 可配置最大并发数
- 资源管理和限流

### 2. 错误处理
- 节点级错误恢复
- 自定义错误处理策略
- 错误传播控制

### 3. 状态管理
- 实时执行状态跟踪
- 历史执行记录
- 暂停/恢复/取消操作

### 4. 调试支持
- 详细的执行日志
- 中间结果查看
- 性能分析数据

## 📊 类型系统对比

| 特性 | TypeScript 编译时 | 运行时验证 | 本系统 |
|------|------------------|------------|--------|
| 类型检查 | ✅ | ❌ | ✅ |
| 运行时安全 | ❌ | ✅ | ✅ |
| 开发体验 | ✅ | ❌ | ✅ |
| 性能 | ✅ | ⚠️ | ✅ |
| 错误信息 | ✅ | ⚠️ | ✅ |

## 🎯 设计原则

1. **类型安全**：编译时和运行时双重保护
2. **可扩展性**：易于添加新节点类型和工具
3. **性能优化**：高效的执行引擎和验证缓存
4. **开发友好**：清晰的API和丰富的类型提示
5. **生产就绪**：完整的错误处理和监控支持

## 📝 运行演示

```bash
# 安装依赖
npm install

# 运行演示
npx ts-node src/core/demo.ts
```

演示包含：
- 基本工作流创建
- 类型安全验证
- 条件逻辑处理
- 工具系统使用
- 错误处理机制

## 🔮 未来扩展

1. **可视化编辑器**：拖拽式工作流编辑
2. **插件系统**：第三方节点和工具
3. **分布式执行**：跨机器的工作流执行
4. **版本控制**：工作流版本管理
5. **监控面板**：实时监控和分析

这个系统为构建复杂的工作流应用提供了坚实的基础，同时保持了高度的类型安全和运行时可靠性。
