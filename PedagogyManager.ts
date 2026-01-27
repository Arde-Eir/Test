import { ASTNode } from './Types';

/**
 * PHASE 3: OUTPUT GENERATION
 * Implements Algorithm 7 (Cognitive Complexity), Algorithm 8 & 9 (CFG & Sugiyama), 
 * and Algorithm 10 (Translation).
 */
export class PedagogyManager {
    // SYNTAX-DIRECTED TRANSLATION (Algorithm 10) [cite: 250, 736, 737]
    public translate(node: ASTNode): string {
        const dictionary: Record<string, string> = {
            'VariableDeclaration': `Creating a memory space for ${node.name} to store a ${node.dataType}.`,
            'WhileLoop': `Repeating a set of actions while "${node.condition}" is true.`,
            'CoutStatement': `Displaying the current value of ${node.value} to the screen.`
        };
        return dictionary[node.type] || "Analyzing logic path...";
    }

    // COGNITIVE COMPLEXITY SCORING (Algorithm 7) [cite: 236, 727, 728]
    public calculateReward(nodes: ASTNode[]): number {
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
        return Math.max(10, 100 - (complexity * 5)); 
    }
}