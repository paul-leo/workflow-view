import { ExpressionParser, type ExpressionContext } from '../utils/ExpressionParser';

// 节点执行上下文
export interface NodeExecutionContext {
  workflowId: string;
  nodeId: string;
  previousResults: Map<string, unknown>;
  // 添加原始设置，用于表达式解析
  originalSettings?: Record<string, unknown>;
}

// 节点执行结果
export interface NodeExecutionResult<TOutput = unknown> {
  success: boolean;
  data?: TOutput;
  error?: Error;
}

// 节点配置接口
export interface NodeConfig {
  id: string;
  name: string;
  type: string;
}

// 抽象基础节点类
export abstract class BaseNode<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput extends Record<string, unknown> = Record<string, unknown>,
  TSettings extends Record<string, unknown> = Record<string, unknown>
> {
  public readonly config: NodeConfig;
  public settings: TSettings;
  public readonly originalSettings: TSettings; // 保存原始设置（包含表达式）

  constructor(config: NodeConfig, settings: TSettings) {
    this.config = config;
    this.settings = settings;
    this.originalSettings = JSON.parse(JSON.stringify(settings)); // 深拷贝原始设置
  }

  // 抽象方法：节点执行逻辑
  public abstract execute(
    inputs: TInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<TOutput>>;

  // 解析动态设置 - 通用实现，深度遍历所有字符串
  public resolveDynamicSettings(
    inputs: TInput,
    context: NodeExecutionContext
  ): TSettings {
    const expressionContext: ExpressionContext = {
      previousResults: context.previousResults,
      currentInputs: inputs,
      currentSettings: this.originalSettings,
      executionContext: {
        workflowId: context.workflowId,
        nodeId: context.nodeId
      }
    };

    // 使用工具函数深度遍历并解析所有字符串中的表达式
    const resolvedSettings = ExpressionParser.deepParseExpressions(
      this.originalSettings,
      expressionContext
    ) as TSettings;

    return resolvedSettings;
  }
}