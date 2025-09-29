import { BaseNode } from '../abstract/BaseNode';
import { PortTypes } from '../types/PortTypes';

// 演示如何使用 PortType 来生成编辑器UI
export class UIGeneratorExample {
  
  // 根据节点生成属性编辑器配置
  static generatePropertyEditor(node: BaseNode) {
    const editorConfig = {
      nodeInfo: {
        id: node.config.id,
        name: node.config.name,
        description: node.config.description,
        icon: node.config.icon,
        color: node.config.color
      },
      inputPorts: [] as Array<{
        id: string;
        label: string;
        inputType: string;
        color: string;
        required: boolean;
        description?: string;
        defaultValue?: unknown;
      }>,
      outputPorts: [] as Array<{
        id: string;
        label: string;
        color: string;
        description?: string;
      }>
    };

    // 处理输入端口 - 生成对应的输入控件
    for (const [portId, port] of node.inputPorts) {
      const inputType = this.getInputControlType(port.type.name);
      
      editorConfig.inputPorts.push({
        id: portId,
        label: port.type.displayName,
        inputType,
        color: port.type.color || '#6B7280',
        required: port.required,
        description: port.description,
        defaultValue: port.defaultValue
      });
    }

    // 处理输出端口 - 生成端口显示
    for (const [portId, port] of node.outputPorts) {
      editorConfig.outputPorts.push({
        id: portId,
        label: port.type.displayName,
        color: port.type.color || '#6B7280',
        description: port.description
      });
    }

    return editorConfig;
  }

  // 根据端口类型决定使用什么输入控件
  private static getInputControlType(portTypeName: string): string {
    const controlMap: Record<string, string> = {
      'string': 'text-input',
      'number': 'number-input', 
      'boolean': 'checkbox',
      'object': 'json-editor',
      'array': 'array-editor',
      'code': 'code-editor',
      'html': 'html-editor',
      'json': 'json-editor',
      'file': 'file-upload',
      'any': 'generic-input'
    };

    return controlMap[portTypeName] || 'text-input';
  }

  // 生成端口连接的视觉样式
  static generatePortStyles(portType: string) {
    const typeConfig = Object.values(PortTypes).find(type => type.name === portType);
    
    return {
      backgroundColor: typeConfig?.color || '#6B7280',
      borderColor: typeConfig?.color || '#6B7280',
      tooltip: typeConfig?.description || '',
      displayName: typeConfig?.displayName || portType
    };
  }

  // 生成连接线的样式（根据数据类型）
  static generateConnectionStyle(sourceType: string, targetType: string) {
    const sourceConfig = Object.values(PortTypes).find(type => type.name === sourceType);
    const targetConfig = Object.values(PortTypes).find(type => type.name === targetType);

    // 如果类型相同，使用该类型的颜色
    if (sourceType === targetType && sourceConfig) {
      return {
        strokeColor: sourceConfig.color,
        strokeWidth: 2,
        strokeDasharray: undefined
      };
    }

    // 如果类型兼容但不同，使用渐变色或虚线
    return {
      strokeColor: '#6B7280',
      strokeWidth: 2,
      strokeDasharray: '5,5' // 虚线表示类型转换
    };
  }
}

// 使用示例
export function demonstrateUIGeneration() {
  console.log('\n🎨 === UI生成器演示 ===');

  // 假设我们有一个HTTP请求节点
  class ExampleHttpNode extends BaseNode<
    { url: string; method: string; headers: Record<string, string> },
    { response: unknown; success: boolean },
    { timeout: number }
  > {
    constructor() {
      super(
        {
          id: 'http-example',
          name: 'HTTP请求示例',
          type: 'http-request',
          category: 'network',
          description: '发送HTTP请求',
          version: '1.0.0'
        },
        { timeout: 30000 }
      );
    }

    protected defineInputs(): void {
      this.addInputPort('url', {
        name: 'URL地址',
        type: PortTypes.STRING,
        required: true,
        description: '要请求的URL'
      });

      this.addInputPort('method', {
        name: 'HTTP方法',
        type: PortTypes.STRING,
        required: false,
        description: 'GET, POST, PUT等',
        defaultValue: 'GET'
      });

      this.addInputPort('headers', {
        name: '请求头',
        type: PortTypes.OBJECT,
        required: false,
        description: 'HTTP请求头对象'
      });
    }

    protected defineOutputs(): void {
      this.addOutputPort('response', {
        name: 'HTTP响应',
        type: PortTypes.HTTP_RESPONSE,
        required: true,
        description: '服务器响应数据'
      });

      this.addOutputPort('success', {
        name: '成功状态',
        type: PortTypes.BOOLEAN,
        required: true,
        description: '请求是否成功'
      });
    }

    public async execute() {
      return { success: true, data: {} as any };
    }
  }

  const httpNode = new ExampleHttpNode();
  
  // 生成编辑器配置
  const editorConfig = UIGeneratorExample.generatePropertyEditor(httpNode);
  
  console.log('🏗️ 生成的编辑器配置:');
  console.log(JSON.stringify(editorConfig, null, 2));

  // 生成端口样式
  console.log('\n🎨 端口样式示例:');
  console.log('STRING端口:', UIGeneratorExample.generatePortStyles('string'));
  console.log('HTTP_RESPONSE端口:', UIGeneratorExample.generatePortStyles('http_response'));

  // 生成连接样式
  console.log('\n🔗 连接样式示例:');
  console.log('STRING -> STRING:', UIGeneratorExample.generateConnectionStyle('string', 'string'));
  console.log('HTTP_RESPONSE -> OBJECT:', UIGeneratorExample.generateConnectionStyle('http_response', 'object'));
}
