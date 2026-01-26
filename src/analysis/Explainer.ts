// src/analysis/Explainer.ts

export function explainNode(node: any): string {
    if (!node) return "";

    switch (node.type) {
        // --- FUNCTIONS ---
        case 'FunctionDefinition':
            return `🆕 **New Skill Created:** You are defining a command named **'${node.name}'**. When called, it will produce **${node.returnType}** data.`;
        
        case 'ReturnStatement':
            return `↩️ **Finish Line:** The function stops here and sends the value **${synthesizeExpression(node.value)}** back to whoever called it.`;

        case 'FunctionCall':
            return `📞 **Call for Help:** You are running the command **'${node.name}'** with the inputs: (${node.args.map((a:any) => synthesizeExpression(a)).join(', ')}).`;

        // --- BASICS ---
        case 'VariableDeclaration':
            return `📦 **Box Created:** You made a box named **'${node.name}'** to hold **${node.varType}**s. ${node.value ? `You put **${synthesizeExpression(node.value)}** inside it.` : "It is currently empty."}`;

        case 'Assignment':
            return `✏️ **Update:** You changed the value inside **'${node.left.name}'** to **${synthesizeExpression(node.right)}**.`;

        // --- LOOPS & LOGIC ---
        case 'WhileStatement':
            return `🔄 **Loop:** "While **${synthesizeExpression(node.test)}** is true, keep doing the following..."`;

        case 'ForStatement':
            return `🔢 **Counted Loop:** Start at **${node.init ? explainNode(node.init) : 'start'}**; keep going while **${synthesizeExpression(node.test)}**; and after each round, **${synthesizeExpression(node.update)}**.`;

        case 'IfStatement':
            return `❓ **Decision:** If **${synthesizeExpression(node.test)}** is true, then do the first block. Otherwise, skip it.`;

        // --- I/O ---
        case 'OutputStatement':
            return `🖨️ **Print:** The computer displays **${synthesizeExpression(node.value)}** on the screen.`;

        case 'InputStatement':
            return `⌨️ **Listen:** The computer pauses and waits for the user to type something into **'${synthesizeExpression(node.value)}'**.`;

        default:
            return "";
    }
}

// Helper to make code look like "English" values
function synthesizeExpression(expr: any): string {
    if (!expr) return "nothing";
    if (expr.type === 'BinaryExpr') {
        const opMap: any = { '==': 'equals', '!=': 'is not', '>': 'is greater than', '<': 'is less than', '&&': 'AND', '||': 'OR' };
        const op = opMap[expr.operator] || expr.operator;
        return `(${synthesizeExpression(expr.left)} ${op} ${synthesizeExpression(expr.right)})`;
    }
    if (expr.type === 'UpdateExpr') return `${expr.arg.name} changes by 1`;
    if (expr.type === 'Identifier') return expr.name;
    if (expr.type === 'Literal') return expr.value.toString();
    if (expr.type === 'FunctionCall') return `${expr.name}()`;
    if (expr.type === 'ArrayAccess') return `${expr.name} at index ${synthesizeExpression(expr.index)}`;
    return "value"; 
}