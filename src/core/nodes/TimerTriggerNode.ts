import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';
import { PortTypes } from '../types/PortTypes';

// 定时触发节点的输入类型
export interface TimerTriggerInput {
  // 定时触发节点通常不需要输入，或者只需要配置参数
}

// 定时触发节点的输出类型
export interface TimerTriggerOutput {
  timestamp: number;
  triggerCount: number;
  data: Record<string, unknown>;
}

// 定时触发节点的设置类型
export interface TimerTriggerSettings {
  interval: number; // 间隔时间（毫秒）
  enabled: boolean; // 是否启用
  maxTriggers?: number; // 最大触发次数，undefined表示无限制
  cronExpression?: string; // cron表达式（可选，与interval二选一）
  timezone?: string; // 时区
  startTime?: Date; // 开始时间
  endTime?: Date; // 结束时间
}

// 定时触发节点实现
export class TimerTriggerNode extends BaseNode<TimerTriggerInput, TimerTriggerOutput, TimerTriggerSettings> {
  private timerId?: NodeJS.Timeout;
  private triggerCount = 0;

  constructor(
    id: string,
    settings: Partial<TimerTriggerSettings> = {}
  ) {
    super(
      {
        id,
        name: '定时触发器',
        type: 'timer-trigger',
        category: 'trigger',
        description: '按照指定的时间间隔或cron表达式触发工作流',
        version: '1.0.0',
        icon: '⏰',
        color: '#DC2626',
        tags: ['trigger', 'timer', 'schedule']
      },
      {
        interval: 60000, // 默认1分钟
        enabled: true,
        maxTriggers: undefined,
        cronExpression: undefined,
        timezone: 'Asia/Shanghai',
        ...settings
      }
    );
  }

  protected defineInputs(): void {
    // 定时触发器通常不需要输入端口
    // 如果需要可以添加配置端口
  }

  protected defineOutputs(): void {
    this.addOutputPort('timestamp', {
      name: '触发时间',
      type: PortTypes.NUMBER,
      required: true,
      description: '触发时的时间戳'
    });

    this.addOutputPort('triggerCount', {
      name: '触发次数',
      type: PortTypes.NUMBER,
      required: true,
      description: '累计触发次数'
    });

    this.addOutputPort('data', {
      name: '触发数据',
      type: PortTypes.OBJECT,
      required: true,
      description: '触发时携带的数据'
    });
  }

  public async execute(
    _inputs: TimerTriggerInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<TimerTriggerOutput>> {
    try {
      this.triggerCount++;

      const output: TimerTriggerOutput = {
        timestamp: Date.now(),
        triggerCount: this.triggerCount,
        data: {
          workflowId: context.workflowId,
          nodeId: context.nodeId,
          executionId: context.executionId,
          settings: this.settings
        }
      };

      return {
        success: true,
        data: output,
        metadata: {
          triggerType: 'timer',
          interval: this.settings.interval,
          nextTrigger: this.getNextTriggerTime()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // 启动定时器
  public start(): void {
    if (!this.settings.enabled || this.timerId) return;

    if (this.settings.cronExpression) {
      this.startCronTimer();
    } else {
      this.startIntervalTimer();
    }
  }

  // 停止定时器
  public stop(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
  }

  // 重置触发计数
  public resetTriggerCount(): void {
    this.triggerCount = 0;
  }

  // 启动间隔定时器
  private startIntervalTimer(): void {
    const scheduleNext = () => {
      // 检查是否达到最大触发次数
      if (this.settings.maxTriggers && this.triggerCount >= this.settings.maxTriggers) {
        return;
      }

      // 检查是否在有效时间范围内
      const now = new Date();
      if (this.settings.startTime && now < this.settings.startTime) {
        this.timerId = setTimeout(scheduleNext, this.settings.startTime.getTime() - now.getTime());
        return;
      }

      if (this.settings.endTime && now > this.settings.endTime) {
        return;
      }

      // 执行触发（这里需要工作流引擎的支持）
      this.onTrigger();

      // 安排下一次触发
      this.timerId = setTimeout(scheduleNext, this.settings.interval);
    };

    scheduleNext();
  }

  // 启动cron定时器（简化实现）
  private startCronTimer(): void {
    // 这里是简化实现，实际应该使用专门的cron库
    console.warn('Cron expression support not implemented yet');
    this.startIntervalTimer();
  }

  // 触发处理
  private onTrigger(): void {
    // 这里应该通知工作流引擎执行
    console.log(`Timer trigger ${this.config.id} fired at ${new Date().toISOString()}`);
  }

  // 获取下一次触发时间
  private getNextTriggerTime(): number | undefined {
    if (!this.settings.enabled) return undefined;
    if (this.settings.maxTriggers && this.triggerCount >= this.settings.maxTriggers) return undefined;

    if (this.settings.cronExpression) {
      // 这里应该解析cron表达式
      return Date.now() + this.settings.interval;
    } else {
      return Date.now() + this.settings.interval;
    }
  }

  // 获取触发器状态
  public getTriggerStatus() {
    return {
      enabled: this.settings.enabled,
      running: !!this.timerId,
      triggerCount: this.triggerCount,
      maxTriggers: this.settings.maxTriggers,
      nextTrigger: this.getNextTriggerTime(),
      settings: this.settings
    };
  }

  // 更新设置
  public updateSettings(newSettings: Partial<TimerTriggerSettings>): void {
    const wasRunning = !!this.timerId;
    
    if (wasRunning) {
      this.stop();
    }

    this.settings = { ...this.settings, ...newSettings };

    if (wasRunning && this.settings.enabled) {
      this.start();
    }
  }

  // 覆盖克隆方法以正确处理定时器状态
  public clone(newId?: string): TimerTriggerNode {
    const cloned = new TimerTriggerNode(newId || this.config.id, this.settings);
    cloned.triggerCount = 0; // 重置计数
    return cloned;
  }
}
