import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';

// 代码节点的输入类型
export interface CodeNodeInput extends Record<string, unknown> {
  data?: unknown;
}

// 代码节点的输出类型
export interface CodeNodeOutput {
  result: unknown;
}

// 代码节点的设置类型
export interface CodeNodeSettings {
  code: string; // JavaScript代码
}

// 代码节点实现
export class CodeNode extends BaseNode<CodeNodeInput, CodeNodeOutput, CodeNodeSettings> {
  constructor(id: string, settings: CodeNodeSettings) {
    super(
      {
        id,
        name: '代码执行',
        type: 'code'
      },
      settings
    );
  }

  public async execute(
    inputs: CodeNodeInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<CodeNodeOutput>> {
    try {
      // 创建函数执行用户代码
      const func = new Function('inputs', this.settings.code);
      const result = func(inputs);

      const output: CodeNodeOutput = {
        result
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