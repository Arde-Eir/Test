import dagre from 'dagre';
import { Node, Edge} from 'reactflow';

// Helper to sanitize IDs (ReactFlow needs string IDs)
const getId = () => `n_${Math.random().toString(36).substr(2, 9)}`;

export const generateCFG = (ast: any): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const g = new dagre.graphlib.Graph();
    
    // Configure Layout Direction (Top-to-Bottom)
    g.setGraph({ rankdir: 'TB', ranksep: 50, nodesep: 50 });
    g.setDefaultEdgeLabel(() => ({}));

    // --- 1. Graph Building Logic ---
    const createNode = (label: string, type: string = 'default') => {
        const id = getId();
        // Width/Height needed for Dagre calculations
        g.setNode(id, { label, width: 150, height: 50 });
        nodes.push({
            id,
            type, // 'input', 'default', or 'output'
            data: { label },
            position: { x: 0, y: 0 }, // Will be updated by dagre later
        });
        return id;
    };

    const createEdge = (source: string, target: string, label: string = '') => {
        g.setEdge(source, target);
        edges.push({
            id: `e_${source}_${target}`,
            source,
            target,
            label,
            type: 'smoothstep', // nice curved lines
            animated: true,
        });
    };

    // Recursive Traversal
    const traverse = (node: any, parentId: string): string => {
        if (!node) return parentId;

        // Handle Block Lists (e.g., { stmts: [...] })
        if (Array.isArray(node)) {
            let currentParent = parentId;
            node.forEach(child => {
                currentParent = traverse(child, currentParent);
            });
            return currentParent;
        }

        // Determine Node Label & Type
        let label = node.type;
        let shape = 'default';

        if (node.type === 'VariableDeclaration') label = `${node.varType} ${node.name}`;
        else if (node.type === 'Assignment') label = `${node.left.name} = ...`;
        else if (node.type === 'FunctionCall') label = `Call ${node.name}()`;
        else if (node.type === 'IfStatement') { label = 'IF Check'; shape = 'diamond'; }
        else if (node.type === 'WhileStatement') { label = 'WHILE Loop'; shape = 'diamond'; }
        else if (node.type === 'ReturnStatement') { label = 'Return'; shape = 'output'; }

        // Create the Node
        const nodeId = createNode(label, shape === 'output' ? 'output' : 'default');
        
        // Connect to previous
        if (parentId) createEdge(parentId, nodeId);

        // Handle Branching Logic (If/Else)
        if (node.type === 'IfStatement') {
            const trueEnd = traverse(node.consequent, nodeId);
            
            // Visual simplification: If there's an 'else', we branch out
            if (node.alternate) {
                traverse(node.alternate, nodeId); // Just call it, don't save to 'falseEnd'
            }
            
            return trueEnd;
        }

        // Handle Loops
        if (node.type === 'WhileStatement') {
            const loopEnd = traverse(node.body, nodeId);
            // Draw line back to start (Loop)
            createEdge(loopEnd, nodeId, 'Repeat');
            return nodeId;
        }

        return nodeId;
    };

    // --- 2. Execution ---
    const startId = createNode('Start', 'input');
    
    // We mainly visualize the main() function body
    let lastNodeId = startId;
    if (ast && ast.body && ast.body.body) {
        lastNodeId = traverse(ast.body.body, startId);
    } else if (ast && ast.body) {
        // Fallback if structure is slightly different
        lastNodeId = traverse(ast.body, startId);
    }

    const endId = createNode('End', 'output');
    createEdge(lastNodeId, endId);

    // --- 3. Apply Layout (Algorithm 9) ---
    dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - (150 / 2), // Center anchor
                y: nodeWithPosition.y - (50 / 2),
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};