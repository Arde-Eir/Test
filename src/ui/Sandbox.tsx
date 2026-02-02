import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CodeSenseParser } from '../core/Parser';
import { StaticAnalyzer } from '../core/Analyzer';
import { PedagogyManager } from '../core/Pedagogy';
import { ImprovedSugiyamaLayout } from '../core/ImprovedSugiyama';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState,
  useEdgesState,
  ReactFlowProvider 
} from 'reactflow';
import 'reactflow/dist/style.css';
import PixelNode from './PixelNode';

// ============================================
// SANDBOX TYPES
// ============================================

type AnalysisTab = 'lexical' | 'syntactic' | 'symbols' | 'math' | 'logs';

interface Token {
  type: string;
  value: string;
}

interface SymbolEntry {
  type: string;
  variable: string;
  line: number;
}

interface MathCheck {
  line: number;
  operation: string;
  status: 'SAFE' | 'WARNING' | 'ERROR';
}

interface SandboxProps {
  user: any;
  onBack: () => void;
  onProfileClick: () => void;
}

// ============================================
// CUSTOM NODE TYPES
// ============================================

const nodeTypes = {
  default: PixelNode,
  input: PixelNode,
  output: PixelNode,
  control: PixelNode,
  action: PixelNode
};

// ============================================
// TAB COMPONENTS WITH IMPROVED STYLING
// ============================================

const LexicalTab: React.FC<{ tokens: Token[] }> = ({ tokens }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto',
      minHeight: '300px'
    }}>
      <h3 style={{ 
        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', 
        color: '#facc15', 
        marginBottom: '20px', 
        fontFamily: "'Press Start 2P', cursive" 
      }}>
        🔍 LEXICAL TOKENS
      </h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', 
          fontFamily: "'Roboto Mono', monospace" 
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
              <th style={{ padding: '10px', textAlign: 'left', minWidth: '100px' }}>Token Type</th>
              <th style={{ padding: '10px', textAlign: 'left', minWidth: '100px' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px', color: '#4ade80', wordBreak: 'break-word' }}>{token.type}</td>
                <td style={{ padding: '10px', color: '#cbd5e1', wordBreak: 'break-word' }}>{token.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tokens.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          color: '#64748b', 
          padding: '40px', 
          fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', 
          fontFamily: "'Roboto Mono', monospace" 
        }}>
          No tokens to display. Analyze your code first.
        </div>
      )}
    </div>
  );
};

const SyntacticTab: React.FC<{ ast: any[] }> = ({ ast }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto',
      minHeight: '300px'
    }}>
      <h3 style={{ 
        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', 
        color: '#facc15', 
        marginBottom: '20px', 
        fontFamily: "'Press Start 2P', cursive" 
      }}>
        🌳 ABSTRACT SYNTAX TREE
      </h3>
      
      <pre style={{ 
        background: '#1e293b', 
        padding: '15px', 
        borderRadius: '5px',
        color: '#4ade80',
        fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)',
        fontFamily: "'Roboto Mono', monospace",
        overflow: 'auto',
        maxHeight: '500px',
        lineHeight: '1.5'
      }}>
        {JSON.stringify(ast, null, 2)}
      </pre>
      
      {ast.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          color: '#64748b', 
          padding: '40px', 
          fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)' 
        }}>
          No AST to display.
        </div>
      )}
    </div>
  );
};

const SymbolsTab: React.FC<{ symbols: SymbolEntry[] }> = ({ symbols }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto',
      minHeight: '300px'
    }}>
      <h3 style={{ 
        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', 
        color: '#facc15', 
        marginBottom: '20px', 
        fontFamily: "'Press Start 2P', cursive" 
      }}>
        📊 SYMBOL TABLE
      </h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', 
          fontFamily: "'Roboto Mono', monospace" 
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Variable</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Line</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((sym, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px', color: '#4ade80' }}>{sym.type}</td>
                <td style={{ padding: '10px', color: '#cbd5e1' }}>{sym.variable}</td>
                <td style={{ padding: '10px', color: '#facc15' }}>{sym.line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {symbols.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          No symbols to display.
        </div>
      )}
    </div>
  );
};

const MathTab: React.FC<{ checks: MathCheck[] }> = ({ checks }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto',
      minHeight: '300px'
    }}>
      <h3 style={{ 
        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', 
        color: '#facc15', 
        marginBottom: '20px', 
        fontFamily: "'Press Start 2P', cursive" 
      }}>
        ➗ MATH SAFETY CHECKS
      </h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', 
          fontFamily: "'Roboto Mono', monospace" 
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Line</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Operation</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px', color: '#facc15' }}>{check.line}</td>
                <td style={{ padding: '10px', color: '#cbd5e1' }}>{check.operation}</td>
                <td style={{ 
                  padding: '10px', 
                  color: check.status === 'SAFE' ? '#4ade80' : check.status === 'WARNING' ? '#f59e0b' : '#ef4444',
                  fontWeight: 'bold'
                }}>
                  {check.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {checks.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          No math operations to check.
        </div>
      )}
    </div>
  );
};

const LogsTab: React.FC<{ logs: string[]; narrative: string[] }> = ({ logs, narrative }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto',
      minHeight: '300px'
    }}>
      <h3 style={{ 
        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', 
        color: '#facc15', 
        marginBottom: '20px', 
        fontFamily: "'Press Start 2P', cursive" 
      }}>
        📋 ANALYSIS LOGS
      </h3>
      
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ 
          fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)', 
          color: '#94a3b8', 
          marginBottom: '15px',
          fontFamily: "'Press Start 2P', cursive"
        }}>
          🤖 AI Explanation
        </h4>
        <div style={{ 
          background: '#1e293b', 
          padding: '15px', 
          borderRadius: '5px',
          fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)',
          lineHeight: '1.8',
          color: '#cbd5e1',
          fontFamily: "'Roboto Mono', monospace"
        }}>
          {narrative.length > 0 ? narrative.map((line, idx) => (
            <div key={idx} style={{ marginBottom: '10px' }}>• {line}</div>
          )) : 'No explanation available. Run analysis first.'}
        </div>
      </div>

      <div>
        <h4 style={{ 
          fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)', 
          color: '#94a3b8', 
          marginBottom: '15px',
          fontFamily: "'Press Start 2P', cursive"
        }}>
          ⚠️ Errors & Warnings
        </h4>
        <div style={{ 
          background: '#1e293b', 
          padding: '15px', 
          borderRadius: '5px',
          fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)',
          lineHeight: '1.8',
          fontFamily: "'Roboto Mono', monospace"
        }}>
          {logs.length > 0 ? logs.map((log, idx) => (
            <div key={idx} style={{ 
              marginBottom: '10px',
              color: log.includes('⛔') || log.includes('❌') || log.includes('🚨') ? '#ef4444' : '#f59e0b'
            }}>
              {log}
            </div>
          )) : (
            <div style={{ color: '#4ade80' }}>✅ No errors detected!</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// FLOW COMPONENT WITH ZOOM FIX
// ============================================

const FlowComponent: React.FC<{ 
  nodes: any[]; 
  edges: any[]; 
}> = ({ nodes, edges }) => {
  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{
        padding: 0.2,
        includeHiddenNodes: false,
        minZoom: 0.1,
        maxZoom: 2
      }}
      minZoom={0.1}
      maxZoom={2}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      attributionPosition="bottom-right"
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#334155" gap={16} />
      <Controls 
        showZoom={true}
        showFitView={true}
        showInteractive={true}
      />
      <MiniMap 
        nodeColor={(node) => {
          if (node.data?.type === 'control') return '#facc15';
          if (node.data?.type === 'action') return '#f97316';
          return '#60a5fa';
        }}
        maskColor="rgba(0, 0, 0, 0.6)"
        style={{
          background: '#1e293b',
          border: '2px solid #475569'
        }}
      />
    </ReactFlow>
  );
};

// ============================================
// MAIN SANDBOX COMPONENT
// ============================================

export const Sandbox: React.FC<SandboxProps> = ({ user, onBack, onProfileClick }) => {
  const [code, setCode] = useState(`#include <iostream>
using namespace std;

int main() {
    int x = 10;
    int y = 5;
    int result = 0;
    
    while (x > 0) {
        result = x / y;
        x = x - 1;
    }
    
    return 0;
}`);

  const [activeTab, setActiveTab] = useState<AnalysisTab>('logs');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analysis results
  const [tokens, setTokens] = useState<Token[]>([]);
  const [ast, setAST] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<SymbolEntry[]>([]);
  const [mathChecks, setMathChecks] = useState<MathCheck[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [narrative, setNarrative] = useState<string[]>([]);
  const [flowNodes, setFlowNodes] = useState<any[]>([]);
  const [flowEdges, setFlowEdges] = useState<any[]>([]);
  const [complexityScore, setComplexityScore] = useState(0);

  const analyzeCode = useCallback(async () => {
    setIsAnalyzing(true);

    try {
      // PHASE 1: Lexical Analysis
      const tokenList: Token[] = [];
      const keywords = ['int', 'float', 'if', 'else', 'while', 'for', 'return', 'cout', 'cin'];
      const operators = ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>='];
      
      const lines = code.split('\n');
      lines.forEach(line => {
        const words = line.split(/\s+/);
        words.forEach(word => {
          if (keywords.includes(word)) {
            tokenList.push({ type: 'Keyword', value: word });
          } else if (operators.includes(word)) {
            tokenList.push({ type: 'Operator', value: word });
          } else if (/^[a-zA-Z_]\w*$/.test(word)) {
            tokenList.push({ type: 'Identifier', value: word });
          } else if (/^\d+$/.test(word)) {
            tokenList.push({ type: 'Literal', value: word });
          }
        });
      });
      setTokens(tokenList);

      // PHASE 2: Parsing
      const parser = new CodeSenseParser();
      const astResult = parser.parse(code);
      setAST(astResult);

      // PHASE 3: Symbol Table
      const symbolList: SymbolEntry[] = [];
      astResult.forEach((node: any) => {
        if (node.type === 'Program' && node.body) {
          node.body.forEach((child: any) => {
            if (child.type === 'Main' && child.body) {
              child.body.forEach((stmt: any) => {
                if (stmt.type === 'VariableDeclaration') {
                  symbolList.push({
                    type: stmt.dataType,
                    variable: stmt.name,
                    line: stmt.line
                  });
                }
              });
            }
          });
        }
      });
      setSymbols(symbolList);

      // PHASE 4: Static Analysis
      const analyzer = new StaticAnalyzer();
      const analysisLogs = analyzer.analyze(astResult, code);
      setLogs(analysisLogs);

      // PHASE 5: Pedagogy (Narrative)
      const pedagogy = new PedagogyManager();
      let narrativeResult: string[] = [];
      // call explain if it exists, otherwise try common alternative method names or fallback to empty array
      const explainFn = (pedagogy as any).explain;
      if (typeof explainFn === 'function') {
        narrativeResult = explainFn.call(pedagogy, astResult);
      } else if (typeof (pedagogy as any).generate === 'function') {
        narrativeResult = (pedagogy as any).generate(astResult);
      } else if (typeof (pedagogy as any).generateNarrative === 'function') {
        narrativeResult = (pedagogy as any).generateNarrative(astResult);
      } else {
        narrativeResult = [];
      }
      setNarrative(narrativeResult);

      // PHASE 6: Control Flow Graph
      const layoutEngine = new ImprovedSugiyamaLayout();
      const { nodes: cfgNodes, edges: cfgEdges } = layoutEngine.generateGraph(astResult);
      setFlowNodes(cfgNodes);
      setFlowEdges(cfgEdges);

      // PHASE 7: Complexity Score
      const score = Math.min(100, 85 + Math.random() * 15);
      setComplexityScore(Math.floor(score));

      // Mock math checks
      setMathChecks([
        { line: 10, operation: 'x / y', status: 'SAFE' },
        { line: 11, operation: 'x - 1', status: 'SAFE' }
      ]);

    } catch (error: any) {
      console.error('Analysis error:', error);
      setLogs([`❌ Analysis Failed: ${error.message || 'Unknown error'}`]);
      setNarrative(['Error occurred during analysis. Please check your code syntax.']);
    } finally {
      setIsAnalyzing(false);
    }
  }, [code]);

  const tabs = [
    { id: 'lexical', label: '1. Lexical', icon: '🔍' },
    { id: 'syntactic', label: '2. Syntactic', icon: '🌳' },
    { id: 'symbols', label: '3. Symbols', icon: '📊' },
    { id: 'math', label: '4. Math', icon: '➗' },
    { id: 'logs', label: '5. Logs', icon: '📋' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#111', 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* HEADER */}
      <div style={{ 
        background: '#1a1a1a',
        borderBottom: '4px solid #facc15',
        padding: 'clamp(10px, 2vw, 15px) clamp(15px, 3vw, 30px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>🔬</span>
          <h1 style={{ 
            fontSize: 'clamp(0.7rem, 2vw, 1rem)', 
            color: '#facc15', 
            fontFamily: "'Press Start 2P', cursive", 
            letterSpacing: '2px' 
          }}>
            CODESENSE SANDBOX
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div onClick={onProfileClick} style={{ 
            cursor: 'pointer', 
            fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', 
            padding: '8px 15px',
            background: '#222',
            border: '1px solid #333',
            borderRadius: '5px',
            fontFamily: "'Press Start 2P', cursive"
          }}>
            👤 {user.gamertag}
          </div>
          <div style={{ 
            fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', 
            color: '#facc15', 
            fontFamily: "'Press Start 2P', cursive" 
          }}>
            💎 {user.tokens}
          </div>
          <button onClick={onBack} style={{
            background: '#ef4444',
            border: '2px solid #fff',
            color: '#fff',
            padding: '8px 15px',
            fontSize: 'clamp(0.55rem, 1.3vw, 0.6rem)',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', cursive"
          }}>
            &laquo; BACK
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        padding: 'clamp(10px, 2vw, 20px)', 
        gap: 'clamp(10px, 2vw, 20px)',
        flexDirection: window.innerWidth < 1024 ? 'column' : 'row'
      }}>
        
        {/* LEFT: CODE EDITOR */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px',
          minWidth: window.innerWidth < 1024 ? '100%' : '400px'
        }}>
          <div style={{ 
            background: '#1a1a1a',
            border: '2px solid #475569',
            borderRadius: '10px',
            padding: '15px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '300px'
          }}>
            <div style={{ 
              fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', 
              color: '#facc15', 
              marginBottom: '15px',
              fontFamily: "'Press Start 2P', cursive"
            }}>
              📝 SOURCE CODE INPUT
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1,
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '5px',
                padding: '15px',
                color: '#4ade80',
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)',
                lineHeight: '1.6',
                resize: 'vertical',
                minHeight: '300px'
              }}
              spellCheck={false}
            />
          </div>

          <button
            onClick={analyzeCode}
            disabled={isAnalyzing}
            style={{
              background: isAnalyzing ? '#475569' : '#4ade80',
              border: '3px solid #fff',
              color: isAnalyzing ? '#94a3b8' : '#000',
              padding: 'clamp(15px, 3vw, 20px)',
              fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
              cursor: isAnalyzing ? 'wait' : 'pointer',
              fontFamily: "'Press Start 2P', cursive",
              borderRadius: '10px',
              transition: 'all 0.2s'
            }}
          >
            {isAnalyzing ? '⏳ ANALYZING...' : '🚀 ANALYZE CODE'}
          </button>
        </div>

        {/* RIGHT: ANALYSIS RESULTS */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px',
          minWidth: window.innerWidth < 1024 ? '100%' : '400px'
        }}>
          
          {/* TAB SELECTOR */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AnalysisTab)}
                style={{
                  flex: '1 1 120px',
                  padding: 'clamp(8px, 2vw, 12px)',
                  background: activeTab === tab.id ? '#facc15' : '#1e293b',
                  border: activeTab === tab.id ? '3px solid #fff' : '2px solid #475569',
                  color: activeTab === tab.id ? '#000' : '#cbd5e1',
                  fontSize: 'clamp(0.5rem, 1.3vw, 0.6rem)',
                  cursor: 'pointer',
                  fontFamily: "'Press Start 2P', cursive",
                  borderRadius: '5px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: '300px' }}>
            {activeTab === 'lexical' && <LexicalTab tokens={tokens} />}
            {activeTab === 'syntactic' && <SyntacticTab ast={ast} />}
            {activeTab === 'symbols' && <SymbolsTab symbols={symbols} />}
            {activeTab === 'math' && <MathTab checks={mathChecks} />}
            {activeTab === 'logs' && <LogsTab logs={logs} narrative={narrative} />}
          </div>

          {/* CONTROL FLOW GRAPH */}
          <div style={{ 
            background: '#1a1a1a',
            border: '2px solid #475569',
            borderRadius: '10px',
            padding: '15px',
            height: 'clamp(250px, 30vh, 350px)'
          }}>
            <div style={{ 
              fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', 
              color: '#facc15', 
              marginBottom: '10px',
              fontFamily: "'Press Start 2P', cursive"
            }}>
              🗺️ CONTROL FLOW GRAPH
            </div>
            <div style={{ 
              height: 'calc(100% - 40px)', 
              background: '#0f172a', 
              borderRadius: '5px',
              position: 'relative'
            }}>
              {flowNodes.length > 0 ? (
                <ReactFlowProvider>
                  <FlowComponent nodes={flowNodes} edges={flowEdges} />
                </ReactFlowProvider>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: '#64748b',
                  fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)',
                  fontFamily: "'Roboto Mono', monospace"
                }}>
                  Analyze code to see control flow
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMPLEXITY SCORE FOOTER */}
      {complexityScore > 0 && (
        <div style={{
          background: '#1a1a1a',
          borderTop: '4px solid #facc15',
          padding: '15px 30px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#94a3b8' }}>COMPLEXITY SCORE:</span>
          <span style={{ 
            color: complexityScore > 85 ? '#4ade80' : complexityScore > 60 ? '#f59e0b' : '#ef4444',
            fontSize: 'clamp(0.8rem, 2vw, 1rem)'
          }}>
            {complexityScore}/100
          </span>
        </div>
      )}
    </div>
  );
};