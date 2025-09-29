/**
 * 演示文件：展示如何使用工作流抽象类系统
 * 
 * 这个文件演示了：
 * 1. 如何创建自定义节点
 * 2. 如何构建工作流
 * 3. 如何执行工作流
 * 4. 运行时类型验证
 * 5. 错误处理
 */

import { ExampleWorkflow, WorkflowFactory } from './examples/ExampleWorkflow';
import { AgentNode, WebSearchTool, CalculatorTool } from './nodes/AgentNode';
import { ConditionNode } from './nodes/ConditionNode';
import { BaseWorkflow } from './abstract/BaseWorkflow';
import { createRuntimeSchema, isValidData, safeValidateData } from './abstract/BaseNode';
import { z } from 'zod';

// 演示函数：基本工作流创建和执行
async function demonstrateBasicWorkflow() {
  console.log('\n🔧 === 基本工作流演示 ===');
  
  try {
    // 创建一个简单的工作流
    const workflow = WorkflowFactory.createLinearWorkflow();
    
    console.log('📋 工作流信息:');
    const info = workflow.getWorkflowInfo();
    console.log(`- ID: ${info.config.id}`);
    console.log(`- 名称: ${info.config.name}`);
    console.log(`- 节点数量: ${info.nodeCount}`);
    console.log(`- 连接数量: ${info.connectionCount}`);
    
    // 验证工作流
    workflow.validate();
    console.log('✅ 工作流验证通过');
    
    // 获取执行顺序
    const executionOrder = workflow.getExecutionOrder();
    console.log('🔄 执行顺序:', executionOrder);
    
  } catch (error) {
    console.error('❌ 基本工作流演示失败:', error);
  }
}

// 演示函数：类型安全和验证
async function demonstrateTypeSafety() {
  console.log('\n🛡️ === 类型安全演示 ===');
  
  try {
    // 创建一个Agent节点
    const agent = new AgentNode('demo-agent', {
      systemPrompt: '你是一个演示助手',
      temperature: 0.5
    });
    
    console.log('📊 节点信息:');
    const nodeInfo = agent.getNodeInfo();
    console.log(`- 节点ID: ${nodeInfo.config.id}`);
    console.log(`- 输入端口数量: ${nodeInfo.inputPorts.length}`);
    console.log(`- 输出端口数量: ${nodeInfo.outputPorts.length}`);
    
    // 演示输入验证
    console.log('\n🔍 输入验证演示:');
    
    // 正确的输入
    const validInput = {
      message: 'Hello, world!',
      context: { user: 'demo' },
      tools: ['calculator'],
      model: 'gpt-4'
    };
    
    try {
      const validatedInput = agent.validateInputs(validInput);
      console.log('✅ 有效输入验证通过:', Object.keys(validatedInput));
    } catch (error) {
      console.log('⚠️ 输入验证遇到问题（可能需要LLM提供者）:', (error as Error).message);
    }
    
    // 错误的输入（缺少必需字段）
    try {
      const invalidInput = {
        context: { user: 'demo' }
        // 缺少必需的 message 字段
      };
      
      agent.validateInputs(invalidInput);
    } catch (error) {
      console.log('❌ 无效输入被正确拒绝:', (error as Error).message);
    }
    
    // 演示新的便利函数
    console.log('\n🆕 新的验证API演示:');
    
    // 创建一个简单的schema
    const userSchema = createRuntimeSchema(z.object({
      name: z.string(),
      age: z.number().min(0),
      email: z.string().email()
    }));
    
    const testData1 = { name: 'John', age: 25, email: 'john@example.com' };
    const testData2 = { name: 'Jane', age: -5, email: 'invalid-email' };
    
    // 使用 isValidData 检查有效性
    console.log(`数据1有效性: ${isValidData(userSchema, testData1) ? '✅' : '❌'}`);
    console.log(`数据2有效性: ${isValidData(userSchema, testData2) ? '✅' : '❌'}`);
    
    // 使用 safeValidateData 安全验证
    const result1 = safeValidateData(userSchema, testData1);
    const result2 = safeValidateData(userSchema, testData2);
    
    if (result1.success) {
      console.log('✅ 数据1验证成功:', result1.data.name);
    }
    
    if (!result2.success) {
      console.log('❌ 数据2验证失败:', result2.error.issues.length, '个错误');
    }
    
  } catch (error) {
    console.error('❌ 类型安全演示失败:', error);
  }
}

// 演示函数：条件节点和分支逻辑
async function demonstrateConditionalLogic() {
  console.log('\n🔀 === 条件逻辑演示 ===');
  
  try {
    // 创建条件节点
    const condition = new ConditionNode('demo-condition', {
      conditionType: 'javascript',
      allowUnsafeEval: true
    });
    
    // 测试不同类型的条件
    const testCases = [
      {
        value: { score: 85, status: 'active' },
        condition: 'value.score > 80 && value.status === "active"',
        expected: true
      },
      {
        value: { items: [1, 2, 3, 4, 5] },
        condition: 'value.items.length >= 5',
        expected: true
      },
      {
        value: { name: 'John Doe', age: 25 },
        condition: 'value.age < 18',
        expected: false
      }
    ];
    
    console.log('🧪 条件测试结果:');
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const isValid = condition.validateCondition(testCase.condition);
      console.log(`测试 ${i + 1}:`);
      console.log(`  条件: ${testCase.condition}`);
      console.log(`  验证通过: ${isValid ? '✅' : '❌'}`);
      console.log(`  预期结果: ${testCase.expected}`);
    }
    
    // 获取条件示例
    const examples = condition.getConditionExamples();
    console.log('\n📝 条件表达式示例:');
    Object.entries(examples).forEach(([type, exampleList]) => {
      console.log(`${type}:`);
      exampleList.forEach(example => console.log(`  - ${example}`));
    });
    
  } catch (error) {
    console.error('❌ 条件逻辑演示失败:', error);
  }
}

// 演示函数：工具系统
async function demonstrateToolSystem() {
  console.log('\n🛠️ === 工具系统演示 ===');
  
  try {
    // 创建Agent并添加工具
    const agent = new AgentNode('tool-demo-agent');
    
    const webSearchTool = new WebSearchTool();
    const calculatorTool = new CalculatorTool();
    
    agent.addTool(webSearchTool);
    agent.addTool(calculatorTool);
    
    console.log('🔧 已添加工具:');
    const toolsInfo = agent.getToolsInfo();
    toolsInfo.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    
    // 演示工具验证
    agent.validateTools();
    console.log('✅ 工具配置验证通过');
    
    // 演示工具执行（模拟）
    console.log('\n⚡ 工具执行演示:');
    
    const mockContext = {
      workflowId: 'demo-workflow',
      nodeId: 'tool-demo-agent',
      executionId: 'demo-exec-001',
      previousResults: new Map(),
      metadata: {}
    };
    
    // 执行计算器工具
    const calcResult = await calculatorTool.execute(
      { expression: '2 + 3 * 4' },
      mockContext
    );
    console.log('🧮 计算器结果:', calcResult);
    
    // 执行搜索工具
    const searchResult = await webSearchTool.execute(
      { query: 'TypeScript workflow engine', limit: 3 },
      mockContext
    );
    console.log('🔍 搜索结果:', searchResult);
    
  } catch (error) {
    console.error('❌ 工具系统演示失败:', error);
  }
}

// 演示函数：完整工作流执行
async function demonstrateFullWorkflowExecution() {
  console.log('\n🚀 === 完整工作流执行演示 ===');
  
  try {
    // 创建示例工作流
    const workflow = new ExampleWorkflow();
    
    console.log('📋 工作流配置:');
    const info = workflow.getWorkflowInfo();
    console.log(`- 工作流ID: ${info.config.id}`);
    console.log(`- 节点数量: ${info.nodeCount}`);
    console.log(`- 连接数量: ${info.connectionCount}`);
    
    // 显示节点信息
    console.log('\n📦 节点列表:');
    info.nodes.forEach(node => {
      console.log(`- ${node.config.id} (${node.config.type}): ${node.config.name}`);
    });
    
    // 显示连接信息
    console.log('\n🔗 连接列表:');
    info.connections.forEach(conn => {
      console.log(`- ${conn.sourceNodeId}.${conn.sourcePortId} → ${conn.targetNodeId}.${conn.targetPortId}`);
    });
    
    console.log('\n⏳ 注意：实际执行需要LLM提供者配置，这里仅演示结构');
    
  } catch (error) {
    console.error('❌ 完整工作流执行演示失败:', error);
  }
}

// 演示函数：错误处理和恢复
async function demonstrateErrorHandling() {
  console.log('\n🚨 === 错误处理演示 ===');
  
  try {
    // 创建工作流
    const workflow = new BaseWorkflow({
      id: 'error-demo-workflow',
      name: 'Error Handling Demo',
      description: 'Demonstrates error handling capabilities',
      version: '1.0.0'
    });
    
    // 添加一个会出错的节点
    const faultyAgent = new AgentNode('faulty-agent', {
      systemPrompt: 'This is a demo agent that will fail'
    });
    
    workflow.addNode(faultyAgent);
    
    console.log('🧪 测试无效连接:');
    try {
      // 尝试创建无效连接
      workflow.addConnection({
        id: 'invalid-conn',
        sourceNodeId: 'non-existent-node',
        sourcePortId: 'output',
        targetNodeId: 'faulty-agent',
        targetPortId: 'message',
        type: 'data'
      });
    } catch (error) {
      console.log('❌ 无效连接被正确拒绝:', (error as Error).message);
    }
    
    console.log('\n🧪 测试循环依赖检测:');
    try {
      const agent1 = new AgentNode('agent-1');
      const agent2 = new AgentNode('agent-2');
      
      workflow.addNode(agent1);
      workflow.addNode(agent2);
      
      // 创建正常连接
      workflow.addConnection({
        id: 'conn-1',
        sourceNodeId: 'agent-1',
        sourcePortId: 'response',
        targetNodeId: 'agent-2',
        targetPortId: 'message',
        type: 'data'
      });
      
      // 尝试创建会形成循环的连接
      workflow.addConnection({
        id: 'conn-2',
        sourceNodeId: 'agent-2',
        sourcePortId: 'response',
        targetNodeId: 'agent-1',
        targetPortId: 'message',
        type: 'data'
      });
      
    } catch (error) {
      console.log('❌ 循环依赖被正确检测:', (error as Error).message);
    }
    
  } catch (error) {
    console.error('❌ 错误处理演示失败:', error);
  }
}

// 主演示函数
export async function runAllDemonstrations() {
  console.log('🎭 === n8n风格工作流系统演示 ===');
  console.log('这个演示展示了抽象类系统的各种功能\n');
  
  await demonstrateBasicWorkflow();
  await demonstrateTypeSafety();
  await demonstrateConditionalLogic();
  await demonstrateToolSystem();
  await demonstrateFullWorkflowExecution();
  await demonstrateErrorHandling();
  
  console.log('\n🎉 === 演示完成 ===');
  console.log('所有功能演示已完成！');
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemonstrations().catch(console.error);
}

// 导出演示函数供其他地方使用
export {
  demonstrateBasicWorkflow,
  demonstrateTypeSafety,
  demonstrateConditionalLogic,
  demonstrateToolSystem,
  demonstrateFullWorkflowExecution,
  demonstrateErrorHandling
};
