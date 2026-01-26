import { SymbolTable } from './SymbolTable';

export function performTypeCheck(ast: any, symbols: SymbolTable) {
  if (!ast) return;
  
  // 1. Register Typedefs First
  if (ast.typedefs) {
      ast.typedefs.forEach((t: any) => {
          const resolved = symbols.resolveType(t.originalType);
          symbols.defineType(t.name, resolved);
      });
  }

  // 2. Register Global Functions
  if (ast.functions) {
      ast.functions.forEach((f: any) => {
          symbols.declare(f.name, f.returnType);
      });
  }

  // 3. Start Traversing
  try {
      traverse(ast, symbols);
  } catch (err) {
      throw err;
  }
}

function traverse(node: any, symbols: SymbolTable) {
    if (!node) return;

    // --- SCOPES ---
    if (node.type === 'Program') {
        symbols.enterScope();
        if(node.body) traverse(node.body, symbols); // Main
        if(node.functions) node.functions.forEach((f:any) => traverse(f, symbols));
        symbols.exitScope();
        return;
    }

    if (node.type === 'MainFunction' || node.type === 'Block') {
        symbols.enterScope();
        if (node.body && Array.isArray(node.body)) {
             node.body.forEach((child: any) => traverse(child, symbols));
        }
        symbols.exitScope();
        return;
    }

    if (node.type === 'FunctionDefinition') {
        symbols.enterScope();
        node.params.forEach((p: any) => symbols.declare(p.name, p.varType));
        traverse(node.body, symbols);
        symbols.exitScope();
        return;
    }

    // --- VARIABLES & TYPEDEFS ---
    if (node.type === 'VariableDeclaration') {
        const resolvedType = symbols.resolveType(node.varType);
        const success = symbols.declare(node.name, resolvedType);
        
        if (!success) {
            throw new Error(`Type Error at line ${node.location?.start.line}: Variable '${node.name}' already declared.`);
        }

        if (node.value) {
            const valType = inferType(node.value, symbols);
            if (valType !== 'unknown' && valType !== resolvedType) {
                 if (!(resolvedType === 'float' && valType === 'int')) {
                    throw new Error(`Type Error at line ${node.location?.start.line}: Cannot assign '${valType}' to '${node.name}' (expects '${resolvedType}').`);
                 }
            }
        }
    }

    else if (node.type === 'Assignment') {
        // Handle Left Side (Identifier or ArrayAccess)
        const targetName = node.left.name; 
        const varType = symbols.lookup(targetName);
        
        if (!varType) {
             throw new Error(`Error at line ${node.location?.start.line}: Variable '${targetName}' is not declared.`);
        }
        
        const valueType = inferType(node.right, symbols); // NOTE: Assignment uses 'right' for value
        if (valueType !== 'unknown' && valueType !== varType) {
             throw new Error(`Type Error at line ${node.location?.start.line}: Cannot assign '${valueType}' to '${targetName}' (expects '${varType}').`);
        }
    }

    // --- CONTROL FLOW ---
    else if (node.type === 'IfStatement' || node.type === 'WhileStatement') {
        const condType = inferType(node.test, symbols);
        if (condType !== 'bool' && condType !== 'int') {
            throw new Error(`Type Error at line ${node.location?.start.line}: Condition must be bool or int.`);
        }
        
        symbols.enterScope();
        traverse(node.consequent || node.body, symbols);
        symbols.exitScope();

        if (node.alternate) {
            symbols.enterScope();
            traverse(node.alternate, symbols);
            symbols.exitScope();
        }
    }

    else if (node.type === 'ForStatement') {
        symbols.enterScope(); 
        if (node.init) traverse(node.init, symbols);
        if (node.test) {
            const t = inferType(node.test, symbols);
            if (t !== 'bool' && t !== 'int') throw new Error(`Type Error at line ${node.location?.start.line}: Loop condition must be bool or int.`);
        }
        traverse(node.body, symbols);
        if (node.update) traverse(node.update, symbols);
        symbols.exitScope();
    }
}

function inferType(node: any, symbols: SymbolTable): string {
    if (!node) return 'unknown';

    if (node.type === 'Literal') {
        if (typeof node.value === 'number') return Number.isInteger(node.value) ? 'int' : 'float';
        if (typeof node.value === 'string') return 'string';
        if (typeof node.value === 'boolean') return 'bool';
    }
    
    if (node.type === 'Identifier') return symbols.lookup(node.name) || 'unknown';

    // UPDATED: Matches Grammar "BinaryExpr"
    if (node.type === 'BinaryExpr') {
        const left = inferType(node.left, symbols);
        const right = inferType(node.right, symbols);
        // UPDATED: Matches Grammar "operator"
        if (['>', '<', '>=', '<=', '==', '!='].includes(node.operator)) return 'bool';
        if (left === 'float' || right === 'float') return 'float';
        return left;
    }

    return 'unknown';
}