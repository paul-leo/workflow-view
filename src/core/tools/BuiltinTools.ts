import { z } from 'zod';
import type { Tool, NodeExecutionContext } from '../types/Tool';
import React from 'react';
import { Calculator, Search, Code2, FileText, Clock } from 'lucide-react';

/**
 * 计算器工具
 * 支持基本的数学运算
 */
export const CalculatorTool: Tool = {
  id: 'calculator',
  name: '计算器',
  description: '执行基本的数学运算，支持加减乘除、幂运算等',
  category: '数学',
  icon: React.createElement(Calculator, { size: 16 }),
  parameters: z.object({
    expression: z.string().describe('要计算的数学表达式，如 "2 + 3 * 4"')
  }),
  
  async execute(input: { expression: string }, _context: NodeExecutionContext) {
    void _context;
    try {
      // 简单的数学表达式求值（生产环境建议使用更安全的数学库）
      const sanitizedExpression = input.expression
        .replace(/[^0-9+\-*/().\s]/g, '') // 只允许数字和基本运算符
        .replace(/\s+/g, ''); // 移除空格
      
      if (!sanitizedExpression) {
        throw new Error('无效的数学表达式');
      }
      
      // 使用 Function 构造器安全地计算表达式
      const result = Function(`"use strict"; return (${sanitizedExpression})`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('计算结果无效');
      }
      
      return {
        result: result,
        expression: input.expression,
        formatted: `${input.expression} = ${result}`
      };
    } catch (error) {
      throw new Error(`计算错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

/**
 * 网络搜索工具
 * 模拟网络搜索功能
 */
export const WebSearchTool: Tool = {
  id: 'web-search',
  name: '网络搜索',
  description: '在互联网上搜索信息',
  category: '搜索',
  icon: React.createElement(Search, { size: 16 }),
  parameters: z.object({
    query: z.string().describe('搜索关键词'),
    limit: z.number().optional().default(5).describe('返回结果数量限制')
  }),
  
  async execute(input: { query: string; limit?: number }, _context: NodeExecutionContext) {
    void _context;
    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟搜索结果
    const mockResults = [
      {
        title: `关于"${input.query}"的搜索结果1`,
        url: `https://example.com/search?q=${encodeURIComponent(input.query)}`,
        snippet: `这是关于${input.query}的相关信息摘要...`
      },
      {
        title: `${input.query} - 详细介绍`,
        url: `https://wiki.example.com/${encodeURIComponent(input.query)}`,
        snippet: `详细介绍了${input.query}的各个方面...`
      },
      {
        title: `如何使用${input.query}`,
        url: `https://tutorial.example.com/${encodeURIComponent(input.query)}`,
        snippet: `教程：学习如何正确使用${input.query}...`
      }
    ];
    
    const results = mockResults.slice(0, input.limit || 5);
    
    return {
      query: input.query,
      results: results,
      totalFound: results.length,
      searchTime: '0.42秒'
    };
  }
};

/**
 * 代码执行工具
 * 安全地执行简单的 JavaScript 代码
 */
export const CodeExecutorTool: Tool = {
  id: 'code-executor',
  name: '代码执行器',
  description: '执行简单的 JavaScript 代码片段',
  category: '开发',
  icon: React.createElement(Code2, { size: 16 }),
  parameters: z.object({
    code: z.string().describe('要执行的 JavaScript 代码'),
    timeout: z.number().optional().default(5000).describe('执行超时时间（毫秒）')
  }),
  
  async execute(input: { code: string; timeout?: number }, _context: NodeExecutionContext) {
    void _context;
    try {
      // 简单的代码安全检查
      const dangerousPatterns = [
        /require\s*\(/,
        /import\s+/,
        /process\./,
        /global\./,
        /window\./,
        /document\./,
        /eval\s*\(/,
        /Function\s*\(/
      ];
      
      const hasDangerousCode = dangerousPatterns.some(pattern => 
        pattern.test(input.code)
      );
      
      if (hasDangerousCode) {
        throw new Error('代码包含不安全的操作');
      }
      
      // 创建受限的执行环境
      const safeGlobals = {
        Math,
        Date,
        JSON,
        String,
        Number,
        Boolean,
        Array,
        Object,
        console: {
          log: (...args: unknown[]) => (args as unknown[]).map(String).join(' ')
        }
      };
      
      // 使用 Function 构造器执行代码
      const func = new Function(
        ...Object.keys(safeGlobals),
        `"use strict"; ${input.code}`
      );
      
      const result = func(...Object.values(safeGlobals));
      
      return {
        code: input.code,
        result: result,
        type: typeof result,
        success: true
      };
    } catch (error) {
      return {
        code: input.code,
        error: error instanceof Error ? error.message : '执行错误',
        success: false
      };
    }
  }
};

/**
 * 文本处理工具
 * 提供各种文本处理功能
 */
export const TextProcessorTool: Tool = {
  id: 'text-processor',
  name: '文本处理器',
  description: '提供文本统计、格式化、转换等功能',
  category: '文本',
  icon: React.createElement(FileText, { size: 16 }),
  parameters: z.object({
    text: z.string().describe('要处理的文本'),
    operation: z.enum(['count', 'uppercase', 'lowercase', 'reverse', 'summary']).describe('处理操作类型')
  }),
  
  async execute(input: { text: string; operation: string }, _context: NodeExecutionContext) {
    void _context;
    const { text, operation } = input;
    
    switch (operation) {
      case 'count':
        return {
          operation: '统计',
          result: {
            characters: text.length,
            charactersNoSpaces: text.replace(/\s/g, '').length,
            words: text.trim() ? text.trim().split(/\s+/).length : 0,
            lines: text.split('\n').length,
            paragraphs: text.split(/\n\s*\n/).filter(p => p.trim()).length
          }
        };
        
      case 'uppercase':
        return {
          operation: '转大写',
          result: text.toUpperCase()
        };
        
      case 'lowercase':
        return {
          operation: '转小写',
          result: text.toLowerCase()
        };
        
      case 'reverse':
        return {
          operation: '反转文本',
          result: text.split('').reverse().join('')
        };
        
      case 'summary': {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        const firstSentence = sentences[0]?.trim() || '';
        return {
          operation: '文本摘要',
          result: {
            summary: firstSentence.length > 100 
              ? firstSentence.substring(0, 100) + '...' 
              : firstSentence,
            totalSentences: sentences.length,
            avgWordsPerSentence: sentences.length > 0 
              ? Math.round(text.trim().split(/\s+/).length / sentences.length)
              : 0
          }
        };}
        
      default:
        throw new Error(`不支持的操作: ${operation}`);
    }
  }
};

// 类型定义：时间工具输入
type TimeAddUnit = 'seconds' | 'minutes' | 'hours' | 'days';

type TimeToolInput =
  | { operation: 'current' }
  | { operation: 'format'; format?: string }
  | { operation: 'add'; amount?: number; unit?: TimeAddUnit }
  | { operation: 'diff'; targetTime: string };

export const TimeTool: Tool = {
  id: 'time-tool',
  name: '时间工具',
  description: '获取当前时间、时间格式化、时区转换等',
  category: '工具',
  icon: React.createElement(Clock, { size: 16 }),
  parameters: z.object({
    operation: z.enum(['current', 'format', 'add', 'diff']).describe('时间操作类型'),
    format: z.string().optional().describe('时间格式（用于 format 操作）'),
    amount: z.number().optional().describe('时间数量（用于 add 操作）'),
    unit: z.enum(['seconds', 'minutes', 'hours', 'days']).optional().describe('时间单位'),
    targetTime: z.string().optional().describe('目标时间（用于 diff 操作）')
  }),
  
  async execute(input: TimeToolInput, _context: NodeExecutionContext) {
    void _context;
    const now = new Date();
    
    switch (input.operation) {
      case 'current':
        return {
          operation: '获取当前时间',
          result: {
            timestamp: now.getTime(),
            iso: now.toISOString(),
            local: now.toLocaleString('zh-CN'),
            utc: now.toUTCString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        };
        
      case 'format': {
        const format = input.format || 'YYYY-MM-DD HH:mm:ss';
        // 简单的格式化实现
        const formatted = now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        return {
          operation: '格式化时间',
          result: formatted,
          format: format
        };}
        
      case 'add': {
        const amount = input.amount || 0;
        const unit: TimeAddUnit = input.unit || 'minutes';
        const multipliers: Record<TimeAddUnit, number> = {
          seconds: 1000,
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000
        };
        
        const newTime = new Date(now.getTime() + amount * multipliers[unit]);
        return {
          operation: '时间计算',
          result: {
            original: now.toLocaleString('zh-CN'),
            added: `${amount} ${unit}`,
            result: newTime.toLocaleString('zh-CN')
          }
        };}
        
      case 'diff': {
        if (!('targetTime' in input) || !input.targetTime) {
          throw new Error('需要提供目标时间');
        }
        
        const targetTime = new Date(input.targetTime);
        if (isNaN(targetTime.getTime())) {
          throw new Error('无效的目标时间格式');
        }
        
        const diffMs = Math.abs(targetTime.getTime() - now.getTime());
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const diffMinutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
        
        return {
          operation: '时间差计算',
          result: {
            from: now.toLocaleString('zh-CN'),
            to: targetTime.toLocaleString('zh-CN'),
            difference: {
              totalMs: diffMs,
              days: diffDays,
              hours: diffHours,
              minutes: diffMinutes,
              formatted: `${diffDays}天 ${diffHours}小时 ${diffMinutes}分钟`
            }
          }
        };}
        
      default:
        throw new Error(`不支持的操作: ${String((input as { operation?: unknown }).operation)}`);
    }
  }
};

// 导出所有内置工具
export const BuiltinTools = {
  CalculatorTool,
  WebSearchTool,
  CodeExecutorTool,
  TextProcessorTool,
  TimeTool
};

// 获取所有内置工具的数组
export const getAllBuiltinTools = (): Tool[] => {
  return Object.values(BuiltinTools);
};
