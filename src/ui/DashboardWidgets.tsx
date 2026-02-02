import React from 'react';
import './PixelTheme.css';

// --- MOCK DATA ---
const MOCK_LEADERBOARD = [
  { rank: 1, name: "NullPointer", score: 9500 },
  { rank: 2, name: "SegFault_King", score: 8200 },
  { rank: 3, name: "CodeNinja", score: 7800 },
];

// --- 1. LEADERBOARD WIDGET ---
export const LeaderboardWidget = ({ userScore }: { userScore: number }) => (
  <div className="pixel-card" style={{ 
      flex: 1, padding: '20px', background: '#111', 
      border: '1px solid #333', boxShadow: '4px 4px 0px #000',
      display: 'flex', flexDirection: 'column'
  }}>
    {/* HEADER */}
    <h3 style={{ 
        fontSize: '0.8rem', color: '#facc15', marginBottom: '15px', 
        borderBottom: '1px dashed #444', paddingBottom: '10px', textAlign: 'center',
        fontFamily: "'Press Start 2P', cursive", textTransform: 'uppercase'
    }}>
      🏆 LEADERBOARD
    </h3>

    {/* LIST */}
    <ul style={{ 
        listStyle: 'none', padding: 0, margin: 0,
        fontSize: '0.8rem', fontFamily: "'Roboto Mono', monospace",
        display: 'flex', flexDirection: 'column', gap: '12px' 
    }}>
        {MOCK_LEADERBOARD.map(p => (
              <li key={p.rank} style={{ display: 'flex', justifyContent: 'space-between', color: '#eee' }}>
                  <span>#{p.rank} {p.name}</span>
                  <span>{p.score}</span>
              </li>
        ))}
        {/* YOU */}
        <li style={{ 
          borderTop: '1px dashed #444', paddingTop: '12px', marginTop: '5px',
          display: 'flex', justifyContent: 'space-between', color: '#facc15', fontWeight: 'bold' 
        }}>
          <span>#4 You</span>
          <span>{userScore}</span>
        </li>
    </ul>
  </div>
);

// --- 2. PROGRESS WIDGET ---
export const ProgressWidget = ({ level, rank, xp }: { level: number, rank: string, xp: number }) => (
  <div className="pixel-card" style={{ 
      flex: 1, padding: '20px', background: '#111', 
      border: '1px solid #333', boxShadow: '4px 4px 0px #000',
      display: 'flex', flexDirection: 'column'
  }}>
    {/* HEADER */}
    <h3 style={{ 
        fontSize: '0.8rem', color: '#4ade80', marginBottom: '20px', 
        borderBottom: '1px dashed #444', paddingBottom: '10px', textAlign: 'center',
        fontFamily: "'Press Start 2P', cursive", textTransform: 'uppercase'
    }}>
      📊 PROGRESS
    </h3>
    
    {/* LEVEL INFO */}
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ 
            fontFamily: "'Press Start 2P', cursive", fontSize: '1.4rem', 
            color: '#fff', marginBottom: '8px', letterSpacing: '1px' 
        }}>
            Level {level}
        </div>
        <div style={{ 
            fontSize: '0.8rem', color: '#888', 
            fontFamily: "'Roboto Mono', monospace" 
        }}>
            {rank}
        </div>
    </div>

    {/* XP BAR */}
    <div style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '8px', color: '#ccc', fontFamily: "'Roboto Mono', monospace" }}>
          <span>XP to Level {level + 1}</span>
          <span>450 / 1000</span>
        </div>
        {/* Striped Green Bar */}
        <div style={{ height: '14px', background: '#222', border: '1px solid #555' }}>
            <div style={{ 
                height: '100%', width: '45%', 
                background: `repeating-linear-gradient(45deg, #4ade80, #4ade80 8px, #22c55e 8px, #22c55e 16px)` 
            }}></div>
        </div>
    </div>

    {/* STATS GRID */}
    <div style={{ display: 'flex', gap: '15px', marginTop: 'auto' }}>
        <div style={{ flex: 1, background: '#1a1a1a', padding: '15px 5px', textAlign: 'center', border: '1px solid #333' }}>
            <div style={{ color: '#facc15', fontSize: '1rem', marginBottom: '5px', fontFamily: "'Press Start 2P', cursive" }}>12</div>
            <div style={{ fontSize: '0.6rem', color: '#888', fontFamily: "'Roboto Mono', monospace" }}>QUESTS</div>
        </div>
        <div style={{ flex: 1, background: '#1a1a1a', padding: '15px 5px', textAlign: 'center', border: '1px solid #333' }}>
            <div style={{ color: '#60a5fa', fontSize: '1rem', marginBottom: '5px', fontFamily: "'Press Start 2P', cursive" }}>85%</div>
            <div style={{ fontSize: '0.6rem', color: '#888', fontFamily: "'Roboto Mono', monospace" }}>ACCURACY</div>
        </div>
    </div>
  </div>
);