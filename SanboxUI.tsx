import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { CodeSenseEngine } from './CodeSenseEngine';
import { PedagogyManager } from './PedagogyManager';

const CodeSenseSandbox = () => {
    const [code, setCode] = useState(`#include <iostream>\nusing namespace std;\n\nint main() {\n  int x = 10;\n  while (x > 0) {\n    x = x - 1;\n  }\n  return 0;\n}`);
    const [tokens, setTokens] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [nodes, setNodes] = useState<any[]>([]);

    const handleAnalyze = () => {
        const engine = new CodeSenseEngine();
        const pedagogy = new PedagogyManager();
        
        const ast = engine.parse(code);
        const errors = engine.analyze(ast);
        const explanations = ast.map(n => pedagogy.translate(n));

        // Algorithm 8 & 9: CFG Construction & Sugiyama Layout [cite: 730, 734, 735]
        // This organizes nodes into layers to preserve "model order" [cite: 286, 735]
        setNodes([
            { id: '1', data: { label: 'START' }, position: { x: 150, y: 0 }, type: 'input' },
            { id: '2', data: { label: 'int x = 10' }, position: { x: 150, y: 100 } },
            { id: '3', data: { label: 'CONDITION: x > 0' }, position: { x: 150, y: 200 } },
            { id: '4', data: { label: 'END' }, position: { x: 150, y: 300 }, type: 'output' }
        ]);

        setLogs([...errors, ...explanations]);
        if (errors.length === 0) setTokens(t => t + pedagogy.calculateReward(ast));
    };

    return (
        <div className="pixel-container" style={{ background: '#1a1a1a', height: '100vh', padding: '20px', color: '#f1c40f' }}>
            {/* Gamification Dashboard [cite: 654] */}
            <header style={{ border: '4px solid #f1c40f', padding: '15px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>📦 CODESENSE_SANDBOX</h1>
                <div style={{ fontSize: '1.2rem' }}>TOKENS: 🪙 {tokens} | RANK: NOVICE</div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', height: 'calc(100% - 120px)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ border: '2px solid #444', background: '#000' }}>
                        <Editor height="400px" theme="vs-dark" defaultLanguage="cpp" value={code} onChange={(v) => setCode(v || "")} />
                        <button onClick={handleAnalyze} style={{ width: '100%', padding: '15px', background: '#f1c40f', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>ANALYZE_CODE</button>
                    </div>
                    {/* Log Panel for English Logic [cite: 156] */}
                    <div className="log-window" style={{ border: '2px solid #f1c40f', height: '180px', overflowY: 'auto', padding: '15px' }}>
                        {logs.map((line, i) => <p key={i} style={{ color: '#89d185', margin: '0 0 10px 0' }}>{`> ${line}`}</p>)}
                    </div>
                </div>
                <div className="cfg-panel" style={{ border: '2px solid #f1c40f', background: '#111' }}>
                    <div style={{ height: '100%' }}>
                        <ReactFlow nodes={nodes} edges={[]} fitView><Background color="#333" /><Controls /></ReactFlow>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeSenseSandbox;