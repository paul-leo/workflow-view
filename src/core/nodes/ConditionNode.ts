import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';

// 条件节点的输入类型
export interface ConditionNodeInput extends Record<string, unknown> {
  value: unknown;
  condition: string;
}

// 条件节点的输出类型
export interface ConditionNodeOutput extends Record<string, unknown> {
  result: boolean;
  value: unknown;
}

// 条件节点的设置类型
export interface ConditionNodeSettings extends Record<string, unknown> {
  conditionType: 'javascript' | 'simple';
  condition?: string; // JavaScript 条件表达式（当 conditionType 为 'javascript' 时使用）
}

// 条件节点实现
export class ConditionNode extends BaseNode<ConditionNodeInput, ConditionNodeOutput, ConditionNodeSettings> {
  constructor(id: string, settings: ConditionNodeSettings) {
    super(
      {
        id,
        name: '条件判断',
        type: 'condition'
      },
      settings
    );
  }

  public async execute(
    inputs: ConditionNodeInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: NodeExecutionContext
  ): Promise<NodeExecutionResult<ConditionNodeOutput>> {
    try {
      let result: boolean;

      if (this.settings.conditionType === 'javascript') {
        result = this.evaluateJavaScriptCondition(inputs);
      } else {
        // 简单条件：直接比较值
        result = Boolean(inputs.value);
      }

      const output: ConditionNodeOutput = {
        result,
        value: inputs.value
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

  // 评估JavaScript条件表达式
  private evaluateJavaScriptCondition(inputs: ConditionNodeInput): boolean {
    try {
      // 优先使用设置中的条件，其次使用输入中的条件
      const condition = this.settings.condition || inputs.condition;
      if (!condition) {
        throw new Error('No condition specified');
      }
      
      // 创建函数执行条件表达式，提供inputs作为上下文
      const func = new Function('inputs', 'value', `return ${condition}`);
      const result = func(inputs, inputs.value);
      return Boolean(result);
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${error}`);
    }
  }
}