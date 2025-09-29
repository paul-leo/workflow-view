import { BaseWorkflow } from '../abstract/BaseWorkflow';
import { AgentNode } from '../nodes/AgentNode';
import { CodeNode } from '../nodes/CodeNode';
import { ConditionNode } from '../nodes/ConditionNode';

// 演示编辑时设定 vs 运行时输入的区别
export function demonstrateSettingsVsInputs() {
  console.log('🔧 === 编辑时设定 vs 运行时输入演示 ===\n');

  // 1. 创建节点时的编辑设定
  console.log('📝 编辑时设定（节点创建时配置）:');
  
  const agentNode = new AgentNode('my-agent', {
    // 这些是编辑时的内置设定 - 保存在节点配置中
    systemPrompt: '你是一个专业的数据分析师，请分析用户提供的数据',
    model: 'gpt-4'
  });
  
  const codeNode = new CodeNode('my-code', {
    // 编辑时设定 - 用户在编辑器中写的代码
    code: `
      // 这段代码是编辑时写好的
      const processed = {
        originalData: inputs.data,
        processedAt: new Date().toISOString(),
        dataType: typeof inputs.data
      };
      return processed;
    `
  });

  const conditionNode = new ConditionNode('my-condition', {
    // 编辑时设定 - 选择条件类型
    conditionType: 'javascript'
  });

  console.log('Agent节点设定:', {
    systemPrompt: agentNode.settings.systemPrompt,
    model: agentNode.settings.model
  });

  console.log('Code节点设定:', {
    codeLength: codeNode.settings.code.length,
    codePreview: codeNode.settings.code.substring(0, 50) + '...'
  });

  console.log('Condition节点设定:', {
    conditionType: conditionNode.settings.conditionType
  });

  // 2. 运行时输入示例
  console.log('\n⚡ 运行时输入（执行时传入的数据）:');
  
  // 模拟运行时输入数据
  const runtimeInputsForAgent = {
    message: '请分析这组销售数据：[100, 200, 150, 300, 250]',
    context: { 
      userId: '12345', 
      requestTime: new Date().toISOString() 
    }
  };

  const runtimeInputsForCode = {
    data: { sales: [100, 200, 150], region: 'North' }
  };

  const runtimeInputsForCondition = {
    value: { score: 85, status: 'active' },
    condition: 'value.score > 80 && value.status === "active"'
  };

  console.log('Agent运行时输入:', runtimeInputsForAgent);
  console.log('Code运行时输入:', runtimeInputsForCode);
  console.log('Condition运行时输入:', runtimeInputsForCondition);

  // 3. 在执行中的使用方式
  console.log('\n🔄 执行时的使用方式:');
  console.log(`
  在节点的 execute 方法中：
  
  public async execute(inputs: TInput, context: NodeExecutionContext) {
    // ✅ 使用编辑时设定
    const systemPrompt = this.settings.systemPrompt;  // 来自编辑时配置
    const model = this.settings.model;                // 来自编辑时配置
    
    // ✅ 使用运行时输入
    const userMessage = inputs.message;               // 来自上游节点或用户输入
    const contextData = inputs.context;               // 来自上游节点传递
    
    // 结合使用
    const response = await callLLM({
      model: model,           // 编辑时设定
      systemPrompt: systemPrompt,  // 编辑时设定
      userMessage: userMessage     // 运行时输入
    });
  }
  `);

  // 4. 实际工作流中的数据流
  console.log('\n🌊 工作流中的数据流示例:');
  
  const workflow = new BaseWorkflow({
    id: 'demo-workflow',
    name: '设定vs输入演示工作流'
  });

  workflow.addNode(codeNode);
  workflow.addNode(agentNode);
  
  workflow.addConnection({
    id: 'code-to-agent',
    sourceNodeId: 'my-code',
    targetNodeId: 'my-agent'
  });

  console.log(`
  数据流向：
  1. CodeNode 执行：
     - 使用编辑时设定：code = "${codeNode.settings.code.substring(0, 30)}..."
     - 接收运行时输入：data = 来自上游节点
     - 输出：processed data
  
  2. AgentNode 执行：
     - 使用编辑时设定：systemPrompt = "${agentNode.settings.systemPrompt}"
     - 使用编辑时设定：model = "${agentNode.settings.model}"
     - 接收运行时输入：message = CodeNode的输出数据
  `);

  return { workflow, agentNode, codeNode, conditionNode };
}

// 演示如何在编辑器UI中体现这种区别
export function demonstrateEditorUI() {
  console.log('\n🎨 === 编辑器UI中的体现 ===');
  
  console.log(`
  在可视化编辑器中：

  📝 节点属性面板（编辑时设定）：
  ┌─────────────────────────────┐
  │ Agent节点 - 属性设置         │
  ├─────────────────────────────┤
  │ System Prompt: [文本框]      │
  │ Model: [下拉选择框]          │
  │ Temperature: [数字输入]      │
  └─────────────────────────────┘

  🔌 节点连接端口（运行时输入）：
  ┌─────────────────────────────┐
  │        Agent节点             │
  │                             │
  │ ● message   (输入端口)       │
  │ ● context   (输入端口)       │
  │                             │
  │ response ●  (输出端口)       │
  │ metadata ●  (输出端口)       │
  └─────────────────────────────┘

  区别：
  - 属性面板的设置 → 保存在 settings 中
  - 连接端口的数据 → 通过 inputs 参数传入
  `);
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateSettingsVsInputs();
  demonstrateEditorUI();
}
