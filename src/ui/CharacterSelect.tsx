import React, { useState } from 'react';

// ============================================
// CHARACTER SELECT & AUTHENTICATION
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

interface CharacterSelectProps {
  onComplete: (user: UserProfile) => void;
}

type AuthMode = 'START' | 'LOGIN' | 'SIGNUP' | 'CHARACTER_SELECT' | 'PRIVACY';

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onComplete }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('START');
  const [gamertag, setGamertag] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<'warrior' | 'mage' | 'rogue' | null>(null);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!gamertag || !password) {
      setError('❌ Please enter both gamertag and password');
      return;
    }

    // Mock login - in production, verify against database
    const mockUser: UserProfile = {
      id: 'user-' + Date.now(),
      gamertag: gamertag,
      character: 'warrior', // Retrieved from DB
      level: 5,
      rank: 'Bronze',
      tokens: 150,
      isGuest: false,
      xp: 450,
      completedQuests: ['q1-history', 'q1-intro']
    };

    onComplete(mockUser);
  };

  const handleSignup = () => {
    if (!gamertag || !password) {
      setError('❌ Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('❌ Password must be at least 6 characters');
      return;
    }

    setAuthMode('PRIVACY');
  };

  const handlePrivacyAccept = () => {
    if (!acceptedPrivacy) {
      setError('❌ You must accept the privacy statement to continue');
      return;
    }
    setAuthMode('CHARACTER_SELECT');
  };

  const handleCharacterSelect = (character: 'warrior' | 'mage' | 'rogue') => {
    setSelectedCharacter(character);
  };

  const handleCreateAccount = () => {
    if (!selectedCharacter) {
      setError('❌ Please select a character type');
      return;
    }

    const newUser: UserProfile = {
      id: 'user-' + Date.now(),
      gamertag: gamertag,
      character: selectedCharacter,
      level: 1,
      rank: 'Beginner',
      tokens: 0,
      isGuest: false,
      xp: 0,
      completedQuests: []
    };

    // Show success message
    alert('✅ Success! Character saved successfully.');
    onComplete(newUser);
  };

  const handleGuestLogin = () => {
    const guestUser: UserProfile = {
      id: 'guest-' + Date.now(),
      gamertag: 'Guest_' + Math.floor(Math.random() * 9999),
      character: 'warrior',
      level: 1,
      rank: 'Guest',
      tokens: 0,
      isGuest: true,
      xp: 0,
      completedQuests: []
    };

    onComplete(guestUser);
  };

  const characters = [
    {
      id: 'warrior',
      name: 'WARRIOR',
      emoji: '🛡️',
      description: 'Strong and defensive. Masters loops and arrays.',
      color: '#3b82f6'
    },
    {
      id: 'mage',
      name: 'MAGE',
      emoji: '🧙‍♂️',
      description: 'Wise and analytical. Excels at algorithms.',
      color: '#8b5cf6'
    },
    {
      id: 'rogue',
      name: 'ROGUE',
      emoji: '🥷',
      description: 'Quick and agile. Expert in optimization.',
      color: '#10b981'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Animated Stars Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 }}>
        {[...Array(100)].map((_, i) => (
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

      {/* LOGO */}
      <div style={{
        fontSize: '3rem',
        marginBottom: '20px',
        animation: 'pulse 2s infinite',
        position: 'relative',
        zIndex: 1
      }}>
        🏰
      </div>

      <h1 style={{
        fontSize: '2.5rem',
        color: '#facc15',
        fontFamily: "'Press Start 2P', cursive",
        textShadow: '4px 4px #000',
        marginBottom: '40px',
        letterSpacing: '5px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        CODESENSE
      </h1>

      {/* ============================================
          START SCREEN
          ============================================ */}
      {authMode === 'START' && (
        <div style={{
          background: '#1e293b',
          border: '4px solid #facc15',
          borderRadius: '15px',
          padding: '50px',
          width: '100%',
          maxWidth: '500px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          animation: 'slideIn 0.5s'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '30px', animation: 'bounce 2s infinite' }}>
            🎮
          </div>
          
          <h2 style={{
            fontSize: '1.2rem',
            color: '#facc15',
            fontFamily: "'Press Start 2P', cursive",
            marginBottom: '40px'
          }}>
            PRESS START TO DEBUG
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              onClick={() => setAuthMode('LOGIN')}
              style={{
                background: '#4ade80',
                border: '3px solid #fff',
                color: '#000',
                padding: '20px',
                fontSize: '0.9rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: 'pointer',
                borderRadius: '10px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(74, 222, 128, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              LOG-IN
            </button>

            <button
              onClick={() => setAuthMode('SIGNUP')}
              style={{
                background: '#facc15',
                border: '3px solid #fff',
                color: '#000',
                padding: '20px',
                fontSize: '0.9rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: 'pointer',
                borderRadius: '10px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(250, 204, 21, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              NEW PLAYER? (SIGNUP)
            </button>

            <button
              onClick={handleGuestLogin}
              style={{
                background: '#475569',
                border: '2px solid #cbd5e1',
                color: '#cbd5e1',
                padding: '15px',
                fontSize: '0.7rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: 'pointer',
                borderRadius: '10px',
                transition: 'all 0.2s'
              }}
            >
              CONTINUE AS GUEST
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          LOGIN FORM
          ============================================ */}
      {authMode === 'LOGIN' && (
        <div style={{
          background: '#1e293b',
          border: '4px solid #4ade80',
          borderRadius: '15px',
          padding: '50px',
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          zIndex: 1,
          animation: 'slideIn 0.5s'
        }}>
          <h2 style={{
            fontSize: '1.2rem',
            color: '#4ade80',
            fontFamily: "'Press Start 2P', cursive",
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            LOG-IN
          </h2>

          {error && (
            <div style={{
              background: '#7f1d1d',
              border: '2px solid #ef4444',
              color: '#fecaca',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '0.7rem',
              fontFamily: "'Roboto Mono', monospace"
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#94a3b8', 
              fontSize: '0.7rem',
              marginBottom: '10px',
              fontFamily: "'Press Start 2P', cursive"
            }}>
              PLAYER NAME:
            </label>
            <input
              type="text"
              placeholder="Enter Gamertag..."
              value={gamertag}
              onChange={(e) => setGamertag(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                background: '#0f172a',
                border: '2px solid #475569',
                borderRadius: '5px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: "'Roboto Mono', monospace"
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ 
              display: 'block', 
              color: '#94a3b8', 
              fontSize: '0.7rem',
              marginBottom: '10px',
              fontFamily: "'Press Start 2P', cursive"
            }}>
              SECRET CODE:
            </label>
            <input
              type="password"
              placeholder="*********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%',
                padding: '15px',
                background: '#0f172a',
                border: '2px solid #475569',
                borderRadius: '5px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: "'Roboto Mono', monospace"
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleLogin}
              style={{
                flex: 1,
                background: '#4ade80',
                border: '3px solid #fff',
                color: '#000',
                padding: '18px',
                fontSize: '0.8rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: 'pointer',
                borderRadius: '10px'
              }}
            >
              ENTER
            </button>
            <button
              onClick={() => { setAuthMode('START'); setError(''); }}
              style={{
                padding: '18px 25px',
                background: '#ef4444',
                border: '2px solid #fff',
                color: '#fff',
                fontSize: '0.8rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: 'pointer',
                borderRadius: '10px'
              }}
            >
              BACK
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          SIGNUP FORM
          ============================================ */}
      {authMode === 'SIGNUP' && (
        <div style={{
          background: '#1e293b',
          border: '4px solid #facc15',
          borderRadius: '15px',
          padding: '50px',
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          zIndex: 1,
          animation: 'slideIn 0.5s'
        }}>
          <h2 style={{
            fontSize: '1.2rem',
            color: '#facc15',
            fontFamily: "'Press Start 2P', cursive",
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            CREATE ACCOUNT
          </h2>

          {error && (
            <div style={{
              background: '#7f1d1d',
              border: '2px solid #ef4444',
              color: '#fecaca',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '0.7rem',
              fontFamily: "'Roboto Mono', monospace"
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#94a3b8', 
              fontSize: '0.7rem',
              marginBottom: '10px',
              fontFamily: "'Press Start 2P', cursive"
            }}>
              PLAYER NAME:
            </label>
            <input
              type="text"
              placeholder="Type your name"
              value={gamertag}
              onChange={(e) => setGamertag(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                background: '#0f172a',
                border: '2px solid #475569',
                borderRadius: '5px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: "'Roboto Mono', monospace"
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ 
              display: 'block', 
              color: '#94a3b8', 
              fontSize: '0.7rem',
              marginBottom: '10px',
              fontFamily: "'Press Start 2P', cursive"
            }}>
              SECRET CODE:
            </label>
            <input
              type="password"
              placeholder="Type your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                background: '#0f172a',
                border: '2px solid #475569',
                borderRadius: '5px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: "'Roboto Mono', monospace"
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSignup}
              style={{
                flex: 1,
                background: '#facc15',
                border: '3px solid #fff',
                color: '#000',
                padding: '18px',
                fontSize: '0.8rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: 'pointer',
                borderRadius: '10px'
              }}
            >
              CONTINUE
            </button>
            <button
              onClick={() => { setAuthMode('START'); setError(''); }}
              style={{
                padding: '18px 25px',
                background: '#ef4444',
                border: '2px solid #fff',
                color: '#fff',
                fontSize: '0.8rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: 'pointer',
                borderRadius: '10px'
              }}
            >
              BACK
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          PRIVACY STATEMENT
          ============================================ */}
      {authMode === 'PRIVACY' && (
        <div style={{
          background: '#1e293b',
          border: '4px solid #8b5cf6',
          borderRadius: '15px',
          padding: '40px',
          width: '100%',
          maxWidth: '600px',
          position: 'relative',
          zIndex: 1,
          animation: 'slideIn 0.5s'
        }}>
          <h2 style={{
            fontSize: '1rem',
            color: '#a78bfa',
            fontFamily: "'Press Start 2P', cursive",
            marginBottom: '25px',
            textAlign: 'center'
          }}>
            PRIVACY STATEMENT CONSENT
          </h2>

          <div style={{
            background: '#0f172a',
            border: '2px solid #475569',
            borderRadius: '10px',
            padding: '20px',
            maxHeight: '300px',
            overflow: 'auto',
            marginBottom: '25px',
            fontSize: '0.8rem',
            color: '#cbd5e1',
            lineHeight: '1.6',
            fontFamily: "'Roboto Mono', monospace"
          }}>
            <p style={{ marginBottom: '15px' }}>
              By using CodeSense, you agree to our collection and use of your data for the following purposes:
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
              <li>Progress tracking and analytics</li>
              <li>Leaderboard rankings</li>
              <li>Account authentication</li>
              <li>Educational research</li>
            </ul>
            <p style={{ marginBottom: '15px' }}>
              We do not share your personal information with third parties. All data is encrypted and stored securely.
              You have the right to request deletion of your data at any time.
            </p>
            <p>
              For full details, please review our Privacy Policy at codesense.edu/privacy
            </p>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '25px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: '#cbd5e1',
            fontFamily: "'Roboto Mono', monospace"
          }}>
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              style={{ width: '25px', height: '25px', cursor: 'pointer' }}
            />
            I have read and agree to the Privacy Statement
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrivacyAccept}
              disabled={!acceptedPrivacy}
              style={{
                flex: 1,
                background: acceptedPrivacy ? '#8b5cf6' : '#475569',
                border: '3px solid #fff',
                color: acceptedPrivacy ? '#fff' : '#94a3b8',
                padding: '18px',
                fontSize: '0.8rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: acceptedPrivacy ? 'pointer' : 'not-allowed',
                borderRadius: '10px'
              }}
            >
              I AGREE
            </button>
            <button
              onClick={() => setAuthMode('SIGNUP')}
              style={{
                padding: '18px 25px',
                background: '#ef4444',
                border: '2px solid #fff',
                color: '#fff',
                fontSize: '0.8rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: 'pointer',
                borderRadius: '10px'
              }}
            >
              BACK
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          CHARACTER SELECTION
          ============================================ */}
      {authMode === 'CHARACTER_SELECT' && (
        <div style={{
          background: '#1e293b',
          border: '4px solid #facc15',
          borderRadius: '15px',
          padding: '40px',
          width: '100%',
          maxWidth: '900px',
          position: 'relative',
          zIndex: 1,
          animation: 'slideIn 0.5s'
        }}>
          <h2 style={{
            fontSize: '1.2rem',
            color: '#facc15',
            fontFamily: "'Press Start 2P', cursive",
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            SELECT YOUR CHARACTER
          </h2>

          <p style={{
            fontSize: '0.7rem',
            color: '#94a3b8',
            textAlign: 'center',
            marginBottom: '40px',
            fontFamily: "'Roboto Mono', monospace"
          }}>
            Choose a class that matches your coding style
          </p>

          {error && (
            <div style={{
              background: '#7f1d1d',
              border: '2px solid #ef4444',
              color: '#fecaca',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '0.7rem',
              fontFamily: "'Roboto Mono', monospace",
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {characters.map((char) => (
              <div
                key={char.id}
                onClick={() => handleCharacterSelect(char.id as any)}
                style={{
                  flex: '1 1 250px',
                  background: selectedCharacter === char.id 
                    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                    : '#0f172a',
                  border: selectedCharacter === char.id 
                    ? `4px solid ${char.color}`
                    : '2px solid #475569',
                  borderRadius: '15px',
                  padding: '30px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  transform: selectedCharacter === char.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: selectedCharacter === char.id 
                    ? `0 10px 30px ${char.color}40`
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  if (selectedCharacter !== char.id) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>{char.emoji}</div>
                <h3 style={{
                  fontSize: '1rem',
                  color: selectedCharacter === char.id ? char.color : '#cbd5e1',
                  fontFamily: "'Press Start 2P', cursive",
                  marginBottom: '15px'
                }}>
                  {char.name}
                </h3>
                <p style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  lineHeight: '1.6',
                  fontFamily: "'Roboto Mono', monospace"
                }}>
                  {char.description}
                </p>
                {selectedCharacter === char.id && (
                  <div style={{
                    marginTop: '15px',
                    color: char.color,
                    fontSize: '0.6rem',
                    fontFamily: "'Press Start 2P', cursive"
                  }}>
                    ✓ SELECTED
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateAccount}
              style={{
                flex: 1,
                background: selectedCharacter ? '#4ade80' : '#475569',
                border: '3px solid #fff',
                color: selectedCharacter ? '#000' : '#94a3b8',
                padding: '20px',
                fontSize: '0.9rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: selectedCharacter ? 'pointer' : 'not-allowed',
                borderRadius: '10px'
              }}
              disabled={!selectedCharacter}
            >
              CREATE ME
            </button>
            <button
              onClick={() => setAuthMode('PRIVACY')}
              style={{
                padding: '20px 30px',
                background: '#ef4444',
                border: '2px solid #fff',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: "'Press Start 2P', cursive",
                cursor: 'pointer',
                borderRadius: '10px'
              }}
            >
              BACK
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideIn {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};