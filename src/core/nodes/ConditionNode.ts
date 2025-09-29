import { z } from 'zod';
import { BaseNode, createRuntimeSchema, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';

// 条件节点的输入类型定义
export interface ConditionNodeInput {
  value: any;
  condition: string; // 条件表达式
  variables?: Record<string, any>; // 额外变量
}

// 条件节点的输出类型定义
export interface ConditionNodeOutput {
  result: boolean;
  value: any; // 传递输入值
  evaluatedCondition: string;
  metadata: {
    executionTime: number;
    conditionType: string;
  };
}

// 条件节点的设置类型定义
export interface ConditionNodeSettings {
  conditionType: 'javascript' | 'simple' | 'jsonpath';
  timeout?: number;
  allowUnsafeEval?: boolean; // 是否允许不安全的表达式求值
}

// 条件运算符枚举
export enum ComparisonOperator {
  EQUALS = '==',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  MATCHES_REGEX = 'matches_regex'
}

// 简单条件表达式接口
export interface SimpleCondition {
  field: string;
  operator: ComparisonOperator;
  value?: any;
}

// 条件节点实现
export class ConditionNode extends BaseNode<ConditionNodeInput, ConditionNodeOutput, ConditionNodeSettings> {
  constructor(
    id: string,
    settings: ConditionNodeSettings = { conditionType: 'simple' }
  ) {
    super(
      {
        id,
        name: 'Condition',
        type: 'condition',
        category: 'logic',
        description: 'Evaluate conditions and control workflow branching',
        version: '1.0.0',
        icon: '❓',
        color: '#F59E0B',
        tags: ['logic', 'condition', 'branching']
      },
      {
        conditionType: 'simple',
        timeout: 5000,
        allowUnsafeEval: false,
        ...settings
      }
    );
  }

  protected defineInputs(): void {
    this.addInputPort<any>('value', {
      name: 'Input Value',
      type: 'any',
      schema: createRuntimeSchema(z.any()),
      required: true,
      description: 'The value to evaluate'
    });

    this.addInputPort<string>('condition', {
      name: 'Condition',
      type: 'string',
      schema: createRuntimeSchema(z.string().min(1)),
      required: true,
      description: 'The condition expression to evaluate'
    });

    this.addInputPort<Record<string, any>>('variables', {
      name: 'Variables',
      type: 'object',
      schema: createRuntimeSchema(z.record(z.any())),
      required: false,
      description: 'Additional variables for condition evaluation',
      defaultValue: {}
    });
  }

  protected defineOutputs(): void {
    this.addOutputPort<boolean>('result', {
      name: 'Result',
      type: 'boolean',
      schema: createRuntimeSchema(z.boolean()),
      required: true,
      description: 'The evaluation result'
    });

    this.addOutputPort<any>('value', {
      name: 'Pass-through Value',
      type: 'any',
      schema: createRuntimeSchema(z.any()),
      required: true,
      description: 'The original input value'
    });

    this.addOutputPort<string>('evaluatedCondition', {
      name: 'Evaluated Condition',
      type: 'string',
      schema: createRuntimeSchema(z.string()),
      required: true,
      description: 'The condition that was evaluated'
    });

    this.addOutputPort<{
      executionTime: number;
      conditionType: string;
    }>('metadata', {
      name: 'Execution Metadata',
      type: 'object',
      schema: createRuntimeSchema(z.object({
        executionTime: z.number(),
        conditionType: z.string()
      })),
      required: true,
      description: 'Metadata about the condition evaluation'
    });
  }

  public async execute(
    inputs: ConditionNodeInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<ConditionNodeOutput>> {
    const startTime = Date.now();

    try {
      let result: boolean;
      
      switch (this.settings.conditionType) {
        case 'simple':
          result = await this.evaluateSimpleCondition(inputs);
          break;
        case 'javascript':
          result = await this.evaluateJavaScriptCondition(inputs);
          break;
        case 'jsonpath':
          result = await this.evaluateJsonPathCondition(inputs);
          break;
        default:
          throw new Error(`Unsupported condition type: ${this.settings.conditionType}`);
      }

      const executionTime = Date.now() - startTime;

      const output: ConditionNodeOutput = {
        result,
        value: inputs.value,
        evaluatedCondition: inputs.condition,
        metadata: {
          executionTime,
          conditionType: this.settings.conditionType
        }
      };

      return {
        success: true,
        data: output,
        nextNodes: this.getNextNodes(result)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // 评估简单条件表达式
  private async evaluateSimpleCondition(inputs: ConditionNodeInput): Promise<boolean> {
    try {
      const condition: SimpleCondition = JSON.parse(inputs.condition);
      const value = this.getFieldValue(inputs.value, condition.field);
      
      return this.compareValues(value, condition.operator, condition.value);
    } catch (error) {
      throw new Error(`Invalid simple condition format: ${error}`);
    }
  }

  // 评估JavaScript条件表达式
  private async evaluateJavaScriptCondition(inputs: ConditionNodeInput): Promise<boolean> {
    if (!this.settings.allowUnsafeEval) {
      throw new Error('JavaScript evaluation is disabled for security reasons');
    }

    try {
      // 创建安全的执行上下文
      const context = {
        value: inputs.value,
        variables: inputs.variables || {},
        // 添加一些常用的工具函数
        isEmpty: (val: any) => val == null || val === '' || (Array.isArray(val) && val.length === 0),
        isNotEmpty: (val: any) => !this.isEmpty(val),
        contains: (str: string, substr: string) => str?.includes(substr),
        startsWith: (str: string, prefix: string) => str?.startsWith(prefix),
        endsWith: (str: string, suffix: string) => str?.endsWith(suffix),
        matches: (str: string, regex: string) => new RegExp(regex).test(str)
      };

      // 使用Function构造函数而不是eval，稍微安全一些
      const func = new Function('context', `
        with(context) {
          return ${inputs.condition};
        }
      `);

      const result = func(context);
      return Boolean(result);

    } catch (error) {
      throw new Error(`JavaScript condition evaluation failed: ${error}`);
    }
  }

  // 评估JSONPath条件表达式
  private async evaluateJsonPathCondition(inputs: ConditionNodeInput): Promise<boolean> {
    // 这里需要引入JSONPath库，如 jsonpath-plus
    // 为了示例，我们实现一个简化版本
    try {
      const [path, operator, expectedValue] = inputs.condition.split(' ');
      const actualValue = this.evaluateJsonPath(inputs.value, path);
      
      return this.compareValues(actualValue, operator as ComparisonOperator, expectedValue);
    } catch (error) {
      throw new Error(`JSONPath condition evaluation failed: ${error}`);
    }
  }

  // 简化的JSONPath求值
  private evaluateJsonPath(obj: any, path: string): any {
    if (path === '$') return obj;
    
    const parts = path.replace(/^\$\./, '').split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current == null) return undefined;
      
      if (part.includes('[') && part.includes(']')) {
        // 处理数组索引，如 items[0]
        const [key, indexStr] = part.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        current = current[key]?.[index];
      } else {
        current = current[part];
      }
    }
    
    return current;
  }

  // 获取字段值（支持嵌套对象）
  private getFieldValue(obj: any, field: string): any {
    if (field.includes('.')) {
      const parts = field.split('.');
      let current = obj;
      for (const part of parts) {
        current = current?.[part];
      }
      return current;
    }
    return obj?.[field];
  }

  // 比较两个值
  private compareValues(actual: any, operator: ComparisonOperator, expected: any): boolean {
    switch (operator) {
      case ComparisonOperator.EQUALS:
        return actual == expected;
      case ComparisonOperator.NOT_EQUALS:
        return actual != expected;
      case ComparisonOperator.GREATER_THAN:
        return actual > expected;
      case ComparisonOperator.GREATER_THAN_OR_EQUAL:
        return actual >= expected;
      case ComparisonOperator.LESS_THAN:
        return actual < expected;
      case ComparisonOperator.LESS_THAN_OR_EQUAL:
        return actual <= expected;
      case ComparisonOperator.CONTAINS:
        return String(actual).includes(String(expected));
      case ComparisonOperator.NOT_CONTAINS:
        return !String(actual).includes(String(expected));
      case ComparisonOperator.STARTS_WITH:
        return String(actual).startsWith(String(expected));
      case ComparisonOperator.ENDS_WITH:
        return String(actual).endsWith(String(expected));
      case ComparisonOperator.IS_EMPTY:
        return actual == null || actual === '' || (Array.isArray(actual) && actual.length === 0);
      case ComparisonOperator.IS_NOT_EMPTY:
        return !(actual == null || actual === '' || (Array.isArray(actual) && actual.length === 0));
      case ComparisonOperator.MATCHES_REGEX:
        return new RegExp(String(expected)).test(String(actual));
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  // 根据条件结果确定下一个节点
  private getNextNodes(result: boolean): string[] {
    // 这里可以根据结果返回不同的下一个节点
    // 在实际实现中，这应该由工作流引擎根据连接配置来处理
    return [];
  }

  // 验证条件表达式
  public validateCondition(condition: string): boolean {
    try {
      switch (this.settings.conditionType) {
        case 'simple':
          JSON.parse(condition);
          return true;
        case 'javascript':
          // 基本的语法检查
          new Function('context', `return ${condition}`);
          return true;
        case 'jsonpath':
          // 基本的JSONPath格式检查
          return condition.includes('$') || condition.includes('.');
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  // 获取条件示例
  public getConditionExamples(): Record<string, string[]> {
    return {
      simple: [
        '{"field": "status", "operator": "==", "value": "active"}',
        '{"field": "count", "operator": ">", "value": 10}',
        '{"field": "name", "operator": "contains", "value": "test"}'
      ],
      javascript: [
        'value.status === "active"',
        'value.count > 10 && value.enabled',
        'variables.threshold < value.score',
        'isEmpty(value.errors)'
      ],
      jsonpath: [
        '$.status == active',
        '$.items.length > 0',
        '$.user.name contains John'
      ]
    };
  }
}
