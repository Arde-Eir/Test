import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    Node, 
    Edge, 
    useNodesState, 
    useEdgesState,
    Position 
} from 'reactflow';
import * as dagre from 'dagre'; 
import 'reactflow/dist/style.css'; 
// @ts-ignore
import { generateCFG } from '../analysis/CFG'; 

type LayoutedElements = {
    nodes: Node[];
    edges: Edge[];
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]): LayoutedElements => {
    if (nodes.length === 0) return { nodes, edges };
    
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 150, height: 50 });
    });
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPos = dagreGraph.node(node.id);
        
        return {
            ...node,
            position: { x: nodeWithPos.x, y: nodeWithPos.y },
            targetPosition: Position.Top,     
            sourcePosition: Position.Bottom, 
        };
    });

    return { nodes: layoutedNodes, edges };
};

export const Visualizer = ({ ast, onNodeHover }: { ast: any, onNodeHover?: (loc: any) => void }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [explanation, setExplanation] = useState<string | null>(null);

    useEffect(() => {
        if(!ast) return;
        try {
            const rawCFG = generateCFG(ast); 
            
            const rfNodes: Node[] = rawCFG.nodes.map((n: any) => ({ 
                 id: n.id, 
                 data: { label: n.label }, 
                 position: { x: 0, y: 0 },
                 style: { background: '#1f2335', color: '#fff', border: '1px solid #777', padding: '10px' }
            }));
            
            const rfEdges: Edge[] = rawCFG.edges.map((e: any) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                label: e.label,
                animated: true,
                style: { stroke: '#565f89' }
            }));
            
            const layout = getLayoutedElements(rfNodes, rfEdges);
            setNodes(layout.nodes);
            setEdges(layout.edges);

        } catch (error) {
            console.error("Visualizer Error:", error);
        }
    }, [ast]);

    // FIX: Renamed 'event' to '_' to ignore it safely
    const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
        setExplanation(node.data.label);
        if (onNodeHover) {
            onNodeHover(node.data); 
        }
    }, [onNodeHover]);

    const onNodeMouseLeave = useCallback(() => {
        setExplanation(null);
    }, []);

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeMouseEnter={onNodeMouseEnter}
                onNodeMouseLeave={onNodeMouseLeave}
                fitView
            >
                <Background color="#555" gap={16} />
                <Controls />
            </ReactFlow>
            <div style={{
                position: 'absolute', bottom: 10, left: 10, right: 10,
                background: 'rgba(0,0,0,0.8)', color: '#73daca', padding: '10px',
                borderRadius: '5px', display: explanation ? 'block' : 'none'
            }}>
                {explanation}
            </div>
        </div>
    );
};