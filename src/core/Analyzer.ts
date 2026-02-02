import { 
  ASTNode, 
  BinaryExpressionNode, 
  LiteralNode, 
  AssignmentNode, 
  VariableDeclarationNode, 
  FunctionDefinitionNode,
  ArrayAccessNode,
  CallExpressionNode,
  IdentifierNode
} from '../types'; 

// INTELLIGENCE: Richer symbol tracking for robust analysis
type SymbolInfo = { 
    initialized: boolean; 
    type: string;       // e.g., 'int', 'float', 'void'
    isConst: boolean;   // Enforce const correctness
    used: boolean; 
    value?: number;     // Track constant values for array bounds (e.g. const N = 5)
    isArray?: boolean; 
    is2D?: boolean;
    arraySize?: number | number[]; // Single number for 1D, array for 2D
};

type AnalysisState = {
    inLoop: boolean;        // Are we inside a while/for loop?
    inSwitch: boolean;      // Are we inside a switch statement?
    currentReturnType: string | null;
    functionCallStack: string[]; // Track recursion
};

export class StaticAnalyzer {
  // STACK-BASED SCOPING: Handles nested blocks and shadowing correctly
  private scopeStack: Map<string, SymbolInfo>[] = [new Map()];
  private state: AnalysisState = { 
    inLoop: false, 
    inSwitch: false, 
    currentReturnType: null,
    functionCallStack: []
  };
  
  public mathChecks: string[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];

  public analyze(nodes: ASTNode[], rawCode: string): string[] {
    this.resetState();

    if (!this.checkStrictStructure(rawCode)) {
        return this.errors; 
    }

    // ✅ FIX: Unwrap Program node if present
    let actualNodes = nodes;
    if (nodes.length === 1 && nodes[0].type === 'Program') {
        actualNodes = (nodes[0] as any).body;
    }

    this.registerGlobals(actualNodes);
    this.traverse(actualNodes);
    
    // 🔥 Regex-based fallback division-by-zero detector
    this.checkDivisionByZeroFallback(rawCode);
    
    this.runPostAnalysisRules();
   
    return [...this.errors, ...this.warnings];
}

  private resetState() {
    this.errors = [];
    this.warnings = [];
    this.mathChecks = [];
    this.scopeStack = [new Map()];
    this.state = { 
      inLoop: false, 
      inSwitch: false, 
      currentReturnType: null,
      functionCallStack: []
    };
  }

  // --- PHASE 1: THE GATEKEEPER ---
  private checkStrictStructure(code: string): boolean {
    let isValid = true;
    const cleanCode = code
        .replace(/\/\/.*$/gm, " ")         
        .replace(/\/\*[\s\S]*?\*\//g, " ")   
        .replace(/"(?:[^"\\]|\\.)*"/g, ""); 

    const pythonisms = [
        { regex: /\bdef\b/, msg: "⛔ Syntax Error: 'def' is Python. Use 'int', 'void', or 'auto'." },
        { regex: /\bprint\s*\(/, msg: "⛔ Syntax Error: 'print()' is Python. Use 'std::cout <<'." },
        { regex: /:\s*$/, msg: "⛔ Syntax Error: C++ blocks use '{ }', not colons." },
        { regex: /\belif\b/, msg: "⛔ Syntax Error: 'elif' is Python. Use 'else if'." }
    ];

    for (const check of pythonisms) {
        if (check.regex.test(cleanCode)) {
            this.errors.push(check.msg);
            isValid = false;
        }
    }

    // COMPREHENSIVE PREPROCESSOR CHECKS
    const libraryChecks = [
        {
            uses: /\b(cout|cin|endl|cerr|clog|ws|flush)\b/,
            include: /#include\s*<iostream>/,
            name: '<iostream>',
            symbols: 'cout, cin, endl, cerr'
        },
        {
            uses: /\b(string|getline|to_string|stoi|stod|stof)\b/,
            include: /#include\s*<string>/,
            name: '<string>',
            symbols: 'string, getline, to_string'
        },
        {
            uses: /\b(vector|push_back|pop_back|emplace_back|size|capacity)\b/,
            include: /#include\s*<vector>/,
            name: '<vector>',
            symbols: 'vector'
        },
        {
            uses: /\b(sqrt|pow|abs|fabs|ceil|floor|round|sin|cos|tan|log|exp|min|max)\b/,
            include: /#include\s*<cmath>/,
            name: '<cmath>',
            symbols: 'sqrt, pow, abs, sin, cos, min, max'
        },
        {
            uses: /\b(sort|reverse|find|count|binary_search|lower_bound|upper_bound|accumulate|max_element|min_element)\b/,
            include: /#include\s*<algorithm>/,
            name: '<algorithm>',
            symbols: 'sort, reverse, find'
        },
        {
            uses: /\b(map|unordered_map|pair|make_pair)\b/,
            include: /#include\s*<(map|unordered_map)>/,
            name: '<map> or <unordered_map>',
            symbols: 'map, unordered_map, pair'
        },
        {
            uses: /\b(set|unordered_set|multiset)\b/,
            include: /#include\s*<(set|unordered_set)>/,
            name: '<set> or <unordered_set>',
            symbols: 'set, unordered_set'
        },
        {
            uses: /\b(queue|priority_queue|deque)\b/,
            include: /#include\s*<(queue|deque)>/,
            name: '<queue> or <deque>',
            symbols: 'queue, priority_queue, deque'
        },
        {
            uses: /\b(stack)\b/,
            include: /#include\s*<stack>/,
            name: '<stack>',
            symbols: 'stack'
        },
        {
            uses: /\b(rand|srand|time)\b/,
            include: /#include\s*<(cstdlib|ctime)>/,
            name: '<cstdlib> and/or <ctime>',
            symbols: 'rand, srand, time'
        },
        {
            uses: /\b(setprecision|setw|fixed|scientific)\b/,
            include: /#include\s*<iomanip>/,
            name: '<iomanip>',
            symbols: 'setprecision, setw, fixed'
        },
        {
            uses: /\b(ifstream|ofstream|fstream)\b/,
            include: /#include\s*<fstream>/,
            name: '<fstream>',
            symbols: 'ifstream, ofstream, fstream'
        },
        {
            uses: /\b(stringstream|istringstream|ostringstream)\b/,
            include: /#include\s*<sstream>/,
            name: '<sstream>',
            symbols: 'stringstream, istringstream'
        },
        {
            uses: /\b(isdigit|isalpha|isalnum|isspace|tolower|toupper)\b/,
            include: /#include\s*<cctype>/,
            name: '<cctype>',
            symbols: 'isdigit, isalpha, tolower, toupper'
        }
    ];

    for (const check of libraryChecks) {
        if (check.uses.test(cleanCode) && !check.include.test(code)) {
            this.errors.push(`⚠️ Compile Error: Used symbols from ${check.name} (${check.symbols}) but missing #include directive.`);
            isValid = false;
        }
    }

    if (!/int\s+main\s*\(/.test(cleanCode)) {
        this.errors.push("⚠️ Linker Error: Missing 'int main()' entry point.");
        isValid = false;
    }

    // AMBIGUITY SOLVER: Did they forget 'using namespace std'?
    // Only check this if iostream is properly included
    const hasIostream = /#include\s*<iostream>/.test(code);
    const usesStdSymbols = /\b(cout|cin|endl|string|vector|map|set)\b/.test(cleanCode);
    
    if (hasIostream && usesStdSymbols && !code.includes("std::") && !/using\s+namespace\s+std\s*;/.test(cleanCode)) {
        this.errors.push("⛔ Scope Error: Standard library symbols undefined. Use 'std::cout' or 'using namespace std;'.");
        isValid = false;
    }

    return isValid;
  }

  // 🔥 Regex-based Division-by-Zero Detector (Fallback)
  private checkDivisionByZeroFallback(code: string) {
    const cleanCode = code
        .replace(/\/\/.*$/gm, " ")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/"(?:[^"\\]|\\.)*"/g, "");
    
    const zeroVars = new Set<string>();
    const zeroPattern = /\b(?:int|float|double|long|short)\s+(\w+)\s*=\s*0\s*;/g;
    let match;
    
    while ((match = zeroPattern.exec(cleanCode)) !== null) {
        zeroVars.add(match[1]);
    }
    
    const divPattern = /([a-zA-Z_]\w*|\d+)\s*\/\s*([a-zA-Z_]\w+)/g;
    
    while ((match = divPattern.exec(cleanCode)) !== null) {
        const denominator = match[2];
        
        if (zeroVars.has(denominator)) {
            const errorMsg = `❌ Math Error: Division by zero - variable '${denominator}' is initialized to 0.`;
            if (!this.errors.includes(errorMsg)) {
                this.errors.push(errorMsg);
            }
        }
        
        if (denominator === '0') {
            const errorMsg = `❌ Math Error: Division by zero - literal 0 used as denominator.`;
            if (!this.errors.includes(errorMsg)) {
                this.errors.push(errorMsg);
            }
        }
    }
    
    const modPattern = /([a-zA-Z_]\w*|\d+)\s*%\s*([a-zA-Z_]\w+)/g;
    
    while ((match = modPattern.exec(cleanCode)) !== null) {
        const denominator = match[2];
        
        if (zeroVars.has(denominator)) {
            const errorMsg = `❌ Math Error: Modulo by zero - variable '${denominator}' is initialized to 0.`;
            if (!this.errors.includes(errorMsg)) {
                this.errors.push(errorMsg);
            }
        }
        
        if (denominator === '0') {
            const errorMsg = `❌ Math Error: Modulo by zero - literal 0 used as denominator.`;
            if (!this.errors.includes(errorMsg)) {
                this.errors.push(errorMsg);
            }
        }
    }
  }

  // --- PHASE 2: THE INTELLIGENT WALKER ---

  private registerGlobals(nodes: ASTNode[]) {
      nodes.forEach(node => {
          if (node.type === 'FunctionDefinition') {
              this.setSymbol(node.name, { 
                  type: 'function', 
                  initialized: true, 
                  isConst: true, 
                  used: node.name === 'main' 
              });
          }
      });
  }

  private traverse(nodes: ASTNode[]) {
    let unreachable = false;

    nodes.forEach(node => {
      if (unreachable) {
          this.warnings.push(`⚠️ Unreachable code detected at line ${node.line}.`);
          return;
      }

      switch (node.type) {
        case 'FunctionDefinition':
            this.enterScope();
            this.state.currentReturnType = node.returnType;
            node.params.forEach(p => {
                this.setSymbol(p.name, { 
                    type: p.dataType, initialized: true, isConst: false, used: false 
                });
            });
            if (node.body) this.traverse(node.body);
            this.state.currentReturnType = null;
            this.exitScope();
            break;

        case 'Main':
            this.enterScope();
            if (node.body) this.traverse(node.body);
            this.exitScope();
            break;

        case 'TypedefDeclaration':
            // Register typedef as a type alias
            this.setSymbol(node.newName, {
                type: 'typedef',
                initialized: true,
                isConst: true,
                used: false
            });
            break;

        case 'VariableDeclaration':
            this.handleDeclaration(node);
            break;

        case 'Assignment':
            this.handleAssignment(node);
            break;
    
        case 'WhileLoop':
        case 'ForLoop':
            const prevLoopState = this.state.inLoop;
            this.state.inLoop = true;
            this.enterScope();

            if ((node as any).conditionNode) {
                this.markUsageInExpression((node as any).conditionNode);
            } else {
                this.markUsageInString((node as any).condition);
            }
            
            if (node.body) this.traverse(node.body);
            this.exitScope();
            this.state.inLoop = prevLoopState;
            break;

        case 'SwitchStatement':
            const prevSwitchState = this.state.inSwitch;
            this.state.inSwitch = true;
            this.enterScope();
            
            this.markUsageInString((node as any).discriminant);
            
            if ((node as any).cases) {
                (node as any).cases.forEach((caseNode: any) => {
                    if (caseNode.body) this.traverse(caseNode.body);
                });
            }
            
            if ((node as any).defaultCase && (node as any).defaultCase.body) {
                this.traverse((node as any).defaultCase.body);
            }
            
            this.exitScope();
            this.state.inSwitch = prevSwitchState;
            break;

        case 'IfStatement':
            this.enterScope();
            if ((node as any).conditionNode) {
                this.markUsageInExpression((node as any).conditionNode);
            } else {
                this.markUsageInString(node.condition);
            }
            if (node.body) this.traverse(node.body);
            
            // Handle else-if clauses
            if ((node as any).elseIfs && (node as any).elseIfs.length > 0) {
                (node as any).elseIfs.forEach((elseIfNode: any) => {
                    this.markUsageInString(elseIfNode.condition);
                    if (elseIfNode.body) this.traverse(elseIfNode.body);
                });
            }
            
            // Handle else clause
            if ((node as any).alternate) {
                this.traverse((node as any).alternate);
            }
            
            this.exitScope();
            break;

        case 'BreakStatement':
            if (!this.state.inLoop && !this.state.inSwitch) {
                this.errors.push(`⛔ Syntax Error: 'break' can only be used inside loops or switch statements (Line ${node.line}).`);
            }
            break;

        case 'ContinueStatement':
            if (!this.state.inLoop) {
                this.errors.push(`⛔ Syntax Error: 'continue' cannot be used outside of a loop (Line ${node.line}).`);
            }
            if (this.state.inSwitch && !this.state.inLoop) {
                this.errors.push(`⛔ Syntax Error: 'continue' cannot be used in switch statements (Line ${node.line}).`);
            }
            break;

        case 'ReturnStatement':
            this.handleReturn(node);
            unreachable = true; 
            break;

        case 'ExpressionStatement':
            this.markUsageInExpression(node.expression);
            
            // Check for recursion
            if (node.expression && node.expression.type === 'CallExpression') {
                const callExpr = node.expression as CallExpressionNode;
                if (this.state.functionCallStack.includes(callExpr.callee)) {
                    this.warnings.push(`🔄 Recursion detected: Function '${callExpr.callee}' calls itself.`);
                }
            }
            break;

        case 'CoutStatement':
            this.markUsageInString(node.value);
            break;
            
        case 'CinStatement':
            node.value.forEach(v => {
                const sym = this.getSymbol(v);
                if (sym) sym.initialized = true;
            });
            break;
      }
    });
  }

  // --- LOGIC HANDLERS ---

  private handleDeclaration(node: VariableDeclarationNode) {
    let valueToStore: number | undefined = undefined;
    
    console.log("=== DECLARATION DEBUG ===");
    console.log("Declaring variable:", node.name);
    console.log("Has valueNode?:", !!node.valueNode);
    
    if (node.valueNode) {
        this.checkMathSafety(node.valueNode, `Declaration of ${node.name}`);
        
        console.log("ValueNode:", node.valueNode);
        console.log("ValueNode type:", (node.valueNode as any)?.type);
        
        const resolvedValue = this.evaluateConstant(node.valueNode);
        console.log("Resolved value:", resolvedValue);
        
        if (resolvedValue !== null) {
            valueToStore = resolvedValue;
            console.log("✅ Storing value:", valueToStore);
        } else {
            console.log("⚠️ Value resolved to null, not storing");
        }
        
        this.markUsageInExpression(node.valueNode);
    }

    const symbolInfo = { 
        type: node.dataType,
        initialized: !!node.valueNode, 
        isConst: node.isConst,
        used: false,
        value: valueToStore,
        isArray: node.isArray,
        is2D: node.is2D,
        arraySize: node.arraySize
    };
    
    console.log("Storing symbol:", node.name, symbolInfo);
    console.log("========================");

    this.setSymbol(node.name, symbolInfo);
}

  private handleAssignment(node: AssignmentNode) {
      const targetName = node.name.split('[')[0]; 
      const sym = this.getSymbol(targetName);

      // 🐛 DEBUG LOGGING
      console.log("=== ASSIGNMENT DEBUG ===");
      console.log("Assignment node:", node);
      console.log("Target name:", targetName);
      console.log("Symbol info:", sym);
      console.log("Has indexNode?:", !!node.indexNode);
      if (node.indexNode) {
          console.log("IndexNode:", node.indexNode);
          console.log("IndexNode type:", typeof node.indexNode);
          console.log("IndexNode.type:", (node.indexNode as any)?.type);
          
          const evalResult = this.evaluateConstant(node.indexNode);
          console.log("Evaluated index:", evalResult);
          
          // If it's a string "index", try to look it up manually
          if (typeof node.indexNode === 'string') {
              console.log("⚠️ IndexNode is a STRING, not an AST node!");
              console.log("Looking up symbol:", node.indexNode);
              const indexSym = this.getSymbol(node.indexNode as string);
              console.log("Symbol found:", indexSym);
          }
      }
      console.log("=======================");

      if (!sym) {
          this.errors.push(`⛔ Error: Variable '${targetName}' not declared.`);
          return;
      }

      if (sym.isConst && sym.initialized) {
          this.errors.push(`⛔ Logic Error: Cannot assign to const variable '${targetName}'.`);
      }

      sym.initialized = true;

      // 🔥 FIX: Check array bounds on LEFT-HAND SIDE using the actual index AST node
      if (node.indexNode && sym.isArray) {
          let indexValue: number | null = null;
          
          // 🐛 WORKAROUND: If indexNode is a string, look it up in symbol table
          if (typeof node.indexNode === 'string') {
              const indexSym = this.getSymbol(node.indexNode as string);
              indexValue = (indexSym && indexSym.value !== undefined) ? indexSym.value : null;
              console.log("🔧 Using workaround for string indexNode, got value:", indexValue);
          } else {
              indexValue = this.evaluateConstant(node.indexNode);
          }
          
          console.log("🔍 Array bounds check - DETAILED:");
          console.log("  indexValue:", indexValue);
          console.log("  is2D:", sym.is2D);
          console.log("  arraySize:", sym.arraySize);
          console.log("  typeof arraySize:", typeof sym.arraySize);
          console.log("  Array.isArray(arraySize):", Array.isArray(sym.arraySize));
          
          if (indexValue !== null) {
              console.log("→ Passed: indexValue is not null");
              
              // 🔥 FIX: Handle arraySize as either a number OR an array [size]
              let actualSize: number | null = null;
              
              if (typeof sym.arraySize === 'number') {
                  actualSize = sym.arraySize;
                  console.log("→ arraySize is a number:", actualSize);
              } else if (Array.isArray(sym.arraySize)) {
                  if (sym.is2D && sym.arraySize.length === 2) {
                      // 2D array: [rows, cols]
                      actualSize = null; // Handle 2D separately
                      console.log("→ arraySize is 2D array:", sym.arraySize);
                  } else if (sym.arraySize.length === 1) {
                      // 1D array stored as [size]
                      actualSize = sym.arraySize[0];
                      console.log("→ arraySize is 1D array [size], extracting:", actualSize);
                  } else {
                      console.log("→ arraySize array has unexpected length:", sym.arraySize.length);
                  }
              }
              
              if (actualSize !== null && !sym.is2D) {
                  console.log("→ Passed: Is 1D array with size:", actualSize);
                  
                  const outOfBounds = indexValue < 0 || indexValue >= actualSize;
                  console.log("→ Checking:", indexValue, "< 0 ||", indexValue, ">=", actualSize, "=", outOfBounds);
                  
                  // 1D array bounds check
                  if (outOfBounds) {
                      const errorMsg = `🚨 Bounds Error: Array '${targetName}[${indexValue}]' is out of bounds (Size: ${actualSize}, Valid indices: 0-${actualSize - 1}).`;
                      console.log("❌❌❌ OUT OF BOUNDS! PUSHING ERROR:", errorMsg);
                      this.errors.push(errorMsg);
                      console.log("❌❌❌ Error pushed! Total errors now:", this.errors.length);
                  } else {
                      console.log("✅ Bounds OK: index", indexValue, "is in range [0," + (actualSize - 1) + "]");
                  }
              } else {
                  console.log("→ Failed: Could not determine array size or is 2D");
                  console.log("  actualSize:", actualSize);
                  console.log("  is2D:", sym.is2D);
              }
          } else {
              console.log("→ Failed: indexValue is null");
          }
          
          // Also mark the index as used
          if (typeof node.indexNode === 'string') {
              const indexSym = this.getSymbol(node.indexNode as string);
              if (indexSym) indexSym.used = true;
          } else {
              this.markUsageInExpression(node.indexNode);
          }
      }

      if (node.valueNode) {
          this.checkMathSafety(node.valueNode, `Assignment to ${node.name}`);
          this.markUsageInExpression(node.valueNode);
          
          const rhsType = this.inferType(node.valueNode);
          if (sym.type === 'int' && rhsType === 'float') {
              this.warnings.push(`⚠️ Precision Loss: Assigning float to int '${targetName}'.`);
          }
      }
  }

  private handleReturn(node: any) {
      if (this.state.currentReturnType === 'void' && node.argument) {
          this.errors.push(`⛔ TypeError: Void function cannot return a value.`);
      }
      if (this.state.currentReturnType !== 'void' && !node.argument) {
          this.errors.push(`⛔ TypeError: Non-void function must return a value.`);
      }
      if (node.argument) {
          this.markUsageInExpression(node.argument);
      }
  }

  // --- EXPRESSION ANALYSIS ---

  private markUsageInString(text: string) {
      if (!text) return;
      const matches = text.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g);
      if (matches) {
          matches.forEach(name => {
              const sym = this.getSymbol(name);
              if (sym) sym.used = true;
          });
      }
  }

  private markUsageInExpression(node: ASTNode | undefined) {
      if (!node) return;

      if (node.type === 'Identifier') {
          const sym = this.getSymbol(node.name);
          if (sym) {
              sym.used = true;
              if (!sym.initialized) {
                  this.warnings.push(`⚠️ Unsafe usage: Variable '${node.name}' is used before initialization.`);
              }
          }
      }
      
      if (node.type === 'ArrayAccess') {
          const arrNode = node as ArrayAccessNode;
          const sym = this.getSymbol(arrNode.name);
          
          // ✅ FIX: Mark the array itself as used
          if (sym) {
              sym.used = true;
          }
          
          // ✅ FIX: Enhanced bounds checking - handle arraySize as number OR array
          if (sym?.isArray && !sym.is2D) {
              let actualSize: number | null = null;
              
              if (typeof sym.arraySize === 'number') {
                  actualSize = sym.arraySize;
              } else if (Array.isArray(sym.arraySize) && sym.arraySize.length === 1) {
                  actualSize = sym.arraySize[0];
              }
              
              if (actualSize !== null) {
                  const idx = this.evaluateConstant(arrNode.index);
                  if (idx !== null && (idx < 0 || idx >= actualSize)) {
                      this.errors.push(`🚨 Bounds Error: Array '${arrNode.name}[${idx}]' is out of bounds (Size: ${actualSize}, Valid indices: 0-${actualSize - 1}).`);
                  }
              }
          }
          this.markUsageInExpression(arrNode.index);
      }

      if (node.type === 'ArrayAccess2D') {
          const arrNode = node as any;
          const sym = this.getSymbol(arrNode.name);
          
          // Mark the array as used
          if (sym) {
              sym.used = true;
          }
          
          if (sym?.is2D && Array.isArray(sym.arraySize)) {
              const idx1 = this.evaluateConstant(arrNode.index);
              const idx2 = this.evaluateConstant(arrNode.index2);
              
              if (idx1 !== null && (idx1 < 0 || idx1 >= sym.arraySize[0])) {
                  this.errors.push(`🚨 Bounds Error: 2D Array '${arrNode.name}[${idx1}][?]' first index is out of bounds (Size: ${sym.arraySize[0]}, Valid indices: 0-${sym.arraySize[0] - 1}).`);
              }
              if (idx2 !== null && (idx2 < 0 || idx2 >= sym.arraySize[1])) {
                  this.errors.push(`🚨 Bounds Error: 2D Array '${arrNode.name}[?][${idx2}]' second index is out of bounds (Size: ${sym.arraySize[1]}, Valid indices: 0-${sym.arraySize[1] - 1}).`);
              }
          }
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
          
          // Track recursion
          this.state.functionCallStack.push(call.callee);
          call.arguments.forEach(arg => this.markUsageInExpression(arg));
          this.state.functionCallStack.pop();
      }
  }

  // --- MATH & TYPES ENGINE ---

  private inferType(node: ASTNode): 'int' | 'float' | 'string' | 'bool' | null {
      if (node.type === 'Literal') {
          return (node as LiteralNode).dataType as any;
      }
      if (node.type === 'BinaryExpression') {
          const leftT = this.inferType((node as BinaryExpressionNode).left);
          const rightT = this.inferType((node as BinaryExpressionNode).right);
          if (leftT === 'float' || rightT === 'float') return 'float';
          if (leftT === 'string' || rightT === 'string') return 'string';
          return 'int';
      }
      if (node.type === 'Identifier') {
          const sym = this.getSymbol((node as IdentifierNode).name);
          return sym ? (sym.type as any) : null;
      }
      return null;
  }

  private evaluateConstant(node: ASTNode | undefined): number | null {
    if (!node) return null;
    
    if (node.type === 'Literal') {
        const lit = node as LiteralNode;
        return lit.dataType === 'int' || lit.dataType === 'float' ? Number(lit.value) : null;
    }
    
    if (node.type === 'Identifier') {
        const sym = this.getSymbol((node as IdentifierNode).name);
        return (sym && sym.value !== undefined) ? sym.value : null;
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
    
    return null;
  }

  private checkMathSafety(node: ASTNode | undefined, context: string) {
    if (!node) return; 

    if (node.type === 'BinaryExpression') {
        const bin = node as BinaryExpressionNode;
        
        this.checkMathSafety(bin.left, context);
        this.checkMathSafety(bin.right, context);

        if (bin.operator === '/' || bin.operator === '%') {
            const denom = this.evaluateConstant(bin.right);
            
            if (denom === 0) {
                const opName = bin.operator === '%' ? 'Modulo' : 'Division';
                const msg = `❌ Math Error: ${opName} by zero detected in ${context}.`;
                this.errors.push(msg);
            }
        }
    }
  }

  // --- SCOPE MANAGERS ---

  private enterScope() {
      this.scopeStack.push(new Map());
  }

  private exitScope() {
      const currentScope = this.scopeStack[this.scopeStack.length - 1];
      currentScope.forEach((info, name) => {
          if (!info.used && info.type !== 'function' && info.type !== 'typedef') {
              this.warnings.push(`⚠️ Clean Code: Variable '${name}' is declared but never used.`);
          }
      });
      this.scopeStack.pop();
  }

  private setSymbol(name: string, info: SymbolInfo) {
      this.scopeStack[this.scopeStack.length - 1].set(name, info);
  }

  private getSymbol(name: string): SymbolInfo | undefined {
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