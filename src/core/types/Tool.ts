import { z } from 'zod';
import type { NodeExecutionContext } from '../abstract/BaseNode';

// 重新导出 NodeExecutionContext
export type { NodeExecutionContext };

// 工具接口定义
export interface Tool {
  /** 工具唯一标识符 */
  id: string;
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 工具参数的 Zod 模式 */
  parameters: z.ZodSchema;
  /** 工具图标（可选） */
  icon?: React.ReactNode;
  /** 工具分类（可选） */
  category?: string;
  /** 执行工具逻辑 */
  execute(input: any, context: NodeExecutionContext): Promise<any>;
}

// 工具执行结果
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: Error;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
  };
}

// 工具调用记录
export interface ToolCall {
  toolId: string;
  toolName: string;
  input: any;
  result: ToolExecutionResult;
  timestamp: number;
}

// LLM 提供者接口
export interface LLMProvider {
  /** 提供者名称 */
  name: string;
  /** 生成回复，支持工具调用 */
  generateResponse(
    messages: Array<{ role: string; content: string }>,
    options: {
      systemPrompt?: string;
      model?: string;
      tools?: Tool[];
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<{
    content: string;
    toolCalls?: Array<{
      toolId: string;
      input: any;
    }>;
    metadata: {
      tokensUsed: number;
      executionTime: number;
    };
  }>;
}

// 工具管理器
export class ToolManager {
  private tools = new Map<string, Tool>();

  /** 注册工具 */
  registerTool(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  /** 移除工具 */
  removeTool(toolId: string): void {
    this.tools.delete(toolId);
  }

  /** 获取工具 */
  getTool(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  /** 获取所有工具 */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /** 按分类获取工具 */
  getToolsByCategory(category: string): Tool[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }

  /** 执行工具 */
  async executeTool(
    toolId: string, 
    input: any, 
    context: NodeExecutionContext
  ): Promise<ToolExecutionResult> {
    const tool = this.getTool(toolId);
    if (!tool) {
      return {
        success: false,
        error: new Error(`Tool not found: ${toolId}`)
      };
    }

    const startTime = Date.now();
    
    try {
      // 验证输入参数
      const validatedInput = tool.parameters.parse(input);
      
      // 执行工具
      const data = await tool.execute(validatedInput, context);
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data,
        metadata: {
          executionTime
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          executionTime
        }
      };
    }
  }
}
