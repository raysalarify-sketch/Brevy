import { useState, useCallback, useRef, useEffect } from "react";
import "./index.css";
import { supabase } from './lib/supabase';
import { DIVS, SYS_PROMPT, SYS_DOC } from "./data/constants";
import useClaude from "./hooks/useClaude";
import Header from "./components/Header";
import Breadcrumbs from "./components/Breadcrumbs";
import Guide from "./components/Guide";
import AlertCenter from "./components/AlertCenter";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [view, setView] = useState("home");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [divId, setDivId] = useState("office");
  const [cat, setCat] = useState(null);
  const [tpl, setTpl] = useState(null);
  const [fld, setFld] = useState({});
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Document state
  const [docHtml, setDocHtml] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [sigMode, setSigMode] = useState(false);
  const [sigData, setSigData] = useState(null);
  
  const sigCanvas = useRef(null);
  const sigDrawing = useRef(false);
  const docRef = useRef(null);
  const topRef = useRef(null);
  
  const { callApi } = useClaude();

  const [sharedDoc, setSharedDoc] = useState(null);
  const [signerName, setSignerName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');
    if (docId) {
      const fetchDoc = async () => {
        const { data, error } = await supabase.from('documents').select('*').eq('id', docId).single();
        if (!error && data) {
          setSharedDoc(data);
          setView("share_view");
        }
      };
      fetchDoc();
    }

    const checkSession = async () => {
      if (docId) return; // 공유 페이지면 세션 체크 건너뜀
      const storedCode = localStorage.getItem('brevy_session_code');
      if (!storedCode) return;
      
      // ... existing session check ...
    };
    checkSession();
  }, []);

  const handleShareDoc = async () => {
    const title = res?.title || "Shared Document";
    const content = docRef.current.innerHTML;
    const { data, error } = await supabase.from('documents').insert({
      title,
      content,
      creator_code: localStorage.getItem('brevy_session_code')
    }).select().single();

    if (!error && data) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?id=${data.id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert("공유 링크가 생성되어 클립보드에 복사되었습니다!\n상대방에게 전달하여 서명을 받으세요.");
    } else {
      alert("공유 링크 생성 중 오류가 발생했습니다.");
    }
  };

  const handleCompleteSignature = async () => {
    if (!signerName || !sigData) return alert("이름과 서명을 모두 완료해 주세요.");
    
    const { error } = await supabase.from('documents').update({
      signer_name: signerName,
      signature_data: sigData,
      signed_at: new Date().toISOString()
    }).eq('id', sharedDoc.id);

    if (!error) {
      alert("서명이 성공적으로 완료되었습니다! 문서가 안전하게 보관되었습니다.");
      window.location.reload();
    } else {
      alert("서명 저장 중 오류가 발생했습니다.");
    }
  };

  const addLog = (code, success) => {
    const logs = JSON.parse(localStorage.getItem('brevy_access_logs') || '[]');
    logs.push({ time: new Date().toISOString(), code, success });
    localStorage.setItem('brevy_access_logs', JSON.stringify(logs));
  };


  const handleAdminExit = () => {
    setIsAdmin(false);
    setIsAuthorized(false);
    localStorage.removeItem('brevy_admin');
    localStorage.removeItem('brevy_auth');
    setRefCode("");
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('brevy_onboard', 'seen');
  };

  const curDiv = DIVS.find(d => d.id === divId);
  const allTemplates = (DIVS || []).flatMap(dv => 
    (dv.cats || []).flatMap(c => 
      (c.t || []).map(t => ({
        ...t, 
        cId: c.id, cL: c.l, cI: c.ic, cC: c.c, 
        dvId: dv.id, dvL: dv.label
      }))
    )
  );

  const filteredTemplates = searchQuery.trim() 
    ? allTemplates.filter(t => (t.n + t.d + t.cL + t.dvL).toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const goHome = () => {
    setView("home"); setCat(null); setTpl(null); setRes(null); setShowDoc(false); setError("");
  };
  
  const goCat = c => {
    setCat(c); setView("tpls");
  };
  
  const goTpl = t => {
    setTpl(t); setFld({}); setView("fill");
  };

  const handleSubmit = useCallback(async () => {
    if (!tpl) return;
    
    // 유효성 검사: 모든 필드가 비어있는지 확인
    const hasContent = tpl.f.some(f => fld[f.k] && fld[f.k].trim() !== "");
    if (!hasContent) {
      return alert("템플릿의 내용을 입력해 주세요.");
    }
    
    const storedCode = localStorage.getItem('brevy_session_code');
    if (!storedCode) return alert('세션이 만료되었습니다. 다시 로그인해 주세요.');

    setLoading(true); setError(""); setRes(null);
    const fieldsText = tpl.f.map(f => `${f.l}: ${fld[f.k] || "(미입력)"}`).join("\n");
    const dv = DIVS.find(d => d.cats.some(c => c.t.some(t => t.id === tpl.id)));
    const c = dv.cats.find(c => c.t.some(t => t.id === tpl.id));
    const msg = `## 작업\n${dv.label} > ${c.l} > ${tpl.n}\n${tpl.d}\n\n## 입력\n${fieldsText}`;
    
    try {
      const text = await callApi(SYS_PROMPT, msg);
      // JSON 추출 로직 강화: { 로 시작해서 } 로 끝나는 부분만 찾아냄
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("결과 데이터 형식이 올바르지 않습니다.");
      
      const jsonStr = jsonMatch[0].trim();
      const parsedRes = JSON.parse(jsonStr);
      
      // 생성 로그 기록
      try {
        const resultObject = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        const { error: dbError } = await supabase.from('prompt_history').insert({
          code: localStorage.getItem('brevy_session_code') || 'GUEST',
          input_text: msg,
          result_json: JSON.stringify(resultObject)
        });
        if (dbError) {
          console.error('Database Insert Error:', dbError);
          // 400 에러의 원인을 알기 위해 알림을 띄우지 않고 로그만 남기되,
          // 중요한 정보라면 여기에 알림을 추가할 수 있습니다.
        }
      } catch (err) {
        console.warn('History Log Process Fail:', err);
      }
      
      setRes(parsedRes);
      setView("result");

    } catch (e) {
      console.error(e);
      setError("변환 중 오류가 발생했습니다.");
      await supabase.from('prompt_history').insert({
        code: storedCode,
        template_name: tpl.n,
        success: false,
        error_msg: e.message
      });
    } finally {
      setLoading(false);
    }
  }, [tpl, fld, callApi]);

  const handleGenDoc = useCallback(async () => {
    if (!res) return;
    setDocLoading(true);
    try {
      const text = await callApi(SYS_DOC, res.prompt);
      setDocHtml(text.replace(/```html|```/g, "").trim());
      setShowDoc(true);
    } catch (e) {
      console.error(e);
      setError("문서 생성 실패.");
    } finally {
      setDocLoading(false);
    }
  }, [res, callApi]);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  // Signature logic
  const startSig = () => { setSigMode(true); setSigData(null); };
  const initCanvas = useCallback(c => {
    if (!c) return;
    sigCanvas.current = c;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e) => {
    const c = sigCanvas.current;
    const r = c.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  };
  
  const onDown = e => {
    sigDrawing.current = true;
    const { x, y } = getPos(e);
    const ctx = sigCanvas.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (e.cancelable) e.preventDefault();
  };
  
  const onMove = e => {
    if (!sigDrawing.current) return;
    const { x, y } = getPos(e);
    const ctx = sigCanvas.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    if (e.cancelable) e.preventDefault();
  };
  
  const onUp = () => { sigDrawing.current = false; };
  
  const saveSig = () => {
    if (!sigCanvas.current) return;
    setSigData(sigCanvas.current.toDataURL());
    setSigMode(false);
  };

  const clearSig = () => {
    const c = sigCanvas.current;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    setSigData(null);
  };

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [view, showDoc]);

  const complexityColors = { low: "#059669", medium: "#ca8a04", high: "#dc2626" };

  // Supabase Integration
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({ email: '', name: '', content: '' });

  const handleAccessAuthorize = async () => {
    if (!refCode) return alert('추천인 코드를 입력해 주세요.');
    const upperCode = refCode.toUpperCase();

    // 1. 하드코딩된 예외 코드 먼저 확인 (데이터베이스 연결 없이도 작동)
    if (upperCode === 'BREVY-AI' || upperCode === 'ADMIN-BREVY') {
      setIsAuthorized(true);
      setIsAdmin(upperCode === 'ADMIN-BREVY');
      localStorage.setItem('brevy_session_code', upperCode);
      alert(`${upperCode === 'ADMIN-BREVY' ? '관리자' : '게스트'}님, 환영합니다! (로컬 모드)`);
      return;
    }
    
    try {
      // 2. 가장 최근에 생성된 코드 단 하나만 허용 (Exclusive Access)
      const { data: codeData, error } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (codeData && codeData.code === upperCode) {
        setIsAuthorized(true);
        setIsAdmin(codeData.is_admin);
        localStorage.setItem('brevy_session_code', upperCode);
        
        // 접속 로그 기록
        await supabase.from('access_logs').insert({ code: upperCode, success: true });
        
        alert(`${codeData.user_name || '사용자'}님, 환영합니다!`);
      } else {
        await supabase.from('access_logs').insert({ code: upperCode, success: false });
        alert('유효하지 않은 코드입니다. 다시 확인해 주세요.');
      }
    } catch (err) {
      console.error('Auth Error:', err);
      alert('입장 코드를 확인 중 오류가 발생했습니다.');
    }
  };

  const handleRequestAccess = async () => {
    if (!requestData.email || !requestData.name) return alert('이메일과 성함을 모두 입력해 주세요.');
    
    try {
      const { error } = await supabase.from('prompt_requests').insert({
        user_name: requestData.name,
        email: requestData.email,
        content: requestData.content || '입장 코드 요청',
        status: 'pending'
      });

      if (error) {
        console.error('Request Error Details:', error);
        return alert(`입장 요청 중 오류가 발생했습니다: ${error.message || '데이터베이스 연결 실패'}`);
      }
      
      alert('입장 요청이 성공적으로 접수되었습니다! 관리자가 확인 후 메일을 발송해 드립니다.');
      setShowRequestForm(false);
      setRequestData({ email: '', name: '', content: '' });
    } catch (err) {
      console.error('Request Error:', err);
      alert('요청을 보내는 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('brevy_session_code');
    setIsAuthorized(false);
    setIsAdmin(false);
    setRefCode('');
  };

  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
        <div className="fade-in card" style={{ width: '100%', maxWidth: '440px', padding: '48px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' }}>
          {/* ... existing header ... */}
          <div style={{ width: 64, height: 64, background: 'var(--primary)', borderRadius: 20, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="serif" style={{ fontSize: '2.75rem', marginBottom: '12px', color: 'var(--text-main)' }}>Brevy Studio</h1>
          
          {!showRequestForm ? (
            <>
              <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '16px', lineHeight: 1.6 }}>초대된 분들만을 위한 프롬프트 최적화 공간입니다.</p>
              
              <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', letterSpacing: '0.05em' }}>Referral Code</label>
                <input 
                  className="input-text" 
                  type="text" 
                  placeholder="코드를 입력해 주세요" 
                  value={refCode}
                  onChange={e => setRefCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAccessAuthorize()}
                  style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-main)', height: '56px', fontSize: '16px', borderRadius: '16px' }}
                />
              </div>

              <button className="btn-primary" onClick={handleAccessAuthorize} style={{ width: '100%', height: '56px', justifyContent: 'center', borderRadius: '16px', fontSize: '16px', marginBottom: '24px' }}>
                입장하기
              </button>

              <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setShowRequestForm(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}
                >
                  추천인 코드가 없으신가요? 입장 요청하기 ✨
                </button>
              </div>
            </>
          ) : (
            <div className="fade-in">
              <h3 style={{ marginBottom: '8px' }}>입장 코드 요청</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>승인 후 입력하신 메일로 코드가 발송됩니다.</p>
              
              <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                <input className="input-text" placeholder="성함" value={requestData.name} onChange={e => setRequestData({...requestData, name: e.target.value})} style={{ marginBottom: '12px' }} />
                <input className="input-text" placeholder="이메일 주소" value={requestData.email} onChange={e => setRequestData({...requestData, email: e.target.value})} />
              </div>

              <button className="btn-primary" onClick={handleRequestAccess} style={{ width: '100%', height: '52px', justifyContent: 'center', marginBottom: '12px' }}>
                요청 제출하기
              </button>
              <button onClick={() => setShowRequestForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '13px', cursor: 'pointer' }}>
                돌아가기
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard onExit={handleLogout} />;
  }

  return (
    <div ref={topRef} className="app-container">
      {showOnboarding && (
        <div className="guide-overlay" style={{ zIndex: 3000 }}>
          <div className="guide-modal" style={{ maxWidth: '700px', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 className="serif" style={{ fontSize: '2.25rem', marginBottom: '8px' }}>Welcome to Brevy</h2>
              <p style={{ color: 'var(--text-muted)' }}>브레비의 3가지 핵심 기능을 확인해보세요.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🚀</div>
                <h4 style={{ marginBottom: '8px' }}>프롬프트 최적화</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>요청 사항을 AI가 즉시 실행 가능한 고품질 프롬프트로 변환합니다.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📄</div>
                <h4 style={{ marginBottom: '8px' }}>문서 생성/다운로드</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>완성된 프롬프트로 실제 문서(계약서, 보고서 등)를 생성하고 PDF로 저장하세요.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔔</div>
                <h4 style={{ marginBottom: '8px' }}>지능형 알림</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>날씨, 뉴스 등 원하는 정보를 원하는 시간에 자동으로 받아보세요.</p>
              </div>
            </div>

            <button className="btn-primary" onClick={closeOnboarding} style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
              시작하기
            </button>
          </div>
        </div>
      )}

      <Header 
        templateCount={allTemplates.length} 
        onHome={goHome} 
        onAlerts={() => setView("alerts")}
        onLogout={handleLogout}
      />
      
      {(loading || docLoading) && (
        <div className="progress-bar">
          <div className="progress-bar-fill"></div>
        </div>
      )}

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        
        {view === "alerts" && <AlertCenter />}
        
        {view === "home" && (
          <div className="fade-in">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 className="serif" style={{ fontSize: "2.5rem", marginBottom: 12 }}>어떤 업무를 도와드릴까요?</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 18 }}>카테고리를 선택하거나, 우측에 바로 요청하세요.</p>
            </div>

            <div className="home-layout">
              <div>
                <div style={{ position: "relative", marginBottom: 32 }}>
                  <input 
                    className="input-text"
                    style={{ paddingLeft: 48, height: 56, fontSize: 16, borderRadius: 16, boxShadow: "var(--shadow-sm)" }}
                    placeholder="템플릿 검색 (예: 보고서, 이메일, 코드...)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: "var(--text-light)" }}>⌕</span>
                </div>

                {searchQuery.trim() ? (
                  <div className="fade-in">
                    <p style={{ fontSize: 14, color: "var(--text-light)", marginBottom: 16 }}>{filteredTemplates.length} templates found</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                      {filteredTemplates.map(t => (
                        <div key={t.id} className="card card-hover cc" onClick={() => goTpl(t)}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <span className="tag" style={{ background: "#f5f5f4", color: "#57534e" }}>{t.dvL}</span>
                            <span className="tag" style={{ background: t.cC + "15", color: t.cC }}>{t.cI} {t.cL}</span>
                          </div>
                          <h3 style={{ fontSize: 16, marginBottom: 4 }}>{t.n}</h3>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto", paddingBottom: 8 }}>
                      {DIVS.map(dv => (
                        <button 
                          key={dv.id} 
                          className={`btn-secondary ${divId === dv.id ? 'active' : ''}`}
                          onClick={() => setDivId(dv.id)}
                          style={{ flex: 1, padding: '8px 16px', whiteSpace: "nowrap",
                            borderColor: divId === dv.id ? "var(--primary)" : "var(--border)",
                            background: divId === dv.id ? "var(--primary)" : "#fff",
                            color: divId === dv.id ? "#fff" : "var(--text-main)" }}
                        >
                          {dv.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="grid-cats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
                      {curDiv.cats.map(c => (
                        <div key={c.id} className="card card-hover cc" onClick={() => goCat(c)} style={{ textAlign: "center", padding: "24px 16px" }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: c.c + "10", 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            margin: "0 auto 12px", fontSize: 24, color: c.c }}>{c.ic}</div>
                          <h4 style={{ fontSize: 14, marginBottom: 4 }}>{c.l}</h4>
                          <div style={{ fontSize: 10, color: c.c, fontWeight: 700 }}>{c.t.length} ITEMS</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="card sticky-side" style={{ border: '1px solid var(--primary)', background: '#fff' }}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--primary)' }}>자유 양식 퀵 프롬프트</h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>템플릿 없이 바로 요청 사항을 입력하세요.</p>
                <textarea 
                  className="input-text"
                  placeholder="예: 3년차 마케터를 위한 이직용 자기소개서 초안을 작성해줘"
                  rows={10}
                  style={{ marginBottom: 16, resize: 'none', fontSize: 15, lineHeight: 1.6 }}
                  value={fld.freeContent || ""}
                  onChange={e => setFld({...fld, freeContent: e.target.value})}
                />
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                  disabled={!fld.freeContent || loading}
                  onClick={async () => {
                    setLoading(true); setError(""); setRes(null);
                    try {
                      const text = await callApi(SYS_PROMPT, `## 자유 요청\n${fld.freeContent}`);
                      setRes(JSON.parse(text.replace(/```json|```/g, "").trim()));
                      setView("result");
                    } catch (e) { setError("오류 발생"); } finally { setLoading(false); }
                  }}>
                  {loading ? "최적화 중..." : "즉시 최적화하기 →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "tpls" && cat && (
          <div className="fade-in">
            <Breadcrumbs cat={cat} onHome={goHome} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {cat.t.map(t => (
                <div key={t.id} className="card card-hover cc" onClick={() => goTpl(t)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: 18, marginBottom: 4 }}>{t.n}</h3>
                    <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{t.d}</p>
                  </div>
                  <span style={{ color: "var(--text-light)", fontSize: 24 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "fill" && tpl && (
          <div className="fade-in">
            <Breadcrumbs cat={cat} tpl={tpl} onHome={goHome} onViewTpls={() => setView("tpls")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {tpl.f.map(f => (
                <div key={f.k}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>{f.l}</label>
                  {f.type === 'textarea' ? (
                    <textarea className="input-text" value={fld[f.k] || ''} onChange={e => setFld(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.p} rows={4} style={{ resize: 'vertical', minHeight: '120px' }} />
                  ) : (
                    <input className="input-text" value={fld[f.k] || ''} onChange={e => setFld(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.p} />
                  )}
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ marginTop: 32 }} onClick={handleSubmit} disabled={loading}>Optimize →</button>
          </div>
        )}

        {view === "result" && res && !showDoc && (
          <div className="fade-in">
            <Breadcrumbs cat={cat} tpl={tpl} onHome={goHome} />
            <div className="card" style={{ marginBottom: 24, borderLeft: "4px solid var(--primary)", position: 'relative' }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>✨ Optimized AI Prompt (Editable)</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => copyToClipboard(res.prompt, "p")}>
                    {copiedId === "p" ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>
              </div>
              <textarea 
                className="input-text"
                style={{ width: '100%', minHeight: '200px', padding: 20, background: "var(--bg)", borderRadius: 12, fontSize: 14, lineHeight: 1.8, border: 'none', resize: 'vertical' }}
                value={res.prompt}
                onChange={(e) => setRes({...res, prompt: e.target.value})}
              />
              
              <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', alignSelf: 'center' }}>🤖 AI 리터칭:</span>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={async () => {
                  setLoading(true);
                  const text = await callApi(SYS_PROMPT, `이전 프롬프트를 더 전문적이고 격식 있는 비즈니스 어투로 고쳐줘: ${res.prompt}`);
                  try { const next = JSON.parse(text.match(/\{[\s\S]*\}/)[0]); setRes(next); } catch(e) {}
                  setLoading(false);
                }}>더 전문적으로</button>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={async () => {
                  setLoading(true);
                  const text = await callApi(SYS_PROMPT, `이전 프롬프트를 핵심만 담아 아주 간결하게 줄여줘: ${res.prompt}`);
                  try { const next = JSON.parse(text.match(/\{[\s\S]*\}/)[0]); setRes(next); } catch(e) {}
                  setLoading(false);
                }}>간결하게</button>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={async () => {
                  setLoading(true);
                  const text = await callApi(SYS_PROMPT, `이전 프롬프트에 구체적인 예시와 제약사항을 더 추가해서 상세하게 만들어줘: ${res.prompt}`);
                  try { const next = JSON.parse(text.match(/\{[\s\S]*\}/)[0]); setRes(next); } catch(e) {}
                  setLoading(false);
                }}>상세하게</button>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-primary" onClick={handleGenDoc} disabled={docLoading}>📄 Create Document</button>
              <button className="btn-secondary" onClick={goHome}>Home</button>
            </div>
          </div>
        )}

        {showDoc && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => document.execCommand('bold')}><b>B</b></button>
                <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => document.execCommand('italic')}><i>I</i></button>
                <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => document.execCommand('insertUnorderedList')}>• List</button>
              </div>
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, background: '#059669' }} onClick={handleShareDoc}>🔗 공유 링크 생성</button>
            </div>
            <div ref={docRef} className="doc-editor" contentEditable="true" dangerouslySetInnerHTML={{ __html: docHtml }} style={{ marginBottom: 32, minHeight: '500px', outline: 'none' }} />
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-primary" onClick={() => window.print()}>🖨️ Print / PDF</button>
              <button className="btn-secondary" onClick={() => setShowDoc(false)}>Back</button>
            </div>
          </div>
        )}

        {view === "share_view" && sharedDoc && (
          <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="card" style={{ padding: 48, marginBottom: 32, background: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
              <div dangerouslySetInnerHTML={{ __html: sharedDoc.content }} style={{ marginBottom: 40 }} />
              
              {sharedDoc.signed_at ? (
                <div style={{ padding: 32, border: '2px solid #059669', borderRadius: 16, textAlign: 'center', background: '#f0fdf4' }}>
                  <h3 style={{ color: '#059669', marginBottom: 8 }}>✓ 서명 완료</h3>
                  <p style={{ fontSize: 14, color: '#166534' }}>서명자: {sharedDoc.signer_name} | 일시: {new Date(sharedDoc.signed_at).toLocaleString()}</p>
                  {sharedDoc.signature_data && <img src={sharedDoc.signature_data} alt="signature" style={{ maxHeight: 80, marginTop: 16 }} />}
                </div>
              ) : (
                <div className="card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <h3 style={{ fontSize: 18, marginBottom: 20 }}>문서 확인 및 서명</h3>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>서명자 성함</label>
                    <input className="input-text" placeholder="성함을 입력해 주세요" value={signerName} onChange={e => setSignerName(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>전자 서명</label>
                    {sigData ? (
                      <div style={{ padding: 16, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, position: 'relative' }}>
                        <img src={sigData} alt="signature" style={{ maxHeight: 100 }} />
                        <button style={{ position: 'absolute', right: 10, top: 10, fontSize: 12, color: 'var(--text-light)', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setSigData(null)}>다시 서명</button>
                      </div>
                    ) : (
                      <button className="btn-secondary" style={{ width: '100%', height: 100, borderStyle: 'dashed' }} onClick={startSig}>클릭하여 서명하기</button>
                    )}
                  </div>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCompleteSignature}>서명 완료 및 전송 →</button>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 12 }}>
              Brevy Secure Document Cloud © 2024
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 24px", textAlign: "center", color: "var(--text-light)", fontSize: 12 }}>
        &copy; 2024 Brevy Prompt Studio. Crafted with precision for AI optimization. (v1.3.3 - LATEST)
      </footer>
      <Guide />
    </div>
  );
}
