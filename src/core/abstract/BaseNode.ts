import { z } from 'zod';

// 运行时类型验证的基础接口
export interface RuntimeSchema<T = any> {
  schema: z.ZodSchema<T>;
  validate(data: unknown): T;
  isValid(data: unknown): boolean;
}

// 创建运行时 Schema 的工厂函数
export function createRuntimeSchema<T>(schema: z.ZodSchema<T>): RuntimeSchema<T> {
  return {
    schema,
    validate(data: unknown): T {
      return schema.parse(data);
    },
    isValid(data: unknown): boolean {
      return schema.safeParse(data).success;
    }
  };
}

// 节点执行上下文
export interface NodeExecutionContext {
  workflowId: string;
  nodeId: string;
  executionId: string;
  previousResults: Map<string, any>;
  metadata: Record<string, any>;
}

// 节点执行结果
export interface NodeExecutionResult<TOutput = any> {
  success: boolean;
  data?: TOutput;
  error?: Error;
  metadata?: Record<string, any>;
  nextNodes?: string[]; // 指定下一个要执行的节点ID
}

// 节点连接端口定义
export interface NodePort<T = any> {
  id: string;
  name: string;
  type: string; // 用于UI显示的类型名称
  schema: RuntimeSchema<T>; // 运行时类型验证
  required: boolean;
  description?: string;
}

// 节点输入端口
export interface InputPort<T = any> extends NodePort<T> {
  defaultValue?: T;
  allowMultiple?: boolean; // 是否允许多个连接
}

// 节点输出端口
export interface OutputPort<T = any> extends NodePort<T> {
  condition?: (data: T, context: NodeExecutionContext) => boolean; // 条件输出
}

// 节点配置接口
export interface NodeConfig {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  version: string;
  icon?: string;
  color?: string;
  tags?: string[];
}

// 抽象基础节点类
export abstract class BaseNode<
  TInput extends Record<string, any> = any,
  TOutput extends Record<string, any> = any,
  TSettings extends Record<string, any> = any
> {
  public readonly config: NodeConfig;
  public readonly inputPorts: Map<string, InputPort>;
  public readonly outputPorts: Map<string, OutputPort>;
  public settings: TSettings;
  
  // 节点状态
  public status: 'idle' | 'running' | 'completed' | 'error' | 'paused' = 'idle';
  public lastExecutionTime?: Date;
  public executionCount: number = 0;

  constructor(
    config: NodeConfig,
    settings: TSettings = {} as TSettings
  ) {
    this.config = config;
    this.settings = settings;
    this.inputPorts = new Map();
    this.outputPorts = new Map();
    
    // 子类需要在构造函数中调用 this.defineInputs() 和 this.defineOutputs()
    this.defineInputs();
    this.defineOutputs();
    this.validatePortDefinitions();
  }

  // 抽象方法：定义输入端口
  protected abstract defineInputs(): void;
  
  // 抽象方法：定义输出端口
  protected abstract defineOutputs(): void;
  
  // 抽象方法：节点执行逻辑
  public abstract execute(
    inputs: TInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<TOutput>>;

  // 添加输入端口的辅助方法
  protected addInputPort<T>(
    id: keyof TInput,
    config: Omit<InputPort<T>, 'id'>
  ): void {
    this.inputPorts.set(id as string, {
      id: id as string,
      ...config
    });
  }

  // 添加输出端口的辅助方法
  protected addOutputPort<T>(
    id: keyof TOutput,
    config: Omit<OutputPort<T>, 'id'>
  ): void {
    this.outputPorts.set(id as string, {
      id: id as string,
      ...config
    });
  }

  // 验证输入数据
  public validateInputs(inputs: unknown): TInput {
    const result: Record<string, any> = {};
    
    for (const [portId, port] of this.inputPorts) {
      const value = (inputs as any)?.[portId];
      
      if (port.required && (value === undefined || value === null)) {
        throw new Error(`Required input '${portId}' is missing for node ${this.config.id}`);
      }
      
      if (value !== undefined && value !== null) {
        try {
          result[portId] = port.schema.validate(value);
        } catch (error) {
          throw new Error(`Invalid input for port '${portId}' in node ${this.config.id}: ${error}`);
        }
      } else if (port.defaultValue !== undefined) {
        result[portId] = port.defaultValue;
      }
    }
    
    return result as TInput;
  }

  // 验证输出数据
  public validateOutputs(outputs: unknown): TOutput {
    const result: Record<string, any> = {};
    
    for (const [portId, port] of this.outputPorts) {
      const value = (outputs as any)?.[portId];
      
      if (value !== undefined && value !== null) {
        try {
          result[portId] = port.schema.validate(value);
        } catch (error) {
          throw new Error(`Invalid output for port '${portId}' in node ${this.config.id}: ${error}`);
        }
      }
    }
    
    return result as TOutput;
  }

  // 检查输入端口是否兼容
  public isInputCompatible(portId: string, sourcePort: OutputPort): boolean {
    const inputPort = this.inputPorts.get(portId);
    if (!inputPort) return false;
    
    // 简单的类型兼容性检查 - 可以扩展为更复杂的逻辑
    return inputPort.type === sourcePort.type || 
           sourcePort.type === 'any' || 
           inputPort.type === 'any';
  }

  // 获取节点信息
  public getNodeInfo() {
    return {
      config: this.config,
      status: this.status,
      inputPorts: Array.from(this.inputPorts.values()),
      outputPorts: Array.from(this.outputPorts.values()),
      settings: this.settings,
      executionCount: this.executionCount,
      lastExecutionTime: this.lastExecutionTime
    };
  }

  // 克隆节点（用于工作流模板）
  public clone(newId?: string): BaseNode<TInput, TOutput, TSettings> {
    const cloned = Object.create(Object.getPrototypeOf(this));
    cloned.config = { ...this.config, id: newId || this.config.id };
    cloned.settings = JSON.parse(JSON.stringify(this.settings));
    cloned.inputPorts = new Map(this.inputPorts);
    cloned.outputPorts = new Map(this.outputPorts);
    cloned.status = 'idle';
    cloned.executionCount = 0;
    cloned.lastExecutionTime = undefined;
    return cloned;
  }

  // 验证端口定义的完整性
  private validatePortDefinitions(): void {
    if (this.inputPorts.size === 0 && this.outputPorts.size === 0) {
      console.warn(`Node ${this.config.id} has no input or output ports defined`);
    }
  }

  // 更新节点状态
  protected updateStatus(status: typeof this.status): void {
    this.status = status;
    if (status === 'completed') {
      this.executionCount++;
      this.lastExecutionTime = new Date();
    }
  }

  // 执行前的钩子
  protected async beforeExecute(inputs: TInput, context: NodeExecutionContext): Promise<void> {
    // 子类可以重写此方法来添加预处理逻辑
  }

  // 执行后的钩子
  protected async afterExecute(
    result: NodeExecutionResult<TOutput>,
    context: NodeExecutionContext
  ): Promise<void> {
    // 子类可以重写此方法来添加后处理逻辑
  }

  // 包装执行方法，添加状态管理和钩子
  public async safeExecute(
    inputs: unknown,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<TOutput>> {
    try {
      this.updateStatus('running');
      
      // 验证输入
      const validatedInputs = this.validateInputs(inputs);
      
      // 执行前钩子
      await this.beforeExecute(validatedInputs, context);
      
      // 执行节点逻辑
      const result = await this.execute(validatedInputs, context);
      
      // 验证输出
      if (result.success && result.data) {
        result.data = this.validateOutputs(result.data);
      }
      
      // 执行后钩子
      await this.afterExecute(result, context);
      
      this.updateStatus(result.success ? 'completed' : 'error');
      return result;
      
    } catch (error) {
      this.updateStatus('error');
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}
