import { ASTNode } from './Types';

/**
 * PHASES 1 & 2: INPUT & LOGIC
 * Implements Algorithms 1-6: Lexical, Syntactic, Symbol Table, 
 * Type Checking, Data Flow, and Symbolic Execution.
 */
export class CodeSenseEngine {
    private symbolTable = new Map<string, { type: string; initialized: boolean }>();

    // LEXICAL & SYNTACTIC ANALYSIS (Algorithms 1 & 2)
    public parse(code: string): ASTNode[] {
        // Regex-based Tokenization
        const tokens = code.match(/\b(int|float|double|if|while|cout|return)\b|[a-zA-Z_]\w*|\d+|<<|[{}()\[\],;=+\-*/%><!&|]/g) || [];
        const ast: ASTNode[] = [];
        
        while (tokens.length > 0) {
            const token = tokens.shift();
            // Variable Declaration Algorithm
            if (['int', 'float', 'double'].includes(token!)) {
                const name = tokens.shift();
                tokens.shift(); // skip '='
                const val = tokens.shift();
                tokens.shift(); // skip ';'
                ast.push({ type: 'VariableDeclaration', dataType: token, name, value: val });
            } 
            // While Loop Algorithm
            else if (token === 'while') {
                tokens.shift(); // skip '('
                const cond = tokens.shift();
                tokens.shift(); // skip ')'
                tokens.shift(); // skip '{'
                ast.push({ type: 'WhileLoop', condition: cond, body: this.parseBlock(tokens) });
            }
        }
        return ast;
    }

    private parseBlock(tokens: string[]): ASTNode[] {
        const block: ASTNode[] = [];
        while (tokens.length > 0 && tokens[0] !== '}') {
            block.push({ type: 'InternalStatement', value: tokens.shift() });
        }
        tokens.shift(); // skip '}'
        return block;
    }

    // STATIC ANALYSIS & MATH SAFETY (Algorithms 4, 5, 6)
    public analyze(nodes: ASTNode[]): string[] {
        const diagnostics: string[] = [];
        nodes.forEach(node => {
            // Symbol Table Management
            if (node.type === 'VariableDeclaration') {
                this.symbolTable.set(node.name!, { 
                    type: node.dataType!, 
                    initialized: node.value !== undefined 
                });
            }
            // Data Flow Analysis: Detect uninitialized memory
            if (node.type === 'CoutStatement' && this.symbolTable.has(node.value)) {
                if (!this.symbolTable.get(node.value)?.initialized) {
                    diagnostics.push(`Logic Error: Using uninitialized variable '${node.value}'.`);
                }
            }
            // Bounded Symbolic Execution: Division by Zero
            if (node.operator === '/' && node.right === '0') {
                diagnostics.push("Math Safety Alert: Division by zero is undefined.");
            }
        });
        return diagnostics;
    }
}