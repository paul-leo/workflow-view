import { BaseWorkflow } from './abstract/BaseWorkflow';
import { TimerTriggerNode } from './nodes/TimerTriggerNode';
import { HttpRequestNode } from './nodes/HttpRequestNode';
import { CodeNode } from './nodes/CodeNode';
import { AgentNode } from './nodes/AgentNode';
import { ConditionNode } from './nodes/ConditionNode';

// 简单演示
export async function simpleDemo() {
  console.log('🚀 简单工作流演示');

  // 创建工作流
  const workflow = new BaseWorkflow({
    id: 'simple-workflow',
    name: '简单演示工作流'
  });

  // 创建节点
  const timerNode = new TimerTriggerNode('timer-1', { interval: 5000 });
  const httpNode = new HttpRequestNode('http-1', { timeout: 10000 });
  const codeNode = new CodeNode('code-1', { 
    code: 'return { processed: inputs.data, timestamp: Date.now() };' 
  });
  const agentNode = new AgentNode('agent-1', {
    systemPrompt: '你是一个助手',
    model: 'gpt-4'
  });
  const conditionNode = new ConditionNode('condition-1', {
    conditionType: 'javascript'
  });

  // 添加节点到工作流
  workflow.addNode(timerNode);
  workflow.addNode(httpNode);
  workflow.addNode(codeNode);
  workflow.addNode(agentNode);
  workflow.addNode(conditionNode);

  // 添加连接
  workflow.addConnection({
    id: 'conn-1',
    sourceNodeId: 'timer-1',
    targetNodeId: 'http-1'
  });

  workflow.addConnection({
    id: 'conn-2', 
    sourceNodeId: 'http-1',
    targetNodeId: 'code-1'
  });

  workflow.addConnection({
    id: 'conn-3',
    sourceNodeId: 'code-1', 
    targetNodeId: 'condition-1'
  });

  workflow.addConnection({
    id: 'conn-4',
    sourceNodeId: 'condition-1', 
    targetNodeId: 'agent-1'
  });

  console.log('📋 工作流信息:');
  console.log(`- 节点数量: ${workflow.nodes.size}`);
  console.log(`- 连接数量: ${workflow.connections.size}`);

  // 执行工作流
  try {
    console.log('\n⚡ 开始执行工作流...');
    const results = await workflow.execute();
    
    console.log('✅ 工作流执行完成');
    console.log('📊 执行结果:');
    
    for (const [nodeId, result] of results) {
      console.log(`- ${nodeId}: ${result.success ? '成功' : '失败'}`);
      if (result.error) {
        console.log(`  错误: ${result.error.message}`);
      }
    }
  } catch (error) {
    console.error('❌ 工作流执行失败:', error);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleDemo().catch(console.error);
}
