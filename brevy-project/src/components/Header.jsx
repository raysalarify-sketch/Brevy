import React from 'react';

const Header = ({ templateCount, onHome }) => {
  return (
    <header className="glass-header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      background: 'rgba(255, 255, 255, 0.8)',
      borderBottom: '1px solid var(--border)',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'DM Serif Display'
        }}>B</div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Brevy</h1>
          <p style={{ fontSize: 10, color: 'var(--text-light)', letterSpacing: '0.05em', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Prompt Studio</p>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{templateCount}</span> templates available
      </div>
    </header>
  );
};

export default Header;
