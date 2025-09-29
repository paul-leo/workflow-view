import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';

// HTTP请求节点的输入类型
export interface HttpRequestInput extends Record<string, unknown> {
  // HTTP节点的输入主要是来自上游节点的数据，用于请求体或查询参数
  data?: unknown;
  params?: Record<string, unknown>;
}

// HTTP请求节点的输出类型
export interface HttpRequestOutput extends Record<string, unknown> {
  status: number;
  data: unknown;
  success: boolean;
}

// HTTP请求节点的设置类型
export interface HttpRequestSettings extends Record<string, unknown> {
  url: string; // 请求URL，支持表达式如 {{$result.configNode.baseUrl}}/api/users
  method: string; // 请求方法：GET, POST, PUT, DELETE等
  headers?: Record<string, string>; // 请求头，支持表达式如 {"Authorization": "Bearer {{$result.authNode.token}}"}
  timeout: number; // 超时时间（毫秒）
  bodyTemplate?: string; // 请求体模板，支持表达式
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

  // 现在使用BaseNode的通用深度遍历实现，不需要自定义解析

  public async execute(
    inputs: HttpRequestInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: NodeExecutionContext
  ): Promise<NodeExecutionResult<HttpRequestOutput>> {
    try {
      // 从设置中获取请求配置（这些设置可能已经被动态解析）
      const { url, method, headers, timeout, bodyTemplate } = this.settings;

      // 构建请求体
      let body: string | undefined;
      if (bodyTemplate) {
        // 如果有请求体模板，使用输入数据填充
        body = this.buildRequestBody(bodyTemplate, inputs);
      } else if (inputs.data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        // 如果没有模板但有数据且是写操作，直接序列化输入数据
        body = JSON.stringify(inputs.data);
      }

      // 构建完整URL（处理查询参数）
      const finalUrl = this.buildUrl(url, inputs.params);

      console.log(`HTTP ${method} request to: ${finalUrl}`);

      const response = await fetch(finalUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body,
        signal: AbortSignal.timeout(timeout)
      });

      let responseData: unknown;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      return {
        success: true,
        data: {
          status: response.status,
          data: responseData,
          success: response.ok
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // 构建请求体
  private buildRequestBody(template: string, inputs: HttpRequestInput): string {
    // 这里可以进一步处理请求体模板，比如替换占位符
    // 现在简单地将输入数据合并到模板中
    if (template === '{{$input.data}}') {
      return JSON.stringify(inputs.data);
    } else if (template === '{{$input}}') {
      return JSON.stringify(inputs);
    } else {
      // 对于更复杂的模板，可以使用表达式解析
      return template;
    }
  }

  // 构建URL（添加查询参数）
  private buildUrl(baseUrl: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }

    return url.toString();
  }
}