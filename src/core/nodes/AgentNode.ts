import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';

// Agent节点的输入类型
export interface AgentNodeInput extends Record<string, unknown> {
  message: string;
  context?: Record<string, unknown>;
}

// Agent节点的输出类型
export interface AgentNodeOutput extends Record<string, unknown> {
  response: string;
  metadata: {
    tokensUsed: number;
    executionTime: number;
  };
}

// Agent节点的设置类型
export interface AgentNodeSettings extends Record<string, unknown> {
  systemPrompt: string;
  model: string;
}

// Agent节点实现
export class AgentNode extends BaseNode<AgentNodeInput, AgentNodeOutput, AgentNodeSettings> {
  constructor(id: string, settings: AgentNodeSettings) {
    super(
      {
        id,
        name: 'AI Agent',
        type: 'agent'
      },
      settings
    );
  }

  public async execute(
    inputs: AgentNodeInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: NodeExecutionContext
  ): Promise<NodeExecutionResult<AgentNodeOutput>> {
    const startTime = Date.now();
    
    try {
      // 这里应该调用实际的LLM API
      // 目前返回模拟响应
      const response = `AI回复: ${inputs.message}`;
      
      const executionTime = Date.now() - startTime;

      const output: AgentNodeOutput = {
        response,
        metadata: {
          tokensUsed: 100, // 模拟值
          executionTime,
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