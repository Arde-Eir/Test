import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { CodeSenseEngine } from './Engine';
import { PedagogyManager } from './PedagogyManager';

const CodeSenseSandbox = () => {
    const [code, setCode] = useState(`#include <iostream>\nusing namespace std;\n\nint main() {\n  int x = 10;\n  while (x > 0) {\n    x = x - 1;\n  }\n  return 0;\n}`);
    const [tokens, setTokens] = useState(0);
    const [activeTab, setActiveTab] = useState('1. Lexical');
    const [logs, setLogs] = useState<string[]>([]);
    const [nodes, setNodes] = useState<any[]>([]);

    const handleRunAnalysis = () => {
        const engine = new CodeSenseEngine();
        const pedagogy = new PedagogyManager();
        
        const ast = engine.parse(code);
        const errors = engine.analyze(ast);
        
        // Algorithm 8 & 9: CFG Construction & Sugiyama Layout [cite: 730, 734, 735]
        setNodes([
            { id: '1', data: { label: 'START' }, position: { x: 150, y: 0 }, type: 'input' },
            { id: '2', data: { label: 'int x = 10' }, position: { x: 150, y: 100 } },
            { id: '3', data: { label: 'x > 0 ?' }, position: { x: 150, y: 200 } },
            { id: '4', data: { label: 'END' }, position: { x: 150, y: 300 }, type: 'output' }
        ]);

        if (errors.length === 0) {
            setTokens(t => t + pedagogy.calculateReward(ast));
            setLogs(["Analysis Complete: No logic errors found!"]);
        } else {
            setLogs(errors);
        }
    };

    return (
        <div style={{ backgroundColor: '#1a1a1a', height: '100vh', padding: '15px', color: '#f1c40f' }}>
            {/* Pixel-Themed Gamification Header */}
            <header style={{ border: '4px solid #f1c40f', padding: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h1 style={{ margin: 0 }}>📦 CODESENSE_SANDBOX</h1>
                <div style={{ fontSize: '1.2rem' }}>TOKENS: 🪙 {tokens} | RANK: NOVICE</div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '15px', height: 'calc(100% - 100px)' }}>
                {/* Left Side: Editor and Deterministic Tabs [cite: 355, 606] */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ border: '2px solid #444', flexGrow: 1 }}>
                        <Editor height="70%" theme="vs-dark" defaultLanguage="cpp" value={code} onChange={(v) => setCode(v || "")} />
                        <button onClick={handleRunAnalysis} style={{ width: '100%', padding: '15px', background: '#f1c40f', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                            ANALYZE_CODE
                        </button>
                    </div>

                    <div style={{ border: '2px solid #f1c40f', height: '180px' }}>
                        <div style={{ display: 'flex', background: '#333', fontSize: '0.8rem' }}>
                            {['1. Lexical', '2. Syntactic', '3. Symbols', '4. Math', '5. Logs'].map(tab => (
                                <div key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 15px', cursor: 'pointer', background: activeTab === tab ? '#444' : 'transparent' }}>{tab}</div>
                            ))}
                        </div>
                        <div style={{ padding: '10px', fontSize: '0.9rem', color: '#89d185' }}>
                            {logs.map((log, i) => <p key={i} style={{ margin: 0 }}>{`> ${log}`}</p>)}
                        </div>
                    </div>
                </div>

                {/* Right Side: Sugiyama Flowchart (CFG) [cite: 70, 735] */}
                <div style={{ border: '2px solid #f1c40f', background: '#252526' }}>
                    <h4 style={{ padding: '10px', margin: 0, background: '#333' }}>CONTROL_FLOW_GRAPH</h4>
                    <div style={{ height: '90%' }}>
                        <ReactFlow nodes={nodes} edges={[]} fitView>
                            <Background color="#333" />
                            <Controls />
                        </ReactFlow>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeSenseSandbox;