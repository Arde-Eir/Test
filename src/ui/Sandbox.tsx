import React, { useState } from 'react';
import { CodeSenseParser } from '../core/Parser';
import { StaticAnalyzer } from '../core/Analyzer';
import { PedagogyManager } from '../core/Pedagogy';
import { ImprovedSugiyamaLayout } from '../core/ImprovedSugiyama';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

// ============================================
// SANDBOX TYPES
// ============================================

type AnalysisTab = 'lexical' | 'syntactic' | 'symbols' | 'math' | 'logs';

interface Token {
  type: string;
  value: string;
}

interface SandboxProps {
  user: any;
  onBack: () => void;
  onProfileClick: () => void;
}

// ============================================
// LEXICAL ANALYSIS TAB
// ============================================

const LexicalTab: React.FC<{ tokens: Token[] }> = ({ tokens }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto'
    }}>
      <h3 style={{ fontSize: '0.8rem', color: '#facc15', marginBottom: '20px', fontFamily: "'Press Start 2P', cursive" }}>
        🔍 LEXICAL TOKENS
      </h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', fontFamily: "'Roboto Mono', monospace" }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Token Type</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
              <td style={{ padding: '10px', color: '#4ade80' }}>{token.type}</td>
              <td style={{ padding: '10px', color: '#cbd5e1' }}>{token.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {tokens.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', fontSize: '0.7rem', fontFamily: "'Roboto Mono', monospace" }}>
          No tokens to display. Analyze your code first.
        </div>
      )}
    </div>
  );
};

// ============================================
// SYNTACTIC ANALYSIS TAB (AST)
// ============================================

const SyntacticTab: React.FC<{ ast: any[] }> = ({ ast }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto'
    }}>
      <h3 style={{ fontSize: '0.8rem', color: '#facc15', marginBottom: '20px', fontFamily: "'Press Start 2P', cursive" }}>
        🌳 ABSTRACT SYNTAX TREE
      </h3>
      
      <pre style={{ 
        background: '#1e293b', 
        padding: '20px', 
        borderRadius: '5px',
        color: '#4ade80',
        fontSize: '0.7rem',
        fontFamily: "'Roboto Mono', monospace",
        overflow: 'auto',
        maxHeight: '600px'
      }}>
        {JSON.stringify(ast, null, 2)}
      </pre>
      
      {ast.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', fontSize: '0.7rem', fontFamily: "'Roboto Mono', monospace" }}>
          No AST to display. Analyze your code first.
        </div>
      )}
    </div>
  );
};

// ============================================
// SYMBOL TABLE TAB
// ============================================

interface SymbolEntry {
  type: string;
  variable: string;
  line: number;
}

const SymbolsTab: React.FC<{ symbols: SymbolEntry[] }> = ({ symbols }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto'
    }}>
      <h3 style={{ fontSize: '0.8rem', color: '#facc15', marginBottom: '20px', fontFamily: "'Press Start 2P', cursive" }}>
        📊 SYMBOL TABLE
      </h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', fontFamily: "'Roboto Mono', monospace" }}>
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
      
      {symbols.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', fontSize: '0.7rem', fontFamily: "'Roboto Mono', monospace" }}>
          No symbols to display. Analyze your code first.
        </div>
      )}
    </div>
  );
};

// ============================================
// MATH SAFETY TAB
// ============================================

interface MathCheck {
  line: number;
  operation: string;
  status: 'SAFE' | 'WARNING' | 'ERROR';
}

const MathTab: React.FC<{ checks: MathCheck[] }> = ({ checks }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto'
    }}>
      <h3 style={{ fontSize: '0.8rem', color: '#facc15', marginBottom: '20px', fontFamily: "'Press Start 2P', cursive" }}>
        ➗ MATH SAFETY CHECKS
      </h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', fontFamily: "'Roboto Mono', monospace" }}>
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
      
      {checks.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', fontSize: '0.7rem', fontFamily: "'Roboto Mono', monospace" }}>
          No math operations to check. Analyze your code first.
        </div>
      )}
    </div>
  );
};

// ============================================
// LOGS TAB (Errors & Warnings)
// ============================================

const LogsTab: React.FC<{ logs: string[]; narrative: string[] }> = ({ logs, narrative }) => {
  return (
    <div style={{ 
      background: '#0f172a', 
      border: '2px solid #475569', 
      borderRadius: '10px', 
      padding: '20px',
      height: '100%',
      overflow: 'auto'
    }}>
      <h3 style={{ fontSize: '0.8rem', color: '#facc15', marginBottom: '20px', fontFamily: "'Press Start 2P', cursive" }}>
        📋 ANALYSIS LOGS
      </h3>
      
      {/* Errors & Warnings */}
      {logs.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ fontSize: '0.7rem', color: '#ef4444', marginBottom: '15px', fontFamily: "'Press Start 2P', cursive" }}>
            ⚠️ ERRORS & WARNINGS
          </h4>
          {logs.map((log, idx) => (
            <div key={idx} style={{ 
              background: log.includes('⛔') || log.includes('❌') || log.includes('🚨') ? '#450a0a' : '#422006',
              border: `2px solid ${log.includes('⛔') || log.includes('❌') || log.includes('🚨') ? '#ef4444' : '#f59e0b'}`,
              padding: '12px',
              borderRadius: '5px',
              marginBottom: '10px',
              fontSize: '0.65rem',
              fontFamily: "'Roboto Mono', monospace",
              color: '#cbd5e1',
              lineHeight: '1.5'
            }}>
              {log}
            </div>
          ))}
        </div>
      )}
      
      {/* Narrative Explanations */}
      {narrative.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.7rem', color: '#4ade80', marginBottom: '15px', fontFamily: "'Press Start 2P', cursive" }}>
            💬 CODE EXPLANATION
          </h4>
          {narrative.map((line, idx) => (
            <div key={idx} style={{ 
              background: '#1e293b',
              border: '1px solid #334155',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '8px',
              fontSize: '0.65rem',
              fontFamily: "'Roboto Mono', monospace",
              color: '#cbd5e1',
              lineHeight: '1.6'
            }}>
              {line}
            </div>
          ))}
        </div>
      )}
      
      {logs.length === 0 && narrative.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', fontSize: '0.7rem', fontFamily: "'Roboto Mono', monospace" }}>
          No logs to display. Analyze your code first.
        </div>
      )}
    </div>
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
    result = x / y; //Math Check
    x = x - 1;
  }
  return 0;
}`);

  const [activeTab, setActiveTab] = useState<AnalysisTab>('lexical');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Analysis Results
  const [tokens, setTokens] = useState<Token[]>([]);
  const [ast, setAst] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<SymbolEntry[]>([]);
  const [mathChecks, setMathChecks] = useState<MathCheck[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [narrative, setNarrative] = useState<string[]>([]);
  const [flowNodes, setFlowNodes] = useState<any[]>([]);
  const [flowEdges, setFlowEdges] = useState<any[]>([]);
  const [complexityScore, setComplexityScore] = useState<number>(0);

  const analyzeCode = () => {
    setIsAnalyzing(true);
    
    try {
      // 1. Parse Code
      const parser = new CodeSenseParser();
      const parsedAST = parser.parse(code);
      setAst(parsedAST);

      // 2. Extract Tokens (Mock - real implementation would use lexer)
      const mockTokens: Token[] = [
        { type: 'Keyword', value: 'int' },
        { type: 'Identifier', value: 'main' },
        { type: 'Separator', value: '(' },
        { type: 'Separator', value: ')' },
        { type: 'Separator', value: '{' },
        { type: 'Keyword', value: 'int' },
        { type: 'Identifier', value: 'x' },
        { type: 'Operator', value: '=' },
        { type: 'Literal', value: '10' },
        { type: 'Separator', value: ';' }
      ];
      setTokens(mockTokens);

      // 3. Semantic Analysis
      const analyzer = new StaticAnalyzer();
      const errors = analyzer.analyze(parsedAST, code);
      setLogs(errors);

      // 4. Extract Symbols
      const mockSymbols: SymbolEntry[] = [
        { type: 'int', variable: 'x', line: 5 },
        { type: 'int', variable: 'y', line: 6 },
        { type: 'int', variable: 'result', line: 7 }
      ];
      setSymbols(mockSymbols);

      // 5. Math Safety
      const mockMathChecks: MathCheck[] = [
        { line: 9, operation: 'x > 0', status: 'SAFE' },
        { line: 10, operation: 'x / y', status: 'SAFE' },
        { line: 11, operation: 'x - 1', status: 'SAFE' }
      ];
      setMathChecks(mockMathChecks);

      // 6. Generate Narrative
      const pedagogy = new PedagogyManager();
      const explanation = pedagogy.translate(parsedAST);
      setNarrative(explanation);

      // 7. Calculate Complexity
      const scoreResult = pedagogy.calculateScore(parsedAST);
      setComplexityScore(scoreResult.score);

      // 8. Generate Control Flow Graph
      const layoutEngine = new ImprovedSugiyamaLayout();
      const graph = layoutEngine.generateGraph(parsedAST);
      setFlowNodes(graph.nodes);
      setFlowEdges(graph.edges);

      // Success message
      if (errors.length === 0) {
        setLogs(['✅ Code analysis complete! No errors found.']);
      }

    } catch (error: any) {
      setLogs([`❌ Analysis Error: ${error.message}`]);
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '1.5rem' }}>🔬</span>
          <h1 style={{ fontSize: '1rem', color: '#facc15', fontFamily: "'Press Start 2P', cursive", letterSpacing: '2px' }}>
            CODESENSE SANDBOX
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div onClick={onProfileClick} style={{ 
            cursor: 'pointer', 
            fontSize: '0.7rem', 
            padding: '8px 15px',
            background: '#222',
            border: '1px solid #333',
            borderRadius: '5px',
            fontFamily: "'Press Start 2P', cursive"
          }}>
            👤 {user.gamertag}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#facc15', fontFamily: "'Press Start 2P', cursive" }}>
            💎 {user.tokens}
          </div>
          <button onClick={onBack} style={{
            background: '#ef4444',
            border: '2px solid #fff',
            color: '#fff',
            padding: '8px 15px',
            fontSize: '0.6rem',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', cursive"
          }}>
            &laquo; BACK
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', padding: '20px', gap: '20px' }}>
        
        {/* LEFT: CODE EDITOR */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ 
            background: '#1a1a1a',
            border: '2px solid #475569',
            borderRadius: '10px',
            padding: '15px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              fontSize: '0.7rem', 
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
                fontSize: '0.85rem',
                lineHeight: '1.6',
                resize: 'none',
                minHeight: '400px'
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
              padding: '20px',
              fontSize: '0.8rem',
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* TAB SELECTOR */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AnalysisTab)}
                style={{
                  flex: '1 1 150px',
                  padding: '12px',
                  background: activeTab === tab.id ? '#facc15' : '#1e293b',
                  border: activeTab === tab.id ? '3px solid #fff' : '2px solid #475569',
                  color: activeTab === tab.id ? '#000' : '#cbd5e1',
                  fontSize: '0.6rem',
                  cursor: 'pointer',
                  fontFamily: "'Press Start 2P', cursive",
                  borderRadius: '5px',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
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
            height: '300px'
          }}>
            <div style={{ 
              fontSize: '0.7rem', 
              color: '#facc15', 
              marginBottom: '10px',
              fontFamily: "'Press Start 2P', cursive"
            }}>
              🗺️ CONTROL FLOW GRAPH
            </div>
            <div style={{ height: 'calc(100% - 40px)', background: '#0f172a', borderRadius: '5px' }}>
              {flowNodes.length > 0 ? (
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  fitView
                  attributionPosition="bottom-left"
                >
                  <Background color="#334155" gap={16} />
                  <Controls />
                </ReactFlow>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: '#64748b',
                  fontSize: '0.7rem',
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
          fontSize: '0.7rem'
        }}>
          <span style={{ color: '#94a3b8' }}>COMPLEXITY SCORE:</span>
          <span style={{ 
            color: complexityScore > 85 ? '#4ade80' : complexityScore > 60 ? '#f59e0b' : '#ef4444',
            fontSize: '1rem'
          }}>
            {complexityScore}/100
          </span>
        </div>
      )}
    </div>
  );
};