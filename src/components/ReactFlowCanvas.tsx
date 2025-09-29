import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  addEdge,
  type Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  ReactFlowProvider,
  useReactFlow,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import { type WorkflowNode as WorkflowNodeType, type Workflow } from '../types/workflow';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import './ReactFlowCanvas.css';

interface ReactFlowCanvasProps {
  workflow: Workflow;
  onNodeClick?: (node: WorkflowNodeType) => void;
  onNodeToggle?: (nodeId: string) => void;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

const ReactFlowCanvasInner: React.FC<ReactFlowCanvasProps> = ({
  workflow,
  onNodeClick,
  onNodeToggle
}) => {
  const { fitView } = useReactFlow();
  
  // Convert workflow data to React Flow format
  const convertToReactFlowNodes = useCallback((workflowNodes: WorkflowNodeType[]): Node[] => {
    const nodes: Node[] = [];
    
    const processNodes = (nodeList: WorkflowNodeType[], parentId?: string) => {
      nodeList.forEach(node => {
        // Add main node
        nodes.push({
          id: node.id,
          type: 'custom',
          position: node.position,
          data: {
            ...node,
            onToggle: onNodeToggle,
            onClick: onNodeClick,
            parentId
          },
          style: {
            width: node.width || 160,
            height: node.height || 50,
          }
        });
        
        // Add child nodes if expanded
        if (node.expanded && node.children) {
          processNodes(node.children, node.id);
        }
      });
    };
    
    processNodes(workflowNodes);
    return nodes;
  }, [onNodeClick, onNodeToggle]);

  const convertToReactFlowEdges = useCallback((connections: any[], nodes: Node[]): Edge[] => {
    const nodeIds = new Set(nodes.map(n => n.id));
    
    return connections
      .filter(conn => nodeIds.has(conn.from) && nodeIds.has(conn.to))
      .map(conn => ({
        id: conn.id,
        source: conn.from,
        target: conn.to,
        type: 'custom',
        data: {
          ...conn,
          animated: conn.animated || false,
          label: conn.label
        },
        style: {
          strokeDasharray: conn.isSubConnection ? '5,5' : 'none',
          stroke: conn.type === 'success' ? '#10b981' : 
                  conn.type === 'error' ? '#ef4444' : '#6366f1'
        },
        animated: conn.animated || false
      }));
  }, []);

  const initialNodes = useMemo(() => convertToReactFlowNodes(workflow.nodes), [workflow.nodes, convertToReactFlowNodes]);
  const initialEdges = useMemo(() => convertToReactFlowEdges(workflow.connections, initialNodes), [workflow.connections, initialNodes, convertToReactFlowEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when workflow changes
  React.useEffect(() => {
    const newNodes = convertToReactFlowNodes(workflow.nodes);
    const newEdges = convertToReactFlowEdges(workflow.connections, newNodes);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [workflow, convertToReactFlowNodes, convertToReactFlowEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );


  const centerView = useCallback(() => {
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
    }, 100);
  }, [fitView]);

  // Center view when workflow changes
  React.useEffect(() => {
    centerView();
  }, [workflow, centerView]);

  return (
    <div className="reactflow-canvas">
      <Panel position="top-left" className="workflow-info-panel">
        <h2 className="workflow-title">{workflow.title}</h2>
        {workflow.description && (
          <p className="workflow-description">{workflow.description}</p>
        )}
      </Panel>

      <Panel position="top-right" className="workflow-controls-panel">
        <button 
          onClick={centerView} 
          className="control-button"
          title="Center View"
        >
          Center
        </button>
      </Panel>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#374151"
        />
        <Controls 
          position="bottom-right"
          showZoom={false}
          showFitView={true}
          showInteractive={false}
        />
      </ReactFlow>

      <Panel position="bottom-center" className="workflow-stats-panel">
        <span>Nodes: {nodes.length}</span>
        <span>Connections: {edges.length}</span>
        <span>Drag to pan • Click nodes to interact</span>
      </Panel>
    </div>
  );
};

const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default ReactFlowCanvas;
