import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminDashboard = ({ onExit }) => {
  const [logs, setLogs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [currentCode, setCurrentCode] = useState('로딩 중...');
  const [newCode, setNewCode] = useState('');
  const [accessCodes, setAccessCodes] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // 1. 접속 로그 가져오기
      const { data: logData } = await supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (logData) setLogs(logData);

      // 2. 입장 요청 가져오기
      const { data: reqData } = await supabase
        .from('prompt_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (reqData) setPendingRequests(reqData);

      // 3. 현재 유효한 코드들 가져오기
      const { data: codeData } = await supabase
        .from('access_codes')
        .select('*');
      if (codeData) {
        setAccessCodes(codeData);
        const mainCode = codeData.find(c => !c.is_admin)?.code || 'N/A';
        setCurrentCode(mainCode);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
    }
  };

  const createCode = async () => {
    if (!newCode.trim()) return alert('새 코드를 입력해주세요.');
    const code = newCode.toUpperCase();
    
    try {
      const { error } = await supabase
        .from('access_codes')
        .upsert({ code: code, user_name: 'Admin User', created_at: new Date().toISOString() }, { onConflict: 'code' });
      
      if (error) throw error;
      
      alert(`새로운 코드 [${code}]가 등록되었습니다.`);
      setNewCode('');
      fetchAdminData();
    } catch (err) {
      console.error('Insert Error:', err);
      alert(`코드 등록 중 오류가 발생했습니다: ${err.message || err.error || '연결 오류'}`);
    }
  };

  const [sendingId, setSendingId] = useState(null);

  const handleSendMail = async (req) => {
    if (sendingId) return;
    const activeCode = accessCodes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.code || 'NONE';
    
    setSendingId(req.id);
    try {
      const response = await fetch('/api/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: req.email,
          userName: req.user_name,
          activeCode: activeCode
        })
      });

      if (response.ok) {
        alert(`${req.user_name}님께 입장 코드를 발송했습니다!`);
        // 발송 후 상태를 업데이트하고 싶다면 여기서 supabase update 로직 추가 가능
      } else {
        const err = await response.json();
        throw new Error(err.message || '발송 실패');
      }
    } catch (err) {
      console.error('Mail Send Error:', err);
      alert(`메일 발송 중 오류가 발생했습니다: ${err.message}\n(Vercel 환경 변수에 RESEND_API_KEY가 설정되어 있는지 확인해 주세요.)`);
    } finally {
      setSendingId(null);
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm('이 요청을 삭제하시겠습니까?')) return;
    await supabase.from('prompt_requests').delete().eq('id', id);
    fetchAdminData();
  };

  return (
    <div className="fade-in" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Console</h2>
          <p style={{ color: 'var(--text-muted)' }}>클라우드 데이터베이스를 통한 실시간 관리 시스템입니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={fetchAdminData}>데이터 새로고침 🔄</button>
          <button className="btn-primary" onClick={onExit}>대시보드 나가기</button>
        </div>
      </div>

      <div className="home-layout">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>총 접속 로그</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{logs.length}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', background: 'var(--primary)', color: 'white' }}>
              <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', fontWeight: 600 }}>입장 요청 대기</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{pendingRequests.length}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)', color: 'white', border: 'none', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)' }}>
              <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em' }}>CURRENT ACTIVE CODE</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{accessCodes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.code || 'NONE'}</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '32px', border: '2px solid var(--primary)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, display: 'flex', justifyContent: 'space-between', background: '#f8fafc', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>Cloud Access Requests (실시간 신청 명단)</span>
            </div>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>DATE</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>USER</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>REQUEST CONTENT</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                      <td style={{ padding: '12px 20px' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ fontWeight: 700 }}>{req.user_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--primary)' }}>{req.email}</div>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>{req.content || '입장 코드 요청'}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleSendMail(req)} 
                            className="btn-secondary" 
                            disabled={sendingId === req.id}
                            style={{ 
                              padding: '4px 12px', 
                              fontSize: '11px', 
                              background: sendingId === req.id ? '#f1f5f9' : '#f0f9ff', 
                              borderColor: sendingId === req.id ? '#e2e8f0' : '#bae6fd', 
                              color: sendingId === req.id ? '#94a3b8' : '#0369a1',
                              minWidth: '80px'
                            }}
                          >
                            {sendingId === req.id ? '발송 중...' : '메일 발송 📧'}
                          </button>
                          <button onClick={() => deleteRequest(req.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
            <div className="card sticky-side" style={{ border: '2px solid var(--primary)' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Code Management</h3>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>ADD NEW CODE</label>
                <input 
                  className="input-text" 
                  placeholder="Ex: SPECIAL-2024" 
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  style={{ marginBottom: '12px', height: '48px' }}
                />
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: '48px' }} onClick={createCode}>
                  발급 및 등록
                </button>
              </div>

              <div style={{ marginTop: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '12px', color: 'var(--text-muted)' }}>RECENT CODES</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[...accessCodes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((c, idx) => (
                    <div key={c.id} style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      background: idx === 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg)',
                      border: idx === 0 ? '1px solid #10b981' : '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: idx === 0 ? '#059669' : 'inherit' }}>{c.code}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleString()}</div>
                      </div>
                      {idx === 0 && <span style={{ fontSize: '10px', background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>}
                      {idx > 0 && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>EXPIRED</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg)', padding: '12px', borderRadius: '8px', marginTop: '20px' }}>
                <strong>Admin Tip:</strong> 가장 위에 있는 [ACTIVE] 코드만 실제 입장이 가능하도록 설정되어 있습니다. 새 코드를 발급하면 이전 코드는 자동으로 만료됩니다.
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
