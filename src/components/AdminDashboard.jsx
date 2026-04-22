import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ onExit }) => {
  const [logs, setLogs] = useState([]);
  const [currentCode, setCurrentCode] = useState(localStorage.getItem('brevy_ref_code') || 'BREVY-AI');
  const [newCode, setNewCode] = useState('');

  useEffect(() => {
    const savedLogs = localStorage.getItem('brevy_access_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs).reverse());
    }
  }, []);

  const updateCode = () => {
    if (!newCode.trim()) return alert('새 코드를 입력해주세요.');
    localStorage.setItem('brevy_ref_code', newCode.toUpperCase());
    setCurrentCode(newCode.toUpperCase());
    setNewCode('');
    alert('입장 코드가 성공적으로 변경되었습니다.');
  };

  const clearLogs = () => {
    if (window.confirm('모든 접속 이력을 삭제하시겠습니까?')) {
      localStorage.removeItem('brevy_access_logs');
      setLogs([]);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Console</h2>
          <p style={{ color: 'var(--text-muted)' }}>시스템 접속 이력 및 보안 설정을 관리합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={clearLogs}>로그 초기화</button>
          <button className="btn-primary" onClick={onExit}>대시보드 나가기</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
        {/* Left Content */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>총 입장 횟수</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{logs.length}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>최근 접속</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{logs[0] ? new Date(logs[0].time).toLocaleTimeString() : '-'}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>시스템 상태</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>ACTIVE</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Recent Access Logs</div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>TIME</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>CODE USED</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No logs found.</td>
                    </tr>
                  ) : (
                    logs.map((log, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                        <td style={{ padding: '16px 20px' }}>{new Date(log.time).toLocaleString()}</td>
                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 600 }}>{log.code}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                            background: log.success ? '#f0fdf4' : '#fef2f2',
                            color: log.success ? '#166534' : '#991b1b'
                          }}>
                            {log.success ? 'SUCCESS' : 'FAILED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Code Settings */}
        <div>
          <div className="card" style={{ border: '2px solid var(--primary)', position: 'sticky', top: '40px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Access Settings</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>CURRENT ACCESS CODE</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>{currentCode}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>UPDATE CODE</label>
              <input 
                className="input-text" 
                placeholder="New code (e.g. ALPHA-2024)" 
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                style={{ marginBottom: '12px', height: '48px' }}
              />
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: '48px' }} onClick={updateCode}>
                Apply New Code
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, background: 'var(--bg)', padding: '12px', borderRadius: '8px' }}>
              <strong>Tip:</strong> 코드를 변경하면 기존 코드는 더 이상 사용할 수 없으며, 새로운 사용자부터 즉시 적용됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
