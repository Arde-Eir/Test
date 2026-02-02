import React, { useState } from 'react';
import { Sandbox } from './ui/Sandbox';
import { CharacterSelect } from './ui/CharacterSelect';
import UserProfile from './ui/UserProfile'; 
import { LeaderboardWidget, ProgressWidget } from './ui/DashboardWidgets'; // 1. IMPORT

// --- TYPES ---
interface UserProfile {
  id: string;
  gamertag: string;
  character: string; // 'warrior' | 'mage' | 'rogue'
  level: number;
  rank: string;
  tokens: number;
  isGuest: boolean;
}

type AppMode = 'AUTH' | 'HOME' | 'SANDBOX' | 'CAMPAIGN' | 'PROFILE';

export const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<AppMode>('AUTH');

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    setMode('HOME');
  };

  const handleLogout = () => {
    setUser(null);
    setMode('AUTH');
  };

  const handleCampaignEntry = () => {
    if (user?.isGuest) {
      alert("🔒 LOCKED! Please Sign Up to save campaign progress.");
    } else {
      setMode('CAMPAIGN');
    }
  };

  return (
    <div className="app-container" style={{ 
      background: '#111', minHeight: '100vh', color: '#fff', 
      fontFamily: "'Roboto Mono', monospace", overflow: 'hidden'
    }}>
      
      {/* --- SCENE 1: AUTHENTICATION --- */}
      {mode === 'AUTH' && <CharacterSelect onComplete={handleLogin} />}

      {/* --- SCENE 2: HOME HUB --- */}
      {mode === 'HOME' && user && (
        <div className="home-screen fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '10px', overflowY: 'auto' }}>
          
          {/* HEADER */}
          <header className="pixel-card" style={{ 
            display: 'flex', justifyContent: 'space-between', padding: '15px 30px', 
            background: '#1a1a1a', borderBottom: '4px solid #facc15', marginBottom: '20px',
            flexWrap: 'wrap', gap: '10px', fontFamily: "'Press Start 2P', cursive"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.2rem' }}>🏰</span>
              <span style={{ color: '#facc15', letterSpacing: '2px' }}>CODESENSE</span>
            </div>
            <div style={{ display: 'flex', gap: '25px', alignItems: 'center', fontSize: '0.7rem' }}>
              <div onClick={() => setMode('PROFILE')} className="hover-lift" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #333', padding: '5px 10px', background: '#222' }}>
                 <span>👤 {user.gamertag}</span>
              </div>
              <span style={{ color: '#facc15' }}>💎 {user.tokens}</span>
              <button onClick={handleLogout} className="pixel-btn" style={{ fontSize: '0.6rem', padding: '5px 10px', background: '#ef4444', borderColor: '#fff' }}>LOGOUT</button>
            </div>
          </header>

          {/* DASHBOARD GRID */}
          <div className="dashboard-grid" style={{ display: 'flex', gap: '20px', flex: 1, paddingBottom: '20px' }}>
            
            {/* LEFT COLUMN */}
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* BANNER */}
              <div className="pixel-card animated-banner" style={{ 
                height: '250px', background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)', 
                border: '4px solid #fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                position: 'relative', overflow: 'hidden', fontFamily: "'Press Start 2P', cursive"
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '10px' }}>
                   {user.character === 'mage' ? '🧙‍♂️' : user.character === 'rogue' ? '🥷' : '🛡️'}
                </div>
                <h1 style={{ color: '#fff', textShadow: '4px 4px #000', textAlign: 'center', lineHeight: '1.5' }}>WELCOME, {user.gamertag}</h1>
                <p style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '10px', fontFamily: "'Roboto Mono', monospace" }}>Your journey continues...</p>
                <div className="scan-line"></div>
              </div>

              {/* ACTION CARDS */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="pixel-card hover-lift" style={{ flex: 1, padding: '30px', background: '#1a1a1a', border: '4px solid #4ade80', textAlign: 'center', minWidth: '250px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📦</div>
                  <h2 style={{ color: '#4ade80', marginBottom: '15px', fontFamily: "'Press Start 2P', cursive" }}>SANDBOX</h2>
                  <p style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: '1.6', marginBottom: '20px' }}>Free coding mode. Test algorithms and visualize flow.</p>
                  <button className="pixel-btn" onClick={() => setMode('SANDBOX')} style={{ width: '100%' }}>ENTER LAB &raquo;</button>
                </div>
                <div className="pixel-card hover-lift" style={{ flex: 1, padding: '30px', background: '#1a1a1a', border: '4px solid #facc15', textAlign: 'center', minWidth: '250px', opacity: user.isGuest ? 0.5 : 1, filter: user.isGuest ? 'grayscale(1)' : 'none' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🗺️</div>
                  <h2 style={{ color: '#facc15', marginBottom: '15px', fontFamily: "'Press Start 2P', cursive" }}>CAMPAIGN</h2>
                  <p style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: '1.6', marginBottom: '20px' }}>{user.isGuest ? "Login to access Story Mode." : "Continue your adventure."}</p>
                  <button className="pixel-btn" onClick={handleCampaignEntry} style={{ width: '100%', background: user.isGuest ? '#555' : undefined }}>{user.isGuest ? "LOCKED 🔒" : "CONTINUE &raquo;"}</button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (Uses Reusable Widgets) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <LeaderboardWidget userScore={user.tokens} />
               <ProgressWidget level={user.level} rank={user.rank} />
            </div>

          </div>
        </div>
      )}

      {/* --- SCENE 3: SANDBOX --- */}
      {mode === 'SANDBOX' && user && <Sandbox user={user} onBack={() => setMode('HOME')} onProfileClick={() => setMode('PROFILE')} />}

      {/* --- SCENE 4: PROFILE --- */}
      {mode === 'PROFILE' && user && <UserProfile user={user} onBack={() => setMode('HOME')} />}

      {/* --- SCENE 5: CAMPAIGN --- */}
      {mode === 'CAMPAIGN' && user && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#050505' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🚧</div>
          <h1 style={{ color: '#facc15', marginBottom: '20px', textAlign: 'center', lineHeight: '1.5', fontFamily: "'Press Start 2P', cursive" }}>CAMPAIGN UNDER CONSTRUCTION</h1>
          <button className="pixel-btn" onClick={() => setMode('HOME')}>&laquo; RETURN TO BASE</button>
        </div>
      )}

    </div>
  );
};