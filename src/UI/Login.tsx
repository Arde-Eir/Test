import React from 'react';

export const LoginScreen = ({ onLogin }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1b26' }}>
    <h1 style={{ color: '#73daca', fontFamily: '"Press Start 2P"', fontSize: '40px', marginBottom: '40px' }}>CODESENSE</h1>
    <div className="card" style={{ padding: '40px', width: '300px', textAlign: 'center' }}>
      <input placeholder="ENTER NAME" style={{ width: '90%', padding: '10px', marginBottom: '20px', background: '#1a1b26', border: '2px solid #565f89', color: 'white' }} />
      <button className="header-btn" style={{ width: '100%' }} onClick={() => onLogin({ name: 'Player 1' })}>START GAME</button>
    </div>
  </div>
);