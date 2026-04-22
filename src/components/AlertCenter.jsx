import React, { useState, useEffect } from 'react';

const AlertCenter = () => {
  const [alerts, setAlerts] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'weather',
    title: '',
    time: '08:00',
    frequency: 'daily',
    channel: 'email',
    recipient: '',
    condition: '', 
    enabled: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('brevy_alerts');
    if (saved) setAlerts(JSON.parse(saved));
  }, []);

  const saveAlerts = (updated) => {
    setAlerts(updated);
    localStorage.setItem('brevy_alerts', JSON.stringify(updated));
  };

  const handleAdd = () => {
    const updated = [...alerts, { ...newAlert, id: Date.now() }];
    saveAlerts(updated);
    setIsAdding(false);
    setNewAlert({ type: 'weather', title: '', time: '08:00', frequency: 'daily', channel: 'email', recipient: '', condition: '', enabled: true });
  };

  const handleTestSend = (a) => {
    window.alert(`🔔 [${a.title}] 알림 즉시 발송 테스트\n\n채널: ${a.channel}\n수신: ${a.recipient}\n조건: ${a.condition || '없음'}\n\n위 내용이 지금 즉시 전송되었습니다!`);
  };

  const toggleAlert = (id) => {
    const updated = alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    saveAlerts(updated);
  };

  const deleteAlert = (id) => {
    const updated = alerts.filter(a => a.id !== id);
    saveAlerts(updated);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Alert Center</h2>
          <p style={{ color: 'var(--text-muted)' }}>특정 상태나 조건에 따라 실시간 알림을 받아보세요.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAdding(true)}>
          <span>+ 새 알림 만들기</span>
        </button>
      </div>

      {isAdding && (
        <div className="guide-overlay" onClick={() => setIsAdding(false)}>
          <div className="guide-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="guide-header">
              <h2>스마트 알림 설정</h2>
              <button className="close-btn" onClick={() => setIsAdding(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>알림 소스 선택</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    {id: 'weather', l: '🌦 날씨 API', d: '기상청 데이터'},
                    {id: 'news', l: '📰 뉴스 API', d: '실시간 속보'},
                    {id: 'personal', l: '👤 개인/커스텀', d: '직접 설정'}
                  ].map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setNewAlert({...newAlert, type: t.id})}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: `2px solid ${newAlert.type === t.id ? 'var(--primary)' : 'var(--border)'}`,
                        background: newAlert.type === t.id ? 'var(--primary)' : 'white',
                        color: newAlert.type === t.id ? 'white' : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{t.l}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{t.d}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>알림 제목</label>
                  <input className="input-text" placeholder="예: 우천 시 알림" value={newAlert.title} onChange={e => setNewAlert({...newAlert, title: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>발송 조건 (Optional)</label>
                  <input className="input-text" placeholder="예: 강수확률 60% 이상일 때" value={newAlert.condition} onChange={e => setNewAlert({...newAlert, condition: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>체크 시간</label>
                  <input type="time" className="input-text" value={newAlert.time} onChange={e => setNewAlert({...newAlert, time: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>주기</label>
                  <select className="input-text" value={newAlert.frequency} onChange={e => setNewAlert({...newAlert, frequency: e.target.value})}>
                    <option value="daily">매일</option>
                    <option value="weekday">평일 (월-금)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>수신 정보</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  {['email', 'sms', 'kakao'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setNewAlert({...newAlert, channel: c})}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: newAlert.channel === c ? 'var(--bg)' : 'transparent',
                        fontWeight: newAlert.channel === c ? 700 : 400,
                        cursor: 'pointer'
                      }}
                    >
                      {c === 'email' ? '이메일' : c === 'sms' ? '문자' : '카톡'}
                    </button>
                  ))}
                </div>
                <input 
                  className="input-text" 
                  placeholder={newAlert.channel === 'kakao' ? '카카오톡 ID 입력' : newAlert.channel === 'email' ? '이메일 주소 입력' : '연락처 입력'} 
                  value={newAlert.recipient}
                  onChange={e => setNewAlert({...newAlert, recipient: e.target.value})}
                />
              </div>

              <button className="btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '12px' }} onClick={handleAdd}>
                알림 설정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {alerts.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: '6rem 2rem', textAlign: 'center', background: 'white', borderRadius: '32px', border: '2px dashed var(--border)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛎</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>아직 설정된 스마트 알림이 없습니다.</h3>
            <p style={{ color: 'var(--text-muted)' }}>날씨, 뉴스, 개인 일정을 AI가 감시하고 알려드립니다.</p>
          </div>
        ) : (
          alerts.map(a => (
            <div key={a.id} className="card card-hover" style={{ opacity: a.enabled ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <span className="tag" style={{ background: 'var(--primary)', color: 'white' }}>
                  {a.type.toUpperCase()}
                </span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => toggleAlert(a.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                    {a.enabled ? '🔔' : '🔕'}
                  </button>
                  <button onClick={() => deleteAlert(a.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                    🗑
                  </button>
                </div>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{a.title}</h3>
              
              <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>발송 조건 및 시간</div>
                <div style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>
                  <strong>조건:</strong> {a.condition || '상시 발송'}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                  <strong>시간:</strong> {a.frequency === 'daily' ? '매일' : '평일'} {a.time}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {a.channel.toUpperCase()}: {a.recipient}
                </div>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  onClick={() => handleTestSend(a)}
                >
                  지금 즉시 발송 테스트
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertCenter;
