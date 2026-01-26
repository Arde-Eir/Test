import React from 'react';

interface Props { onSelectLevel: (lvl: number | 'sandbox') => void; playerRank: string; }

export const LevelSelect: React.FC<Props> = ({ onSelectLevel, playerRank }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1b26' }}>
      <h1 style={{ color: '#73daca', fontFamily: '"Press Start 2P"', marginBottom: '40px' }}>SELECT QUEST</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div className="card" onClick={() => onSelectLevel('sandbox')} style={{ cursor: 'pointer', border: '4px solid #7dcfff', width: '200px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛠️</div>
          <h3>SANDBOX</h3>
        </div>
        
        <div className="card" onClick={() => onSelectLevel(1)} style={{ cursor: 'pointer', width: '200px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏠</div>
          <h3>BASICS</h3>
        </div>

        <div className="card" onClick={() => onSelectLevel(2)} style={{ cursor: 'not-allowed', width: '200px', textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🌲</div>
          <h3>LOGIC (LOCKED)</h3>
        </div>
      </div>
      
      <div style={{ marginTop: '40px', color: '#565f89' }}>CURRENT RANK: {playerRank}</div>
    </div>
  );
};