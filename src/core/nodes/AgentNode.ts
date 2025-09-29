import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';
import { ToolManager, type Tool, type ToolCall, type LLMProvider } from '../types/Tool';

// Agent节点的输入类型
export interface AgentNodeInput extends Record<string, unknown> {
  message: string;
  context?: Record<string, unknown>;
}

// Agent节点的输出类型
export interface AgentNodeOutput extends Record<string, unknown> {
  response: string;
  toolCalls?: ToolCall[];
  metadata: {
    tokensUsed: number;
    executionTime: number;
    toolsUsed?: number;
  };
}

// Agent节点的设置类型
export interface AgentNodeSettings extends Record<string, unknown> {
  systemPrompt: string;
  model: string;
  enableTools?: boolean;
  maxToolCalls?: number;
}

// Agent节点实现
export class AgentNode extends BaseNode<AgentNodeInput, AgentNodeOutput, AgentNodeSettings> {
  private toolManager: ToolManager;
  private llmProvider?: LLMProvider;

  constructor(id: string, settings: AgentNodeSettings) {
    super(
      {
        id,
        name: 'AI Agent',
        type: 'agent'
      },
      settings
    );
    
    this.toolManager = new ToolManager();
  }

  /** 添加工具 */
  public addTool(tool: Tool): void {
    this.toolManager.registerTool(tool);
  }

  /** 移除工具 */
  public removeTool(toolId: string): void {
    this.toolManager.removeTool(toolId);
  }

  /** 获取所有工具 */
  public getTools(): Tool[] {
    return this.toolManager.getAllTools();
  }

  /** 设置 LLM 提供者 */
  public setLLMProvider(provider: LLMProvider): void {
    this.llmProvider = provider;
  }

  public async execute(
    inputs: AgentNodeInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<AgentNodeOutput>> {
    const startTime = Date.now();
    
    try {
      let response: string;
      const toolCalls: ToolCall[] = [];
      let totalTokensUsed = 0;

      if (this.settings.enableTools && this.llmProvider && this.getTools().length > 0) {
        // 使用 LLM 提供者进行智能回复，支持工具调用
        const llmResult = await this.llmProvider.generateResponse(
          [{ role: 'user', content: inputs.message }],
          {
            systemPrompt: this.settings.systemPrompt,
            model: this.settings.model,
            tools: this.getTools(),
            maxTokens: 2000
          }
        );

        response = llmResult.content;
        totalTokensUsed += llmResult.metadata.tokensUsed;

        // 处理工具调用
        if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
          const maxCalls = this.settings.maxToolCalls || 5;
          const callsToProcess = llmResult.toolCalls.slice(0, maxCalls);

          for (const toolCall of callsToProcess) {
            const toolResult = await this.toolManager.executeTool(
              toolCall.toolId,
              toolCall.input,
              context
            );

            const call: ToolCall = {
              toolId: toolCall.toolId,
              toolName: this.toolManager.getTool(toolCall.toolId)?.name || 'Unknown',
              input: toolCall.input,
              result: toolResult,
              timestamp: Date.now()
            };

            toolCalls.push(call);
          }
        }
      } else {
        // 简单模拟回复
        response = `AI回复: ${inputs.message}`;
        
        // 如果启用了工具但没有 LLM 提供者，给出提示
        if (this.settings.enableTools && this.getTools().length > 0) {
          response += `\n\n可用工具: ${this.getTools().map(t => t.name).join(', ')}`;
        }
      }
      
      const executionTime = Date.now() - startTime;

      const output: AgentNodeOutput = {
        response,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        metadata: {
          tokensUsed: totalTokensUsed || 100, // 默认模拟值
          executionTime,
          toolsUsed: toolCalls.length
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