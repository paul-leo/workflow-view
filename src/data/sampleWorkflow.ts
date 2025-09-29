import type { Workflow } from '../types/workflow';

export const sampleWorkflow: Workflow = {
  id: 'sample-workflow-1',
  title: 'User Registration Workflow',
  description: 'Complete user registration and verification process',
  nodes: [
    {
      id: 'start',
      title: 'Start Registration',
      type: 'trigger',
      status: 'completed',
      description: 'User clicks register button',
      position: { x: 50, y: 100 },
      width: 150,
      height: 40
    },
    {
      id: 'validate-input',
      title: '输入验证',
      type: 'task',
      status: 'completed',
      description: '验证用户输入的邮箱、密码等信息格式',
      position: { x: 300, y: 100 },
      width: 200,
      height: 80
    },
    {
      id: 'check-user-exists',
      title: '检查用户是否存在',
      type: 'condition',
      status: 'completed',
      description: '查询数据库确认邮箱是否已被注册',
      position: { x: 570, y: 100 },
      width: 220,
      height: 80
    },
    {
      id: 'user-management-block',
      title: '用户管理模块',
      type: 'block',
      status: 'running',
      description: '处理用户创建和相关操作',
      expanded: true,
      position: { x: 860, y: 50 },
      width: 240,
      height: 100,
      children: [
        {
          id: 'create-user',
          title: '创建用户账户',
          type: 'task',
          status: 'completed',
          description: '在数据库中创建新用户记录',
          position: { x: 1150, y: 30 },
          width: 200,
          height: 70
        },
        {
          id: 'generate-token',
          title: '生成验证令牌',
          type: 'task',
          status: 'completed',
          description: '生成邮箱验证用的临时令牌',
          position: { x: 1400, y: 30 },
          width: 200,
          height: 70
        },
        {
          id: 'notification-block',
          title: '通知服务',
          type: 'block',
          status: 'running',
          description: '处理各种通知发送',
          expanded: false,
          position: { x: 1150, y: 130 },
          width: 180,
          height: 80,
          children: [
            {
              id: 'send-email',
              title: '发送验证邮件',
              type: 'task',
              status: 'running',
              description: '向用户邮箱发送验证链接',
              position: { x: 1380, y: 110 },
              width: 180,
              height: 70
            },
            {
              id: 'send-sms',
              title: '发送短信通知',
              type: 'task',
              status: 'pending',
              description: '可选的短信验证功能',
              position: { x: 1380, y: 200 },
              width: 180,
              height: 70
            },
            {
              id: 'push-notification',
              title: '推送通知',
              type: 'task',
              status: 'pending',
              description: '发送App推送通知',
              position: { x: 1610, y: 155 },
              width: 160,
              height: 70
            }
          ]
        },
        {
          id: 'log-registration',
          title: '记录注册日志',
          type: 'task',
          status: 'pending',
          description: '记录用户注册行为到日志系统',
          position: { x: 1400, y: 130 },
          width: 180,
          height: 70
        }
      ]
    },
    {
      id: 'wait-verification',
      title: '等待邮箱验证',
      type: 'task',
      status: 'pending',
      description: '等待用户点击邮件中的验证链接',
      position: { x: 300, y: 250 },
      width: 200,
      height: 80
    },
    {
      id: 'verification-check',
      title: '验证状态检查',
      type: 'condition',
      status: 'pending',
      description: '检查用户是否完成了邮箱验证',
      position: { x: 570, y: 250 },
      width: 200,
      height: 80
    },
    {
      id: 'welcome-block',
      title: '欢迎流程',
      type: 'block',
      status: 'pending',
      description: '新用户欢迎和引导流程',
      expanded: false,
      position: { x: 840, y: 250 },
      width: 200,
      height: 80,
      children: [
        {
          id: 'send-welcome-email',
          title: '发送欢迎邮件',
          type: 'task',
          status: 'pending',
          description: '发送包含产品介绍的欢迎邮件',
          position: { x: 1100, y: 230 },
          width: 180,
          height: 70
        },
        {
          id: 'setup-profile',
          title: '引导完善资料',
          type: 'task',
          status: 'pending',
          description: '引导用户完善个人资料信息',
          position: { x: 1320, y: 230 },
          width: 180,
          height: 70
        },
        {
          id: 'show-tutorial',
          title: '显示使用教程',
          type: 'task',
          status: 'pending',
          description: '展示产品功能介绍和使用教程',
          position: { x: 1540, y: 230 },
          width: 180,
          height: 70
        }
      ]
    },
    {
      id: 'end',
      title: '注册完成',
      type: 'end',
      status: 'pending',
      description: '用户成功完成注册流程',
      position: { x: 1100, y: 350 },
      width: 160,
      height: 80
    }
  ],
  connections: [
    { id: 'c1', from: 'start', to: 'validate-input', type: 'default' },
    { id: 'c2', from: 'validate-input', to: 'check-user-exists', type: 'success' },
    { id: 'c3', from: 'check-user-exists', to: 'user-management-block', type: 'success' },
    { id: 'c4', from: 'user-management-block', to: 'create-user', type: 'default' },
    { id: 'c5', from: 'create-user', to: 'generate-token', type: 'success' },
    { id: 'c6', from: 'user-management-block', to: 'notification-block', type: 'default' },
    { id: 'c7', from: 'notification-block', to: 'send-email', type: 'default', animated: true },
    { id: 'c8', from: 'generate-token', to: 'log-registration', type: 'default' },
    { id: 'c9', from: 'check-user-exists', to: 'wait-verification', type: 'default' },
    { id: 'c10', from: 'wait-verification', to: 'verification-check', type: 'default' },
    { id: 'c11', from: 'verification-check', to: 'welcome-block', type: 'success' },
    { id: 'c12', from: 'welcome-block', to: 'end', type: 'success' },
    { id: 'c13', from: 'verification-check', to: 'wait-verification', type: 'error', label: '重试' }
  ]
};

export const simpleWorkflow: Workflow = {
  id: 'simple-workflow',
  title: '简单任务流程',
  description: '一个简单的三步任务流程示例',
  nodes: [
    {
      id: 'task1',
      title: '准备工作',
      type: 'task',
      status: 'completed',
      description: '收集必要的资料和工具',
      position: { x: 100, y: 150 },
      width: 200,
      height: 80,
      icon: '📋'
    },
    {
      id: 'task2',
      title: '执行任务',
      type: 'task',
      status: 'running',
      description: '按照计划执行主要任务',
      position: { x: 350, y: 150 },
      width: 200,
      height: 80,
      icon: '⚡'
    },
    {
      id: 'task3',
      title: '完成验收',
      type: 'task',
      status: 'pending',
      description: '检查任务完成质量并提交',
      position: { x: 600, y: 150 },
      width: 200,
      height: 80,
      icon: '✅'
    }
  ],
  connections: [
    { id: 'c1', from: 'task1', to: 'task2', type: 'success' },
    { id: 'c2', from: 'task2', to: 'task3', type: 'default', animated: true }
  ]
};
