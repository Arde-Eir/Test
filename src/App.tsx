import { useState, useRef} from 'react';
import './App.css'; 

// --- 1. LOGIC ENGINE IMPORTS ---
// @ts-ignore
import * as parserModule from './grammar/cppParser.js'; 
import { SymbolTable } from './analysis/SymbolTable';
import { performTypeCheck } from './analysis/TypeChecker';
import { analyzeDataFlow } from './analysis/DataFlow';
import { checkMathSafety } from './analysis/SymbolicExe';
import { calculateScore } from './gamification/Score';
import { explainNode } from './analysis/Explainer';

// --- 2. UI COMPONENT IMPORTS ---
import { Visualizer } from './UI/Visualizer';
import { LoginScreen } from './UI/Login';
import { LevelSelect } from './UI/LevelSelect';
import { GameAvatar } from './UI/GameAvatar';
import { TutorialModal } from './UI/TutorialModal';

// ========================================================
// HELPER: Recursive Token Extractor (The "Lexer" View)
// ========================================================
const extractTokens = (node: any, tokens: any[] = []) => {
  if (!node) return tokens;

  // A. Handle Arrays (Block bodies, Function lists)
  if (Array.isArray(node)) {
    node.forEach(child => extractTokens(child, tokens));
    return tokens;
  }

  // B. Handle Structural Wrappers
  if (node.type === 'Program') {
    if (node.functions) node.functions.forEach((f: any) => extractTokens(f, tokens));
    if (node.body) extractTokens(node.body, tokens); // Main
    return tokens;
  }

  if (node.type === 'MainFunction') {
    tokens.push({ type: 'Keyword', value: 'int' }, { type: 'Identifier', value: 'main' }, { type: 'Separator', value: '()' });
    extractTokens(node.body, tokens);
    return tokens;
  }

  if (node.type === 'FunctionDefinition') {
    tokens.push({ type: 'Keyword', value: node.returnType }, { type: 'Identifier', value: node.name }, { type: 'Separator', value: '()' });
    extractTokens(node.body, tokens);
    return tokens;
  }

  if (node.type === 'Block') {
    tokens.push({ type: 'Separator', value: '{' });
    extractTokens(node.body, tokens);
    tokens.push({ type: 'Separator', value: '}' });
    return tokens;
  }

  // C. Handle Statements & Logic
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

  // D. Handle Expressions (Leaves)
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
// MAIN APP COMPONENT
// ========================================================
function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState<{name: string, coins: number} | null>(null);
  const [view, setView] = useState<'login' | 'menu' | 'editor'>('login');
  
  const [mode, setMode] = useState<'sandbox' | 'campaign'>('sandbox');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const [code, setCode] = useState("");
  const [ast, setAst] = useState<any>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [gamification, setGamification] = useState<{score: number, rank: string, coins: number} | null>(null);
  
  const [activeTab, setActiveTab] = useState('lexical');
  const [tokens, setTokens] = useState<any[]>([]);
  
  const [missionComplete, setMissionComplete] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'success' | 'error'>('idle');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // --- LEVEL DEFINITIONS ---
  const findNodes = (node: any, type: string, list: any[] = []) => {
    if(!node) return list;
    if(node.type === type) list.push(node);
    if(node.body) (Array.isArray(node.body) ? node.body : [node.body]).forEach((c:any) => findNodes(c, type, list));
    if(node.functions) node.functions.forEach((f:any) => findNodes(f.body, type, list));
    return list;
  }

  const LEVELS = {
    1: {
      title: "Level 1: The Beginning",
      desc: "Mission: Declare an integer variable named 'hp' and assign it the value 100.",
      starterCode: `int main() {\n  // Write your code here\n  \n  return 0;\n}`,
      check: (ast: any) => {
        const vars = findNodes(ast, 'VariableDeclaration'); 
        const hpVar = vars.find((v: any) => v.name === 'hp');
        // Simple check: does the variable exist?
        return !!hpVar; 
      }
    }
  };

  // --- ACTION HANDLERS ---
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
    setGamification(null);
    setView('editor');
  };

  const handleAnalyze = () => {
    setConsoleOutput([]); 
    setAvatarState('idle');
    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    // 1. Build & Parse Check
    let parseFunction;
    if (parserModule && typeof parserModule.parse === 'function') parseFunction = parserModule.parse;
    // @ts-ignore
    else if (parserModule && parserModule.default && parserModule.default.parse) parseFunction = parserModule.default.parse;

    if (!parseFunction) { 
        log("❌ Parser Error: Run 'npm run build:parser' first."); 
        setAvatarState('error');
        setConsoleOutput(logs);
        return; 
    }

    try {
      log("1. Parsing Code Structure...");
      const parsedAst = parseFunction(code);
      setAst(parsedAst);
      setTokens(extractTokens(parsedAst));

      // 2. "Sandbox Mode" Explainer (English Translation)
      log("2. Translating Logic to English...");
      const explanations: string[] = [];
      const walk = (n: any) => {
          if(!n) return;
          const text = explainNode(n); // Call the Explainer
          if(text) explanations.push(text);
          
          if(n.body) (Array.isArray(n.body) ? n.body : [n.body]).forEach(walk);
          if(n.consequent) walk(n.consequent);
          if(n.alternate) walk(n.alternate);
          if(n.functions) n.functions.forEach(walk);
      };
      walk(parsedAst);

      if (explanations.length > 0) {
          log("📘 CODE EXPLANATION:");
          explanations.forEach(e => log(`> ${e}`));
      }

      // 3. Deep Analysis (Type Check, Data Flow, Math Safety)
      log("3. Running Deep Analysis...");
      const symbols = new SymbolTable();
      performTypeCheck(parsedAst, symbols);
      analyzeDataFlow(parsedAst);
      checkMathSafety(parsedAst);

      // 4. Gamification (Score & Coins)
      const gameStats = calculateScore(parsedAst);
      setGamification(gameStats);
      
      log(`✅ Analysis Complete: Perfect Syntax!`);
      log(`💰 REWARD: ${gameStats.coins} COINS ADDED`);
      setAvatarState('success');

      // 5. Campaign Logic (Win Condition)
      if (mode === 'campaign') {
        // @ts-ignore
        const levelData = LEVELS[currentLevel];
        if (levelData && levelData.check(parsedAst)) {
           setMissionComplete(true);
           log("🏆 MISSION SUCCESS! Level Cleared.");
        } else {
           setMissionComplete(false);
           log("ℹ️ Mission incomplete. Check requirements.");
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

  // --- VIEW ROUTING ---
  if (view === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (view === 'menu') {
    return <LevelSelect playerRank={gamification?.rank || "NOVICE"} onSelectLevel={handleLevelSelect} />;
  }

  // --- EDITOR VIEW ---
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);
  // @ts-ignore
  const currentLevelData = LEVELS[currentLevel];

  return (
    <div className="app-container">
      {/* Tutorial Modal */}
      {mode === 'campaign' && showTutorial && (
        <TutorialModal 
            title={currentLevelData.title} 
            desc={currentLevelData.desc} 
            onClose={() => setShowTutorial(false)} 
        />
      )}

      {/* Top Header */}
      <header className="header">
        <div style={{display:'flex', alignItems:'center', gap: '20px'}}>
            <button className="back-btn" onClick={() => setView('menu')}>← Menu</button>
            <h1>{mode === 'sandbox' ? '🛠️ Sandbox Mode' : `⚔️ ${currentLevelData?.title}`}</h1>
        </div>
        <div>
            PLAYER: {user?.name} | 
            COINS: <span style={{color:'#e0af68'}}>{(user?.coins || 0) + (gamification?.coins || 0)}</span> | 
            RANK: {gamification?.rank || "NOVICE"}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="main-content">
        
        {/* Left Panel: Avatar, Editor, Logs */}
        <div className="editor-panel">
          {/* Avatar Feedback Area */}
          <div style={{ borderBottom: '4px solid #414868', background: '#16161e' }}>
             <GameAvatar state={avatarState} />
          </div>

          {/* Code Editor */}
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

          {/* Action Button */}
          <button onClick={handleAnalyze} className="analyze-btn">RUN ANALYSIS 🚀</button>

          {/* Logs & Token Tabs */}
          <div className="logs-panel">
            <div className="tabs-header">
              <button className={`tab-btn ${activeTab === 'lexical' ? 'active' : ''}`} onClick={() => setActiveTab('lexical')}>Tokens</button>
              <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Logs</button>
            </div>
            <div className="tab-content">
               {activeTab === 'lexical' && (
                  tokens.length > 0 ? tokens.map((t,i) => (
                    <span key={i} style={{marginRight:'5px', color: t.type === 'Keyword' ? '#bb9af7' : '#9cdcfe'}}>
                        {t.value}
                    </span>
                  )) : <div style={{color:'#565f89'}}>No tokens generated yet.</div>
               )}
               {activeTab === 'logs' && consoleOutput.map((l,i) => (
                   <div key={i} className={l.includes('❌')?'log-error': l.includes('💰') ? 'log-success' : ''} style={{marginBottom:'4px'}}>
                       {l}
                   </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Logic Visualizer */}
        <div className="visualizer-panel">
          <div className="viz-header">
            <h3>Logic Graph</h3>
            {missionComplete && <span className="badge">MISSION COMPLETE</span>}
          </div>
          <div className="canvas-container">
             <Visualizer ast={ast} onNodeHover={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;