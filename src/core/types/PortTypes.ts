import type { PortType } from '../abstract/BaseNode';

// 常用端口类型定义
export const PortTypes = {
  // 基础类型
  STRING: {
    name: 'string',
    displayName: '文本',
    color: '#10B981',
    description: '字符串类型数据'
  } as PortType,

  NUMBER: {
    name: 'number',
    displayName: '数字',
    color: '#3B82F6',
    description: '数字类型数据'
  } as PortType,

  BOOLEAN: {
    name: 'boolean',
    displayName: '布尔值',
    color: '#8B5CF6',
    description: '布尔类型数据'
  } as PortType,

  OBJECT: {
    name: 'object',
    displayName: '对象',
    color: '#F59E0B',
    description: '对象类型数据'
  } as PortType,

  ARRAY: {
    name: 'array',
    displayName: '数组',
    color: '#EF4444',
    description: '数组类型数据'
  } as PortType,

  // 特殊类型
  ANY: {
    name: 'any',
    displayName: '任意',
    color: '#6B7280',
    description: '任意类型数据'
  } as PortType,

  // 业务类型
  HTTP_RESPONSE: {
    name: 'http_response',
    displayName: 'HTTP响应',
    color: '#06B6D4',
    description: 'HTTP请求的响应数据'
  } as PortType,

  JSON: {
    name: 'json',
    displayName: 'JSON',
    color: '#F97316',
    description: 'JSON格式数据'
  } as PortType,

  HTML: {
    name: 'html',
    displayName: 'HTML',
    color: '#EC4899',
    description: 'HTML内容'
  } as PortType,

  FILE: {
    name: 'file',
    displayName: '文件',
    color: '#84CC16',
    description: '文件数据'
  } as PortType,

  // 触发器类型
  TRIGGER: {
    name: 'trigger',
    displayName: '触发器',
    color: '#DC2626',
    description: '触发执行的信号'
  } as PortType,

  // 代码执行相关
  CODE: {
    name: 'code',
    displayName: '代码',
    color: '#1F2937',
    description: '可执行的代码'
  } as PortType,

  // AI相关
  AI_MESSAGE: {
    name: 'ai_message',
    displayName: 'AI消息',
    color: '#7C3AED',
    description: 'AI对话消息'
  } as PortType,

  AI_RESPONSE: {
    name: 'ai_response',
    displayName: 'AI响应',
    color: '#9333EA',
    description: 'AI生成的响应'
  } as PortType
} as const;

// 端口类型工具函数
export const PortTypeUtils = {
  // 检查两个端口类型是否兼容
  isCompatible(sourceType: PortType, targetType: PortType): boolean {
    if (sourceType.name === targetType.name) return true;
    if (sourceType.name === 'any' || targetType.name === 'any') return true;
    
    // JSON 可以转换为 OBJECT
    if (sourceType.name === 'json' && targetType.name === 'object') return true;
    if (sourceType.name === 'object' && targetType.name === 'json') return true;
    
    // HTTP_RESPONSE 包含多种数据
    if (sourceType.name === 'http_response') {
      return ['object', 'json', 'string', 'any'].includes(targetType.name);
    }
    
    return false;
  },

  // 获取端口类型的颜色
  getColor(portType: PortType): string {
    return portType.color || '#6B7280';
  },

  // 获取所有可用的端口类型
  getAllTypes(): PortType[] {
    return Object.values(PortTypes);
  },

  // 根据名称查找端口类型
  findByName(name: string): PortType | undefined {
    return Object.values(PortTypes).find(type => type.name === name);
  }
};
