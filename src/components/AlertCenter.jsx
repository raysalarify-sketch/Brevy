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
    kakaoId: '',
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
    setNewAlert({ type: 'weather', title: '', time: '08:00', frequency: 'daily', channel: 'email', recipient: '', kakaoId: '', enabled: true });
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
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Alert Center</h2>
          <p style={{ color: 'var(--text-muted)' }}>AI가 생성한 정보를 원하는 시간에 받아보세요.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAdding(true)}>
          <span>+ 알림 추가</span>
        </button>
      </div>

      {isAdding && (
        <div className="guide-overlay" onClick={() => setIsAdding(false)}>
          <div className="guide-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="guide-header">
              <h2>새 알림 설정</h2>
              <button className="close-btn" onClick={() => setIsAdding(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>알림 유형</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['weather', 'news', 'personal'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setNewAlert({...newAlert, type: t})}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: `2px solid ${newAlert.type === t ? 'var(--primary)' : 'var(--border)'}`,
                        background: newAlert.type === t ? 'var(--bg)' : 'white',
                        cursor: 'pointer',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    >
                      {t === 'weather' ? '🌦 날씨' : t === 'news' ? '📰 뉴스' : '👤 개인'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>알림 제목</label>
                <input 
                  className="input-text" 
                  placeholder="예: 매일 아침 날씨 브리핑" 
                  value={newAlert.title}
                  onChange={e => setNewAlert({...newAlert, title: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>발송 시간</label>
                  <input 
                    type="time" 
                    className="input-text" 
                    value={newAlert.time}
                    onChange={e => setNewAlert({...newAlert, time: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>발송 주기</label>
                  <select 
                    className="input-text"
                    value={newAlert.frequency}
                    onChange={e => setNewAlert({...newAlert, frequency: e.target.value})}
                  >
                    <option value="daily">매일</option>
                    <option value="weekday">평일 (월-금)</option>
                    <option value="weekly">매주</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>수신 채널 및 정보</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  {['email', 'sms', 'kakao'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setNewAlert({...newAlert, channel: c})}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: `1px solid ${newAlert.channel === c ? 'var(--primary)' : 'var(--border)'}`,
                        background: newAlert.channel === c ? 'var(--primary)' : 'transparent',
                        color: newAlert.channel === c ? 'white' : 'var(--text-main)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {c === 'email' ? '이메일' : c === 'sms' ? '문자' : '카카오톡'}
                    </button>
                  ))}
                </div>
                <input 
                  className="input-text" 
                  placeholder={newAlert.channel === 'kakao' ? '카카오톡 ID 입력' : newAlert.channel === 'email' ? '이메일 주소 입력' : '연락처 입력 (- 제외)'} 
                  value={newAlert.recipient}
                  onChange={e => setNewAlert({...newAlert, recipient: e.target.value})}
                />
              </div>

              <button className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleAdd}>
                알림 만들기
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {alerts.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '2px dashed var(--border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
            <h3 style={{ marginBottom: '0.5rem' }}>설정된 알림이 없습니다.</h3>
            <p style={{ color: 'var(--text-muted)' }}>새로운 알림을 추가하여 AI 정보를 정기적으로 받아보세요.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="card card-hover" style={{ position: 'relative', opacity: alert.enabled ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="tag" style={{ background: 'var(--bg)', color: 'var(--primary)' }}>
                  {alert.type === 'weather' ? '🌦 Weather' : alert.type === 'news' ? '📰 News' : '👤 Personal'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => toggleAlert(alert.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>
                    {alert.enabled ? '🟢' : '⚪️'}
                  </button>
                  <button onClick={() => deleteAlert(alert.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>
                    🗑
                  </button>
                </div>
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{alert.title || '제목 없음'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⏰</span> {alert.frequency === 'daily' ? '매일' : alert.frequency === 'weekday' ? '평일' : '매주'} {alert.time}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✉️</span> {alert.channel === 'email' ? '이메일' : alert.channel === 'sms' ? '문자' : '카카오톡'}: {alert.recipient}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertCenter;
