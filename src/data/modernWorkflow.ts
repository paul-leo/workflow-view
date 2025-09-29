import type { Workflow } from '../types/workflow';

export const aiAgentWorkflow: Workflow = {
  id: 'ai-agent-workflow',
  title: 'AI Agent Workflow',
  description: 'Automated AI agent processing with tools and integrations',
  nodes: [
    {
      id: 'form-trigger',
      title: 'Create User Form',
      type: 'trigger',
      status: 'completed',
      position: { x: 50, y: 100 },
      width: 140,
      height: 40,
      category: 'trigger'
    },
    {
      id: 'ai-agent',
      title: 'AI Agent',
      type: 'agent',
      status: 'running',
      subtitle: 'Tools Agent',
      position: { x: 250, y: 80 },
      width: 160,
      height: 60,
      category: 'agent',
      isCollapsible: true,
      expanded: true,
      children: [
        {
          id: 'chat-model',
          title: 'Chat Model',
          type: 'tool',
          status: 'completed',
          position: { x: 450, y: 50 },
          width: 120,
          height: 40
        },
        {
          id: 'memory',
          title: 'Memory',
          type: 'tool',
          status: 'completed',
          position: { x: 450, y: 110 },
          width: 120,
          height: 40
        }
      ]
    },
    {
      id: 'condition-check',
      title: 'Is Manager?',
      type: 'condition',
      status: 'pending',
      position: { x: 600, y: 100 },
      width: 120,
      height: 40
    },
    {
      id: 'slack-invite',
      title: 'Add to Channel',
      type: 'tool',
      status: 'pending',
      subtitle: 'invite: channel',
      position: { x: 780, y: 60 },
      width: 140,
      height: 50
    },
    {
      id: 'profile-update',
      title: 'Update Profile',
      type: 'tool',
      status: 'pending',
      subtitle: 'updateProfile: user',
      position: { x: 780, y: 140 },
      width: 140,
      height: 50
    }
  ],
  connections: [
    { id: 'c1', from: 'form-trigger', to: 'ai-agent', type: 'default' },
    { id: 'c2', from: 'ai-agent', to: 'chat-model', type: 'dashed', isSubConnection: true },
    { id: 'c3', from: 'ai-agent', to: 'memory', type: 'dashed', isSubConnection: true },
    { id: 'c4', from: 'ai-agent', to: 'condition-check', type: 'default' },
    { id: 'c5', from: 'condition-check', to: 'slack-invite', type: 'success', label: 'true' },
    { id: 'c6', from: 'condition-check', to: 'profile-update', type: 'default', label: 'false' }
  ]
};

export const simpleTaskFlow: Workflow = {
  id: 'simple-task-flow',
  title: 'Simple Task Flow',
  description: 'Basic three-step task execution',
  nodes: [
    {
      id: 'prepare',
      title: 'Prepare',
      type: 'task',
      status: 'completed',
      position: { x: 100, y: 150 },
      width: 120,
      height: 40
    },
    {
      id: 'execute',
      title: 'Execute',
      type: 'task',
      status: 'running',
      position: { x: 280, y: 150 },
      width: 120,
      height: 40
    },
    {
      id: 'verify',
      title: 'Verify',
      type: 'task',
      status: 'pending',
      position: { x: 460, y: 150 },
      width: 120,
      height: 40
    }
  ],
  connections: [
    { id: 'c1', from: 'prepare', to: 'execute', type: 'success' },
    { id: 'c2', from: 'execute', to: 'verify', type: 'default', animated: true }
  ]
};

export const collapsedBlockWorkflow: Workflow = {
  id: 'collapsed-block-workflow',
  title: 'Workflow with Collapsed Blocks',
  description: 'Demonstrates collapsible block functionality',
  nodes: [
    {
      id: 'start',
      title: 'Start Process',
      type: 'trigger',
      status: 'completed',
      position: { x: 100, y: 200 },
      width: 130,
      height: 40
    },
    {
      id: 'data-processing',
      title: 'Data Processing',
      type: 'block',
      status: 'running',
      position: { x: 300, y: 200 },
      width: 140,
      height: 40,
      isCollapsible: true,
      expanded: false,
      collapsedRadius: 20,
      children: [
        {
          id: 'validate',
          title: 'Validate Data',
          type: 'task',
          status: 'completed',
          position: { x: 300, y: 120 },
          width: 120,
          height: 40
        },
        {
          id: 'transform',
          title: 'Transform',
          type: 'task',
          status: 'running',
          position: { x: 300, y: 280 },
          width: 120,
          height: 40
        }
      ]
    },
    {
      id: 'output',
      title: 'Generate Output',
      type: 'task',
      status: 'pending',
      position: { x: 500, y: 200 },
      width: 140,
      height: 40
    }
  ],
  connections: [
    { id: 'c1', from: 'start', to: 'data-processing', type: 'default' },
    { id: 'c2', from: 'data-processing', to: 'output', type: 'default' },
    // Internal connections within the block
    { id: 'c3', from: 'data-processing', to: 'validate', type: 'dashed', isSubConnection: true },
    { id: 'c4', from: 'validate', to: 'transform', type: 'success', isSubConnection: true }
  ]
};
