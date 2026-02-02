import { 
  ASTNode, 
  VariableDeclarationNode, 
  AssignmentNode, 
  BinaryExpressionNode,
  LiteralNode,
  IdentifierNode,
  WhileLoopNode,
  ForLoopNode,
  IfStatementNode,
  CoutStatementNode,
  CinStatementNode,
  ReturnStatementNode,
  FunctionDefinitionNode,
  CallExpressionNode,
  ArrayAccessNode,
  UpdateExpressionNode,
  SwitchStatementNode,
  TypedefDeclarationNode,
  ElseIfClauseNode
} from '../types';

export class PedagogyManager {
  
  public translate(nodes: ASTNode[]): string[] {
    const narrative: string[] = [];
    
    const traverseNodes = (list: ASTNode[]) => {
      list.forEach(node => {
        
        // --- 1. STRUCTURES ---
        if (node.type === 'Program') {
            if (node.body) traverseNodes(node.body);
            return;
        }

        if (node.type === 'NamespaceDirective') {
            narrative.push(`📚 **Library:** I tell the computer to use the **'std'** (Standard) namespace.`);
            narrative.push(`   💡 **Why?** Without this, we would have to type "std::" before every command like cout or cin. It's a shortcut to keep code clean.`);
        }

        if (node.type === 'FunctionDefinition') {
            const func = node as FunctionDefinitionNode;
            const params = func.params.map(p => `a ${p.dataType} named '${p.name}'`).join(', ');
            narrative.push(`📘 **New Recipe:** I am defining a function called **'${func.name}'**.`);
            narrative.push(`   💡 **Concept:** Think of this as a reusable recipe. Instead of writing the same code twice, we wrap it here so we can "call" (cook) it whenever we want.`);
            if (params) {
                narrative.push(`   📥 **Ingredients:** This recipe takes ${params}.`);
            }
            if (func.body) traverseNodes(func.body);
            narrative.push(`📘 **End Recipe:** The '${func.name}' definition ends here.`);
        }

        if (node.type === 'Main') {
            narrative.push(`🚀 **Start:** I am entering **'int main()'**.`);
            narrative.push(`   💡 **How it works:** C++ always looks for 'main' first. It is the entry point where your program wakes up.`);
            if (node.body) traverseNodes(node.body);
            narrative.push(`🏁 **Finish:** The main program execution ends.`);
        }

        // --- 2. NEW: TYPEDEF ---
        if (node.type === 'TypedefDeclaration') {
            const typedef = node as TypedefDeclarationNode;
            narrative.push(`🔖 **Type Alias:** I create a nickname **'${typedef.newName}'** for the type **${typedef.baseType}**.`);
            narrative.push(`   💡 **Why?** This is a shorthand. Now instead of writing '${typedef.baseType}' every time, you can just write '${typedef.newName}'.`);
        }

        // --- 3. DATA & MEMORY ---
        if (node.type === 'VariableDeclaration') {
            const varNode = node as VariableDeclarationNode;
            
            if (varNode.is2D) {
                const sizes = Array.isArray(varNode.arraySize) ? varNode.arraySize : [0, 0];
                narrative.push(`🗄️ **2D Array:** I reserve a grid of **${sizes[0]} rows × ${sizes[1]} columns** named **'${varNode.name}'**.`);
                narrative.push(`   💡 **Concept:** A 2D Array is like a spreadsheet with rows and columns. Use ${varNode.name}[row][col] to access each cell.`);
            } else if (varNode.isArray) {
                narrative.push(`🗄️ **Array:** I reserve a row of **${varNode.arraySize}** spots named **'${varNode.name}'**.`);
                narrative.push(`   💡 **Concept:** An Array is like a street with houses. The variable name is the street name, and the index [0] is the house number.`);
            } else {
                let explanation = `📦 **Memory:** I create a box named **'${varNode.name}'** to hold a **${varNode.dataType}**.`;
                
                if (varNode.valueNode) {
                    const logic = this.explainMath(varNode.valueNode);
                    explanation += ` I immediately calculate ${logic} and store it inside.`;
                } else if (varNode.value) {
                    explanation += ` I initialize it with **${varNode.value}**.`;
                } else {
                    explanation += ` It is created empty.`;
                }
                narrative.push(explanation);
                
                if (varNode.isConst) {
                     narrative.push(`   💡 **Why Const?** You marked this as 'const' (constant). This tells the computer to lock this box so the value can NEVER change. It prevents accidental bugs.`);
                }
            }
        }

        if (node.type === 'Assignment') {
            const assignNode = node as AssignmentNode;
            const opMap: Record<string, string> = { 
                '=': 'replace it with', '+=': 'add', '-=': 'subtract', '*=': 'multiply by', '/=': 'divide by' 
            };
            const action = opMap[assignNode.operator] || 'update it with';
            const logic = this.explainMath(assignNode.valueNode || { type: 'Literal', value: assignNode.value, raw: assignNode.value, dataType: 'int' } as LiteralNode);
            
            narrative.push(`📝 **Update:** I find the variable **'${assignNode.name}'** and ${action} ${logic}.`);
            narrative.push(`   💡 **Note:** The single equals sign '=' is not for math equality. It is an **Assignment Operator**. It means "Take the value on the right and save it into the variable on the left."`);
        }

        // --- 4. INPUT / OUTPUT ---
        if (node.type === 'CoutStatement') {
            const coutNode = node as CoutStatementNode;
            const cleanVal = coutNode.value.replace(/<<\s*endl/g, " and create a new line");
            narrative.push(`🖥️ **Output:** I print: ${cleanVal}`);
            narrative.push(`   💡 **How:** 'cout' stands for "Character Output". The '<<' arrows point to the left, showing that data is flowing OUT to the screen.`);
        }

        if (node.type === 'CinStatement') {
            const cinNode = node as CinStatementNode;
            const vars = cinNode.value.join(", ");
            narrative.push(`⌨️ **Input:** I pause and wait for the user to type a value for **${vars}**.`);
            narrative.push(`   💡 **How:** 'cin' stands for "Character Input". The '>>' arrows point to the right, showing that data flows FROM the keyboard INTO your variable.`);
        }

        // --- 5. CONTROL FLOW ---
        if (node.type === 'WhileLoop') {
            const loopNode = node as WhileLoopNode;
            narrative.push(`🔄 **Loop (While):** I check if **(${loopNode.condition})** is true.`);
            narrative.push(`   💡 **Concept:** As long as this condition stays true, the computer will repeat the code block below forever. It's useful when we don't know exactly how many times we need to loop.`);
            if (loopNode.body) {
                narrative.push(`   ⤵️ *Start of Loop:*`);
                traverseNodes(loopNode.body);
                narrative.push(`   ⤴️ *End of Loop: Go back up and check condition again.*`);
            }
        }

        if (node.type === 'ForLoop') {
            const loopNode = node as ForLoopNode;
            narrative.push(`🔄 **Loop (For):** I start a counting loop [${loopNode.condition}].`);
            narrative.push(`   💡 **Why?** 'For' loops are perfect for counting. We have a starting number, a condition to stop, and a step (like i++) all in one line.`);
            if (loopNode.body) {
                narrative.push(`   ⤵️ *Start of Loop:*`);
                traverseNodes(loopNode.body);
                narrative.push(`   ⤴️ *End of Loop: Update counter and check condition.*`);
            }
        }

        // --- 6. NEW: ENHANCED IF WITH ELSE-IF ---
        if (node.type === 'IfStatement') {
            const ifNode = node as IfStatementNode;
            narrative.push(`❓ **Decision:** I check: Is **(${ifNode.condition})** true?`);
            narrative.push(`   💡 **Logic:** Computers make decisions by asking "Yes or No" questions. If Yes (True), we run the code block. If No (False), we check the next condition.`);
            
            if (ifNode.body) {
                narrative.push(`   ✅ *It is TRUE, so I do this:*`);
                traverseNodes(ifNode.body);
            }
            
            // NEW: Handle else-if clauses
            if (ifNode.elseIfs && ifNode.elseIfs.length > 0) {
                ifNode.elseIfs.forEach((elseIf, index) => {
                    narrative.push(`❓ **Else If:** Otherwise, I check: Is **(${elseIf.condition})** true?`);
                    if (elseIf.body) {
                        narrative.push(`   ✅ *It is TRUE, so I do this:*`);
                        traverseNodes(elseIf.body);
                    }
                });
            }
            
            // NEW: Handle else clause
            if (ifNode.alternate) {
                narrative.push(`❌ **Else:** None of the conditions above were true, so I do this instead:`);
                traverseNodes(ifNode.alternate);
            }
        }

        // --- 7. NEW: SWITCH STATEMENT ---
        if (node.type === 'SwitchStatement') {
            const switchNode = node as SwitchStatementNode;
            narrative.push(`🔀 **Switch:** I check the value of **(${switchNode.discriminant})** and jump to the matching case.`);
            narrative.push(`   💡 **Concept:** Switch is like a menu. Instead of many if-else statements, we compare one value against multiple options.`);
            
            if (switchNode.cases) {
                switchNode.cases.forEach((caseNode, index) => {
                    narrative.push(`   📍 **Case ${index + 1}:** If the value equals ${this.explainMath(caseNode.value)}:`);
                    if (caseNode.body) {
                        traverseNodes(caseNode.body);
                    }
                });
            }
            
            if (switchNode.defaultCase) {
                narrative.push(`   📍 **Default:** If none of the cases match, do this:`);
                if (switchNode.defaultCase.body) {
                    traverseNodes(switchNode.defaultCase.body);
                }
            }
        }

        if (node.type === 'BreakStatement') {
            narrative.push(`🛑 **Break:** I immediately exit the current loop or switch statement.`);
            narrative.push(`   💡 **Why?** This is like an emergency exit. It stops the loop early when we've found what we need.`);
        }

        if (node.type === 'ContinueStatement') {
            narrative.push(`⏭️ **Continue:** I skip the rest of this loop iteration and jump back to the condition check.`);
            narrative.push(`   💡 **Why?** This is like saying "skip this one, move to the next." It's useful when certain items don't need processing.`);
        }

        if (node.type === 'ReturnStatement') {
            const retNode = node as ReturnStatementNode;
            if (retNode.argument) {
                const logic = this.explainMath(retNode.argument);
                narrative.push(`👋 **Return:** I finish and send back ${logic}.`);
                narrative.push(`   💡 **Concept:** Functions are like workers. When they finish a task, they "return" the result to the boss (the main program).`);
            } else {
                narrative.push(`👋 **Return:** I finish and exit the function.`);
            }
        }

        // --- 8. DYNAMIC UPDATES ---
        if (node.type === 'UpdateExpression') {
             const upNode = node as UpdateExpressionNode;
             const isPlus = upNode.operator === '++';
             
             const action = isPlus ? "add 1 to" : "subtract 1 from";
             const emoji = isPlus ? "📈" : "📉";
             const title = isPlus ? "Increment" : "Decrement";

             narrative.push(`${emoji} **${title}:** I ${action} the variable **'${upNode.argument}'**.`);
             narrative.push(`   💡 **Why?** This updates the value of **${upNode.argument}**. In loops, this is usually the "step" that moves us closer to finishing the task.`);
        }

        // --- 9. NEW: RECURSION DETECTION ---
        if (node.type === 'ExpressionStatement' && node.expression?.type === 'CallExpression') {
            const call = node.expression as CallExpressionNode;
            narrative.push(`📞 **Function Call:** I call the function **'${call.callee}'** ${call.arguments.length > 0 ? 'with arguments' : 'with no arguments'}.`);
            narrative.push(`   💡 **Note:** If this function calls itself, this is **recursion** - like a mirror reflecting a mirror. Make sure there's a base case to stop!`);
        }

      });
    };
    
    traverseNodes(nodes);
    return narrative;
  }

  private explainMath(node: ASTNode): string {
      if (!node) return "something";
      
      // Base Cases
      if (node.type === 'Literal') {
          const lit = node as LiteralNode;
          return lit.dataType === 'string' ? `"${lit.value}"` : `**${lit.value}**`;
      }
      
      if (node.type === 'Identifier') {
          return `the value inside **'${(node as IdentifierNode).name}'**`;
      }
      
      if (node.type === 'ArrayAccess') {
          const arr = node as ArrayAccessNode;
          const indexLogic = this.explainMath(arr.index);
          return `the item in array **'${arr.name}'** at position ${indexLogic}`;
      }

      // NEW: 2D Array Access
      if (node.type === 'ArrayAccess2D') {
          const arr = node as any;
          const idx1 = this.explainMath(arr.index);
          const idx2 = this.explainMath(arr.index2);
          return `the item in 2D array **'${arr.name}'** at row ${idx1}, column ${idx2}`;
      }

      if (node.type === 'CallExpression') {
          const call = node as CallExpressionNode;
          return `the result from **${call.callee}()**`;
      }
      
      // Recursive Case (Binary Expressions)
      if (node.type === 'BinaryExpression') {
          const bin = node as BinaryExpressionNode;
          const left = this.explainMath(bin.left);
          const right = this.explainMath(bin.right);
          
          switch(bin.operator) {
              case '+': return `(${left} plus ${right})`;
              case '-': return `(${left} minus ${right})`;
              case '*': return `(${left} multiplied by ${right})`;
              case '/': return `(${left} divided by ${right})`;
              case '%': return `(the remainder of ${left} / ${right})`;
              case '==': return `(checking if ${left} equals ${right})`;
              case '!=': return `(checking if ${left} is different from ${right})`;
              case '<': return `(checking if ${left} is smaller than ${right})`;
              case '>': return `(checking if ${left} is bigger than ${right})`;
              case '<=': return `(checking if ${left} is smaller than or equal to ${right})`;
              case '>=': return `(checking if ${left} is bigger than or equal to ${right})`;
              case '&&': return `(checking if BOTH ${left} AND ${right} are true)`;
              case '||': return `(checking if EITHER ${left} OR ${right} is true)`;
              default: return `(${left} ${bin.operator} ${right})`;
          }
      }

      return "a calculated value";
  }

  // --- SCORE CALCULATOR ---
  public calculateScore(nodes: ASTNode[]): { score: number, advice: string } {
    let complexity = 0;
    let nestingDepth = 0;
    let advancedFeatures = 0;
    let recursionCount = 0;

    const traverse = (list: ASTNode[], depth: number) => {
      list.forEach((n: any) => {
        // Recurse into blocks
        if (n.body) {
            traverse(n.body, depth);
        }

        // Penalize Control Flow
        if (n.type === 'WhileLoop' || n.type === 'ForLoop' || n.type === 'IfStatement') {
            complexity += (1 + depth);
            if (depth > 1) nestingDepth = Math.max(nestingDepth, depth);
            if (n.body) traverse(n.body, depth + 1);
            
            // NEW: Penalize else-if chains
            if (n.type === 'IfStatement' && n.elseIfs) {
                complexity += n.elseIfs.length * 0.5;
            }
        }

        // NEW: Switch statements
        if (n.type === 'SwitchStatement') {
            complexity += (1 + depth);
            if (n.cases) {
                complexity += n.cases.length * 0.3; // Small penalty per case
            }
        }

        // Track Arrays and 2D Arrays
        if (n.type === 'ArrayAccess') {
            advancedFeatures++;
            complexity += 0.5;
        }
        
        // NEW: 2D Arrays are more complex
        if (n.type === 'ArrayAccess2D') {
            advancedFeatures += 2;
            complexity += 1;
        }

        // NEW: Recursion detection
        if (n.type === 'ExpressionStatement' && n.expression?.type === 'CallExpression') {
            // This would need context to detect actual recursion
            // For now, just track function calls
        }
      });
    };
    
    traverse(nodes, 0);
    
    // Normalize Score (100 is perfect, 0 is impossible to read)
    const rawScore = 100 - (complexity * 5);
    const score = Math.max(0, Math.min(100, rawScore));
    
    let advice = "✅ Great job! Your code logic is clear and linear.";
    
    if (score < 85) advice = "⚠️ Getting complicated. Try to split logic into smaller parts.";
    if (score < 60) advice = "❌ Hard to read. You have too many conditions inside conditions.";
    if (nestingDepth > 2) advice = "📉 Deep Nesting Alert: Avoid putting loops inside loops inside loops.";
    if (advancedFeatures > 5) advice = "💡 Nice use of Arrays! You are handling data structures well.";
    if (recursionCount > 0) advice = "🔄 Recursion detected! Make sure you have proper base cases.";

    return { score, advice };
  }
}