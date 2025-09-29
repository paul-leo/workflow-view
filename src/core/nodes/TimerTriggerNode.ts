import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';

// 定时触发节点的输入类型
export interface TimerTriggerInput extends Record<string, unknown> {
  // 触发器节点通常不需要输入
}

// 定时触发节点的输出类型
export interface TimerTriggerOutput {
  timestamp: number;
  data: Record<string, unknown>;
}

// 定时触发节点的设置类型
export interface TimerTriggerSettings {
  interval: number; // 间隔时间（毫秒）
}

// 定时触发节点实现
export class TimerTriggerNode extends BaseNode<TimerTriggerInput, TimerTriggerOutput, TimerTriggerSettings> {
  constructor(id: string, settings: TimerTriggerSettings) {
    super(
      {
        id,
        name: '定时触发器',
        type: 'timer-trigger'
      },
      settings
    );
  }

  public async execute(
    _inputs: TimerTriggerInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<TimerTriggerOutput>> {
    try {
      const output: TimerTriggerOutput = {
        timestamp: Date.now(),
        data: {
          workflowId: context.workflowId,
          nodeId: context.nodeId
        }
      };

      return {
        success: true,
        data: output
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}