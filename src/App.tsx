import { useState } from 'react'
import FlowCanvas from './components/FlowCanvas'
import InputPanel from './components/InputPanel'
import type { Workflow, WorkflowNode } from './types/workflow'
import { aiAgentWorkflow, simpleTaskFlow, collapsedBlockWorkflow } from './data/modernWorkflow'
import './App.css'

function App() {
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>(aiAgentWorkflow)
  const [messages, setMessages] = useState<string[]>([])

  const handleNodeToggle = (nodeId: string) => {
    const toggleNodeInWorkflow = (nodes: WorkflowNode[]): WorkflowNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, expanded: !node.expanded }
        }
        if (node.children) {
          return { ...node, children: toggleNodeInWorkflow(node.children) }
        }
        return node
      })
    }

    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: toggleNodeInWorkflow(prev.nodes)
    }))
  }

  const handleNodeClick = (node: WorkflowNode) => {
    console.log('Node clicked:', node)
    // Add node click handling logic here
  }

  const handleSendMessage = (message: string) => {
    setMessages(prev => [...prev, message])
    
    // Command processing examples
    if (message.toLowerCase().includes('simple') || message.toLowerCase().includes('task')) {
      setCurrentWorkflow(simpleTaskFlow)
    } else if (message.toLowerCase().includes('agent') || message.toLowerCase().includes('ai')) {
      setCurrentWorkflow(aiAgentWorkflow)
    } else if (message.toLowerCase().includes('collapsed') || message.toLowerCase().includes('block')) {
      setCurrentWorkflow(collapsedBlockWorkflow)
    }
    
    console.log('Message sent:', message)
  }

  return (
    <div className="app">
      <FlowCanvas
        workflow={currentWorkflow}
        onNodeClick={handleNodeClick}
        onNodeToggle={handleNodeToggle}
      />
      <InputPanel
        onSendMessage={handleSendMessage}
        placeholder="Type commands to control workflow (e.g., 'simple', 'ai agent', 'collapsed')..."
      />
    </div>
  )
}

export default App
