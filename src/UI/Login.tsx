// src/UI/Login.tsx
import { useState } from 'react';

export const LoginScreen = ({ onLogin }: any) => {
  const [name, setName] = useState("");

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      height: '100vh', background: '#1a1b26', fontFamily: '"Press Start 2P"' 
    }}>
      <h1 style={{ 
        color: '#73daca', fontSize: '40px', marginBottom: '10px', textShadow: '4px 4px #000' 
      }}>CODESENSE</h1>
      
      <p style={{ color: '#565f89', marginBottom: '50px', fontSize: '12px' }}>STATIC ANALYSIS ENGINE</p>

      <div style={{ 
        padding: '40px', width: '350px', textAlign: 'center', 
        border: '4px solid #414868', boxShadow: '8px 8px 0px #000',
        background: '#24283b'
      }}>
        <label style={{display: 'block', color: '#7dcfff', marginBottom: '15px', textAlign: 'left'}}>USER ID:</label>
        <input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ENTER NAME..." 
          style={{ 
            width: '90%', padding: '15px', marginBottom: '30px', 
            background: '#1a1b26', border: '2px solid #565f89', 
            color: 'white', fontFamily: '"Fira Code"', outline: 'none'
          }} 
        />
        
        <button 
          onClick={() => name && onLogin({ name, coins: 0 })}
          style={{ 
            width: '100%', padding: '15px', cursor: 'pointer',
            background: name ? '#73daca' : '#414868', 
            color: '#1a1b26', border: 'none',
            fontFamily: '"Press Start 2P"', boxShadow: '4px 4px 0px #000'
          }}
        >
          {name ? "START GAME" : "ENTER NAME"}
        </button>
      </div>
    </div>
  );
};