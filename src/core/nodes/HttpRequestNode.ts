import { BaseNode, type NodeExecutionContext, type NodeExecutionResult } from '../abstract/BaseNode';
import { PortTypes } from '../types/PortTypes';

// HTTP请求方法
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// HTTP请求节点的输入类型
export interface HttpRequestInput {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
  params?: Record<string, string>;
}

// HTTP响应数据类型
export interface HttpResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
  url: string;
}

// HTTP请求节点的输出类型
export interface HttpRequestOutput {
  response: HttpResponseData;
  success: boolean;
  error?: string;
}

// HTTP请求节点的设置类型
export interface HttpRequestSettings {
  timeout: number; // 超时时间（毫秒）
  followRedirects: boolean; // 是否跟随重定向
  validateSSL: boolean; // 是否验证SSL证书
  retryCount: number; // 重试次数
  retryDelay: number; // 重试延迟（毫秒）
  defaultHeaders: Record<string, string>; // 默认请求头
  authentication?: {
    type: 'bearer' | 'basic' | 'apikey';
    credentials: Record<string, string>;
  };
}

// HTTP请求节点实现
export class HttpRequestNode extends BaseNode<HttpRequestInput, HttpRequestOutput, HttpRequestSettings> {
  constructor(
    id: string,
    settings: Partial<HttpRequestSettings> = {}
  ) {
    super(
      {
        id,
        name: 'HTTP请求',
        type: 'http-request',
        category: 'network',
        description: '发送HTTP请求并返回响应数据',
        version: '1.0.0',
        icon: '🌐',
        color: '#06B6D4',
        tags: ['http', 'request', 'api', 'network']
      },
      {
        timeout: 30000, // 30秒
        followRedirects: true,
        validateSSL: true,
        retryCount: 0,
        retryDelay: 1000,
        defaultHeaders: {
          'User-Agent': 'WorkflowEngine/1.0'
        },
        ...settings
      }
    );
  }

  protected defineInputs(): void {
    this.addInputPort('url', {
      name: 'URL',
      type: PortTypes.STRING,
      required: true,
      description: '请求的URL地址'
    });

    this.addInputPort('method', {
      name: 'HTTP方法',
      type: PortTypes.STRING,
      required: false,
      description: 'HTTP请求方法（GET, POST, PUT, DELETE等）',
      defaultValue: 'GET'
    });

    this.addInputPort('headers', {
      name: '请求头',
      type: PortTypes.OBJECT,
      required: false,
      description: 'HTTP请求头',
      defaultValue: {}
    });

    this.addInputPort('body', {
      name: '请求体',
      type: PortTypes.ANY,
      required: false,
      description: 'HTTP请求体数据'
    });

    this.addInputPort('params', {
      name: '查询参数',
      type: PortTypes.OBJECT,
      required: false,
      description: 'URL查询参数',
      defaultValue: {}
    });
  }

  protected defineOutputs(): void {
    this.addOutputPort('response', {
      name: 'HTTP响应',
      type: PortTypes.HTTP_RESPONSE,
      required: true,
      description: '完整的HTTP响应数据'
    });

    this.addOutputPort('success', {
      name: '成功状态',
      type: PortTypes.BOOLEAN,
      required: true,
      description: '请求是否成功'
    });

    this.addOutputPort('error', {
      name: '错误信息',
      type: PortTypes.STRING,
      required: false,
      description: '请求失败时的错误信息'
    });
  }

  public async execute(
    inputs: HttpRequestInput,
    _context: NodeExecutionContext
  ): Promise<NodeExecutionResult<HttpRequestOutput>> {
    const startTime = Date.now();

    try {
      // 构建请求URL
      const url = this.buildUrl(inputs.url, inputs.params || {});
      
      // 构建请求头
      const headers = this.buildHeaders(inputs.headers || {});
      
      // 构建请求体
      const body = this.buildBody(inputs.body, headers);
      
      // 发送请求（带重试）
      const response = await this.sendRequestWithRetry({
        url,
        method: inputs.method || 'GET',
        headers,
        body
      });

      const responseTime = Date.now() - startTime;

      const output: HttpRequestOutput = {
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          responseTime,
          url
        },
        success: response.status >= 200 && response.status < 400
      };

      return {
        success: true,
        data: output,
        metadata: {
          requestTime: responseTime,
          statusCode: response.status,
          contentType: response.headers['content-type']
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        data: {
          response: {
            status: 0,
            statusText: 'Request Failed',
            headers: {},
            data: null,
            responseTime,
            url: inputs.url
          },
          success: false,
          error: error instanceof Error ? error.message : String(error)
        },
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // 构建完整URL（包含查询参数）
  private buildUrl(baseUrl: string, params: Record<string, string>): string {
    if (Object.keys(params).length === 0) return baseUrl;

    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  // 构建请求头
  private buildHeaders(inputHeaders: Record<string, string>): Record<string, string> {
    const headers = { ...this.settings.defaultHeaders, ...inputHeaders };

    // 添加认证头
    if (this.settings.authentication) {
      const auth = this.settings.authentication;
      switch (auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${auth.credentials.token}`;
          break;
        case 'basic':
          const credentials = Buffer.from(
            `${auth.credentials.username}:${auth.credentials.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
          break;
        case 'apikey':
          headers[auth.credentials.headerName || 'X-API-Key'] = auth.credentials.apiKey;
          break;
      }
    }

    return headers;
  }

  // 构建请求体
  private buildBody(
    inputBody: string | Record<string, unknown> | undefined,
    headers: Record<string, string>
  ): string | undefined {
    if (!inputBody) return undefined;

    if (typeof inputBody === 'string') {
      return inputBody;
    }

    // 自动设置Content-Type并序列化对象
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    const contentType = headers['Content-Type'] || headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      return JSON.stringify(inputBody);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      return new URLSearchParams(inputBody as Record<string, string>).toString();
    } else {
      return JSON.stringify(inputBody);
    }
  }

  // 发送HTTP请求（使用fetch）
  private async sendRequest(options: {
    url: string;
    method: HttpMethod;
    headers: Record<string, string>;
    body?: string;
  }): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.settings.timeout);

    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
        redirect: this.settings.followRedirects ? 'follow' : 'manual'
      });

      clearTimeout(timeoutId);

      // 解析响应头
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // 解析响应体
      let data: unknown;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.arrayBuffer();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data
      };

    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 带重试的请求发送
  private async sendRequestWithRetry(options: {
    url: string;
    method: HttpMethod;
    headers: Record<string, string>;
    body?: string;
  }): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
  }> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.settings.retryCount; attempt++) {
      try {
        return await this.sendRequest(options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.settings.retryCount) {
          await this.delay(this.settings.retryDelay);
        }
      }
    }

    throw lastError;
  }

  // 延迟工具函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 测试连接
  public async testConnection(url: string): Promise<boolean> {
    try {
      const response = await this.sendRequest({
        url,
        method: 'HEAD',
        headers: this.settings.defaultHeaders
      });
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }

  // 获取支持的HTTP方法
  public static getSupportedMethods(): HttpMethod[] {
    return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  }

  // 获取常用的Content-Type
  public static getCommonContentTypes(): Record<string, string> {
    return {
      json: 'application/json',
      form: 'application/x-www-form-urlencoded',
      multipart: 'multipart/form-data',
      text: 'text/plain',
      xml: 'application/xml',
      html: 'text/html'
    };
  }
}
