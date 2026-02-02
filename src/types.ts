// ==================================================================
//  CODESENSE TYPES DEFINITION (Fully Aligned with Updated Parser)
// ==================================================================

// --- 1. Base Node ---
export interface BaseNode {
  id: string;             // Unique ID (e.g., "n1", "n2")
  line: number;           // Line number for error reporting
  body?: ASTNode[];       // For block containers (Main, If, While, Program)
}

// --- 2. Structural Nodes ---

export interface ProgramNode extends BaseNode {
  type: 'Program';
}

export interface NamespaceDirectiveNode extends BaseNode {
  type: 'NamespaceDirective';
  name: string;
}

export interface MainNode extends BaseNode {
  type: 'Main';
}

export interface ParameterNode extends BaseNode {
  type: 'Parameter';
  dataType: string;
  name: string;
}

export interface FunctionDefinitionNode extends BaseNode {
  type: 'FunctionDefinition';
  name: string;
  returnType: string;
  params: ParameterNode[];
}

// --- 3. NEW: Typedef Support ---
export interface TypedefDeclarationNode extends BaseNode {
  type: 'TypedefDeclaration';
  baseType: string;
  newName: string;
}

// --- 4. Statement Nodes ---

export interface VariableDeclarationNode extends BaseNode {
  type: 'VariableDeclaration';
  name: string;
  dataType: string;
  
  // Metadata for Static Analysis
  isConst: boolean;
  isArray: boolean;
  is2D?: boolean;                    // NEW: 2D array flag
  arraySize?: number | number[];     // NEW: Can be [5] or [3,3]
  
  value?: string;
  valueNode?: ASTNode;
}

export interface AssignmentNode extends BaseNode {
  type: 'Assignment';
  name: string;
  targetName?: string;        // NEW: Base array name (e.g., "arr")
  indexNode?: ASTNode | null; // NEW: Index expression AST
  operator: '=' | '+=' | '-=' | '*=' | '/=';
  value: string;
  valueNode?: ASTNode;
}

export interface UpdateExpressionNode extends BaseNode {
  type: 'UpdateExpression';
  operator: '++' | '--';
  argument: string;
  prefix: boolean;
  isStatement?: boolean;
}

export interface ExpressionStatementNode extends BaseNode {
  type: 'ExpressionStatement';
  expression: CallExpressionNode;
}

// --- 5. Control Flow Nodes ---

export interface WhileLoopNode extends BaseNode {
  type: 'WhileLoop';
  condition: string;
  conditionNode?: ASTNode;
}

export interface ForLoopNode extends BaseNode {
  type: 'ForLoop';
  condition: string;
}

// NEW: Enhanced If Statement with else-if support
export interface IfStatementNode extends BaseNode {
  type: 'IfStatement';
  condition: string;
  conditionNode?: ASTNode;
  elseIfs?: ElseIfClauseNode[];      // NEW: Array of else-if clauses
  alternate?: ASTNode[];             // NEW: else clause body
}

// NEW: Else-If Clause
export interface ElseIfClauseNode extends BaseNode {
  type: 'ElseIfClause';
  condition: string;
  body: ASTNode[];
}

// NEW: Switch Statement Support
export interface SwitchStatementNode extends BaseNode {
  type: 'SwitchStatement';
  discriminant: string;
  cases: SwitchCaseNode[];
  defaultCase?: DefaultCaseNode;
}

export interface SwitchCaseNode extends BaseNode {
  type: 'SwitchCase';
  value: ASTNode;
  body: ASTNode[];
}

export interface DefaultCaseNode extends BaseNode {
  type: 'DefaultCase';
  body: ASTNode[];
}

export interface BreakStatementNode extends BaseNode {
  type: 'BreakStatement';
}

export interface ContinueStatementNode extends BaseNode {
  type: 'ContinueStatement';
}

export interface ReturnStatementNode extends BaseNode {
  type: 'ReturnStatement';
  argument?: ASTNode;
}

// --- 6. I/O Nodes ---

export interface CoutStatementNode extends BaseNode {
  type: 'CoutStatement';
  value: string;
}

export interface CinStatementNode extends BaseNode {
  type: 'CinStatement';
  value: string[];
}

// --- 7. Expression & Value Nodes ---

export interface BinaryExpressionNode extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface ArrayAccessNode extends BaseNode {
  type: 'ArrayAccess';
  name: string;
  index: ASTNode;
}

// NEW: 2D Array Access
export interface ArrayAccess2DNode extends BaseNode {
  type: 'ArrayAccess2D';
  name: string;
  index: ASTNode;
  index2: ASTNode;
}

export interface CallExpressionNode extends BaseNode {
  type: 'CallExpression';
  callee: string;
  arguments: ASTNode[];
}

export interface LiteralNode extends BaseNode {
  type: 'Literal';
  value: string | number | boolean;
  raw: string;
  dataType: 'int' | 'float' | 'string' | 'char' | 'bool';
}

export interface IdentifierNode extends BaseNode {
  type: 'Identifier';
  name: string;
}

// NEW: Array Initializer (for {1, 2, 3} syntax)
export interface ArrayInitializerNode extends BaseNode {
  type: 'ArrayInitializer';
  values: ASTNode[];
}

// --- 8. Visualization Types ---

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { 
    label: string; 
    type?: string;
    narrative?: string;
    lineNumber?: number;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: any;
  type?: string;
  labelStyle?: any;
  labelBgStyle?: any;
}

// --- 9. The Master Union Type ---
export type ASTNode = 
  // Structure
  | ProgramNode 
  | NamespaceDirectiveNode
  | MainNode 
  | FunctionDefinitionNode
  | ParameterNode
  | TypedefDeclarationNode           // NEW
  
  // Statements
  | VariableDeclarationNode 
  | AssignmentNode 
  | ExpressionStatementNode
  | CoutStatementNode 
  | CinStatementNode 
  | ReturnStatementNode 
  | BreakStatementNode
  | ContinueStatementNode
  
  // Control Flow
  | WhileLoopNode 
  | ForLoopNode
  | IfStatementNode
  | ElseIfClauseNode                 // NEW
  | SwitchStatementNode              // NEW
  | SwitchCaseNode                   // NEW
  | DefaultCaseNode                  // NEW
  
  // Expressions
  | BinaryExpressionNode
  | UpdateExpressionNode   
  | ArrayAccessNode
  | ArrayAccess2DNode                // NEW
  | CallExpressionNode
  | LiteralNode
  | IdentifierNode
  | ArrayInitializerNode;            // NEW

// --- 10. App-Level Metadata ---

export interface UserProfile {
  id: string;
  gamertag: string;
  password: string;
  character: string;
  tokens: number;
  rank: string;
  level: number;
  isGuest: boolean;
}

export interface AnalysisResult {
  ast: ASTNode[];
  errors: string[];       
  narrative: string[];    
  complexityScore: number;
}