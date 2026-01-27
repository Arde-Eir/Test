/**
 * ASTNode Interface
 * Represents the hierarchical structure of C++ code for deterministic analysis.
 */
export interface ASTNode {
    type: string;          // The code construct (e.g., 'WhileLoop')
    name?: string;         // Variable name
    value?: any;           // Literal value
    dataType?: string;     // C++ type (int, float, etc.)
    condition?: string;    // Logic check
    operator?: string;     // Math operator
    right?: any;           // Divisor or right-hand value
    body?: ASTNode[];      // Nested code blocks
}