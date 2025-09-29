import { z } from 'zod';
import { BaseNode, createRuntimeSchema, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';

// Agent节点的输入类型定义
export interface AgentNodeInput {
  message: string;
  context?: Record<string, any>;
  tools?: string[]; // 可用工具列表
  model?: string;   // LLM模型名称
}

// Agent节点的输出类型定义
export interface AgentNodeOutput {
  response: string;
  toolCalls?: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
  reasoning?: string;
  metadata: {
    tokensUsed: number;
    executionTime: number;
    model: string;
  };
}

// Agent节点的设置类型定义
export interface AgentNodeSettings {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  enableTools?: boolean;
  timeout?: number;
}

// 工具接口定义
export interface Tool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute(input: any, context: NodeExecutionContext): Promise<any>;
}

// Agent节点实现
export class AgentNode extends BaseNode<AgentNodeInput, AgentNodeOutput, AgentNodeSettings> {
  private tools: Map<string, Tool> = new Map();
  private llmProvider?: LLMProvider;

  constructor(
    id: string,
    settings: AgentNodeSettings = {}
  ) {
    super(
      {
        id,
        name: 'AI Agent',
        type: 'agent',
        category: 'ai',
        description: 'AI Agent that can use tools and reason about tasks',
        version: '1.0.0',
        icon: '🤖',
        color: '#4F46E5',
        tags: ['ai', 'agent', 'llm']
      },
      {
        systemPrompt: 'You are a helpful AI assistant.',
        temperature: 0.7,
        maxTokens: 2000,
        enableTools: true,
        timeout: 30000,
        ...settings
      }
    );
  }

  protected defineInputs(): void {
    this.addInputPort<string>('message', {
      name: 'Message',
      type: 'string',
      schema: createRuntimeSchema(z.string().min(1)),
      required: true,
      description: 'The input message or prompt for the agent'
    });

    this.addInputPort<Record<string, any>>('context', {
      name: 'Context',
      type: 'object',
      schema: createRuntimeSchema(z.record(z.any())),
      required: false,
      description: 'Additional context information',
      defaultValue: {}
    });

    this.addInputPort<string[]>('tools', {
      name: 'Available Tools',
      type: 'array',
      schema: createRuntimeSchema(z.array(z.string())),
      required: false,
      description: 'List of available tool names',
      defaultValue: []
    });

    this.addInputPort<string>('model', {
      name: 'LLM Model',
      type: 'string',
      schema: createRuntimeSchema(z.string()),
      required: false,
      description: 'The LLM model to use',
      defaultValue: 'gpt-4'
    });
  }

  protected defineOutputs(): void {
    this.addOutputPort<string>('response', {
      name: 'Response',
      type: 'string',
      schema: createRuntimeSchema(z.string()),
      required: true,
      description: 'The agent\'s response'
    });

    this.addOutputPort<Array<{ tool: string; input: any; output: any }>>('toolCalls', {
      name: 'Tool Calls',
      type: 'array',
      schema: createRuntimeSchema(z.array(z.object({
        tool: z.string(),
        input: z.any(),
        output: z.any()
      }))),
      required: false,
      description: 'Information about tool calls made during execution'
    });

    this.addOutputPort<string>('reasoning', {
      name: 'Reasoning',
      type: 'string',
      schema: createRuntimeSchema(z.string()),
      required: false,
      description: 'The agent\'s reasoning process'
    });

    this.addOutputPort<{
      tokensUsed: number;
      executionTime: number;
      model: string;
    }>('metadata', {
      name: 'Execution Metadata',
      type: 'object',
      schema: createRuntimeSchema(z.object({
        tokensUsed: z.number(),
        executionTime: z.number(),
        model: z.string()
      })),
      required: true,
      description: 'Metadata about the execution'
    });
  }

  // 添加工具
  public addTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  // 移除工具
  public removeTool(toolName: string): void {
    this.tools.delete(toolName);
  }

  // 设置LLM提供者
  public setLLMProvider(provider: LLMProvider): void {
    this.llmProvider = provider;
  }

  public async execute(
    inputs: AgentNodeInput,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult<AgentNodeOutput>> {
    const startTime = Date.now();
    
    try {
      if (!this.llmProvider) {
        throw new Error('LLM provider not configured for Agent node');
      }

      // 准备可用工具
      const availableTools = inputs.tools?.filter(toolName => this.tools.has(toolName)) || [];
      const toolDefinitions = availableTools.map(toolName => {
        const tool = this.tools.get(toolName)!;
        return {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        };
      });

      // 构建系统提示
      let systemPrompt = this.settings.systemPrompt || 'You are a helpful AI assistant.';
      if (availableTools.length > 0 && this.settings.enableTools) {
        systemPrompt += '\n\nYou have access to the following tools:\n' +
          toolDefinitions.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
      }

      // 调用LLM
      const llmResponse = await this.llmProvider.generate({
        model: inputs.model || 'gpt-4',
        systemPrompt,
        message: inputs.message,
        context: inputs.context,
        tools: this.settings.enableTools ? toolDefinitions : undefined,
        temperature: this.settings.temperature,
        maxTokens: this.settings.maxTokens,
        timeout: this.settings.timeout
      });

      const toolCalls: Array<{ tool: string; input: any; output: any }> = [];

      // 执行工具调用
      if (llmResponse.toolCalls && this.settings.enableTools) {
        for (const toolCall of llmResponse.toolCalls) {
          const tool = this.tools.get(toolCall.name);
          if (tool) {
            try {
              const toolOutput = await tool.execute(toolCall.input, context);
              toolCalls.push({
                tool: toolCall.name,
                input: toolCall.input,
                output: toolOutput
              });
            } catch (error) {
              console.error(`Error executing tool ${toolCall.name}:`, error);
              toolCalls.push({
                tool: toolCall.name,
                input: toolCall.input,
                output: { error: error instanceof Error ? error.message : String(error) }
              });
            }
          }
        }
      }

      const executionTime = Date.now() - startTime;

      const output: AgentNodeOutput = {
        response: llmResponse.response,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        reasoning: llmResponse.reasoning,
        metadata: {
          tokensUsed: llmResponse.tokensUsed || 0,
          executionTime,
          model: inputs.model || 'gpt-4'
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

  // 验证工具配置
  public validateTools(): void {
    for (const [name, tool] of this.tools) {
      if (!tool.name || !tool.description || !tool.parameters) {
        throw new Error(`Invalid tool configuration for tool '${name}'`);
      }
    }
  }

  // 获取工具信息
  public getToolsInfo() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters.describe ? tool.parameters.describe() : 'Schema not available'
    }));
  }
}

// LLM提供者接口
export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}

export interface LLMRequest {
  model: string;
  systemPrompt: string;
  message: string;
  context?: Record<string, any>;
  tools?: Array<{
    name: string;
    description: string;
    parameters: z.ZodSchema;
  }>;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface LLMResponse {
  response: string;
  reasoning?: string;
  toolCalls?: Array<{
    name: string;
    input: any;
  }>;
  tokensUsed?: number;
}

// 示例工具实现
export class WebSearchTool implements Tool {
  name = 'web_search';
  description = 'Search the web for information';
  parameters = z.object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().describe('Maximum number of results')
  });

  async execute(input: any, context: NodeExecutionContext): Promise<any> {
    // 这里是模拟实现，实际应该调用真实的搜索API
    const { query, limit = 5 } = input;
    
    return {
      results: [
        {
          title: `Search result for: ${query}`,
          url: 'https://example.com',
          snippet: 'This is a mock search result...'
        }
      ],
      totalResults: 1,
      searchTime: '0.1s'
    };
  }
}

export class CalculatorTool implements Tool {
  name = 'calculator';
  description = 'Perform mathematical calculations';
  parameters = z.object({
    expression: z.string().describe('Mathematical expression to evaluate')
  });

  async execute(input: any, context: NodeExecutionContext): Promise<any> {
    const { expression } = input;
    
    try {
      // 注意：在实际应用中应该使用安全的表达式求值器
      // 这里只是示例，不要在生产环境中直接使用 eval
      const result = this.safeEvaluate(expression);
      
      return {
        result,
        expression,
        success: true
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        expression,
        success: false
      };
    }
  }

  private safeEvaluate(expression: string): number {
    // 简单的安全检查，实际应用中应该使用专门的数学表达式求值库
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      throw new Error('Invalid mathematical expression');
    }
    
    // 这里应该使用安全的求值器，如 math.js
    return eval(expression);
  }
}
