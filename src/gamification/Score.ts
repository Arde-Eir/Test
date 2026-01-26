// src/gamification/Score.ts

export const calculateScore = (ast: any): { score: number, coins: number, rank: string } => {
    if (!ast) return { score: 0, coins: 0, rank: "F (NOVICE)" };

    const json = JSON.stringify(ast);
    
    // 1. Complexity Points (Lines of logic)
    const logicNodes = (json.match(/(IfStatement|WhileStatement|ForStatement|FunctionDefinition)/g) || []).length;
    
    // 2. Variable Points
    const vars = (json.match(/VariableDeclaration/g) || []).length;

    // 3. Calculate Score (Base 10 + bonuses)
    let score = 10 + (logicNodes * 15) + (vars * 5);
    if (score > 100) score = 100; // Cap at 100

    // 4. Calculate Coins (Gold)
    const coins = Math.floor(score / 2); // 50 coins max per run

    return { 
        score, 
        coins, 
        rank: getRank(score) 
    };
};

export const getRank = (score: number) => {
    if (score >= 90) return "S (ARCHMAGE)";
    if (score >= 70) return "A (WIZARD)";
    if (score >= 50) return "B (APPRENTICE)";
    return "F (NOVICE)";
};