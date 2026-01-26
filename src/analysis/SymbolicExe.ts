export function checkMathSafety(node: any, constraints: Map<string, number> = new Map()): Map<string, number> {
    if (!node) return constraints;

    // 1. Structural Traversal
    if (node.type === 'Program' || node.type === 'MainFunction') {
        return checkMathSafety(node.body, constraints);
    }
    if (node.type === 'Block') {
        if (node.body && Array.isArray(node.body)) {
            node.body.forEach((child: any) => checkMathSafety(child, constraints));
        }
        return constraints;
    }

    // 2. Control Flow
    if (node.type === 'WhileStatement' || node.type === 'IfStatement') {
        checkMathSafety(node.test, constraints);
        checkMathSafety(node.consequent || node.body, constraints);
        if (node.alternate) checkMathSafety(node.alternate, constraints);
        return constraints;
    }

    // 3. Variable Tracking
    if (node.type === 'VariableDeclaration' || node.type === 'Assignment') {
        const valueNode = node.value;
        if (valueNode) {
            if (valueNode.type === 'Literal' && typeof valueNode.value === 'number') {
                constraints.set(node.name, valueNode.value);
            } else if (valueNode.type === 'Identifier') {
                const val = constraints.get(valueNode.name);
                if (val !== undefined) constraints.set(node.name, val);
                else constraints.delete(node.name);
            } else {
                constraints.delete(node.name);
            }
        }
    }

    // 4. Division Safety Check
    if (node.type === 'BinaryExp' && (node.op === '/' || node.op === '%')) {
        const denominator = node.right;
        
        // Literal Zero
        if (denominator.type === 'Literal' && denominator.value === 0) {
             throw new Error(`Math Error: Division by Literal Zero.`);
        }
        // Variable Zero
        if (denominator.type === 'Identifier') {
             const val = constraints.get(denominator.name);
             if (val === 0) {
                 throw new Error(`Math Error: Division by Zero. Variable '${denominator.name}' is known to be 0.`);
             }
        }
    }

    // Recurse expressions
    if (node.left) checkMathSafety(node.left, constraints);
    if (node.right) checkMathSafety(node.right, constraints);

    return constraints;
}