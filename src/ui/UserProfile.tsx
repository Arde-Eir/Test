import React, { useState } from 'react';
import { LeaderboardWidget, ProgressWidget } from './DashboardWidgets';
import './PixelTheme.css';

interface UserProfileProps {
  user: any;
  onBack: () => void;
  onLogin?: () => void; // Added to trigger auth modal/view
}

const UserProfile = ({ user, onBack, onLogin }: UserProfileProps) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEARN'>('OVERVIEW');

  // ✅ 1. AUTHENTICATION GUARD: Block Guests
  if (!user || user.isGuest) {
    return (
      <div className="sandbox-container" style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#111' 
      }}>
        <div className="pixel-card" style={{ 
          textAlign: 'center', 
          maxWidth: '450px', 
          border: '4px solid #ef4444',
          padding: '30px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🔐</div>
          <h2 style={{ 
            fontFamily: "'Press Start 2P', cursive", 
            color: '#ef4444', 
            fontSize: '1rem',
            lineHeight: '1.5'
          }}>
            ACCESS PROHIBITED
          </h2>
          <p style={{ margin: '20px 0', color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6' }}>
            User profiles are reserved for registered wizards. <br/>
            Create an account to track your C++ progress and earn tokens!
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* LOGIN SHORTCUT */}
            <button 
              onClick={onLogin} 
              className="pixel-btn" 
              style={{ background: '#facc15', color: '#000' }}
            >
              LOG IN / SIGN UP »
            </button>
            
            <button 
              onClick={onBack} 
              className="pixel-btn" 
              style={{ background: 'transparent', border: '2px solid #555' }}
            >
              RETURN TO MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 2. AUTHENTICATED VIEW: Only visible to logged-in users
  return (
    <div className="sandbox-container" style={{ minHeight: '100vh', background: '#111', color: '#fff', fontFamily: "'Roboto Mono', monospace" }}>
      
      {/* HEADER */}
      <header className="pixel-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '4px solid #facc15' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} className="pixel-btn">« BACK</button>
          <span style={{ fontFamily: "'Press Start 2P', cursive", color: '#fff', fontSize: '0.8rem' }}>👤 PROFILE</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>🔔</span>
            <div style={{ width: '30px', height: '30px', background: '#facc15', borderRadius: '50%' }}></div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile() ? '1fr' : '2fr 1fr', 
          gap: '20px', padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%'
      }}>

        {/* LEFT COLUMN: PROFILE CARD */}
        <div className="pixel-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
                height: '180px', 
                background: 'linear-gradient(45deg, #1e1b4b 25%, #312e81 25%, #312e81 50%, #1e1b4b 50%, #1e1b4b 75%, #312e81 75%, #312e81 100%)',
                backgroundSize: '40px 40px', position: 'relative'
            }}>
                <button className="pixel-btn" style={{ position: 'absolute', right: '20px', bottom: '20px', fontSize: '0.6rem' }}>✏️ EDIT PROFILE</button>
            </div>

            <div style={{ padding: '0 20px', marginTop: '-50px', display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
                <div style={{ 
                    width: '100px', height: '100px', background: '#facc15', border: '4px solid #111', 
                    boxShadow: '4px 4px 0px #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem'
                }}>
                    {user?.character === 'mage' ? '🧙‍♂️' : user?.character === 'rogue' ? '🥷' : '🛡️'}
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <h1 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '1.2rem', margin: '0 0 5px 0' }}>{user?.gamertag || "Player_One"}</h1>
                    <span style={{ color: '#888' }}>ID: {user?.id || "player_handle"}</span>
                </div>
            </div>

            <div style={{ display: 'flex', marginTop: '30px', borderBottom: '2px solid #333', padding: '0 20px' }}>
                {['OVERVIEW', 'LEARN'].map(tab => (
                    <div key={tab} onClick={() => setActiveTab(tab as any)} style={{
                        padding: '10px 20px', cursor: 'pointer', fontFamily: "'Press Start 2P', cursive", fontSize: '0.7rem',
                        color: activeTab === tab ? '#facc15' : '#666', borderBottom: activeTab === tab ? '4px solid #facc15' : 'none'
                    }}>
                        {tab}
                    </div>
                ))}
            </div>

            <div style={{ padding: '20px', lineHeight: '1.6', color: '#ccc' }}>
                {activeTab === 'OVERVIEW' ? (
                    <div>
                        <h3 style={{ color: '#fff', marginTop: 0 }}>Wizard Bio</h3>
                        <p>Currently exploring the dungeons of C++ Logic. Level {user?.level || 1} {user?.character || 'Novice'}.</p>
                        <p><strong>Joined:</strong> {user?.joinDate || 'Jan 2026'}</p>
                        <h3 style={{ color: '#fff' }}>Unlocked Achievements</h3>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {user?.achievements?.length > 0 ? user.achievements.map((badge: string) => (
                                <span key={badge} style={{ background: '#333', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #555' }}>{badge}</span>
                            )) : (
                              <span style={{ color: '#555', fontStyle: 'italic' }}>No achievements yet. Keep coding!</span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                      <h3 style={{ color: '#fff', marginTop: 0 }}>Course Progress</h3>
                      <p>Finish your first analysis to unlock learning paths!</p>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: WIDGETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <LeaderboardWidget userScore={user?.tokens || 0} />
             <ProgressWidget level={user?.level || 1} rank={user?.rank || "Initiate"} />
        </div>

      </div>
    </div>
  );
};

// Helper to check mobile view for grid adjustment
const isMobile = () => window.innerWidth <= 768;

export default UserProfile;