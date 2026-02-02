import React, { useState, useRef, useEffect, useCallback, ErrorInfo } from 'react';
import Editor, { useMonaco } from "@monaco-editor/react";
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  ReactFlowProvider,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

// --- CORE ENGINE IMPORTS ---
import { CodeSenseParser } from '../core/Parser';
import { StaticAnalyzer } from '../core/Analyzer';
import { PedagogyManager } from '../core/Pedagogy';
import { ImprovedSugiyamaLayout } from '../core/ImprovedSugiyama';
import { DatabaseService } from '../data/Database';

// --- TYPES ---
import { ASTNode } from '../types';

type LogEntry = {
  msg: string;
  type: 'info' | 'error' | 'warning';
};

type SafetyLog = {
  msg: string;
  status: 'pass' | 'fail';
  category?: 'math' | 'memory' | 'logic' | 'syntax' | 'warning' | 'validation' | 'compilation' | 'general';
};

type TokenInfo = {
  word: string;
  type: string;
  color: string;
};

type SymbolInfo = {
  name: string;
  type: string;
  init: boolean;
  isConst: boolean;
  isArray?: boolean;
};

type TabType = 'MAIN' | 'TOKENS' | 'AST' | 'SYMBOLS' | 'SAFETY';
type MobileTabType = 'EDITOR' | 'GRAPH' | 'LOGS';

import PixelNode from './PixelNode';
import './PixelTheme.css';

// --- ERROR BOUNDARY COMPONENT ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ 
          padding: '20px', 
          background: '#450a0a', 
          border: '2px solid #ef4444', 
          color: '#fff',
          fontFamily: "'Roboto Mono', monospace"
        }}>
          <h3>⚠️ Component Error</h3>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ 
              marginTop: '10px', 
              padding: '8px 16px', 
              background: '#ef4444', 
              border: 'none', 
              color: '#fff', 
              cursor: 'pointer' 
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- HELPER: Markdown Formatter ---
const LogMessage = ({ msg, type }: { msg: string; type?: 'info' | 'error' | 'warning' }) => {
  const parts = msg.split(/(\*\*.*?\*\*)/g);
  return (
    <div style={{ 
      padding: '6px 0', 
      borderBottom: '1px solid #333', 
      color: type === 'error' ? '#ff5555' : type === 'warning' ? '#facc15' : '#eee',
      fontFamily: "'Roboto Mono', monospace",
      fontSize: '0.8rem',
      lineHeight: '1.4'
    }}>
      {type === 'error' ? '❌ ' : type === 'warning' ? '⚠️ ' : '👉 '}
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: '#fff' }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

// --- HELPER: Visual Tokenizer ---
const classifyToken = (word: string): TokenInfo => {
  if (word.startsWith('//') || word.startsWith('/*')) 
    return { word, type: 'COMMENT', color: '#6b7280' };
  
  const keywords = ['int', 'float', 'string', 'while', 'if', 'else', 'return', 'cout', 'cin', 
                   'using', 'namespace', 'void', 'include', 'break', 'continue', 'const', 
                   'unsigned', 'long', 'short', 'char', 'bool', 'for', 'do', 'switch', 'case'];
  const operators = ['=', '+', '-', '*', '/', '<<', '>>', '==', '!=', '>', '<', '++', '--', '&&', '||'];
  
  if (keywords.includes(word)) return { word, type: 'KEYWORD', color: '#f472b6' }; 
  if (word === 'std') return { word, type: 'NAMESPACE', color: '#c084fc' }; 
  if (operators.includes(word)) return { word, type: 'OPERATOR', color: '#facc15' }; 
  if (!isNaN(Number(word)) && word !== '') return { word, type: 'NUMBER', color: '#4ade80' };   
  if (word.startsWith('"')) return { word, type: 'STRING', color: '#a78bfa' };   
  if (word.startsWith("'")) return { word, type: 'CHAR', color: '#fcd34d' };   
  if (word.match(/^[a-zA-Z_]\w*$/)) return { word, type: 'IDENTIFIER', color: '#60a5fa' }; 
  return { word, type: 'SYMBOL', color: '#9ca3af' }; 
};

// --- HELPER: Symbol Extractor ---
const extractSymbols = (nodes: ASTNode[]): SymbolInfo[] => {
  const symbols: SymbolInfo[] = [];
  const traverse = (list: ASTNode[]) => {
    list.forEach((n: any) => {
      if (n.type === 'VariableDeclaration') {
        symbols.push({ 
          name: n.name, 
          type: n.dataType, 
          init: !!n.valueNode || !!n.value, 
          isConst: n.isConst, 
          isArray: n.isArray 
        });
      }
      if (n.type === 'FunctionDefinition') {
        symbols.push({ 
          name: n.name, 
          type: `func(${n.returnType})`, 
          init: true, 
          isConst: true 
        });
      }
      if (n.body) traverse(n.body);
    });
  };
  traverse(nodes);
  return symbols;
};

// --- COMPONENT: Recursive Interactive Tree ---
const ASTTreeItem = ({ 
  label, 
  value, 
  isLast, 
  depth = 0 
}: { 
  label: string; 
  value: any; 
  isLast: boolean; 
  depth?: number;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);
  const keys = isObject 
    ? Object.keys(value).filter(k => k !== 'line' && k !== 'location' && k !== 'id') 
    : [];
  
  const labelColor = isArray ? '#fb923c' : (value?.type ? '#f472b6' : '#9ca3af');
  const valueColor = '#facc15';
  
  return (
    <div style={{ 
      paddingLeft: depth > 0 ? '20px' : '0', 
      position: 'relative', 
      fontFamily: "'Roboto Mono', monospace", 
      fontSize: '0.75rem', 
      lineHeight: '1.6' 
    }}>
      {/* Connection Lines */}
      {depth > 0 && (
        <div style={{ 
          position: 'absolute', 
          left: '0', 
          top: '-6px', 
          width: '12px', 
          height: '18px', 
          borderLeft: '1px solid #444', 
          borderBottom: isLast ? '1px solid #444' : 'none' 
        }} />
      )}
      {!isLast && depth > 0 && (
        <div style={{ 
          position: 'absolute', 
          left: '0', 
          top: '0', 
          bottom: '0', 
          borderLeft: '1px solid #444' 
        }} />
      )}

      {/* Node Row */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: isObject ? 'pointer' : 'default' 
        }} 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (isObject) setIsOpen(!isOpen); 
        }}
      >
        {/* Toggle Arrow */}
        {isObject && (
          <span style={{ marginRight: '5px', color: '#666', fontSize: '0.6rem' }}>
            {isOpen ? '▼' : '▶'}
          </span>
        )}

        {/* Label */}
        <span style={{ color: labelColor, fontWeight: value?.type ? 'bold' : 'normal' }}>
          {label}
        </span>

        {/* Value */}
        {!isObject && (
          <span style={{ marginLeft: '8px', color: valueColor }}>
            {String(value)}
          </span>
        )}
        
        {/* Type Badge */}
        {value?.type && (
          <span style={{ 
            marginLeft: '10px', 
            fontSize: '0.6rem', 
            color: '#444', 
            border: '1px solid #333', 
            padding: '0 4px', 
            borderRadius: '4px' 
          }}>
            {value.type}
          </span>
        )}
      </div>

      {/* Recursive Children */}
      {isObject && isOpen && (
        <div style={{ 
          borderLeft: depth === 0 ? '1px solid #333' : 'none', 
          marginLeft: depth === 0 ? '4px' : '0' 
        }}>
          {keys.map((key, i) => (
            <ASTTreeItem 
              key={key} 
              label={key} 
              value={value[key]} 
              isLast={i === keys.length - 1} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- HELPER: Group Tokens ---
const groupTokens = (tokens: TokenInfo[]): Record<string, TokenInfo[]> => {
  const groups: Record<string, TokenInfo[]> = { 
    'KEYWORDS': [], 
    'IDENTIFIERS': [], 
    'LITERALS': [], 
    'OPERATORS': [], 
    'SEPARATORS': [], 
    'COMMENTS': [] 
  };

  tokens.forEach(t => {
    if (t.type === 'KEYWORD' || t.type === 'NAMESPACE') {
      groups['KEYWORDS'].push(t);
    } else if (t.type === 'IDENTIFIER') {
      groups['IDENTIFIERS'].push(t);
    } else if (t.type === 'NUMBER' || t.type === 'STRING' || t.type === 'CHAR') {
      groups['LITERALS'].push(t);
    } else if (t.type === 'OPERATOR') {
      groups['OPERATORS'].push(t);
    } else if (t.type === 'COMMENT') {
      groups['COMMENTS'].push(t);
    } else {
      groups['SEPARATORS'].push(t);
    }
  });

  return groups;
};

// --- MAIN COMPONENT ---
const SandboxContent = ({ user, onBack }: { user: any; onBack: () => void }) => {
  // STATE
  const [code, setCode] = useState(
    `// Welcome to CodeSense C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n  int x = 5;\n  while(x > 0) {\n    cout << x << endl;\n    x--;\n  }\n  return 0;\n}`
  );
  
  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [symbolLogs, setSymbolLogs] = useState<SymbolInfo[]>([]);
  const [tokenLogs, setTokenLogs] = useState<TokenInfo[]>([]);
  const [safetyLogs, setSafetyLogs] = useState<SafetyLog[]>([]);
  const [astData, setAstData] = useState<ASTNode[] | null>(null);
  
  // GRAPH STATE
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  
  // MOBILE STATE
  const [mobileTab, setMobileTab] = useState<MobileTabType>('EDITOR');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // LOADING STATE
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // EDITOR REFS
  const editorRef = useRef<any>(null);
  const monaco = useMonaco(); 
  const decorationsRef = useRef<any[]>([]);
  
  // Monaco Editor Setup
  const handleEditorDidMount = useCallback((editor: any, monacoInstance: any) => {
    editorRef.current = editor;

    // Register custom language
    monacoInstance.languages.register({ id: 'codesense-cpp' });

    // Define tokenizer
    monacoInstance.languages.setMonarchTokensProvider('codesense-cpp', {
      tokenizer: {
        root: [
          [/\b(cout|cin|endl|std|vector|string|printf)\b/, 'custom-keyword'],
          [/\b(int|float|double|char|void|bool|auto|const|unsigned|long|short|return|if|else|while|for|break|continue|class|struct|public|private|do|switch|case|default|typedef|enum|sizeof|new|delete)\b/, 'keyword'],
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/\d+/, 'number'],
          [/[=><!~?:&|+\-*\/\^%]+/, 'operator'],
          [/[{}()\[\]]/, 'delimiter'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/"([^"\\]|\\.)*"/, 'string'],
          [/'([^'\\]|\\.)*'/, 'char'],
        ]
      }
    });

    // Define theme
    monacoInstance.editor.defineTheme('codesense-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'custom-keyword', foreground: '4ade80', fontStyle: 'bold' },
        { token: 'keyword', foreground: 'f472b6', fontStyle: 'bold' },
        { token: 'identifier', foreground: '60a5fa' },
        { token: 'number', foreground: 'facc15' },
        { token: 'string', foreground: 'a78bfa' },
        { token: 'char', foreground: 'fcd34d' },
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'operator', foreground: 'e5e7eb' },
        { token: 'delimiter', foreground: 'e5e7eb' },
      ],
      colors: {
        'editor.background': '#111111',
        'editor.foreground': '#eeeeee',
        'editor.lineHighlightBackground': '#222222',
        'editorCursor.foreground': '#facc15',
        'editor.selectionBackground': '#444444'
      }
    });

    monacoInstance.editor.setTheme('codesense-dark');
  }, []);

  // Node Interaction
  const onNodeMouseEnter = useCallback((_: any, node: Node) => {
    if (node.data?.narrative) {
      setHoverInfo(node.data.narrative);
    }
    
    if (node.data?.lineNumber && editorRef.current && monaco) {
      const line = node.data.lineNumber;
      try {
        editorRef.current.revealLineInCenter(line);
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current, 
          [{
            range: new monaco.Range(line, 1, line, 1000),
            options: { 
              isWholeLine: true, 
              className: 'myLineDecoration',
              glyphMarginClassName: 'myGlyphMarginClass'
            }
          }]
        );
      } catch (error) {
        console.error('Error highlighting line:', error);
      }
    }
  }, [monaco]);

  const onNodeMouseLeave = useCallback(() => {
    setHoverInfo(null);
    if (editorRef.current && decorationsRef.current) {
      try {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      } catch (error) {
        console.error('Error removing highlight:', error);
      }
    }
  }, []);

  // Screen resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Node types for ReactFlow
  const nodeTypes = React.useMemo(() => ({
    default: PixelNode,
    input: PixelNode,
    output: PixelNode,
    action: PixelNode,
    control: PixelNode,
    data: PixelNode
  }), []);

  // Analysis Engine
  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setLogs([]);
    setSafetyLogs([]);
    
    const tempLogs: LogEntry[] = [];
    const log = (msg: string, type: LogEntry['type'] = 'info') => {
      tempLogs.push({ msg, type });
    };

    try {
      // PHASE 1: LEXICAL ANALYSIS
      log("🔍 **PHASE 1: LEXICAL ANALYSIS**", 'info');
      log("...Scanning code text for valid C++ tokens...", 'info');
      
      const words = code.match(/\/\/.*|\/\*[\s\S]*?\*\/|"[^"]*"|'[^']*'|\w+|[^\s\w]/g) || [];
      const tokens = words.map(w => classifyToken(w));
      setTokenLogs(tokens);

      log(`✅ **LEXICAL PASSED:** Categorized ${tokens.length} tokens.`, 'info');

      // PHASE 2: SYNTACTIC ANALYSIS
      log("🌲 **PHASE 2: SYNTACTIC ANALYSIS**", 'info');
      log("...Constructing Abstract Syntax Tree (AST)...", 'info');

      const parser = new CodeSenseParser();
      const ast = parser.parse(code); 
      setAstData(ast);

      log("✅ **SYNTAX PASSED:** Valid Tree Structure generated.", 'info');

      // PHASE 3: SEMANTIC ANALYSIS
      log("🗂️ **PHASE 3: SYMBOL TABLE GENERATION**", 'info');
      
      const symbols = extractSymbols(ast || []);
      if (!symbols) {
        throw new Error("Symbol extraction failed.");
      }
      setSymbolLogs(symbols);

      // PHASE 4: SAFETY CHECK
      log("🛡️ **PHASE 4: SAFETY CHECK**", 'info');

      const analyzer = new StaticAnalyzer();
      const rawResults = analyzer.analyze(ast, code);

      console.log("🔍 DEBUG: Raw analyzer results:", rawResults);

      // Categorize all results by type
      const categorizedLogs: SafetyLog[] = rawResults.map((msg: string) => {
        let category: SafetyLog['category'] = 'general';
        let status: 'pass' | 'fail' = 'fail';

        // Math errors (division by zero, modulo by zero, bounds errors)
        if (msg.includes('Math Error') || msg.includes('Bounds Error')) {
          category = 'math';
          status = 'fail';
        }
        // Syntax errors (Python syntax, missing semicolons, etc.)
        else if (msg.includes('Syntax Error')) {
          category = 'syntax';
          status = 'fail';
        }
        // Type/Logic errors (return type mismatch, const assignment, scope errors)
        else if (msg.includes('TypeError') || msg.includes('Logic Error') || msg.includes('Scope Error') || msg.includes('Error:')) {
          category = 'logic';
          status = 'fail';
        }
        // Compile/Linker errors
        else if (msg.includes('Compile Error') || msg.includes('Linker Error')) {
          category = 'compilation';
          status = 'fail';
        }
        // Warnings (unused variables, precision loss, unsafe usage, etc.)
        else if (msg.includes('⚠️') || msg.includes('Warning') || msg.includes('Clean Code') || msg.includes('Unsafe')) {
          category = 'warning';
          status = 'pass'; // Warnings don't fail the code
        }

        return { msg, status, category };
      });

      setSafetyLogs(categorizedLogs);

      // Log all issues
      rawResults.forEach((msg: string) => {
        const isWarning = msg.includes('⚠️') || msg.includes('Warning') || msg.includes('Clean Code') || msg.includes('Unsafe');
        log(msg, isWarning ? 'warning' : 'error');
      });

      // Check for critical errors (anything that's not a warning)
      const criticalErrors = rawResults.filter((r: string) => 
        !(r.includes('⚠️') || r.includes('Warning') || r.includes('Clean Code') || r.includes('Unsafe'))
      );

      if (criticalErrors.length > 0) {
        log("❌ **SAFETY CHECK FAILED:** Critical errors detected.", 'error');
        setNodes([]);
        setEdges([]);
        setLogs(tempLogs);
        setIsAnalyzing(false);
        return;
      }

      // ✅ SUCCESS PATH (no critical errors, but may have warnings)
      if (criticalErrors.length === 0 && rawResults.length === 0) {
        // Perfect code - no errors or warnings
        setSafetyLogs([{ msg: "✅ Logic is valid. No errors or warnings detected.", status: 'pass', category: 'validation' }]);
        log("✅ **SAFETY CHECK PASSED:** Logic is valid.", 'info');
      } else if (criticalErrors.length === 0 && rawResults.length > 0) {
        // Has warnings but no errors
        log("⚠️ **SAFETY CHECK PASSED:** Logic is valid with warnings.", 'warning');
      }

      // PHASE 5: PEDAGOGY
      const pedagogy = new PedagogyManager();
      const narrative = pedagogy.translate(ast);
      
      log("----------------------------------", 'info');
      narrative.forEach(n => log(n, 'info'));

      // PHASE 6: VISUALIZATION
      const layout = new ImprovedSugiyamaLayout();
      const { nodes: lNodes, edges: lEdges } = layout.generateGraph(ast);
      setNodes(lNodes);
      setEdges(lEdges);

      // Save to database
      if (user?.id) {
        await DatabaseService.saveAnalysisReport(user.id, code, narrative);
      }
      
      if (isMobile) setMobileTab('GRAPH');

    } catch (err: any) {
      console.error("Analysis Crash:", err);
      let msg = err.message || 'Unknown error occurred';
      
      if (err.location) {
        msg = `Syntax Error at Line ${err.location.start.line}: ${err.message}`;
      }
      
      log(`❌ **CRITICAL FAILURE:** ${msg}`, 'error');
      
      const failLog: SafetyLog = {
        msg: msg,
        status: 'fail',
        category: 'syntax'
      };
      setSafetyLogs([failLog]);
      setActiveTab('SAFETY');
      
      if (isMobile) setMobileTab('LOGS');
    }

    setLogs(tempLogs);
    setIsAnalyzing(false);
  }, [code, user, setNodes, setEdges, isMobile]);

  // Render helpers
  const renderGraph = () => (
    <div className="pixel-card" style={{ 
      flex: 1, 
      position: 'relative', 
      minHeight: isMobile ? '500px' : '600px',
      height: '100%',
      width: '100%'
    }}>
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 5, 
        background: 'rgba(0,0,0,0.7)', 
        padding: '5px 10px', 
        borderRadius: '4px', 
        fontSize: '0.8rem',
        color: '#fff'
      }}>
        CONTROL FLOW VISUALIZER
      </div>
      
      {hoverInfo && (
        <div style={{ 
          position: 'absolute', 
          top: 50, 
          right: 20, 
          zIndex: 10, 
          background: 'rgba(0,0,0,0.9)', 
          border: '2px solid #facc15', 
          padding: '15px', 
          width: '250px', 
          color: '#fff', 
          borderRadius: '4px' 
        }}>
          <div style={{ 
            color: '#facc15', 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            fontSize: '0.8rem' 
          }}>
            logic_explainer.exe
          </div>
          <div style={{ lineHeight: '1.5', fontSize: '0.85rem' }}>
            {hoverInfo}
          </div>
        </div>
      )}
      
      <div style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px'
      }}>
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onNodeMouseEnter={onNodeMouseEnter} 
          onNodeMouseLeave={onNodeMouseLeave}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={4}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#222" gap={20} />
          <Controls style={{ border: '2px solid #333', borderRadius: 0 }} />
        </ReactFlow>
      </div>
    </div>
  );

  const renderEditor = () => (
    <div className="pixel-card" style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: isMobile ? '70vh' : 'auto' 
    }}>
      <div style={{ 
        padding: '8px 12px', 
        background: '#222', 
        borderBottom: '2px solid #333', 
        fontSize: '0.8rem', 
        color: '#888' 
      }}>
        MAIN.CPP
      </div>
      
      <div style={{ flex: 1 }}>
        <ErrorBoundary>
          <Editor 
            height="100%" 
            theme="vs-dark" 
            defaultLanguage="cpp" 
            value={code} 
            onChange={(v) => setCode(v || "")} 
            onMount={handleEditorDidMount}
            options={{ 
              automaticLayout: true, 
              minimap: { enabled: false }, 
              fontSize: 13, 
              fontFamily: "'Roboto Mono', monospace",
              scrollBeyondLastLine: false,
              wordWrap: 'on'
            }} 
          />
        </ErrorBoundary>
      </div>
      
      <button 
        className="pixel-btn" 
        style={{ width: '100%', borderTop: '2px solid #fff' }} 
        onClick={handleAnalyze}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? 'ANALYZING...' : 'RUN ANALYSIS »'}
      </button>
    </div>
  );

  const renderLogs = () => (
    <div className="pixel-card" style={{ 
      height: isMobile ? '100%' : '35%', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* Tab Header */}
      <div style={{ 
        display: 'flex', 
        background: '#222', 
        borderBottom: '2px solid #333', 
        overflowX: 'auto' 
      }}>
        {(['MAIN', 'TOKENS', 'AST', 'SYMBOLS', 'SAFETY'] as TabType[]).map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: '8px 15px', 
              cursor: 'pointer', 
              fontSize: '0.6rem', 
              fontFamily: "'Press Start 2P', cursive", 
              whiteSpace: 'nowrap',
              color: activeTab === tab ? '#000' : '#888', 
              background: activeTab === tab ? '#facc15' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div 
        className="scroll-content" 
        style={{ 
          padding: '15px', 
          flex: 1, 
          overflowY: 'auto', 
          fontFamily: "'Roboto Mono', monospace", 
          fontSize: '0.8rem' 
        }}
      >
        {/* MAIN Tab */}
        {activeTab === 'MAIN' && (
          logs.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center' }}>
              Run analysis to see results...
            </div>
          ) : (
            logs.map((l, i) => <LogMessage key={i} msg={l.msg} type={l.type} />)
          )
        )}

        {/* TOKENS Tab */}
        {activeTab === 'TOKENS' && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '15px', 
            paddingBottom: '10px' 
          }}>
            {Object.entries(groupTokens(tokenLogs)).map(([category, items]) => (
              <div 
                key={category} 
                style={{ 
                  background: '#1a1a1a', 
                  border: '2px solid #333', 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '160px'
                }}
              >
                <div style={{ 
                  background: '#222', 
                  padding: '6px 10px', 
                  borderBottom: '2px solid #333', 
                  fontSize: '0.65rem', 
                  color: '#888',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold'
                }}>
                  <span>{category}</span>
                  <span style={{ color: '#facc15' }}>{items.length}</span>
                </div>

                <div 
                  className="scroll-content" 
                  style={{ 
                    padding: '8px', 
                    overflowY: 'auto', 
                    flex: 1 
                  }}
                >
                  {items.length === 0 ? (
                    <span style={{ 
                      color: '#444', 
                      fontSize: '0.7rem', 
                      fontStyle: 'italic' 
                    }}>
                      None found
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {items.map((t, k) => (
                        <span 
                          key={k} 
                          style={{ 
                            color: t.color, 
                            background: 'rgba(255,255,255,0.08)', 
                            padding: '2px 6px', 
                            borderRadius: '2px', 
                            fontSize: '0.7rem', 
                            fontFamily: 'monospace',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {t.word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AST Tab */}
        {activeTab === 'AST' && (
          <div style={{ padding: '10px' }}>
            {astData ? (
              <ASTTreeItem label="root" value={astData} isLast={true} />
            ) : (
              <div style={{ color: '#555', fontStyle: 'italic' }}>
                No AST generated yet...
              </div>
            )}
          </div>
        )}

        {/* SYMBOLS Tab */}
        {activeTab === 'SYMBOLS' && (
          symbolLogs.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center' }}>
              No symbols detected...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  textAlign: 'left', 
                  color: '#666', 
                  borderBottom: '1px solid #444' 
                }}>
                  <th style={{ padding: '5px' }}>NAME</th>
                  <th>TYPE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {symbolLogs.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '5px', color: '#facc15' }}>{s.name}</td>
                    <td style={{ color: '#60a5fa' }}>{s.type}</td>
                    <td style={{ color: s.isConst ? '#f472b6' : '#4ade80' }}>
                      {s.isConst ? '🔒 CONST' : '📝 MUTABLE'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* SAFETY Tab */}
        {activeTab === 'SAFETY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Result Banner */}
            <div style={{ 
              padding: '15px', 
              background: safetyLogs.some(s => s.status === 'fail') ? '#450a0a' : '#052e16', 
              border: safetyLogs.some(s => s.status === 'fail') 
                ? '2px solid #ef4444' 
                : '2px solid #4ade80', 
              textAlign: 'center', 
              fontWeight: 'bold', 
              color: '#fff',
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              {safetyLogs.some(s => s.status === 'fail') ? '⚠️ INVALID CODE ❌' : '✅ VALID CODE ✅'}
            </div>
            
            {safetyLogs.length === 0 ? (
              <div style={{ 
                color: '#555', 
                textAlign: 'center',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No safety checks performed yet. Click "RUN ANALYSIS" to check your code.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {safetyLogs.map((s, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px', 
                      background: s.status === 'fail' ? '#2d0a0a' : '#0a2d1a', 
                      border: `2px solid ${s.status === 'pass' ? '#4ade80' : '#ef4444'}`,
                      borderLeft: `6px solid ${s.status === 'pass' ? '#4ade80' : '#ef4444'}`,
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '0.7rem',
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        {s.category || 'General'}
                      </span>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: s.status === 'pass' ? '#4ade80' : '#ef4444',
                        fontSize: '0.9rem'
                      }}>
                        {s.status === 'pass' ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                    <span style={{
                      color: '#fff',
                      fontSize: '0.85rem',
                      lineHeight: '1.4'
                    }}>
                      {s.msg}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Help message for errors */}
            {safetyLogs.some(s => s.status === 'fail') && (
              <div style={{
                marginTop: '10px',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#aaa',
                fontSize: '0.75rem',
                lineHeight: '1.5'
              }}>
                <div style={{ color: '#facc15', fontWeight: 'bold', marginBottom: '6px' }}>
                  💡 How to fix:
                </div>
                {safetyLogs.filter(s => s.category === 'math').length > 0 && (
                  <div>• Math errors: Check for division by zero or invalid arithmetic operations</div>
                )}
                {safetyLogs.filter(s => s.category === 'syntax').length > 0 && (
                  <div>• Syntax errors: Review code structure and fix syntax issues</div>
                )}
                {safetyLogs.filter(s => s.category === 'logic').length > 0 && (
                  <div>• Logic errors: Verify your program logic and control flow</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className="sandbox-container" 
      style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        background: '#111' 
      }}
    >
      {/* Header */}
      <header 
        className="pixel-card" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '10px 20px', 
          fontSize: '0.7rem', 
          borderBottom: '4px solid #facc15', 
          zIndex: 10 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} className="pixel-btn">MENU</button>
          <span style={{ color: '#fff' }}>📦 CODESENSE</span>
        </div>
        
        {!isMobile && (
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            alignItems: 'center', 
            color: '#aaa' 
          }}>
            <span>
              USER: <span style={{ color: '#facc15' }}>
                {user?.gamertag || 'GUEST'}
              </span>
            </span>
          </div>
        )}
      </header>

      {/* Dynamic Layout */}
      {isMobile ? (
        <div style={{ 
          flex: 1, 
          padding: '10px', 
          paddingBottom: '80px', 
          overflow: 'hidden' 
        }}>
          {mobileTab === 'EDITOR' && renderEditor()}
          {mobileTab === 'GRAPH' && (
            <ErrorBoundary>
              {renderGraph()}
            </ErrorBoundary>
          )}
          {mobileTab === 'LOGS' && renderLogs()}
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          padding: '20px', 
          flex: 1, 
          overflow: 'hidden' 
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px', 
            width: '40%' 
          }}>
            {renderEditor()}
            {renderLogs()}
          </div>
          
          <ErrorBoundary>
            {renderGraph()}
          </ErrorBoundary>
        </div>
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <div className="sandbox-mobile-nav">
          <div 
            className={`sandbox-mobile-nav-item ${mobileTab === 'EDITOR' ? 'active' : ''}`} 
            onClick={() => setMobileTab('EDITOR')}
          >
            📝 CODE
          </div>
          <div 
            className={`sandbox-mobile-nav-item ${mobileTab === 'GRAPH' ? 'active' : ''}`} 
            onClick={() => setMobileTab('GRAPH')}
          >
            🕸️ FLOW
          </div>
          <div 
            className={`sandbox-mobile-nav-item ${mobileTab === 'LOGS' ? 'active' : ''}`} 
            onClick={() => setMobileTab('LOGS')}
          >
            📟 LOGS
          </div>
        </div>
      )}
    </div>
  );
};

// Main export with ReactFlow provider
export const Sandbox = (props: any) => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <ReactFlowProvider>
        <SandboxContent {...props} />
      </ReactFlowProvider>
    </div>
  );
};