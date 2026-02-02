import React, { useState } from 'react';
import { DatabaseService } from '../data/Database';
import './PixelTheme.css';

export const CharacterSelect = ({ onComplete }: { onComplete: (user: any) => void }) => {
  const [gamertag, setGamertag] = useState('');
  const [password, setPassword] = useState(''); 
  const [character, setCharacter] = useState('Novice');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const characterTypes = ['Warrior', 'Mage', 'Technician', 'Novice'];

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gamertag.trim() || (!isSignup && !password.trim())) {
      setError('Please enter your credentials.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let userProfile;
      if (isSignup) {
        // Create new account [cite: 31, 42]
        userProfile = await DatabaseService.signUp(gamertag, password, character);
      } else {
        // Strict login verification [cite: 19]
        userProfile = await DatabaseService.login(gamertag, password);
      }
      onComplete(userProfile);
    } catch (err: any) {
      // Show registration error 
      setError("Ooops! This account is not registered. Please try to sign-in first.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = async () => {
    setLoading(true);
    try {
      // Access as guest (Sandbox only)
      const guestUser = await DatabaseService.loginAsGuest();
      onComplete(guestUser);
    } catch (err) {
      setError('Guest entry failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
      <div className="pixel-card" style={{ width: '450px', textAlign: 'center', padding: '30px' }}>
        <h1 style={{ fontFamily: '"Press Start 2P"', color: '#facc15', fontSize: '1.2rem' }}>CodeSense</h1>
        
        <p style={{ fontSize: '0.8rem', margin: '15px 0' }}>
            {loading ? 'SYNCHRONIZING...' : 'PRESS START TO DEBUG'}
        </p>

        {error && (
          <div className="pixel-card" style={{ background: '#421', color: '#f55', fontSize: '0.6rem', marginBottom: '15px', padding: '10px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ textAlign: 'left', fontSize: '0.7rem' }}>
          <label>PLAYER NAME:</label>
          <input 
            className="pixel-input" 
            placeholder="Type your name..." 
            value={gamertag}
            onChange={e => setGamertag(e.target.value)}
            disabled={loading}
            style={{ width: '100%', marginBottom: '15px' }}
          />

          <label>SECRET CODE:</label>
          <input 
            className="pixel-input" 
            type="password"
            placeholder="Type your password..." 
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            style={{ width: '100%', marginBottom: '20px' }}
          />

          {isSignup && (
            <>
              <label>CHARACTER:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '10px 0 20px 0' }}>
                {characterTypes.map(c => (
                  <button 
                    key={c}
                    type="button"
                    className={`pixel-btn ${character === c ? 'active' : ''}`}
                    onClick={() => setCharacter(c)}
                    style={{ 
                        fontSize: '0.5rem', 
                        padding: '10px', 
                        background: character === c ? '#facc15' : '#333',
                        color: character === c ? '#000' : '#fff'
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}

          <button type="submit" className="pixel-btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'PROCESSING...' : (isSignup ? 'CREATE ME' : 'LOG-IN')}
          </button>
        </form>

        <button 
          className="pixel-btn" 
          style={{ width: '100%', background: '#444', marginTop: '10px' }} 
          onClick={handleGuestEntry}
          disabled={loading}
        >
          PLAY AS GUEST
        </button>

        <div 
          style={{ marginTop: '20px', fontSize: '0.6rem', cursor: 'pointer', textDecoration: 'underline', color: '#aaa' }}
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup ? 'ALREADY REGISTERED? LOG-IN' : 'NEW PLAYER? (SIGNUP)'}
        </div>
      </div>
    </div>
  );
};