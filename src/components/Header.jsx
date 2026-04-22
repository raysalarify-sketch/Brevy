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
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onHome()}>
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg" style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 7L12 12L4 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 12L20 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            <path d="M12 12L4 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
          </svg>
        </div>
        <h1 className="text-2xl font-serif tracking-tight text-primary m-0" style={{ fontSize: 24, fontWeight: 700, fontFamily: 'DM Serif Display', margin: 0 }}>Brevy</h1>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{templateCount}</span> templates available
      </div>
    </header>
  );
};

export default Header;
