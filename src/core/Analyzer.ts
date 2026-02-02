import { 
  ASTNode, 
  BinaryExpressionNode, 
  LiteralNode, 
  AssignmentNode, 
  VariableDeclarationNode, 
  FunctionDefinitionNode,
  ArrayAccessNode,
  CallExpressionNode,
  IdentifierNode,
  WhileLoopNode,
  ForLoopNode,
  IfStatementNode,
  SwitchStatementNode,
  UpdateExpressionNode,
  ArrayAccess2DNode
} from '../types'; 

// ============================================
// ENHANCED SYMBOL TRACKING
// ============================================

type SymbolInfo = { 
    initialized: boolean; 
    type: string;
    isConst: boolean;
    used: boolean; 
    value?: number;
    isArray?: boolean; 
    is2D?: boolean;
    arraySize?: number | number[];
    declaredAt: number;
    usedAt?: number[];
};

type AnalysisState = {
    inLoop: boolean;
    inSwitch: boolean;
    currentReturnType: string | null;
    functionCallStack: string[];
    loopDepth: number;
    conditionalDepth: number;
    hasReturnStatement: boolean;
};

// ============================================
// PRODUCTION-READY STATIC ANALYZER
// ============================================

export class StaticAnalyzer {
  private scopeStack: Map<string, SymbolInfo>[] = [new Map()];
  private state: AnalysisState = { 
    inLoop: false, 
    inSwitch: false, 
    currentReturnType: null,
    functionCallStack: [],
    loopDepth: 0,
    conditionalDepth: 0,
    hasReturnStatement: false
  };
  
  public mathChecks: string[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];
  private codeLines: string[] = [];

  // ============================================
  // MAIN ANALYSIS ENTRY POINT
  // ============================================

  public analyze(nodes: ASTNode[], rawCode: string): string[] {
    this.resetState();
    this.codeLines = rawCode.split('\n');

    if (!this.checkStrictStructure(rawCode)) {
        return this.errors; 
    }

    let actualNodes = nodes;
    if (nodes.length === 1 && nodes[0].type === 'Program') {
        actualNodes = (nodes[0] as any).body || [];
    }

    try {
      this.registerGlobals(actualNodes);
      this.traverse(actualNodes);
      this.checkDivisionByZeroFallback(rawCode);
      this.runPostAnalysisRules();
    } catch (error: any) {
      this.errors.push(`🚨 Internal Error: ${error.message || 'Analysis failed'}`);
      console.error('[Analyzer] Critical error:', error);
    }
   
    return [...this.errors, ...this.warnings];
  }

  private resetState() {
    this.errors = [];
    this.warnings = [];
    this.mathChecks = [];
    this.scopeStack = [new Map()];
    this.codeLines = [];
    this.state = { 
      inLoop: false, 
      inSwitch: false, 
      currentReturnType: null,
      functionCallStack: [],
      loopDepth: 0,
      conditionalDepth: 0,
      hasReturnStatement: false
    };
  }

  // Continue with rest of implementation (same as before, but with all improvements)...
  // I'll include the complete implementation in the output files

  private checkStrictStructure(code: string): boolean {
    if (!code || code.trim().length === 0) {
      this.errors.push("⛔ Empty Code: Please enter some C++ code to analyze.");
      return false;
    }

    let isValid = true;
    const cleanCode = code
        .replace(/\/\/.*$/gm, " ")         
        .replace(/\/\*[\s\S]*?\*\//g, " ")   
        .replace(/"(?:[^"\\]|\\.)*"/g, ""); 

    const pythonisms = [
        { regex: /\bdef\s+\w+\s*\(/, msg: "⛔ Syntax Error: 'def' is Python. Use 'int', 'void', or 'auto' in C++." },
        { regex: /\bprint\s*\(/, msg: "⛔ Syntax Error: 'print()' is Python. Use 'std::cout <<' in C++." },
        { regex: /^[\t ]*\w+.*:\s*$/m, msg: "⛔ Syntax Error: C++ uses '{ }', not colons." },
        { regex: /\belif\b/, msg: "⛔ Syntax Error: 'elif' is Python. Use 'else if' in C++." }
    ];

    for (const check of pythonisms) {
        if (check.regex.test(cleanCode)) {
            this.errors.push(check.msg);
            isValid = false;
        }
    }

    const libraryChecks = [
        {
            uses: /\b(cout|cin|endl|cerr)\b/,
            include: /#include\s*<iostream>/,
            name: '<iostream>',
            symbols: 'cout, cin, endl'
        },
        {
            uses: /\b(string|getline|to_string)\b/,
            include: /#include\s*<string>/,
            name: '<string>',
            symbols: 'string, getline'
        },
        {
            uses: /\b(sqrt|pow|abs)\b/,
            include: /#include\s*<cmath>/,
            name: '<cmath>',
            symbols: 'sqrt, pow, abs'
        }
    ];

    for (const check of libraryChecks) {
        if (check.uses.test(cleanCode) && !check.include.test(code)) {
            this.errors.push(`⚠️ Missing #include ${check.name} for: ${check.symbols}`);
            isValid = false;
        }
    }

    if (!/int\s+main\s*\(/.test(cleanCode)) {
        this.errors.push("⚠️ Missing 'int main()' entry point.");
        isValid = false;
    }

    const openBraces = (cleanCode.match(/\{/g) || []).length;
    const closeBraces = (cleanCode.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        this.errors.push(`⛔ Unbalanced braces: ${openBraces} '{' vs ${closeBraces} '}'.`);
        isValid = false;
    }

    return isValid;
  }

  private checkDivisionByZeroFallback(code: string) {
    const cleanCode = code
        .replace(/\/\/.*$/gm, " ")
        .replace(/\/\*[\s\S]*?\*\//g, " ");
    
    const lines = cleanCode.split('\n');
    const zeroVars = new Set<string>();
    
    lines.forEach((line, idx) => {
      const zeroInit = line.match(/(\w+)\s*=\s*0\s*;/);
      if (zeroInit) zeroVars.add(zeroInit[1]);
      
      if (line.match(/[\/\%]\s*0(?:\s|;|\/|\))/)) {
        this.errors.push(`❌ Division by zero at line ${idx + 1}`);
      }
      
      zeroVars.forEach(varName => {
        if (new RegExp(`[\/\%]\\s*${varName}`).test(line)) {
          this.warnings.push(`⚠️ Risk: Division by '${varName}' = 0 at line ${idx + 1}`);
        }
      });
    });
  }

  private registerGlobals(nodes: ASTNode[]) {
    if (!nodes || !Array.isArray(nodes)) return;
    
    nodes.forEach(node => {
      try {
        if (!node || !node.type) return;
        
        if (node.type === 'FunctionDefinition') {
          const funcNode = node as FunctionDefinitionNode;
          this.setSymbol(funcNode.name, { 
            initialized: true, 
            type: 'function', 
            isConst: false, 
            used: false,
            declaredAt: funcNode.line 
          });
        }
        
        if (node.type === 'VariableDeclaration') {
          const varNode = node as VariableDeclarationNode;
          this.setSymbol(varNode.name, {
            initialized: varNode.value !== 'undefined',
            type: varNode.dataType,
            isConst: varNode.isConst,
            used: false,
            isArray: varNode.isArray,
            is2D: varNode.is2D,
            arraySize: varNode.arraySize,
            declaredAt: varNode.line
          });
        }
      } catch (error: any) {
        console.warn('[Analyzer] Error registering:', error.message);
      }
    });
  }

  private traverse(nodes: ASTNode[]) {
    if (!nodes || !Array.isArray(nodes)) return;
    nodes.forEach(node => {
      try {
        this.visit(node);
      } catch (error: any) {
        this.errors.push(`🚨 Error at '${node?.type}': ${error.message}`);
      }
    });
  }

  private visit(node: ASTNode | undefined) {
    if (!node || !node.type) return;

    const handlers: Record<string, (n: any) => void> = {
      'FunctionDefinition': (n) => this.handleFunction(n),
      'VariableDeclaration': (n) => this.handleDeclaration(n),
      'Assignment': (n) => this.handleAssignment(n),
      'WhileLoop': (n) => this.handleWhile(n),
      'ForLoop': (n) => this.handleFor(n),
      'IfStatement': (n) => this.handleIf(n),
      'SwitchStatement': (n) => this.handleSwitch(n),
      'ReturnStatement': (n) => this.handleReturn(n),
      'BreakStatement': () => this.handleBreak(),
      'ContinueStatement': () => this.handleContinue(),
      'CoutStatement': (n) => this.markUsageInString(n.value),
      'CinStatement': (n) => this.handleCin(n),
      'UpdateExpression': (n) => this.handleUpdate(n),
      'ExpressionStatement': (n) => {
        if (n.expression) this.markUsageInExpression(n.expression);
      }
    };

    const handler = handlers[node.type];
    if (handler) handler(node);
  }

  // Implement all handlers with guards...
  private handleFunction(node: FunctionDefinitionNode) {
    this.enterScope();
    this.state.currentReturnType = node.returnType;
    this.state.hasReturnStatement = false;

    if (node.params && Array.isArray(node.params)) {
      node.params.forEach(param => {
        this.setSymbol(param.name, {
          initialized: true,
          type: param.dataType,
          isConst: false,
          used: false,
          declaredAt: node.line
        });
      });
    }

    if (node.body && Array.isArray(node.body)) {
      this.traverse(node.body);
    }

    if (node.returnType !== 'void' && !this.state.hasReturnStatement) {
      this.warnings.push(`⚠️ Missing return in '${node.name}'`);
    }

    this.exitScope();
  }

  private handleDeclaration(node: VariableDeclarationNode) {
    const hasInit = !!(node.value && node.value !== 'undefined');

    this.setSymbol(node.name, {
      initialized: hasInit,
      type: node.dataType,
      isConst: node.isConst,
      used: false,
      isArray: node.isArray,
      is2D: node.is2D,
      arraySize: node.arraySize,
      declaredAt: node.line
    });

    if (node.isConst && !hasInit) {
      this.errors.push(`⛔ Const '${node.name}' must be initialized`);
    }

    if (node.valueNode) {
      this.checkMathSafety(node.valueNode, `init ${node.name}`);
      this.markUsageInExpression(node.valueNode);
    }
  }

  private handleAssignment(node: AssignmentNode) {
    const targetName = node.targetName || node.name.split('[')[0];
    const sym = this.getSymbol(targetName);

    if (!sym) {
      this.errors.push(`⛔ Undefined: '${targetName}'`);
      return;
    }

    if (sym.isConst) {
      this.errors.push(`⛔ Cannot modify const '${targetName}'`);
      return;
    }

    sym.initialized = true;

    if (node.valueNode) {
      this.checkMathSafety(node.valueNode, `assign to ${targetName}`);
      this.markUsageInExpression(node.valueNode);
    }
  }

  private handleWhile(node: WhileLoopNode) {
    this.enterScope();
    this.state.inLoop = true;
    this.state.loopDepth++;

    this.markUsageInString(node.condition);
    if (node.body) this.traverse(node.body);

    this.state.loopDepth--;
    this.state.inLoop = this.state.loopDepth > 0;
    this.exitScope();
  }

  private handleFor(node: ForLoopNode) {
    this.enterScope();
    this.state.inLoop = true;
    this.state.loopDepth++;

    this.markUsageInString(node.condition);
    if (node.body) this.traverse(node.body);

    this.state.loopDepth--;
    this.state.inLoop = this.state.loopDepth > 0;
    this.exitScope();
  }

  private handleIf(node: IfStatementNode) {
    this.state.conditionalDepth++;
    this.markUsageInString(node.condition);

    this.enterScope();
    if (node.body) this.traverse(node.body);
    this.exitScope();

    if (node.elseIfs && Array.isArray(node.elseIfs)) {
      node.elseIfs.forEach(elseIf => {
        this.markUsageInString(elseIf.condition);
        this.enterScope();
        if (elseIf.body) this.traverse(elseIf.body);
        this.exitScope();
      });
    }

    if (node.alternate) {
      this.enterScope();
      this.traverse(node.alternate);
      this.exitScope();
    }

    this.state.conditionalDepth--;
  }

  private handleSwitch(node: SwitchStatementNode) {
    const wasInSwitch = this.state.inSwitch;
    this.state.inSwitch = true;

    this.markUsageInString(node.discriminant);

    if (node.cases) {
      node.cases.forEach(caseNode => {
        this.enterScope();
        if (caseNode.body) this.traverse(caseNode.body);
        this.exitScope();
      });
    }

    if (node.defaultCase && node.defaultCase.body) {
      this.enterScope();
      this.traverse(node.defaultCase.body);
      this.exitScope();
    }

    this.state.inSwitch = wasInSwitch;
  }

  private handleBreak() {
    if (!this.state.inLoop && !this.state.inSwitch) {
      this.errors.push(`⛔ 'break' outside loop/switch`);
    }
  }

  private handleContinue() {
    if (!this.state.inLoop) {
      this.errors.push(`⛔ 'continue' outside loop`);
    }
  }

  private handleReturn(node: any) {
    this.state.hasReturnStatement = true;

    if (this.state.currentReturnType === 'void' && node.argument) {
      this.errors.push(`⛔ Void function cannot return value`);
    }
    
    if (this.state.currentReturnType !== 'void' && !node.argument) {
      this.errors.push(`⛔ Must return a value`);
    }
    
    if (node.argument) {
      this.markUsageInExpression(node.argument);
    }
  }

  private handleCin(node: any) {
    if (node.value && Array.isArray(node.value)) {
      node.value.forEach((varName: string) => {
        const sym = this.getSymbol(varName);
        if (!sym) {
          this.errors.push(`⛔ Undefined in cin: '${varName}'`);
        } else {
          sym.initialized = true;
          sym.used = true;
        }
      });
    }
  }

  private handleUpdate(node: UpdateExpressionNode) {
    const sym = this.getSymbol(node.argument);
    if (!sym) {
      this.errors.push(`⛔ Undefined: '${node.argument}'`);
      return;
    }
    
    if (sym.isConst) {
      this.errors.push(`⛔ Cannot modify const '${node.argument}'`);
    }
    
    sym.used = true;
  }

  private markUsageInString(text: string) {
    if (!text) return;
    const matches = text.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g);
    if (matches) {
      matches.forEach(name => {
        const sym = this.getSymbol(name);
        if (sym) {
          sym.used = true;
          if (!sym.initialized) {
            this.warnings.push(`⚠️ '${name}' used before init`);
          }
        }
      });
    }
  }

  private markUsageInExpression(node: ASTNode | undefined) {
    if (!node || !node.type) return;

    try {
      if (node.type === 'Identifier') {
        const idNode = node as IdentifierNode;
        const sym = this.getSymbol(idNode.name);
        if (sym) {
          sym.used = true;
          if (!sym.initialized) {
            this.warnings.push(`⚠️ '${idNode.name}' uninitialized`);
          }
        }
      }
      
      if (node.type === 'ArrayAccess') {
        const arrNode = node as ArrayAccessNode;
        const sym = this.getSymbol(arrNode.name);
        
        if (sym) {
          sym.used = true;
          
          if (sym.isArray && !sym.is2D) {
            let actualSize: number | null = null;
            
            if (typeof sym.arraySize === 'number') {
              actualSize = sym.arraySize;
            } else if (Array.isArray(sym.arraySize)) {
              actualSize = sym.arraySize[0];
            }
            
            if (actualSize !== null) {
              const idx = this.evaluateConstant(arrNode.index);
              if (idx !== null && (idx < 0 || idx >= actualSize)) {
                this.errors.push(`🚨 Bounds: ${arrNode.name}[${idx}] out of range [0-${actualSize-1}]`);
              }
            }
          }
        }
        this.markUsageInExpression(arrNode.index);
      }

      if (node.type === 'ArrayAccess2D') {
        const arrNode = node as ArrayAccess2DNode;
        const sym = this.getSymbol(arrNode.name);
        
        if (sym && sym.is2D && Array.isArray(sym.arraySize)) {
          const idx1 = this.evaluateConstant(arrNode.index);
          const idx2 = this.evaluateConstant(arrNode.index2);
          
          if (idx1 !== null && (idx1 < 0 || idx1 >= sym.arraySize[0])) {
            this.errors.push(`🚨 2D Bounds: [${idx1}][?] out of range`);
          }
          if (idx2 !== null && (idx2 < 0 || idx2 >= sym.arraySize[1])) {
            this.errors.push(`🚨 2D Bounds: [?][${idx2}] out of range`);
          }
        }
        
        if (sym) sym.used = true;
        this.markUsageInExpression(arrNode.index);
        this.markUsageInExpression(arrNode.index2);
      }

      if (node.type === 'BinaryExpression') {
        const bin = node as BinaryExpressionNode;
        this.markUsageInExpression(bin.left);
        this.markUsageInExpression(bin.right);
      }
      
      if (node.type === 'CallExpression') {
        const call = node as CallExpressionNode;
        if (call.arguments) {
          call.arguments.forEach(arg => this.markUsageInExpression(arg));
        }
      }
    } catch (error: any) {
      console.warn('[Analyzer] Expression error:', error.message);
    }
  }

  private inferType(node: ASTNode): 'int' | 'float' | 'string' | 'bool' | null {
    if (!node || !node.type) return null;

    if (node.type === 'Literal') {
      return (node as LiteralNode).dataType as any;
    }
    
    if (node.type === 'BinaryExpression') {
      const bin = node as BinaryExpressionNode;
      const leftT = this.inferType(bin.left);
      const rightT = this.inferType(bin.right);
      if (leftT === 'float' || rightT === 'float') return 'float';
      return 'int';
    }
    
    if (node.type === 'Identifier') {
      const sym = this.getSymbol((node as IdentifierNode).name);
      return sym ? (sym.type as any) : null;
    }
    
    return null;
  }

  private evaluateConstant(node: ASTNode | undefined): number | null {
    if (!node || !node.type) return null;
    
    try {
      if (node.type === 'Literal') {
        const lit = node as LiteralNode;
        return Number(lit.value);
      }
      
      if (node.type === 'Identifier') {
        const sym = this.getSymbol((node as IdentifierNode).name);
        return sym?.value ?? null;
      }
      
      if (node.type === 'BinaryExpression') {
        const bin = node as BinaryExpressionNode;
        const l = this.evaluateConstant(bin.left);
        const r = this.evaluateConstant(bin.right);
        
        if (l !== null && r !== null) {
          switch(bin.operator) {
            case '+': return l + r;
            case '-': return l - r;
            case '*': return l * r;
            case '/': return r === 0 ? null : Math.floor(l / r);
            case '%': return r === 0 ? null : l % r;
          }
        }
      }
    } catch (error: any) {
      console.warn('[Analyzer] Eval error:', error.message);
    }
    
    return null;
  }

  private checkMathSafety(node: ASTNode | undefined, context: string) {
    if (!node || !node.type) return; 

    try {
      if (node.type === 'BinaryExpression') {
        const bin = node as BinaryExpressionNode;
        
        this.checkMathSafety(bin.left, context);
        this.checkMathSafety(bin.right, context);

        if (bin.operator === '/' || bin.operator === '%') {
          const denom = this.evaluateConstant(bin.right);
          
          if (denom === 0) {
            this.errors.push(`❌ Division by zero in ${context}`);
          }
        }
      }
    } catch (error: any) {
      console.warn('[Analyzer] Math check error:', error.message);
    }
  }

  private enterScope() {
    this.scopeStack.push(new Map());
  }

  private exitScope() {
    const currentScope = this.scopeStack[this.scopeStack.length - 1];
    if (currentScope) {
      currentScope.forEach((info, name) => {
        if (!info.used && info.type !== 'function' && info.type !== 'typedef') {
          this.warnings.push(`⚠️ Unused: '${name}' at line ${info.declaredAt}`);
        }
      });
    }
    this.scopeStack.pop();
  }

  private setSymbol(name: string, info: SymbolInfo) {
    if (!name || !info) return;
    this.scopeStack[this.scopeStack.length - 1].set(name, info);
  }

  private getSymbol(name: string): SymbolInfo | undefined {
    if (!name) return undefined;
    
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      if (this.scopeStack[i].has(name)) {
        return this.scopeStack[i].get(name);
      }
    }
    return undefined;
  }

  private runPostAnalysisRules() {
    this.exitScope();
  }
}