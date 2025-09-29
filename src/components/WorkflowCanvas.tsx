import React from 'react';
import type { Workflow, WorkflowNode as WorkflowNodeType } from '../types/workflow';
import WorkflowNode from './WorkflowNode';
import './WorkflowCanvas.css';

interface WorkflowCanvasProps {
  workflow: Workflow;
  onNodeClick?: (node: WorkflowNodeType) => void;
  onNodeToggle?: (nodeId: string) => void;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onNodeClick,
  onNodeToggle
}) => {
  return (
    <div className="workflow-canvas">
      <div className="workflow-canvas__header">
        <h1 className="workflow-canvas__title">{workflow.title}</h1>
        {workflow.description && (
          <p className="workflow-canvas__description">{workflow.description}</p>
        )}
      </div>

      <div className="workflow-canvas__content">
        <div className="workflow-nodes">
          {workflow.nodes.map((node) => (
            <WorkflowNode
              key={node.id}
              node={node}
              onToggle={onNodeToggle}
              onClick={onNodeClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowCanvas;
