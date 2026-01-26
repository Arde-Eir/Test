import { useState, useRef } from 'react';
import './App.css'; 

// --- 1. LOGIC ENGINE IMPORTS ---
// @ts-ignore
import * as parserModule from './grammar/cppParser.js'; 
import { SymbolTable } from './analysis/SymbolTable';
import { performTypeCheck } from './analysis/TypeChecker';
import { analyzeDataFlow } from './analysis/DataFlow';
import { checkMathSafety } from './analysis/SymbolicExe';
import { calculateScore} from './gamification/Score';
import { explainNode } from './analysis/Explainer';

// --- 2. UI COMPONENT IMPORTS ---
import { Visualizer } from './UI/Visualizer';
import { LoginScreen } from './UI/Login';
import { LevelSelect } from './UI/LevelSelect';
import { GameAvatar } from './UI/GameAvatar';
import { TutorialModal } from './UI/TutorialModal';

// ========================================================
// HELPER 1: Recursive Token Extractor
// ========================================================
const extractTokens = (node: any, tokens: any[] = []) => {
  if (!node) return tokens;

  // Handle Lists & Wrappers
  if (Array.isArray(node)) {
    node.forEach(child => extractTokens(child, tokens));
    return tokens;
  }
  
  if (node.type === 'Program') {
    if (node.functions) node.functions.forEach((f:any) => extractTokens(f, tokens));
    if (node.body) extractTokens(node.body, tokens);
    return tokens;
  }
  if (node.type === 'MainFunction') {
    tokens.push({ type: 'Keyword', value: 'int' }, { type: 'Identifier', value: 'main' }, { type: 'Separator', value: '()' });
    extractTokens(node.body, tokens);
    return tokens;
  }
  if (node.type === 'Block') {
    tokens.push({ type: 'Separator', value: '{' });
    extractTokens(node.body, tokens);
    tokens.push({ type: 'Separator', value: '}' });
    return tokens;
  }

  // Statements
  if (node.type === 'VariableDeclaration') {
    tokens.push({ type: 'Keyword', value: node.varType }, { type: 'Identifier', value: node.name }); 
    if (node.value) { tokens.push({ type: 'Operator', value: '=' }); extractTokens(node.value, tokens); }
    tokens.push({ type: 'Separator', value: ';' });
  } 
  else if (node.type === 'Assignment') {
    tokens.push({ type: 'Identifier', value: node.left.name }, { type: 'Operator', value: '=' });
    extractTokens(node.right, tokens); tokens.push({ type: 'Separator', value: ';' });
  }
  else if (node.type === 'WhileStatement') {
    tokens.push({ type: 'Keyword', value: 'while' }, { type: 'Separator', value: '(' });
    extractTokens(node.test, tokens);
    tokens.push({ type: 'Separator', value: ')' });
    extractTokens(node.body, tokens);
  }
  else if (node.type === 'IfStatement') {
    tokens.push({ type: 'Keyword', value: 'if' }, { type: 'Separator', value: '(' });
    extractTokens(node.test, tokens);
    tokens.push({ type: 'Separator', value: ')' });
    extractTokens(node.consequent, tokens);
    if (node.alternate) {
        tokens.push({ type: 'Keyword', value: 'else' });
        extractTokens(node.alternate, tokens);
    }
  }
  else if (node.type === 'OutputStatement') {
    tokens.push({ type: 'Keyword', value: 'cout' }, { type: 'Operator', value: '<<' });
    extractTokens(node.value, tokens);
    tokens.push({ type: 'Separator', value: ';' });
  }
  else if (node.type === 'ReturnStatement') {
    tokens.push({ type: 'Keyword', value: 'return' });
    if(node.value) extractTokens(node.value, tokens);
    tokens.push({ type: 'Separator', value: ';' });
  }

  // Expressions
  else if (node.type === 'BinaryExpr') {
    extractTokens(node.left, tokens);
    tokens.push({ type: 'Operator', value: node.operator });
    extractTokens(node.right, tokens);
  }
  else if (node.type === 'Literal') tokens.push({ type: 'Literal', value: node.value.toString() });
  else if (node.type === 'Identifier') tokens.push({ type: 'Identifier', value: node.name });
  
  return tokens;
};

// ========================================================
// HELPER 2: Extract Math Operations (Safety Check)
// ========================================================
const extractMathOps = (node: any, list: any[] = []) => {
  if (!node) return list;

  if (node.type === 'BinaryExpr') {
    let rightVal = '?';
    // Helper to get string representation for UI
    if (node.right.type === 'Identifier') rightVal = node.right.name;
    else if (node.right.type === 'Literal') rightVal = node.right.value.toString();
    else if (node.right.type === 'BinaryExpr') rightVal = '(Expr)';

    let leftVal = '?';
    if (node.left.type === 'Identifier') leftVal = node.left.name;
    else if (node.left.type === 'Literal') leftVal = node.left.value.toString();

    list.push({ 
      op: node.operator, 
      left: leftVal, 
      right: rightVal, 
      rightRaw: node.right.type === 'Literal' ? node.right.value : null, 
      rightName: node.right.type === 'Identifier' ? node.right.name : null,
      line: node.location?.start?.line || 0 
    });
  }

  // Recurse
  if (node.body) { (Array.isArray(node.body) ? node.body : [node.body]).forEach((child: any) => extractMathOps(child, list)); }
  if (node.left) extractMathOps(node.left, list);
  if (node.right) extractMathOps(node.right, list);
  if (node.test) extractMathOps(node.test, list);
  if (node.consequent) extractMathOps(node.consequent, list);
  if (node.alternate) extractMathOps(node.alternate, list);
  if (node.value) extractMathOps(node.value, list);
  if (node.functions) node.functions.forEach((f:any) => extractMathOps(f, list));

  return list;
};

// ========================================================
// HELPER 3: Extract Variables (Symbol Table View)
// ========================================================
const extractVariables = (node: any, list: any[] = []) => {
  if (!node) return list;
  if (node.type === 'VariableDeclaration') {
    list.push({ type: node.varType, name: node.name, line: node.location?.start?.line || 0 });
  }
  if (node.body) { (Array.isArray(node.body) ? node.body : [node.body]).forEach((child: any) => extractVariables(child, list)); }
  if (node.consequent) extractVariables(node.consequent, list);
  if (node.alternate) extractVariables(node.alternate, list);
  if (node.functions) node.functions.forEach((f:any) => extractVariables(f, list));
  return list;
};

// ========================================================
// MAIN APP COMPONENT
// ========================================================
function App() {
  // --- STATE ---
  const [user, setUser] = useState<{name: string, coins: number} | null>(null);
  const [view, setView] = useState<'login' | 'menu' | 'editor'>('login');
  const [mode, setMode] = useState<'sandbox' | 'campaign'>('sandbox');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Editor State
  const [code, setCode] = useState("");
  const [ast, setAst] = useState<any>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [gamification, setGamification] = useState<{score: number, rank: string, coins: number} | null>(null);
  
  // Advanced Analysis State
  const [activeTab, setActiveTab] = useState<'lexical' | 'syntactic' | 'symbols' | 'math' | 'logs'>('lexical');
  const [tokens, setTokens] = useState<any[]>([]);
  const [mathOps, setMathOps] = useState<any[]>([]);
  const [symbolData, setSymbolData] = useState<any[]>([]);
  const [solvedValues, setSolvedValues] = useState<Map<string, number>>(new Map());

  // UI State
  const [missionComplete, setMissionComplete] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'success' | 'error'>('idle');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // --- LEVELS ---
  const LEVELS = {
    1: {
      title: "Level 1: The Beginning",
      desc: "Mission: Declare an integer variable named 'hp' and assign it the value 100.",
      starterCode: `int main() {\n  // Write your code here\n  \n  return 0;\n}`,
      check: (ast: any) => {
        const vars = extractVariables(ast); 
        const hpVar = vars.find((v: any) => v.name === 'hp');
        return !!hpVar; 
      }
    }
  };

  // --- HANDLERS ---
  const handleLogin = (userData: {name: string, coins: number}) => {
    setUser(userData);
    setView('menu');
  };

  const handleLevelSelect = (selection: number | 'sandbox') => {
    if (selection === 'sandbox') {
      setMode('sandbox');
      setCode(`int main() {\n  int x = 10;\n  int y = 5;\n  \n  while(x > 0) {\n    x = x - 1;\n  }\n  return 0;\n}`);
      setShowTutorial(false);
    } else {
      setMode('campaign');
      setCurrentLevel(selection);
      // @ts-ignore
      setCode(LEVELS[selection].starterCode);
      setShowTutorial(true);
    }
    setMissionComplete(false);
    setAvatarState('idle');
    setConsoleOutput([]);
    setAst(null);
    setTokens([]);
    setMathOps([]);
    setSymbolData([]);
    setGamification(null);
    setView('editor');
  };

  const handleAnalyze = () => {
    setConsoleOutput([]); 
    setAvatarState('idle');
    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    // 1. Dynamic Parser Load
    let parseFunction;
    if (parserModule && typeof parserModule.parse === 'function') parseFunction = parserModule.parse;
    // @ts-ignore
    else if (parserModule && parserModule.default && parserModule.default.parse) parseFunction = parserModule.default.parse;

    if (!parseFunction) { 
        log("❌ FATAL ERROR: Parser not built. Run 'npm run build:parser'"); 
        setAvatarState('error');
        setConsoleOutput(logs);
        return; 
    }

    try {
      log("1. Parsing Code...");
      const parsedAst = parseFunction(code);
      setAst(parsedAst);

      // 2. Extract Data for Tabs
      setTokens(extractTokens(parsedAst));
      setMathOps(extractMathOps(parsedAst));
      setSymbolData(extractVariables(parsedAst));

      // 2b. Explainer (English Translation) -- FIXED HERE
      const explanations: string[] = [];
      const walk = (n: any) => {
          if(!n) return;
          const text = explainNode(n); 
          if(text) explanations.push(text);
          
          if(n.body) (Array.isArray(n.body) ? n.body : [n.body]).forEach(walk);
          if(n.consequent) walk(n.consequent);
          if(n.alternate) walk(n.alternate);
          if(n.functions) n.functions.forEach(walk);
      };
      walk(parsedAst);

      if (explanations.length > 0) {
          log("📘 ENGLISH TRANSLATION:");
          explanations.forEach(e => log(`> ${e}`));
      }

      // 3. Logic & Analysis
      log("2. Running Deep Analysis...");
      const symbols = new SymbolTable();
      performTypeCheck(parsedAst, symbols);
      analyzeDataFlow(parsedAst);
      
      // Math Safety & Memory Tracking
      const finalMemory = checkMathSafety(parsedAst);
      setSolvedValues(finalMemory);

      // 4. Scoring
      const gameStats = calculateScore(parsedAst);
      setGamification(gameStats);
      
      log(`✅ Analysis Complete!`);
      log(`💰 EARNED: ${gameStats.coins} COINS`);
      setAvatarState('success');

      // 5. Campaign Check
      if (mode === 'campaign') {
        // @ts-ignore
        const levelData = LEVELS[currentLevel];
        if (levelData && levelData.check(parsedAst)) {
           setMissionComplete(true);
           log("🏆 MISSION SUCCESS!");
        }
      }

    } catch (error: any) {
      log(`❌ Error: ${error.message}`);
      setAvatarState('error');
      setAst(null); 
    }
    setConsoleOutput(logs);
  };

  const handleScroll = () => {
    if (textAreaRef.current && lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  };

  const handleNodeHover = (location: any) => {
    if (!location || !textAreaRef.current) return;
    
    // 1. Sync Cursor with Node
    if (typeof location.start?.offset === 'number' && typeof location.end?.offset === 'number') {
        textAreaRef.current.focus();
        textAreaRef.current.setSelectionRange(location.start.offset, location.end.offset);
        
        // 2. Auto-scroll
        const lineHeight = 21; 
        const scrollPos = (location.start.line - 1) * lineHeight;
        textAreaRef.current.scrollTop = scrollPos - 60; 
    }
  };

  // --- VIEW RENDER ---
  if (view === 'login') return <LoginScreen onLogin={handleLogin} />;
  if (view === 'menu') return <LevelSelect playerRank={gamification?.rank || "NOVICE"} onSelectLevel={handleLevelSelect} />;

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);
  // @ts-ignore
  const currentLevelData = LEVELS[currentLevel];

  return (
    <div className="app-container">
      {mode === 'campaign' && showTutorial && (
        <TutorialModal title={currentLevelData.title} desc={currentLevelData.desc} onClose={() => setShowTutorial(false)} />
      )}

      {/* HEADER */}
      <header className="header">
        <div style={{display:'flex', alignItems:'center', gap: '20px'}}>
            <button className="back-btn" onClick={() => setView('menu')}>← Menu</button>
            <h1>{mode === 'sandbox' ? '🛠️ Sandbox' : `⚔️ ${currentLevelData?.title}`}</h1>
        </div>
        <div>
            PLAYER: {user?.name} | COINS: <span style={{color:'#e0af68'}}>{(user?.coins || 0) + (gamification?.coins || 0)}</span> | RANK: {gamification?.rank || "NOVICE"}
        </div>
      </header>

      <div className="main-content">
        <div className="editor-panel">
          
          <div style={{ borderBottom: '4px solid #414868', background: '#16161e' }}>
             <GameAvatar state={avatarState} />
          </div>

          {mode === 'campaign' && (
            <div style={{padding: '10px', background: '#24283b', borderBottom: '2px solid #565f89', color: '#e0af68', fontSize: '12px', fontFamily: '"Press Start 2P"'}}>
                <strong>🎯 MISSION:</strong> <span style={{fontFamily: '"Fira Code"', color: '#fff'}}>{currentLevelData.desc}</span>
            </div>
          )}

          <div className="code-editor-wrapper">
              <div className="line-numbers" ref={lineNumbersRef}>
                  {lineNumbers.map(num => ( <div key={num}>{num}</div> ))}
              </div>
              <textarea 
                ref={textAreaRef} 
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll} 
                spellCheck={false}
              />
          </div>

          <button onClick={handleAnalyze} className="analyze-btn">ANALYZE CODE 🚀</button>

          {/* ADVANCED LOGS PANEL */}
          <div className="logs-panel">
            <div className="tabs-header">
              <button className={`tab-btn ${activeTab === 'lexical' ? 'active' : ''}`} onClick={() => setActiveTab('lexical')}>1. Lexical</button>
              <button className={`tab-btn ${activeTab === 'syntactic' ? 'active' : ''}`} onClick={() => setActiveTab('syntactic')}>2. Syntactic</button>
              <button className={`tab-btn ${activeTab === 'symbols' ? 'active' : ''}`} onClick={() => setActiveTab('symbols')}>3. Symbols</button>
              <button className={`tab-btn ${activeTab === 'math' ? 'active' : ''}`} onClick={() => setActiveTab('math')}>4. Math</button>
              <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>5. Logs</button>
            </div>

            <div className="tab-content">
               {/* 1. LEXICAL VIEW */}
               {activeTab === 'lexical' && (
                  tokens.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>Token</th><th>Value</th></tr></thead>
                        <tbody>
                        {tokens.map((t,i) => (
                            <tr key={i}>
                                <td style={{color:'#bb9af7'}}>{t.type}</td>
                                <td style={{color:'#9cdcfe'}}>{t.value}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                  ) : <div style={{color:'#565f89'}}>No tokens generated yet.</div>
               )}

               {/* 2. SYNTACTIC VIEW */}
               {activeTab === 'syntactic' && <div className="json-view">{ast ? JSON.stringify(ast, null, 2) : "No AST."}</div>}
               
               {/* 3. SYMBOLS VIEW */}
               {activeTab === 'symbols' && (
                 symbolData.length > 0 ? (
                   <table className="data-table">
                      <thead><tr><th>Type</th><th>Variable</th><th>Line</th></tr></thead>
                      <tbody>
                        {symbolData.map((s, i) => ( <tr key={i}><td>{s.type}</td><td>{s.name}</td><td>{s.line}</td></tr> ))}
                      </tbody>
                   </table>
                 ) : <div>No variables detected.</div>
               )}

               {/* 4. MATH SAFETY VIEW */}
               {activeTab === 'math' && (
                 mathOps.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>Line</th><th>Op</th><th>Status</th></tr></thead>
                        <tbody>
                        {mathOps.map((op, i) => {
                            // Check Safety
                            const varVal = op.rightName ? solvedValues.get(op.rightName) : null;
                            const isUnsafe = (op.op === '/' || op.op === '%') && (op.rightRaw === 0 || varVal === 0);
                            return (
                                <tr key={i}>
                                    <td>{op.line}</td>
                                    <td>{op.left} {op.op} {op.right}</td>
                                    <td style={{color: isUnsafe ? '#f7768e' : '#73daca'}}>
                                        {isUnsafe ? '⚠️ UNSAFE' : '✅ SAFE'}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                 ) : <div>No math operations detected.</div>
               )}

               {/* 5. LOGS VIEW */}
               {activeTab === 'logs' && consoleOutput.map((l,i) => (
                   <div key={i} className={l.includes('❌')?'log-error': l.includes('💰') ? 'log-success' : ''}>
                       {l}
                   </div>
               ))}
            </div>
          </div>
        </div>

        <div className="visualizer-panel">
          <div className="viz-header">
            <h3>Logic Graph</h3>
            {missionComplete && <span className="badge">MISSION COMPLETE</span>}
          </div>
          <div className="canvas-container">
             <Visualizer ast={ast} onNodeHover={handleNodeHover} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;