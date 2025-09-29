// 节点执行上下文
export interface NodeExecutionContext {
  workflowId: string;
  nodeId: string;
  previousResults: Map<string, unknown>;
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

  constructor(config: NodeConfig, settings: TSettings) {
    this.config = config;
    this.settings = settings;
  }

  // 抽象方法：节点执行逻辑
  public abstract execute(
    inputs: TInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<TOutput>>;
}
