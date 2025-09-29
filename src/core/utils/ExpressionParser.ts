// 简化的表达式解析器 - 演示用途
export class ExpressionParser {
  // 深度解析对象中的所有表达式（只处理字符串类型）
  public static deepParseExpressions(
    obj: unknown,
    context: ExpressionContext
  ): unknown {
    // 如果是字符串，尝试解析表达式
    if (typeof obj === 'string') {
      return this.parseString(obj, context);
    }
    
    // 如果是数组，递归处理每个元素
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepParseExpressions(item, context));
    }
    
    // 如果是对象（且不是null），递归处理每个属性
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        result[key] = this.deepParseExpressions(value, context);
      }
      return result;
    }
    
    // 其他类型（number, boolean, null等）直接返回
    return obj;
  }

  // 解析字符串中的表达式 - 简化版本
  private static parseString(str: string, context: ExpressionContext): unknown {
    // 检查是否包含表达式
    if (!str.includes('{{') || !str.includes('}}')) {
      return str;
    }

    try {
      // 简单的正则替换
      return str.replace(/\{\{([^}]+)\}\}/g, (_, expression) => {
        const trimmedExpr = expression.trim();
        const value = this.evaluateSimpleExpression(trimmedExpr, context);
        return this.toString(value);
      });
    } catch (error) {
      console.warn(`Failed to parse expression in "${str}":`, error);
      return str;
    }
  }

  // 简化的表达式求值
  private static evaluateSimpleExpression(expression: string, context: ExpressionContext): unknown {
    // $result.nodeId.field
    if (expression.startsWith('$result.')) {
      const path = expression.substring(8);
      const parts = path.split('.');
      if (parts.length < 2) return '';
      
      const nodeId = parts[0];
      const nodeResult = context.previousResults?.get(nodeId);
      if (!nodeResult) return '';
      
      return this.getValueByPath(nodeResult, parts.slice(1));
    }
    
    // $input.field
    if (expression.startsWith('$input.')) {
      const path = expression.substring(7);
      if (!context.currentInputs) return '';
      return this.getValueByPath(context.currentInputs, path.split('.'));
    }
    
    // $context.field
    if (expression.startsWith('$context.')) {
      const path = expression.substring(9);
      if (!context.executionContext) return '';
      return this.getValueByPath(context.executionContext, path.split('.'));
    }
    
    // $settings.field
    if (expression.startsWith('$settings.')) {
      const path = expression.substring(10);
      if (!context.currentSettings) return '';
      return this.getValueByPath(context.currentSettings, path.split('.'));
    }
    
    return expression; // 不支持的表达式直接返回
  }

  // 简化的路径取值
  private static getValueByPath(obj: unknown, path: string[]): unknown {
    let current = obj;
    
    for (const key of path) {
      if (current == null || typeof current !== 'object') {
        return '';
      }
      current = (current as Record<string, unknown>)[key];
    }
    
    return current;
  }

  // 转换为字符串
  private static toString(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  // 检查字符串是否包含表达式
  public static hasExpression(template: string): boolean {
    if (typeof template !== 'string') return false;
    return template.includes('{{') && template.includes('}}');
  }

  // 批量解析对象（保持向后兼容）
  public static parseObject(
    obj: Record<string, unknown>,
    context: ExpressionContext
  ): Record<string, unknown> {
    return this.deepParseExpressions(obj, context) as Record<string, unknown>;
  }
}

// 表达式上下文接口
export interface ExpressionContext {
  previousResults?: Map<string, unknown>;
  currentInputs?: Record<string, unknown>;
  currentSettings?: Record<string, unknown>;
  executionContext?: Record<string, unknown>;
}

// 简化的工具类
export class ExpressionUtils {
  // 获取表达式的依赖节点
  public static getDependencies(expression: string): string[] {
    const dependencies = new Set<string>();
    const matches = expression.match(/\{\{\$result\.([^.}]+)/g);
    
    if (matches) {
      for (const match of matches) {
        const nodeId = match.replace('{{$result.', '');
        dependencies.add(nodeId);
      }
    }
    
    return Array.from(dependencies);
  }

  // 简单的表达式示例
  public static getExpressionExamples(): Record<string, string[]> {
    return {
      '节点结果': [
        '{{$result.httpNode.status}}',
        '{{$result.codeNode.result}}',
        '{{$result.agentNode.response}}'
      ],
      '当前输入': [
        '{{$input.message}}',
        '{{$input.data}}',
        '{{$input.userId}}'
      ],
      '执行上下文': [
        '{{$context.workflowId}}',
        '{{$context.nodeId}}'
      ],
      '节点设置': [
        '{{$settings.apiKey}}',
        '{{$settings.timeout}}'
      ]
    };
  }
}