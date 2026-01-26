import * as dagre from 'dagre';
import { Node, Edge} from 'reactflow';

const getId = () => `n_${Math.random().toString(36).substr(2, 9)}`;

export const generateCFG = (ast: any): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', ranksep: 50 });
    g.setDefaultEdgeLabel(() => ({}));

    const createNode = (label: string, type: string = 'default') => {
        const id = getId();
        g.setNode(id, { label, width: 150, height: 50 });
        nodes.push({ id, type, data: { label }, position: { x: 0, y: 0 } });
        return id;
    };

    const createEdge = (src: string, tgt: string, label: string = '') => {
        g.setEdge(src, tgt);
        edges.push({ id: `e_${src}_${tgt}`, source: src, target: tgt, label, type: 'smoothstep', animated: true });
    };

    const traverse = (node: any, parentId: string): string => {
        if (!node) return parentId;

        // Arrays (Blocks)
        if (Array.isArray(node)) {
            let curr = parentId;
            node.forEach(c => curr = traverse(c, curr));
            return curr;
        }

        // Structural Wrappers
        if (['Program', 'MainFunction', 'Block', 'FunctionDefinition'].includes(node.type)) {
            return traverse(node.body, parentId);
        }

        // Nodes
        let label = node.type;
        let shape = 'default';

        if (node.type === 'VariableDeclaration') label = `${node.varType} ${node.name}`;
        else if (node.type === 'Typedef') label = `typedef ${node.name}`;
        else if (node.type === 'Assignment') label = `${node.left.name} = ...`;
        else if (node.type === 'ForStatement') { label = 'FOR Loop'; shape = 'diamond'; }
        else if (node.type === 'IfStatement') { label = 'IF Check'; shape = 'diamond'; }
        else if (node.type === 'WhileStatement') { label = 'WHILE Loop'; shape = 'diamond'; }
        else if (node.type === 'OutputStatement') label = `cout << ...`;
        else if (node.type === 'InputStatement') label = `cin >> ...`;
        else if (node.type === 'ReturnStatement') { label = 'Return'; shape = 'output'; }

        const nodeId = createNode(label, shape);
        if (parentId) createEdge(parentId, nodeId);

        // Branching
        if (node.type === 'IfStatement') {
            const tEnd = traverse(node.consequent, nodeId);
            if(node.alternate) traverse(node.alternate, nodeId);
            return tEnd;
        }
        if (node.type === 'WhileStatement') {
            const loopEnd = traverse(node.body, nodeId);
            createEdge(loopEnd, nodeId, 'Back');
            return nodeId;
        }
        if (node.type === 'ForStatement') {
            const bodyEnd = traverse(node.body, nodeId);
            createEdge(bodyEnd, nodeId, 'Next');
            return nodeId;
        }

        return nodeId;
    };

    // 1. Create Start
    const start = createNode('Start', 'input');
    
    // 2. Traverse Graph
    const endNode = traverse(ast, start); 
    
    // 3. Create Visual End
    const visualEndId = createNode('End', 'output');

    // FIX: Connect the last logic node to the Visual End
    if (endNode) {
        createEdge(endNode, visualEndId);
    }

    dagre.layout(g);
    
    // Remap positions
    const layoutedNodes = nodes.map(n => {
        const pos = g.node(n.id);
        return { ...n, position: { x: pos.x - 75, y: pos.y - 25 } };
    });

    return { nodes: layoutedNodes, edges };
};