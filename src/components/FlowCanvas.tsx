import React, { useState, useRef, useCallback } from 'react';
import type { Workflow, WorkflowNode } from '../types/workflow';
import ModernFlowNode from './ModernFlowNode';
import FlowConnection, { ConnectionMarkers } from './FlowConnection';
import './FlowCanvas.css';

interface FlowCanvasProps {
  workflow: Workflow;
  onNodeClick?: (node: WorkflowNode) => void;
  onNodeToggle?: (nodeId: string) => void;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  workflow,
  onNodeClick,
  onNodeToggle
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Create a flat list of all visible nodes (including expanded children)
  const getVisibleNodes = useCallback((nodes: WorkflowNode[], parentId?: string): WorkflowNode[] => {
    const visibleNodes: WorkflowNode[] = [];
    
    nodes.forEach(node => {
      const nodeWithParent = { ...node, parentId };
      visibleNodes.push(nodeWithParent);
      
      if (node.type === 'block' && node.expanded && node.children) {
        visibleNodes.push(...getVisibleNodes(node.children, node.id));
      }
    });
    
    return visibleNodes;
  }, []);

  const visibleNodes = getVisibleNodes(workflow.nodes);

  // Find node by ID
  const findNodeById = useCallback((id: string): WorkflowNode | undefined => {
    return visibleNodes.find(node => node.id === id);
  }, [visibleNodes]);

  // Handle node click
  const handleNodeClick = useCallback((node: WorkflowNode) => {
    setSelectedNodeId(node.id);
    onNodeClick?.(node);
  }, [onNodeClick]);

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setViewBox({ x: 0, y: 0 });
  }, []);

  // Calculate canvas bounds
  const getCanvasBounds = useCallback(() => {
    if (visibleNodes.length === 0) return { width: 800, height: 600 };
    
    const maxX = Math.max(...visibleNodes.map(node => node.position.x + (node.width || 200)));
    const maxY = Math.max(...visibleNodes.map(node => node.position.y + (node.height || 80)));
    
    return {
      width: Math.max(800, maxX + 100),
      height: Math.max(600, maxY + 100)
    };
  }, [visibleNodes]);

  const canvasBounds = getCanvasBounds();

  return (
    <div className="flow-canvas">
      {/* Canvas Header */}
      <div className="flow-canvas__header">
        <div className="flow-canvas__title-section">
          <h1 className="flow-canvas__title">{workflow.title}</h1>
          {workflow.description && (
            <p className="flow-canvas__description">{workflow.description}</p>
          )}
        </div>
        
        <div className="flow-canvas__controls">
          <button
            className="flow-canvas__control-button"
            onClick={resetView}
            title="Reset View"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={canvasRef}
        className={`flow-canvas__container ${isPanning ? 'flow-canvas__container--panning' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="flow-canvas__viewport flow-canvas__viewport--dynamic"
          style={{
            transform: `translate(${-viewBox.x}px, ${-viewBox.y}px)`,
            width: `${canvasBounds.width}px`,
            height: `${canvasBounds.height}px`
          }}
        >
          {/* Background Grid */}
          <div className="flow-canvas__grid" />
          
          {/* SVG for Connections */}
          <svg
            className="flow-canvas__connections"
            width={canvasBounds.width}
            height={canvasBounds.height}
          >
            <ConnectionMarkers />
            {workflow.connections.map(connection => {
              const fromNode = findNodeById(connection.from);
              const toNode = findNodeById(connection.to);
              
              if (!fromNode || !toNode) return null;
              
              return (
                <FlowConnection
                  key={connection.id}
                  connection={connection}
                  fromNode={fromNode}
                  toNode={toNode}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {visibleNodes.map(node => (
            <ModernFlowNode
              key={node.id}
              node={node}
              onToggle={onNodeToggle}
              onClick={handleNodeClick}
              isSelected={selectedNodeId === node.id}
            />
          ))}
        </div>
      </div>

      {/* Canvas Footer */}
      <div className="flow-canvas__footer">
        <div className="flow-canvas__stats">
          Nodes: {visibleNodes.length} | Connections: {workflow.connections.length}
        </div>
        <div className="flow-canvas__help">
          Drag to pan | Click to select nodes
        </div>
      </div>
    </div>
  );
};

export default FlowCanvas;
