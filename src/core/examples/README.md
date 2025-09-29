# 工作流实例案例

本目录包含三个完整的工作流实例案例，每个案例都展示了不同的业务场景和工作流设计模式。

## 📊 案例概览

| 案例 | 文件名 | 场景 | 节点数 | 连接数 | 主要功能 |
|------|--------|------|--------|--------|----------|
| 1 | `data-scraping-workflow.json` | 数据抓取与分析 | 6 | 5 | 定时抓取、数据处理、AI分析、告警通知 |
| 2 | `content-generation-workflow.json` | 内容生成与发布 | 7 | 6 | 趋势获取、AI写作、质量检查、自动发布 |
| 3 | `order-processing-workflow.json` | 电商订单处理 | 9 | 8 | 订单处理、风险评估、库存管理、自动发货 |

## 🔍 详细案例说明

### 案例1: 数据抓取与分析工作流
**文件**: `data-scraping-workflow.json`

**业务场景**: 自动监控比特币价格，当价格波动超过阈值时发送警报

**工作流程**:
1. **定时触发** (每小时) → 
2. **API数据获取** (CoinDesk API) → 
3. **数据处理** (价格计算、趋势分析) → 
4. **条件判断** (价格波动检查) → 
5. **AI市场分析** (生成分析报告) → 
6. **Slack通知** (发送警报)

**关键特性**:
- 定时触发机制 (3600000ms = 1小时)
- 实时价格数据获取
- 智能价格趋势分析
- 条件触发的警报系统
- AI驱动的市场分析
- 集成Slack通知

**使用的节点类型**:
- `timer-trigger`: 定时触发器
- `http-request`: HTTP请求节点 (×2)
- `code`: 代码执行节点
- `condition`: 条件判断节点
- `agent`: AI分析节点

---

### 案例2: 内容生成与发布工作流
**文件**: `content-generation-workflow.json`

**业务场景**: 自动获取热门话题，生成高质量内容并发布到博客平台

**工作流程**:
1. **每日触发** (24小时) → 
2. **获取Twitter趋势** (Twitter API) → 
3. **话题筛选** (内容过滤、主题选择) → 
4. **AI内容生成** (800字科普文章) → 
5. **质量检查** (字数、结构、质量评分) → 
6. **发布条件** (质量达标检查) → 
7. **Medium发布** (自动发布到博客)

**关键特性**:
- 每日自动执行
- 智能话题筛选和过滤
- AI驱动的内容创作
- 多维度质量评估
- 条件化发布流程
- 集成Medium平台

**使用的节点类型**:
- `timer-trigger`: 定时触发器
- `http-request`: HTTP请求节点 (×2)
- `code`: 代码执行节点 (×2)
- `agent`: AI内容生成节点
- `condition`: 条件判断节点

---

### 案例3: 电商订单处理工作流
**文件**: `order-processing-workflow.json`

**业务场景**: 自动化电商订单处理，包含风险评估、库存检查和发货流程

**工作流程**:
1. **定时检查** (5分钟) → 
2. **获取新订单** (Shopify API) → 
3. **订单处理** (数据解析、风险评估) → 
4. **风险检查** (高风险订单识别) → 
5. **AI风险分析** (专业风险评估) + **库存检查** (并行) → 
6. **库存条件** (库存充足检查) → 
7. **创建发货** (自动发货处理) → 
8. **客户通知** (邮件发货通知)

**关键特性**:
- 高频订单检查 (5分钟间隔)
- 智能风险评估算法
- AI驱动的风险分析
- 并行库存检查流程
- 自动发货处理
- 客户邮件通知

**使用的节点类型**:
- `timer-trigger`: 定时触发器
- `http-request`: HTTP请求节点 (×4)
- `code`: 代码执行节点
- `condition`: 条件判断节点 (×2)
- `agent`: AI风险分析节点

## 🛠️ 工作流结构分析

### 节点类型使用统计
```
timer-trigger: 3个 (100% 使用率)
http-request: 8个 (平均2.7个/工作流)
code: 4个 (平均1.3个/工作流)
condition: 5个 (平均1.7个/工作流)
agent: 3个 (100% 使用率)
```

### 设计模式

1. **定时触发模式**: 所有工作流都使用定时触发器作为入口
2. **数据获取模式**: HTTP请求获取外部数据
3. **数据处理模式**: 代码节点进行数据转换和业务逻辑
4. **条件分支模式**: 条件节点实现业务规则判断
5. **AI增强模式**: AI节点提供智能分析和内容生成
6. **通知集成模式**: HTTP请求实现外部系统通知

### 表达式使用示例

**设置引用**:
```json
"Authorization": "Bearer {{$settings.twitterBearerToken}}"
```

**数据引用**:
```json
"value": "${{inputs.processedData.prices.usd}}"
```

**条件表达式**:
```javascript
"condition": "inputs.shouldAlert === true"
"condition": "inputs.isQualified === true && inputs.qualityScore >= 70"
"condition": "inputs.allItemsAvailable === true"
```

## 📝 使用方法

### 1. 导入工作流

```typescript
import { WorkflowSerializer } from '../utils/WorkflowSerializer';
import dataScrapingWorkflow from './data-scraping-workflow.json';

// 从JSON恢复工作流
const workflow = WorkflowSerializer.fromJSON(dataScrapingWorkflow);
```

### 2. 执行工作流

```typescript
// 执行工作流
const results = await workflow.execute();
console.log('执行结果:', results);
```

### 3. 自定义配置

在使用这些工作流之前，需要配置相应的API密钥和设置：

**数据抓取工作流**:
- Slack Webhook URL

**内容生成工作流**:
- Twitter Bearer Token
- Medium User ID
- Medium Access Token

**订单处理工作流**:
- Shopify Access Token
- Inventory API Key
- Warehouse Location ID
- SendGrid API Key

## 🔧 扩展和定制

### 添加新节点
1. 在现有连接中插入新节点
2. 更新连接关系
3. 配置节点设置和表达式

### 修改业务逻辑
1. 编辑代码节点中的JavaScript代码
2. 调整条件节点的判断逻辑
3. 更新AI节点的系统提示

### 集成新服务
1. 添加新的HTTP请求节点
2. 配置API端点和认证
3. 处理响应数据格式

## 🎯 最佳实践

1. **错误处理**: 在代码节点中添加try-catch块
2. **数据验证**: 验证外部API返回的数据格式
3. **超时设置**: 为HTTP请求设置合适的超时时间
4. **日志记录**: 在关键节点添加日志输出
5. **测试验证**: 在生产环境前充分测试工作流

这些案例展示了工作流系统的强大功能和灵活性，可以作为开发自定义工作流的参考模板。
