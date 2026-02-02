import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Define proper types for node data
interface PixelNodeData {
  label: string;
  type?: 'control' | 'action' | 'default' | 'input' | 'output';
  narrative?: string;
  lineNumber?: number;
}

const PixelNode: React.FC<NodeProps<PixelNodeData>> = ({ data, selected }) => {
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
        border: `${selected ? '5px' : '4px'} solid ${borderColor}`,
        boxShadow: selected 
          ? '0 0 20px rgba(250, 204, 21, 0.5), 8px 8px 0px rgba(0,0,0,0.7)' 
          : '6px 6px 0px rgba(0,0,0,0.5)',
        padding: 'clamp(10px, 1.5vw, 12px)',
        minWidth: 'clamp(150px, 20vw, 180px)',
        maxWidth: 'clamp(180px, 25vw, 220px)',
        borderRadius: '0px',
        position: 'relative',
        transition: 'all 0.2s ease',
        fontFamily: "'Press Start 2P', cursive",
        cursor: 'pointer',
        transform: selected ? 'scale(1.05)' : 'scale(1)'
      }}
    >
      {/* Top Connector */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          background: borderColor, 
          width: 'clamp(10px, 1.5vw, 12px)', 
          height: 'clamp(10px, 1.5vw, 12px)', 
          borderRadius: 0, 
          top: '-6px',
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
        fontSize: 'clamp(0.9rem, 1.5vw, 1rem)',
        zIndex: 10,
        lineHeight: 1
      }}>
        {icon}
      </div>

      {/* Content Text */}
      <div style={{ 
        marginTop: '10px',
        fontSize: 'clamp(0.6rem, 1.2vw, 0.65rem)', 
        color: '#fff', 
        textAlign: 'center',
        lineHeight: '1.5',
        textShadow: '2px 2px #000',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        hyphens: 'auto'
      }}>
        {label}
      </div>

      {/* Line Number Badge */}
      {data.lineNumber && (
        <div style={{
          position: 'absolute',
          bottom: '-12px',
          right: '5px',
          background: '#1e293b',
          color: '#94a3b8',
          fontSize: 'clamp(0.5rem, 1vw, 0.55rem)',
          padding: '2px 6px',
          border: '1px solid #475569',
          borderRadius: '3px'
        }}>
          L{data.lineNumber}
        </div>
      )}
      
      {/* Bottom Connector */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          background: borderColor, 
          width: 'clamp(10px, 1.5vw, 12px)', 
          height: 'clamp(10px, 1.5vw, 12px)', 
          borderRadius: 0, 
          bottom: '-6px',
          border: '2px solid #000'
        }} 
      />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(PixelNode);