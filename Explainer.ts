import { ASTNode } from './Types';

/**
 * PHASE 3: OUTPUT GENERATION [cite: 660]
 * Maps AST nodes to natural language templates to provide 
 * line-by-line English logic explanations[cite: 736, 737].
 */
export class PedagogyManager {
    // Dictionary of simple English templates for C++ logic [cite: 737, 214]
    private templates: Record<string, (node: ASTNode) => string> = {
        'VariableDeclaration': (n) => `Line Logic: Creating a storage box named "${n.name}" for ${n.dataType} numbers, starting with the value ${n.value}. [cite: 250]`,
        'WhileLoop': (n) => `Line Logic: This is a loop. The computer repeats everything inside the brackets as long as "${n.condition}" is true. [cite: 231, 250]`,
        'CoutStatement': (n) => `Line Logic: Telling the program to show the information "${n.value}" on your screen. [cite: 250]`,
        'InternalStatement': (n) => `Line Logic: Executing a standard command: ${n.value}. [cite: 737]`
    };

    /**
     * Translates the program's Abstract Syntax Tree (AST) into 
     * simple English narratives[cite: 92, 703].
     */
    public generateNarrative(ast: ASTNode[]): string[] {
        return ast.map(node => {
            const explainer = this.templates[node.type];
            return explainer ? explainer(node) : "Line Logic: Performing standard background task.";
        });
    }

    /**
     * Algorithm 7: Cognitive Complexity Metric [cite: 727, 728]
     * Calculates user tokens based on the nesting depth of the code[cite: 700, 702].
     */
    public calculateTokens(nodes: ASTNode[]): number {
        let complexity = 0;
        const traverse = (list: ASTNode[], depth: number) => {
            list.forEach(n => {
                if (n.type === 'WhileLoop') {
                    complexity += (1 + depth); // Penalize deep nesting [cite: 728]
                    if (n.body) traverse(n.body, depth + 1);
                }
            });
        };
        traverse(nodes, 0);
        return Math.max(10, 100 - (complexity * 10)); // Reward tokens for clean reasoning [cite: 94]
    }
}