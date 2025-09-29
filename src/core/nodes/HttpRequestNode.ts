import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';

// HTTP请求节点的输入类型
export interface HttpRequestInput extends Record<string, unknown> {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

// HTTP请求节点的输出类型
export interface HttpRequestOutput extends Record<string, unknown> {
  status: number;
  data: unknown;
  success: boolean;
}

// HTTP请求节点的设置类型
export interface HttpRequestSettings extends Record<string, unknown> {
  timeout: number; // 超时时间（毫秒）
}

// HTTP请求节点实现
export class HttpRequestNode extends BaseNode<HttpRequestInput, HttpRequestOutput, HttpRequestSettings> {
  constructor(id: string, settings: HttpRequestSettings) {
    super(
      {
        id,
        name: 'HTTP请求',
        type: 'http-request'
      },
      settings
    );
  }

  public async execute(
    inputs: HttpRequestInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: NodeExecutionContext
  ): Promise<NodeExecutionResult<HttpRequestOutput>> {
    try {
      const response = await fetch(inputs.url, {
        method: inputs.method || 'GET',
        headers: inputs.headers,
        body: inputs.body ? JSON.stringify(inputs.body) : undefined
      });

      const data = await response.json();

      const output: HttpRequestOutput = {
        status: response.status,
        data,
        success: response.ok
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