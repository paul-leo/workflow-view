import { BaseWorkflow, type WorkflowConfig } from '../abstract/BaseWorkflow';
import { AgentNode, WebSearchTool, CalculatorTool } from '../nodes/AgentNode';
import { ConditionNode } from '../nodes/ConditionNode';

// 示例工作流：智能数据处理流程
export class ExampleWorkflow extends BaseWorkflow {
  constructor() {
    const config: WorkflowConfig = {
      id: 'example-workflow-001',
      name: 'Smart Data Processing Workflow',
      description: 'An example workflow demonstrating AI agent integration with tools and conditional logic',
      version: '1.0.0',
      tags: ['example', 'ai', 'data-processing'],
      settings: {
        maxConcurrency: 3,
        timeout: 300000 // 5 minutes
      }
    };

    super(config);
    this.setupWorkflow();
  }

  private setupWorkflow(): void {
    // 1. 创建AI Agent节点
    const aiAgent = new AgentNode('ai-agent-001', {
      systemPrompt: `You are a data analysis assistant. Your job is to:
1. Analyze incoming data requests
2. Use available tools to gather information
3. Process and summarize findings
4. Provide actionable insights`,
      temperature: 0.3,
      maxTokens: 1500,
      enableTools: true
    });

    // 为Agent添加工具
    aiAgent.addTool(new WebSearchTool());
    aiAgent.addTool(new CalculatorTool());

    // 2. 创建条件节点 - 检查数据质量
    const dataQualityCheck = new ConditionNode('data-quality-check', {
      conditionType: 'javascript',
      allowUnsafeEval: true
    });

    // 3. 创建另一个Agent节点用于数据清理
    const dataCleanupAgent = new AgentNode('data-cleanup-agent', {
      systemPrompt: `You are a data cleanup specialist. Your tasks:
1. Identify data quality issues
2. Suggest cleanup strategies  
3. Apply data transformations
4. Validate cleaned data`,
      temperature: 0.1,
      maxTokens: 1000,
      enableTools: true
    });

    dataCleanupAgent.addTool(new CalculatorTool());

    // 4. 创建最终处理Agent
    const finalProcessingAgent = new AgentNode('final-processing-agent', {
      systemPrompt: `You are a data reporting specialist. Your job:
1. Generate comprehensive reports
2. Create visualizations recommendations
3. Provide executive summaries
4. Suggest next actions`,
      temperature: 0.2,
      maxTokens: 2000,
      enableTools: true
    });

    finalProcessingAgent.addTool(new WebSearchTool());
    finalProcessingAgent.addTool(new CalculatorTool());

    // 添加节点到工作流
    this.addNode(aiAgent);
    this.addNode(dataQualityCheck);
    this.addNode(dataCleanupAgent);
    this.addNode(finalProcessingAgent);

    // 建立连接
    this.addConnection({
      id: 'conn-001',
      sourceNodeId: 'ai-agent-001',
      sourcePortId: 'response',
      targetNodeId: 'data-quality-check',
      targetPortId: 'value',
      type: 'data'
    });

    this.addConnection({
      id: 'conn-002',
      sourceNodeId: 'data-quality-check',
      sourcePortId: 'value',
      targetNodeId: 'data-cleanup-agent',
      targetPortId: 'message',
      type: 'data',
      condition: 'result === false' // 只有在数据质量不佳时才进入清理流程
    });

    this.addConnection({
      id: 'conn-003',
      sourceNodeId: 'data-cleanup-agent',
      sourcePortId: 'response',
      targetNodeId: 'final-processing-agent',
      targetPortId: 'message',
      type: 'data'
    });

    this.addConnection({
      id: 'conn-004',
      sourceNodeId: 'data-quality-check',
      sourcePortId: 'value',
      targetNodeId: 'final-processing-agent',
      targetPortId: 'message',
      type: 'data',
      condition: 'result === true' // 数据质量良好时直接进入最终处理
    });
  }

  // 重写错误处理策略
  protected shouldStopOnError(nodeId: string, error: Error): boolean {
    // 对于某些节点，我们可能希望继续执行
    const nonCriticalNodes = ['data-cleanup-agent'];
    
    if (nonCriticalNodes.includes(nodeId)) {
      console.warn(`Non-critical node ${nodeId} failed, continuing workflow:`, error.message);
      return false;
    }
    
    return true; // 其他节点出错时停止工作流
  }

  // 创建示例输入数据
  public static createSampleInput(): Record<string, any> {
    return {
      'ai-agent-001': {
        message: 'Please analyze this sales data and provide insights: {"sales": [100, 150, 200, 180, 220], "regions": ["North", "South", "East", "West", "Central"], "quarters": ["Q1", "Q2", "Q3", "Q4", "Q1"]}',
        context: {
          businessType: 'retail',
          analysisType: 'sales_performance',
          timeframe: 'quarterly'
        },
        tools: ['web_search', 'calculator'],
        model: 'gpt-4'
      },
      'data-quality-check': {
        condition: 'value.includes("error") || value.includes("invalid") || value.length < 50'
      }
    };
  }

  // 演示工作流执行
  public async runExample(): Promise<void> {
    console.log('🚀 Starting Example Workflow Execution...\n');
    
    try {
      const sampleInput = ExampleWorkflow.createSampleInput();
      
      const result = await this.execute({
        variables: sampleInput,
        maxConcurrency: 2,
        debugMode: true
      });

      console.log('📊 Workflow Execution Results:');
      console.log('Status:', result.status);
      console.log('Execution Time:', result.endTime!.getTime() - result.startTime.getTime(), 'ms');
      console.log('Nodes Executed:', result.results.size);
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        result.errors.forEach(error => {
          console.log(`- ${error.nodeId}: ${error.error.message}`);
        });
      }

      console.log('\n📋 Node Results:');
      for (const [nodeId, nodeResult] of result.results) {
        console.log(`\n${nodeId}:`);
        console.log('  Success:', nodeResult.success);
        if (nodeResult.data) {
          console.log('  Output Keys:', Object.keys(nodeResult.data));
        }
        if (nodeResult.error) {
          console.log('  Error:', nodeResult.error.message);
        }
      }

    } catch (error) {
      console.error('💥 Workflow execution failed:', error);
    }
  }
}

// 工厂函数：创建不同类型的示例工作流
export class WorkflowFactory {
  // 创建简单的线性工作流
  public static createLinearWorkflow(): BaseWorkflow {
    const workflow = new BaseWorkflow({
      id: 'linear-workflow',
      name: 'Simple Linear Workflow',
      description: 'A basic linear processing workflow',
      version: '1.0.0'
    });

    const agent1 = new AgentNode('agent-1', {
      systemPrompt: 'You are a data preprocessor. Clean and prepare the input data.'
    });

    const agent2 = new AgentNode('agent-2', {
      systemPrompt: 'You are a data analyzer. Analyze the preprocessed data and extract insights.'
    });

    const agent3 = new AgentNode('agent-3', {
      systemPrompt: 'You are a report generator. Create a comprehensive report from the analysis.'
    });

    workflow.addNode(agent1);
    workflow.addNode(agent2);
    workflow.addNode(agent3);

    workflow.addConnection({
      id: 'linear-conn-1',
      sourceNodeId: 'agent-1',
      sourcePortId: 'response',
      targetNodeId: 'agent-2',
      targetPortId: 'message',
      type: 'data'
    });

    workflow.addConnection({
      id: 'linear-conn-2',
      sourceNodeId: 'agent-2',
      sourcePortId: 'response',
      targetNodeId: 'agent-3',
      targetPortId: 'message',
      type: 'data'
    });

    return workflow;
  }

  // 创建并行处理工作流
  public static createParallelWorkflow(): BaseWorkflow {
    const workflow = new BaseWorkflow({
      id: 'parallel-workflow',
      name: 'Parallel Processing Workflow',
      description: 'A workflow with parallel processing branches',
      version: '1.0.0'
    });

    const dispatcher = new AgentNode('dispatcher', {
      systemPrompt: 'You are a task dispatcher. Split the input into parallel tasks.'
    });

    const processor1 = new AgentNode('processor-1', {
      systemPrompt: 'You are processor #1. Handle numerical analysis tasks.'
    });

    const processor2 = new AgentNode('processor-2', {
      systemPrompt: 'You are processor #2. Handle text analysis tasks.'
    });

    const aggregator = new AgentNode('aggregator', {
      systemPrompt: 'You are an aggregator. Combine results from parallel processors.'
    });

    workflow.addNode(dispatcher);
    workflow.addNode(processor1);
    workflow.addNode(processor2);
    workflow.addNode(aggregator);

    // 分发连接
    workflow.addConnection({
      id: 'dispatch-1',
      sourceNodeId: 'dispatcher',
      sourcePortId: 'response',
      targetNodeId: 'processor-1',
      targetPortId: 'message',
      type: 'data'
    });

    workflow.addConnection({
      id: 'dispatch-2',
      sourceNodeId: 'dispatcher',
      sourcePortId: 'response',
      targetNodeId: 'processor-2',
      targetPortId: 'message',
      type: 'data'
    });

    // 聚合连接
    workflow.addConnection({
      id: 'aggregate-1',
      sourceNodeId: 'processor-1',
      sourcePortId: 'response',
      targetNodeId: 'aggregator',
      targetPortId: 'message',
      type: 'data'
    });

    workflow.addConnection({
      id: 'aggregate-2',
      sourceNodeId: 'processor-2',
      sourcePortId: 'response',
      targetNodeId: 'aggregator',
      targetPortId: 'context',
      type: 'data'
    });

    return workflow;
  }

  // 创建条件分支工作流
  public static createConditionalWorkflow(): BaseWorkflow {
    const workflow = new BaseWorkflow({
      id: 'conditional-workflow',
      name: 'Conditional Branch Workflow',
      description: 'A workflow with conditional branching logic',
      version: '1.0.0'
    });

    const analyzer = new AgentNode('analyzer', {
      systemPrompt: 'Analyze the input and determine the processing path needed.'
    });

    const condition = new ConditionNode('branch-condition', {
      conditionType: 'javascript',
      allowUnsafeEval: true
    });

    const pathA = new AgentNode('path-a-processor', {
      systemPrompt: 'Handle path A processing - complex analysis required.'
    });

    const pathB = new AgentNode('path-b-processor', {
      systemPrompt: 'Handle path B processing - simple processing sufficient.'
    });

    workflow.addNode(analyzer);
    workflow.addNode(condition);
    workflow.addNode(pathA);
    workflow.addNode(pathB);

    workflow.addConnection({
      id: 'analyze-to-condition',
      sourceNodeId: 'analyzer',
      sourcePortId: 'response',
      targetNodeId: 'branch-condition',
      targetPortId: 'value',
      type: 'data'
    });

    workflow.addConnection({
      id: 'condition-to-path-a',
      sourceNodeId: 'branch-condition',
      sourcePortId: 'value',
      targetNodeId: 'path-a-processor',
      targetPortId: 'message',
      type: 'data',
      condition: 'result === true'
    });

    workflow.addConnection({
      id: 'condition-to-path-b',
      sourceNodeId: 'branch-condition',
      sourcePortId: 'value',
      targetNodeId: 'path-b-processor',
      targetPortId: 'message',
      type: 'data',
      condition: 'result === false'
    });

    return workflow;
  }
}
