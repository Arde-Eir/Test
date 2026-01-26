import  { useState, useRef } from 'react';
import './App.css'; 

// --- IMPORTS ---
// @ts-ignore
import * as parserModule from './grammar/cppParser.js'; 
import { SymbolTable } from './analysis/SymbolTable';
import { performTypeCheck } from './analysis/TypeChecker';
import { analyzeDataFlow } from './analysis/DataFlow';
import { checkMathSafety } from './analysis/SymbolicExe';
import { calculateScore, getRank } from './gamification/Score';
import { Visualizer } from './UI/Visualizer';

// ========================================================
// HELPER: Extract Tokens (Kept from your original code)
// ========================================================
const extractTokens = (node: any, tokens: any[] = []) => {
  if (!node) return tokens;
  if (node.type === 'Program') {
    tokens.push({ type: 'Keyword', value: 'int' }, { type: 'Identifier', value: 'main' }, { type: 'Separator', value: '()' }, { type: 'Separator', value: '{' });
    if (node.body) (Array.isArray(node.body) ? node.body : [node.body]).forEach((c:any) => extractTokens(c, tokens));
    tokens.push({ type: 'Separator', value: '}' });
  } else if (node.type === 'VariableDecl') {
    tokens.push({ type: 'Keyword', value: node.varType }, { type: 'Identifier', value: node.name }); 
    if (node.value) { tokens.push({ type: 'Operator', value: '=' }); extractTokens(node.value, tokens); }
    tokens.push({ type: 'Separator', value: ';' });
  } else if (node.type === 'Assignment') {
    tokens.push({ type: 'Identifier', value: node.name }, { type: 'Operator', value: '=' });
    extractTokens(node.value, tokens); tokens.push({ type: 'Separator', value: ';' });
  } else if (node.type === 'Integer') tokens.push({ type: 'Literal', value: node.value.toString() });
  else if (node.type === 'Identifier') tokens.push({ type: 'Identifier', value: node.name });
  return tokens;
};

// ========================================================
// MAIN APP COMPONENT
// ========================================================
function App() {
  // --- NAVIGATION STATE ---
  const [view, setView] = useState<'menu' | 'editor'>('menu');
  const [mode, setMode] = useState<'sandbox' | 'campaign'>('sandbox');
  const [currentLevel, setCurrentLevel] = useState(1);
  
  // --- EDITOR STATE ---
  const [code, setCode] = useState("");
  const [ast, setAst] = useState<any>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [gamification, setGamification] = useState<{score: number, rank: string} | null>(null);
  const [activeTab, setActiveTab] = useState('lexical');
  const [tokens, setTokens] = useState<any[]>([]);
  
  // --- MISSION STATE ---
  const [missionComplete, setMissionComplete] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // --- LEVELS DATA ---
  const LEVELS = {
    1: {
      title: "Level 1: The Beginning",
      desc: "Mission: Declare an integer variable named 'hp' and assign it the value 100.",
      starterCode: `int main() {\n  // Write your code here\n  \n  return 0;\n}`,
      check: (ast: any) => {
        // Simple check: Look for VariableDecl with name='hp' and value=100
        const vars = findNodes(ast, 'VariableDecl');
        const hpVar = vars.find((v: any) => v.name === 'hp' && v.value?.value === 100);
        return !!hpVar;
      }
    }
  };

  // Helper to find nodes in AST
  const findNodes = (node: any, type: string, list: any[] = []) => {
    if(!node) return list;
    if(node.type === type) list.push(node);
    if(node.body) (Array.isArray(node.body) ? node.body : [node.body]).forEach((c:any) => findNodes(c, type, list));
    return list;
  }

  // --- NAVIGATION HANDLERS ---
  const startSandbox = () => {
    setMode('sandbox');
    setCode(`int main() {\n  int x = 10;\n  int y = 5;\n  \n  while(x > 0) {\n    x = x - 1;\n  }\n  return 0;\n}`);
    setMissionComplete(false);
    setView('editor');
  };

  const startCampaign = () => {
    setMode('campaign');
    setCurrentLevel(1);
    setCode(LEVELS[1].starterCode);
    setMissionComplete(false);
    setView('editor');
  };

  const handleScroll = () => {
    if (textAreaRef.current && lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  };

  const handleAnalyze = () => {
    setConsoleOutput([]); 
    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    // 1. Dynamic Import Handling
    let parseFunction;
    if (parserModule && typeof parserModule.parse === 'function') parseFunction = parserModule.parse;
    else if (parserModule && (parserModule as any).default) parseFunction = (parserModule as any).default.parse;

    if (!parseFunction) { alert("Parser Error: Run 'npm run build:grammar' first!"); return; }

    try {
      log("1. Parsing Code...");
      const parsedAst = parseFunction(code);
      setAst(parsedAst);
      setTokens(extractTokens(parsedAst));

      log("2. Running Semantic Analysis...");
      const symbols = new SymbolTable();
      performTypeCheck(parsedAst, symbols);
      analyzeDataFlow(parsedAst);
      checkMathSafety(parsedAst);

      const score = calculateScore(parsedAst);
      setGamification({ score, rank: getRank(score) });
      
      log("✅ Analysis Complete: No Errors Found.");

      // --- MISSION CHECK (Campaign Only) ---
      if (mode === 'campaign') {
        const levelData = LEVELS[currentLevel as keyof typeof LEVELS];
        if (levelData && levelData.check(parsedAst)) {
           setMissionComplete(true);
           log("🏆 MISSION COMPLETE! Well done.");
        } else {
           setMissionComplete(false);
           log("ℹ️ Mission incomplete. Keep trying!");
        }
      }

    } catch (error: any) {
      log(`❌ Error: ${error.message}`);
      setAst(null);
    }
    setConsoleOutput(logs);
  };

  // --- RENDER: 1. MENU SCREEN ---
  if (view === 'menu') {
    return (
      <div className="menu-container">
        <div className="menu-card" onClick={startSandbox}>
          <div className="menu-icon">🛠️</div>
          <h2>Sandbox Mode</h2>
          <p>Experiment freely with code. No rules, just logic.</p>
        </div>
        <div className="menu-card" onClick={startCampaign}>
          <div className="menu-icon">⚔️</div>
          <h2>Campaign Mode</h2>
          <p>Start your journey. Complete missions to learn C++.</p>
        </div>
      </div>
    );
  }

  // --- RENDER: 2. EDITOR SCREEN ---
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="app-container">
      {/* Mission Overlay (Only in Campaign) */}
      {mode === 'campaign' && (
        <div className="mission-overlay">
          <h3 style={{color: '#61dafb', margin: '0 0 5px 0'}}>{LEVELS[currentLevel as keyof typeof LEVELS].title}</h3>
          <p style={{margin: 0, color: '#ddd'}}>{LEVELS[currentLevel as keyof typeof LEVELS].desc}</p>
          {missionComplete && <div style={{color: '#4ec9b0', fontWeight: 'bold', marginTop: '10px'}}>✅ MISSION ACCOMPLISHED</div>}
        </div>
      )}

      <header className="header">
        <div style={{display:'flex', alignItems:'center'}}>
            <button className="back-btn" onClick={() => setView('menu')}>← Menu</button>
            <h1>Code Sense {mode === 'sandbox' ? '🛠️ Sandbox' : `⚔️ Level ${currentLevel}`}</h1>
        </div>
      </header>

      <div className="main-content">
        <div className="editor-panel">
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

          <div className="logs-panel">
            <div className="tabs-header">
              <button className={`tab-btn ${activeTab === 'lexical' ? 'active' : ''}`} onClick={() => setActiveTab('lexical')}>Tokens</button>
              <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Logs</button>
            </div>
            <div className="tab-content">
               {activeTab === 'lexical' && tokens.map((t,i) => <span key={i} style={{marginRight:'5px', color:'#9cdcfe'}}>{t.value}</span>)}
               {activeTab === 'logs' && consoleOutput.map((l,i) => <div key={i} className={l.includes('❌')?'log-error':'log-success'}>{l}</div>)}
            </div>
          </div>
        </div>

        <div className="visualizer-panel">
          <div className="viz-header">
            <h3>Logic Map</h3>
            {gamification && <span className="badge">Rank: {gamification.rank}</span>}
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