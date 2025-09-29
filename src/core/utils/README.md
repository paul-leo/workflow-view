# 工作流序列化工具

这个模块提供了完整的工作流序列化和反序列化功能，支持将工作流实例与 JSON 格式相互转换。

## 🎯 主要功能

- ✅ **工作流序列化**：将工作流实例转换为 JSON 格式
- ✅ **工作流反序列化**：从 JSON 重建工作流实例
- ✅ **格式验证**：验证序列化 JSON 的完整性和正确性
- ✅ **文件导入导出**：支持工作流的文件保存和加载
- ✅ **工作流合并**：合并多个工作流为一个
- ✅ **节点类型注册**：支持自定义节点类型的序列化
- ✅ **错误处理**：完善的错误处理和验证机制

## 📦 核心组件

### WorkflowSerializer

主要的序列化工具类，提供核心的序列化和反序列化功能。

```typescript
import { WorkflowSerializer } from './WorkflowSerializer';

// 序列化工作流
const serialized = WorkflowSerializer.toJSON(workflow);

// 反序列化工作流
const workflow = WorkflowSerializer.fromJSON(serialized);

// 验证序列化格式
const validation = WorkflowSerializer.validate(serialized);
```

### NodeRegistry

节点类型注册表，管理所有可序列化的节点类型。

```typescript
import { NodeRegistry } from './WorkflowSerializer';

// 注册自定义节点类型
NodeRegistry.registerNodeType('my-node', MyCustomNode);

// 检查节点类型是否已注册
const isRegistered = NodeRegistry.isRegistered('my-node');
```

### WorkflowImportExport

提供高级的导入导出功能。

```typescript
import { WorkflowImportExport } from './WorkflowSerializer';

// 导出到文件
const fileExport = WorkflowImportExport.exportToFile(workflow);

// 从文件导入
const workflow = WorkflowImportExport.importFromFile(fileContent);

// 合并工作流
const merged = WorkflowImportExport.mergeWorkflows(baseWorkflow, [workflow1, workflow2]);
```

## 🚀 快速开始

### 1. 基本序列化

```typescript
import { BaseWorkflow } from '../abstract/BaseWorkflow';
import { WorkflowSerializer } from './WorkflowSerializer';
import { TimerTriggerNode } from '../nodes/TimerTriggerNode';

// 创建工作流
const workflow = new BaseWorkflow({
  id: 'my-workflow',
  name: '我的工作流'
});

// 添加节点
const timerNode = new TimerTriggerNode('timer-1', { interval: 5000 });
workflow.addNode(timerNode);

// 序列化为 JSON
const serialized = WorkflowSerializer.toJSON(workflow);
console.log('序列化结果:', JSON.stringify(serialized, null, 2));

// 从 JSON 反序列化
const rebuiltWorkflow = WorkflowSerializer.fromJSON(serialized);
console.log('重建的工作流:', rebuiltWorkflow.config.name);
```

### 2. 文件导入导出

```typescript
import { WorkflowImportExport } from './WorkflowSerializer';

// 导出工作流到文件
const fileExport = WorkflowImportExport.exportToFile(workflow);
console.log('导出文件:', fileExport.filename);

// 保存文件内容（在浏览器环境中）
const blob = new Blob([fileExport.content], { type: fileExport.mimeType });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = fileExport.filename;
a.click();

// 从文件加载工作流
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  const content = await file.text();
  
  try {
    const workflow = WorkflowImportExport.importFromFile(content);
    console.log('导入成功:', workflow.config.name);
  } catch (error) {
    console.error('导入失败:', error);
  }
});
```

### 3. 工作流验证

```typescript
import { WorkflowSerializer } from './WorkflowSerializer';

// 验证工作流 JSON 格式
function validateWorkflow(jsonData: unknown): boolean {
  const validation = WorkflowSerializer.validate(jsonData);
  
  if (validation.valid) {
    console.log('✅ 工作流格式有效');
    return true;
  } else {
    console.log('❌ 工作流格式无效:');
    validation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
    return false;
  }
}

// 获取工作流摘要
const summary = WorkflowSerializer.getSummary(workflow);
console.log('工作流摘要:', summary);
```

## 📋 序列化格式

### SerializedWorkflow 接口

```typescript
interface SerializedWorkflow {
  config: {
    id: string;
    name: string;
  };
  nodes: SerializedNode[];
  connections: WorkflowConnection[];
  metadata?: {
    version: string;
    createdAt: string;
    updatedAt: string;
    description?: string;
  };
}
```

### SerializedNode 接口

```typescript
interface SerializedNode {
  config: {
    id: string;
    name: string;
    type: string;
  };
  settings: Record<string, unknown>;
  originalSettings: Record<string, unknown>;
}
```

### 示例 JSON 格式

```json
{
  "config": {
    "id": "sample-workflow",
    "name": "示例工作流"
  },
  "nodes": [
    {
      "config": {
        "id": "timer-1",
        "name": "定时触发器",
        "type": "timer-trigger"
      },
      "settings": {
        "interval": 5000
      },
      "originalSettings": {
        "interval": 5000
      }
    },
    {
      "config": {
        "id": "http-1",
        "name": "HTTP请求",
        "type": "http-request"
      },
      "settings": {
        "url": "https://api.example.com/data",
        "method": "GET",
        "timeout": 10000
      },
      "originalSettings": {
        "url": "{{$result.config-node.baseUrl}}/data",
        "method": "GET",
        "timeout": 10000
      }
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "sourceNodeId": "timer-1",
      "targetNodeId": "http-1"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "description": "Serialized workflow: 示例工作流"
  }
}
```

## 🔧 高级功能

### 1. 自定义节点类型序列化

```typescript
import { NodeRegistry } from './WorkflowSerializer';
import { BaseNode } from '../abstract/BaseNode';

// 定义自定义节点
class MyCustomNode extends BaseNode<MyInput, MyOutput, MySettings> {
  constructor(id: string, settings: MySettings) {
    super({
      id,
      name: '自定义节点',
      type: 'my-custom'
    }, settings);
  }

  public async execute(inputs: MyInput, context: NodeExecutionContext): Promise<NodeExecutionResult<MyOutput>> {
    // 节点执行逻辑
    return { success: true, data: { result: 'processed' } };
  }
}

// 注册自定义节点类型
NodeRegistry.registerNodeType('my-custom', MyCustomNode);

// 现在可以序列化包含自定义节点的工作流
const workflow = new BaseWorkflow({ id: 'test', name: 'Test' });
workflow.addNode(new MyCustomNode('custom-1', { customSetting: 'value' }));

const serialized = WorkflowSerializer.toJSON(workflow);
const restored = WorkflowSerializer.fromJSON(serialized);
```

### 2. 工作流合并

```typescript
import { WorkflowImportExport } from './WorkflowSerializer';

// 创建多个工作流
const workflow1 = createDataProcessingWorkflow();
const workflow2 = createNotificationWorkflow();
const workflow3 = createAnalyticsWorkflow();

// 合并工作流
const mergedWorkflow = WorkflowImportExport.mergeWorkflows(
  workflow1, // 基础工作流
  [workflow2, workflow3], // 要合并的工作流
  {
    nodeIdPrefix: 'merged', // 节点ID前缀
    preserveOriginalIds: false // 是否保持原始ID
  }
);

console.log('合并后的工作流:', mergedWorkflow.config.name);
```

### 3. 工作流模板创建

```typescript
import { WorkflowImportExport } from './WorkflowSerializer';

// 创建空模板
const template = WorkflowImportExport.createTemplate(
  'data-pipeline-template',
  '数据管道模板',
  '用于创建数据处理管道的模板'
);

// 从模板创建工作流
const workflow = WorkflowSerializer.fromJSON(template);
// 添加节点和连接...
```

## 🛠️ 最佳实践

### 1. 错误处理

```typescript
function safeSerialize(workflow: BaseWorkflow): string | null {
  try {
    const serialized = WorkflowSerializer.toJSON(workflow);
    const validation = WorkflowSerializer.validate(serialized);
    
    if (!validation.valid) {
      console.error('序列化验证失败:', validation.errors);
      return null;
    }
    
    return JSON.stringify(serialized, null, 2);
  } catch (error) {
    console.error('序列化失败:', error);
    return null;
  }
}

function safeDeserialize(jsonString: string): BaseWorkflow | null {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = WorkflowSerializer.validate(parsed);
    
    if (!validation.valid) {
      console.error('反序列化验证失败:', validation.errors);
      return null;
    }
    
    return WorkflowSerializer.fromJSON(parsed);
  } catch (error) {
    console.error('反序列化失败:', error);
    return null;
  }
}
```

### 2. 版本控制

```typescript
function addVersionControl(workflow: BaseWorkflow, version: string): SerializedWorkflow {
  const serialized = WorkflowSerializer.toJSON(workflow);
  
  if (serialized.metadata) {
    serialized.metadata.version = version;
    serialized.metadata.updatedAt = new Date().toISOString();
  }
  
  return serialized;
}
```

### 3. 备份和恢复

```typescript
class WorkflowBackupManager {
  private backups: Map<string, string> = new Map();
  
  // 创建备份
  backup(workflow: BaseWorkflow): string {
    const backupId = `${workflow.config.id}-${Date.now()}`;
    const serialized = WorkflowSerializer.toFormattedJSON(workflow);
    this.backups.set(backupId, serialized);
    return backupId;
  }
  
  // 恢复备份
  restore(backupId: string): BaseWorkflow | null {
    const serialized = this.backups.get(backupId);
    if (!serialized) return null;
    
    try {
      return WorkflowSerializer.fromJSONString(serialized);
    } catch (error) {
      console.error('恢复备份失败:', error);
      return null;
    }
  }
  
  // 列出所有备份
  listBackups(): string[] {
    return Array.from(this.backups.keys());
  }
}
```

## 📚 完整示例

查看以下文件获取完整的使用示例：

- `SerializationDemo.ts` - 基本序列化演示
- `WorkflowSerializationUsage.ts` - 实际使用场景示例

## 🔍 故障排除

### 常见问题

1. **未知节点类型错误**
   ```
   Error: Unknown node type: my-custom-node
   ```
   **解决方案**: 确保在反序列化之前注册了所有自定义节点类型
   ```typescript
   NodeRegistry.registerNodeType('my-custom-node', MyCustomNode);
   ```

2. **JSON 格式验证失败**
   ```
   Error: Config missing required field: name
   ```
   **解决方案**: 检查 JSON 结构是否完整，确保包含所有必需字段

3. **节点设置类型不匹配**
   ```
   Error: Failed to create node: settings validation failed
   ```
   **解决方案**: 确保节点设置符合节点类型的要求

### 调试技巧

1. **使用验证功能**
   ```typescript
   const validation = WorkflowSerializer.validate(jsonData);
   if (!validation.valid) {
     console.log('验证错误:', validation.errors);
   }
   ```

2. **检查工作流摘要**
   ```typescript
   const summary = WorkflowSerializer.getSummary(workflow);
   console.log('工作流摘要:', summary);
   ```

3. **逐步调试**
   ```typescript
   // 先序列化
   const serialized = WorkflowSerializer.toJSON(workflow);
   console.log('序列化结果:', serialized);
   
   // 再验证
   const validation = WorkflowSerializer.validate(serialized);
   console.log('验证结果:', validation);
   
   // 最后反序列化
   const restored = WorkflowSerializer.fromJSON(serialized);
   console.log('恢复结果:', restored);
   ```
