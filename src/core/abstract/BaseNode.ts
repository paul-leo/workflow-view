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
  public readonly id: string;
  public readonly config: NodeConfig;
  public settings: TSettings;
  public readonly originalSettings: TSettings; // 保存原始设置（包含表达式）

  constructor(config: NodeConfig, settings: TSettings) {
    const incomingId = (config as Partial<NodeConfig>).id as string | undefined;
    const resolvedId = incomingId && String(incomingId).length > 0
      ? incomingId
      : BaseNode.generateId();

    this.id = resolvedId;
    this.config = { ...config, id: resolvedId } as NodeConfig;
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

  // 生成 UUID（优先使用原生 randomUUID，降级到 v4 近似实现）
  private static generateId(): string {
    try {
      const maybeCrypto = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
      if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') {
        return maybeCrypto.randomUUID();
      }
    } catch {
      // ignore and fallback
    }
    const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return template.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}