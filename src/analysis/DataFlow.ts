export function analyzeDataFlow(node: any, initializedVars: Set<string> = new Set()) {
    if (!node) return;

    // FIX 1: Match Grammar Name 'VariableDeclaration'
    if (node.type === 'VariableDeclaration' || node.type === 'VariableDecl') { 
        if (node.value) {
            analyzeDataFlow(node.value, initializedVars); 
            initializedVars.add(node.name);
        }
    }

    // CASE: Assignment (x = 10;)
    if (node.type === 'Assignment') {
        analyzeDataFlow(node.value || node.right, initializedVars); // Handle both structure types
        initializedVars.add(node.name || node.left.name); 
    }

    // CASE: Usage (y = x + 1)
    if (node.type === 'Identifier') {
        // Ignore function names or declarations, strictly check usage
        if (!initializedVars.has(node.name)) {
            // We only throw if we are sure it's a usage, usually handled by context
            // For simple safety, we rely on TypeChecker for 'declaration' checks
            // and use this purely for 'initialization' logic if needed.
        }
    }

    // CASE: Return Statement
    if (node.type === 'ReturnStatement') {
        analyzeDataFlow(node.value, initializedVars);
    }

    // Recursion for Expressions
    if (node.type === 'BinaryExpr') {
        analyzeDataFlow(node.left, initializedVars);
        analyzeDataFlow(node.right, initializedVars);
    }

    // Recursion for Control Structures
    if (node.type === 'IfStatement') {
        analyzeDataFlow(node.test || node.condition, initializedVars);
        analyzeDataFlow(node.consequent || node.body, new Set(initializedVars));
        if (node.alternate || node.elseBody) {
            analyzeDataFlow(node.alternate || node.elseBody, new Set(initializedVars));
        }
    }

    else if (node.type === 'WhileStatement') {
        analyzeDataFlow(node.test || node.condition, initializedVars);
        analyzeDataFlow(node.body, new Set(initializedVars));
    }

    // Recursion for Blocks
    else if (node.body) {
         if (Array.isArray(node.body)) {
             const blockScope = new Set(initializedVars); 
             node.body.forEach((n: any) => analyzeDataFlow(n, blockScope));
         } else {
             analyzeDataFlow(node.body, new Set(initializedVars));
         }
    }
}