import React, { useState } from 'react';
import { Sandbox } from './ui/Sandbox';
import { Campaign } from './ui/Campaign';
import { QuestActivity } from './ui/Questactivity';
import { CharacterSelect } from './ui/CharacterSelect';
import UserProfile from './ui/UserProfile';
import { LeaderboardWidget, ProgressWidget } from './ui/DashboardWidgets';

// ============================================
// TYPES
// ============================================

interface UserProfile {
  id: string;
  gamertag: string;
  character: 'warrior' | 'mage' | 'rogue';
  level: number;
  rank: string;
  tokens: number;
  isGuest: boolean;
  xp: number;
  completedQuests: string[];
}

type AppMode = 'AUTH' | 'HOME' | 'SANDBOX' | 'CAMPAIGN' | 'QUEST' | 'PROFILE';

// ============================================
// MAIN APP COMPONENT
// ============================================

export const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<AppMode>('AUTH');
  const [currentQuest, setCurrentQuest] = useState<string | null>(null);

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

  const handleQuestStart = (questId: string) => {
    setCurrentQuest(questId);
    setMode('QUEST');
  };

  const handleQuestComplete = (xpEarned: number) => {
    if (user && currentQuest) {
      setUser({
        ...user,
        xp: user.xp + xpEarned,
        tokens: user.tokens + Math.floor(xpEarned / 2),
        completedQuests: [...user.completedQuests, currentQuest]
      });
      alert(`🎉 Quest Complete! You earned ${xpEarned} XP and ${Math.floor(xpEarned / 2)} tokens!`);
      setCurrentQuest(null);
      setMode('CAMPAIGN');
    }
  };

  return (
    <div style={{ 
      background: '#111', 
      minHeight: '100vh', 
      color: '#fff', 
      fontFamily: "'Roboto Mono', monospace"
    }}>
      
      {/* ================================================
          SCENE 1: AUTHENTICATION (Login/Signup)
          ================================================ */}
      {mode === 'AUTH' && <CharacterSelect onComplete={handleLogin} />}

      {/* ================================================
          SCENE 2: HOME HUB (Dashboard)
          ================================================ */}
      {mode === 'HOME' && user && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
        }}>
          
          {/* HEADER */}
          <header style={{ 
            background: '#1a1a1a',
            borderBottom: '4px solid #facc15',
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
            fontFamily: "'Press Start 2P', cursive"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.5rem' }}>🏰</span>
              <h1 style={{ color: '#facc15', fontSize: '1.2rem', letterSpacing: '3px' }}>
                CODESENSE
              </h1>
            </div>
            
            <div style={{ display: 'flex', gap: '25px', alignItems: 'center', fontSize: '0.7rem' }}>
              <div 
                onClick={() => setMode('PROFILE')} 
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '2px solid #333',
                  padding: '8px 15px',
                  background: '#222',
                  borderRadius: '5px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#333';
                  e.currentTarget.style.borderColor = '#facc15';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#222';
                  e.currentTarget.style.borderColor = '#333';
                }}
              >
                <span>👤</span>
                <span>{user.gamertag}</span>
              </div>
              
              <div style={{ color: '#facc15', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>💎</span>
                <span>{user.tokens}</span>
              </div>
              
              <div style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>⭐</span>
                <span>Lvl {user.level}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                style={{
                  background: '#ef4444',
                  border: '2px solid #fff',
                  color: '#fff',
                  padding: '8px 15px',
                  fontSize: '0.6rem',
                  cursor: 'pointer',
                  borderRadius: '5px'
                }}
              >
                LOGOUT
              </button>
            </div>
          </header>

          {/* MAIN DASHBOARD */}
          <div style={{ 
            flex: 1,
            padding: '30px',
            display: 'flex',
            gap: '30px'
          }}>
            
            {/* LEFT COLUMN: Hero Banner + Action Cards */}
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* HERO BANNER */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                border: '4px solid #facc15',
                borderRadius: '15px',
                padding: '50px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {/* Animated Stars Background */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0,
                  opacity: 0.2 
                }}>
                  {[...Array(30)].map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      width: '2px',
                      height: '2px',
                      background: '#fff',
                      borderRadius: '50%',
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animation: `twinkle ${2 + Math.random() * 3}s infinite`
                    }} />
                  ))}
                </div>

                <div style={{ 
                  fontSize: '5rem', 
                  marginBottom: '20px',
                  animation: 'bounce 2s infinite',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {user.character === 'mage' ? '🧙‍♂️' : user.character === 'rogue' ? '🥷' : '🛡️'}
                </div>
                
                <h2 style={{ 
                  color: '#facc15',
                  fontSize: '2rem',
                  fontFamily: "'Press Start 2P', cursive",
                  textShadow: '4px 4px #000',
                  marginBottom: '15px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  WELCOME, {user.gamertag.toUpperCase()}
                </h2>
                
                <p style={{ 
                  color: '#cbd5e1',
                  fontSize: '0.8rem',
                  fontFamily: "'Roboto Mono', monospace",
                  position: 'relative',
                  zIndex: 1
                }}>
                  Your journey continues...
                </p>

                {/* Scan Line Effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, #facc15, transparent)',
                  animation: 'scan 3s linear infinite'
                }} />
              </div>

              {/* ACTION CARDS */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* SANDBOX CARD */}
                <div 
                  onClick={() => setMode('SANDBOX')}
                  style={{
                    flex: '1 1 300px',
                    background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                    border: '4px solid #4ade80',
                    borderRadius: '15px',
                    padding: '40px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(74, 222, 128, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔬</div>
                  <h3 style={{ 
                    color: '#4ade80',
                    fontSize: '1.2rem',
                    fontFamily: "'Press Start 2P', cursive",
                    marginBottom: '15px'
                  }}>
                    SANDBOX
                  </h3>
                  <p style={{ 
                    fontSize: '0.8rem',
                    color: '#d1fae5',
                    lineHeight: '1.6',
                    marginBottom: '20px',
                    fontFamily: "'Roboto Mono', monospace"
                  }}>
                    Experiment freely with code. No rules, just logic.
                  </p>
                  <div style={{
                    display: 'inline-block',
                    background: '#4ade80',
                    color: '#000',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    fontSize: '0.7rem',
                    fontFamily: "'Press Start 2P', cursive",
                    fontWeight: 'bold'
                  }}>
                    ENTER LAB &raquo;
                  </div>
                </div>

                {/* CAMPAIGN CARD */}
                <div 
                  onClick={handleCampaignEntry}
                  style={{
                    flex: '1 1 300px',
                    background: user.isGuest 
                      ? 'linear-gradient(135deg, #334155 0%, #475569 100%)'
                      : 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
                    border: user.isGuest ? '4px solid #64748b' : '4px solid #facc15',
                    borderRadius: '15px',
                    padding: '40px',
                    textAlign: 'center',
                    cursor: user.isGuest ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    opacity: user.isGuest ? 0.6 : 1,
                    filter: user.isGuest ? 'grayscale(0.5)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!user.isGuest) {
                      e.currentTarget.style.transform = 'translateY(-10px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(250, 204, 21, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!user.isGuest) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                    {user.isGuest ? '🔒' : '🗺️'}
                  </div>
                  <h3 style={{ 
                    color: user.isGuest ? '#94a3b8' : '#facc15',
                    fontSize: '1.2rem',
                    fontFamily: "'Press Start 2P', cursive",
                    marginBottom: '15px'
                  }}>
                    CAMPAIGN
                  </h3>
                  <p style={{ 
                    fontSize: '0.8rem',
                    color: user.isGuest ? '#cbd5e1' : '#fef3c7',
                    lineHeight: '1.6',
                    marginBottom: '20px',
                    fontFamily: "'Roboto Mono', monospace"
                  }}>
                    {user.isGuest 
                      ? "Sign up to unlock Story Mode and save your progress."
                      : "Continue your adventure through C++ mastery."}
                  </p>
                  <div style={{
                    display: 'inline-block',
                    background: user.isGuest ? '#475569' : '#facc15',
                    color: user.isGuest ? '#cbd5e1' : '#000',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    fontSize: '0.7rem',
                    fontFamily: "'Press Start 2P', cursive",
                    fontWeight: 'bold'
                  }}>
                    {user.isGuest ? "LOCKED 🔒" : "CONTINUE &raquo;"}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Leaderboard & Progress */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '300px' }}>
              <LeaderboardWidget userScore={user.tokens} />
              <ProgressWidget level={user.level} rank={user.rank} xp={user.xp} />
            </div>
          </div>

          {/* CSS ANIMATIONS */}
          <style>{`
            @keyframes twinkle {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 1; }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
            @keyframes scan {
              0% { top: 0; }
              100% { top: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* ================================================
          SCENE 3: SANDBOX MODE
          ================================================ */}
      {mode === 'SANDBOX' && user && (
        <Sandbox 
          user={user} 
          onBack={() => setMode('HOME')}
          onProfileClick={() => setMode('PROFILE')}
        />
      )}

      {/* ================================================
          SCENE 4: CAMPAIGN MODE
          ================================================ */}
      {mode === 'CAMPAIGN' && user && (
        <Campaign
          user={user}
          onBack={() => setMode('HOME')}
          onQuestStart={handleQuestStart}
        />
      )}

      {/* ================================================
          SCENE 5: QUEST ACTIVITY
          ================================================ */}
      {mode === 'QUEST' && user && currentQuest && (
        <QuestActivity
          questId={currentQuest}
          onComplete={handleQuestComplete}
          onBack={() => setMode('CAMPAIGN')}
        />
      )}

      {/* ================================================
          SCENE 6: USER PROFILE
          ================================================ */}
      {mode === 'PROFILE' && user && (
        <UserProfile 
          user={user} 
          onBack={() => setMode('HOME')}
        />
      )}
    </div>
  );
};