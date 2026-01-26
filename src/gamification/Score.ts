export const calculateScore = (ast: any): number => {
    // Basic Complexity Scorer
    const json = JSON.stringify(ast);
    
    // Calculated based on nesting depth (how many {} blocks you have)
    const depth = (json.match(/Block/g) || []).length;
    
    return Math.max(0, 100 - (depth * 5));
};

export const getRank = (score: number) => {
    if (score >= 90) return "S (ARCHMAGE)";
    if (score >= 70) return "A (WIZARD)";
    if (score >= 50) return "B (APPRENTICE)";
    return "F (NOVICE)";
};