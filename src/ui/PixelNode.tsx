import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Define proper types for node data
interface PixelNodeData {
  label: string;
  type?: 'control' | 'action' | 'default' | 'input' | 'output';
  narrative?: string;
  lineNumber?: number;
}

const PixelNode: React.FC<NodeProps<PixelNodeData>> = ({ data }) => {
  // Default theme (Data/Variables)
  let borderColor = '#60a5fa'; // Blue
  let icon = '📦';
  let bgColor = '#1e3a8a'; // Dark Blue background
  let label = data.label || 'Node';

  // Dynamic theme switcher based on node type
  if (data.type === 'control') { 
    // IF/WHILE (Logic)
    borderColor = '#facc15'; // Yellow
    icon = '⚔️'; 
    bgColor = '#422006'; // Dark Brown/Gold
  } 
  else if (data.type === 'action') { 
    // UPDATES like x-- (The "Impact" Nodes)
    borderColor = '#f97316'; // Orange
    icon = '⚡';
    bgColor = '#431407'; // Dark Red/Orange
  }
  else if (label === 'START') {
    borderColor = '#10b981'; // Green
    icon = '🚩';
    bgColor = '#064e3b';
  }
  else if (label === 'END') {
    borderColor = '#ef4444'; // Red
    icon = '🏁';
    bgColor = '#7f1d1d';
  }

  return (
    <div 
      className="hover-lift" 
      style={{
        background: bgColor,
        border: `4px solid ${borderColor}`,
        boxShadow: '6px 6px 0px rgba(0,0,0,0.5)',
        padding: '12px',
        minWidth: '180px',
        maxWidth: '220px',
        borderRadius: '0px',
        position: 'relative',
        transition: 'all 0.2s',
        fontFamily: "'Press Start 2P', cursive",
        cursor: 'pointer'
      }}
    >
      {/* Top Connector */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          background: borderColor, 
          width: '12px', 
          height: '12px', 
          borderRadius: 0, 
          top: '-8px',
          border: '2px solid #000'
        }} 
      />
      
      {/* Header Icon */}
      <div style={{ 
        position: 'absolute', 
        top: '-15px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        background: borderColor, 
        padding: '2px 6px',
        border: '2px solid #000',
        fontSize: '1rem',
        zIndex: 10,
        lineHeight: 1
      }}>
        {icon}
      </div>

      {/* Content Text */}
      <div style={{ 
        marginTop: '10px',
        fontSize: '0.65rem', 
        color: '#fff', 
        textAlign: 'center',
        lineHeight: '1.5',
        textShadow: '2px 2px #000',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}>
        {label}
      </div>
      
      {/* Bottom Connector */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          background: borderColor, 
          width: '12px', 
          height: '12px', 
          borderRadius: 0, 
          bottom: '-8px',
          border: '2px solid #000'
        }} 
      />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(PixelNode);