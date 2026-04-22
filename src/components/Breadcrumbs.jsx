import React from 'react';

const Breadcrumbs = ({ cat, tpl, onHome, onViewTpls }) => {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 24, color: 'var(--text-muted)' }}>
      <span onClick={onHome} style={{ cursor: 'pointer', transition: 'color 0.2s' }} className="hover:text-primary">All</span>
      {cat && (
        <>
          <span style={{ opacity: 0.5 }}>/</span>
          <span onClick={onViewTpls} style={{ cursor: 'pointer' }} className="hover:text-primary">{cat.l}</span>
        </>
      )}
      {tpl && (
        <>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{tpl.n}</span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumbs;
