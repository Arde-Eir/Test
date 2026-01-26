
export const TutorialModal = ({ title, desc, onClose }: any) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="card" style={{ width: '400px', textAlign: 'center', border: '4px solid #73daca', padding: '30px' }}>
      <h2 style={{ color: '#73daca' }}>{title}</h2>
      <p style={{ lineHeight: '1.6', margin: '20px 0', color: '#c0caf5' }}>{desc}</p>
      <button className="header-btn" onClick={onClose}>ACCEPT MISSION ►</button>
    </div>
  </div>
);