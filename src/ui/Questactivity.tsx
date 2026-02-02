import React, { useState } from 'react';

// ============================================
// QUEST ACTIVITY TYPES
// ============================================

interface ActivityProps {
  questId: string;
  onComplete: (xpEarned: number) => void;
  onBack: () => void;
}

type ActivityMode = 'tutorial' | 'drag-drop' | 'manual-input' | 'game';

// ============================================
// DRAG & DROP COMPONENT
// ============================================

const DragDropActivity: React.FC<{ onSubmit: (code: string) => void }> = ({ onSubmit }) => {
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  
  const codeBlocks = [
    { id: 'include', text: '#include <iostream>' },
    { id: 'namespace', text: 'using namespace std;' },
    { id: 'main', text: 'int main() {' },
    { id: 'var', text: '  int x = 10;' },
    { id: 'cout', text: '  cout << x;' },
    { id: 'return', text: '  return 0;' },
    { id: 'close', text: '}' }
  ];

  const handleDragStart = (e: React.DragEvent, block: string) => {
    e.dataTransfer.setData('text/plain', block);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const block = e.dataTransfer.getData('text/plain');
    setDroppedItems([...droppedItems, block]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      {/* Source Blocks */}
      <div style={{ flex: 1, background: '#1e293b', border: '2px solid #475569', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ fontSize: '0.7rem', color: '#facc15', marginBottom: '20px' }}>📦 DRAG FROM HERE</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {codeBlocks.map(block => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, block.text)}
              style={{
                background: '#334155',
                border: '2px solid #64748b',
                padding: '15px',
                borderRadius: '5px',
                cursor: 'grab',
                fontFamily: "'Roboto Mono', monospace",
                fontSize: '0.7rem',
                color: '#e2e8f0',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#475569';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#334155';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {block.text}
            </div>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div style={{ flex: 1, background: '#0f172a', border: '2px dashed #facc15', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ fontSize: '0.7rem', color: '#facc15', marginBottom: '20px' }}>🎯 DROP HERE TO BUILD</h3>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            minHeight: '400px',
            background: '#1e293b',
            borderRadius: '5px',
            padding: '15px',
            fontFamily: "'Roboto Mono', monospace",
            fontSize: '0.7rem',
            color: '#4ade80'
          }}
        >
          {droppedItems.length === 0 && (
            <div style={{ color: '#64748b', textAlign: 'center', paddingTop: '40px' }}>
              Drag code blocks here...
            </div>
          )}
          {droppedItems.map((item, index) => (
            <div key={index} style={{ marginBottom: '5px', color: '#e2e8f0' }}>
              {index + 1}  {item}
            </div>
          ))}
        </div>
        <button
          onClick={() => onSubmit(droppedItems.join('\n'))}
          disabled={droppedItems.length === 0}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '15px',
            background: droppedItems.length > 0 ? '#4ade80' : '#475569',
            border: '2px solid #fff',
            color: '#000',
            fontSize: '0.7rem',
            fontFamily: "'Press Start 2P', cursive",
            cursor: droppedItems.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          CHECK CODE
        </button>
      </div>
    </div>
  );
};

// ============================================
// MANUAL INPUT COMPONENT
// ============================================

const ManualInputActivity: React.FC<{ onSubmit: (code: string) => void }> = ({ onSubmit }) => {
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '0.7rem', color: '#facc15', marginBottom: '15px' }}>
        ⌨️ TYPE YOUR CODE HERE
      </h3>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{
          flex: 1,
          background: '#0f172a',
          border: '2px solid #475569',
          borderRadius: '10px',
          padding: '20px',
          color: '#4ade80',
          fontFamily: "'Roboto Mono', monospace",
          fontSize: '0.8rem',
          lineHeight: '1.6',
          resize: 'none',
          minHeight: '400px'
        }}
        spellCheck={false}
      />
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={() => onSubmit(code)}
          style={{
            flex: 1,
            padding: '15px',
            background: '#4ade80',
            border: '2px solid #fff',
            color: '#000',
            fontSize: '0.7rem',
            fontFamily: "'Press Start 2P', cursive",
            cursor: 'pointer'
          }}
        >
          CHECK CODE
        </button>
        <button
          onClick={() => setCode('')}
          style={{
            padding: '15px 30px',
            background: '#ef4444',
            border: '2px solid #fff',
            color: '#fff',
            fontSize: '0.7rem',
            fontFamily: "'Press Start 2P', cursive",
            cursor: 'pointer'
          }}
        >
          RESET
        </button>
      </div>
    </div>
  );
};

// ============================================
// POP THE BALLOON GAME
// ============================================

const BalloonGame: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [balloons, setBalloons] = useState([
    { id: 1, x: 20, y: 80, popped: false, question: 'int main()', answer: 'Entry point' },
    { id: 2, x: 40, y: 60, popped: false, question: 'cout <<', answer: 'Output' },
    { id: 3, x: 60, y: 70, popped: false, question: 'cin >>', answer: 'Input' },
    { id: 4, x: 80, y: 50, popped: false, question: 'while()', answer: 'Loop' }
  ]);

  const [selectedBalloon, setSelectedBalloon] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');

  const handlePop = (id: number) => {
    setSelectedBalloon(id);
  };

  const checkAnswer = () => {
    const balloon = balloons.find(b => b.id === selectedBalloon);
    if (balloon && userAnswer.toLowerCase().includes(balloon.answer.toLowerCase())) {
      setBalloons(balloons.map(b => 
        b.id === selectedBalloon ? { ...b, popped: true } : b
      ));
      setSelectedBalloon(null);
      setUserAnswer('');
      
      if (balloons.filter(b => !b.popped).length === 1) {
        setTimeout(onComplete, 500);
      }
    } else {
      alert('❌ Try again!');
    }
  };

  return (
    <div style={{ height: '100%', position: 'relative', background: '#0f172a', borderRadius: '10px', padding: '20px' }}>
      <h3 style={{ fontSize: '0.8rem', color: '#facc15', textAlign: 'center', marginBottom: '20px' }}>
        🎈 POP THE BALLOON GAME
      </h3>
      <p style={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'center', marginBottom: '30px', fontFamily: "'Roboto Mono', monospace" }}>
        Click balloons and answer C++ questions!
      </p>

      {/* Balloons */}
      <div style={{ position: 'relative', height: '300px', marginBottom: '30px' }}>
        {balloons.map(balloon => !balloon.popped && (
          <div
            key={balloon.id}
            onClick={() => handlePop(balloon.id)}
            style={{
              position: 'absolute',
              left: `${balloon.x}%`,
              top: `${balloon.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              transition: 'all 0.3s',
              animation: `float ${2 + balloon.id * 0.5}s ease-in-out infinite`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
            }}
          >
            <div style={{ fontSize: '4rem' }}>🎈</div>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              fontSize: '0.5rem',
              color: '#fff',
              textAlign: 'center',
              width: '60px',
              fontFamily: "'Press Start 2P', cursive"
            }}>
              {balloon.id}
            </div>
          </div>
        ))}
      </div>

      {/* Question Panel */}
      {selectedBalloon !== null && (
        <div style={{ 
          background: '#1e293b', 
          border: '3px solid #facc15', 
          borderRadius: '10px', 
          padding: '20px',
          animation: 'slideIn 0.3s'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#facc15', marginBottom: '15px' }}>
            ❓ What does this mean?
          </div>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#4ade80', 
            marginBottom: '20px',
            fontFamily: "'Roboto Mono', monospace",
            background: '#0f172a',
            padding: '15px',
            borderRadius: '5px'
          }}>
            {balloons.find(b => b.id === selectedBalloon)?.question}
          </div>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer..."
            style={{
              width: '100%',
              padding: '15px',
              background: '#0f172a',
              border: '2px solid #475569',
              borderRadius: '5px',
              color: '#fff',
              fontSize: '0.7rem',
              fontFamily: "'Roboto Mono', monospace",
              marginBottom: '15px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
          />
          <button
            onClick={checkAnswer}
            style={{
              width: '100%',
              padding: '15px',
              background: '#4ade80',
              border: '2px solid #fff',
              color: '#000',
              fontSize: '0.7rem',
              fontFamily: "'Press Start 2P', cursive",
              cursor: 'pointer'
            }}
          >
            SUBMIT ANSWER
          </button>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-20px); }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ============================================
// MAIN QUEST ACTIVITY COMPONENT
// ============================================

export const QuestActivity: React.FC<ActivityProps> = ({ questId, onComplete, onBack }) => {
  const [mode, setMode] = useState<ActivityMode>('tutorial');
  const [hintsUsed, setHintsUsed] = useState(0);
  const maxHints = 3;

  const handleCodeSubmit = (code: string) => {
    // In production, this would analyze the code
    console.log('Code submitted:', code);
    
    // Mock success
    setTimeout(() => {
      const xpEarned = 10 - (hintsUsed * 2); // Penalty for using hints
      alert(`✅ Correct! You earned ${xpEarned} XP!`);
      onComplete(xpEarned);
    }, 500);
  };

  const useHint = () => {
    if (hintsUsed < maxHints) {
      setHintsUsed(hintsUsed + 1);
      alert(`💡 Hint ${hintsUsed + 1}: Remember to include proper headers and namespace!`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      color: '#fff',
      fontFamily: "'Press Start 2P', cursive",
      padding: '20px'
    }}>
      
      {/* HEADER */}
      <div style={{ 
        background: '#1a1a1a',
        border: '4px solid #facc15',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginBottom: '8px' }}>
            QUEST ACTIVITY
          </div>
          <h2 style={{ fontSize: '0.9rem', color: '#facc15' }}>
            Introduction to C++
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.6rem', textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', marginBottom: '5px' }}>XP</div>
            <div style={{ color: '#facc15', fontSize: '0.8rem' }}>+10</div>
          </div>
          <button
            onClick={useHint}
            disabled={hintsUsed >= maxHints}
            style={{
              padding: '10px 20px',
              background: hintsUsed < maxHints ? '#f59e0b' : '#475569',
              border: '2px solid #fff',
              color: hintsUsed < maxHints ? '#000' : '#94a3b8',
              fontSize: '0.6rem',
              cursor: hintsUsed < maxHints ? 'pointer' : 'not-allowed'
            }}
          >
            💡 HINT ({hintsUsed}/{maxHints})
          </button>
          <button
            onClick={onBack}
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              border: '2px solid #fff',
              color: '#fff',
              fontSize: '0.6rem',
              cursor: 'pointer'
            }}
          >
            EXIT
          </button>
        </div>
      </div>

      {/* MODE SELECTOR */}
      <div style={{ 
        background: '#1e293b',
        border: '2px solid #475569',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'tutorial', label: '📖 TUTORIAL', icon: '📖' },
          { id: 'drag-drop', label: '🎯 DRAG & DROP', icon: '🎯' },
          { id: 'manual-input', label: '⌨️ MANUAL INPUT', icon: '⌨️' },
          { id: 'game', label: '🎈 POP BALLOON', icon: '🎈' }
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setMode(btn.id as ActivityMode)}
            style={{
              padding: '12px 25px',
              background: mode === btn.id ? '#facc15' : '#334155',
              border: mode === btn.id ? '3px solid #fff' : '2px solid #64748b',
              color: mode === btn.id ? '#000' : '#cbd5e1',
              fontSize: '0.6rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flex: '1 1 200px'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ACTIVITY AREA */}
      <div style={{ 
        background: '#1e293b',
        border: '4px solid #facc15',
        borderRadius: '10px',
        padding: '30px',
        minHeight: '500px'
      }}>
        {mode === 'tutorial' && (
          <div style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '0.8rem', lineHeight: '1.8', color: '#cbd5e1' }}>
            <h3 style={{ fontSize: '1rem', color: '#facc15', marginBottom: '20px', fontFamily: "'Press Start 2P', cursive" }}>
              📚 TUTORIAL: INTRODUCTION TO C++
            </h3>
            <p style={{ marginBottom: '15px' }}>
              C++ is a powerful programming language used to build everything from games to operating systems.
              Every C++ program starts with the <span style={{ color: '#4ade80' }}>main()</span> function.
            </p>
            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '5px', marginBottom: '15px' }}>
              <pre style={{ margin: 0, color: '#4ade80' }}>{`#include <iostream>
using namespace std;

int main() {
  cout << "Hello World!";
  return 0;
}`}</pre>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>🔹 <span style={{ color: '#facc15' }}>#include</span> - Import libraries</li>
              <li style={{ marginBottom: '10px' }}>🔹 <span style={{ color: '#facc15' }}>using namespace std</span> - Use standard namespace</li>
              <li style={{ marginBottom: '10px' }}>🔹 <span style={{ color: '#facc15' }}>int main()</span> - Program entry point</li>
              <li style={{ marginBottom: '10px' }}>🔹 <span style={{ color: '#facc15' }}>cout</span> - Output to screen</li>
            </ul>
          </div>
        )}

        {mode === 'drag-drop' && <DragDropActivity onSubmit={handleCodeSubmit} />}
        {mode === 'manual-input' && <ManualInputActivity onSubmit={handleCodeSubmit} />}
        {mode === 'game' && <BalloonGame onComplete={() => onComplete(10)} />}
      </div>
    </div>
  );
};