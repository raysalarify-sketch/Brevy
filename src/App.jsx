import { useState, useCallback, useRef, useEffect } from "react";
import "./index.css";
import { DIVS, SYS_PROMPT, SYS_DOC } from "./data/constants";
import useClaude from "./hooks/useClaude";
import Header from "./components/Header";
import Breadcrumbs from "./components/Breadcrumbs";
import Guide from "./components/Guide";
import AlertCenter from "./components/AlertCenter";

export default function App() {
  const [view, setView] = useState("home");
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

  const curDiv = DIVS.find(d => d.id === divId);
  const allTemplates = DIVS.flatMap(dv => 
    dv.cats.flatMap(c => 
      c.t.map(t => ({
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
    setLoading(true); setError(""); setRes(null);
    const fieldsText = tpl.f.map(f => `${f.l}: ${fld[f.k] || "(미입력)"}`).join("\n");
    const dv = DIVS.find(d => d.cats.some(c => c.t.some(t => t.id === tpl.id)));
    const c = dv.cats.find(c => c.t.some(t => t.id === tpl.id));
    const msg = `## 작업\n${dv.label} > ${c.l} > ${tpl.n}\n${tpl.d}\n\n## 입력\n${fieldsText}`;
    
    try {
      const text = await callApi(SYS_PROMPT, msg);
      const jsonStr = text.replace(/```json|```/g, "").trim();
      setRes(JSON.parse(jsonStr));
      setView("result");
    } catch (e) {
      console.error(e);
      setError(e.message === "API key missing" ? "API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요." : "변환 중 오류가 발생했습니다. 다시 시도해 주세요.");
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
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);
  
  const onDown = e => {
    sigDrawing.current = true;
    const c = sigCanvas.current;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  
  const onMove = e => {
    if (!sigDrawing.current) return;
    const c = sigCanvas.current;
    const r = c.getBoundingClientRect();
    c.getContext("2d").lineTo(e.clientX - r.left, e.clientY - r.top);
    c.getContext("2d").stroke();
  };
  
  const onUp = () => { sigDrawing.current = false; };
  
  const saveSig = () => {
    if (!sigCanvas.current) return;
    setSigData(sigCanvas.current.toDataURL());
    setSigMode(false);
  };

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [view, showDoc]);

  const complexityColors = { low: "#059669", medium: "#ca8a04", high: "#dc2626" };

  return (
    <div ref={topRef} className="app-container">
      <Header 
        templateCount={allTemplates.length} 
        onHome={goHome} 
        onAlerts={() => setView("alerts")}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
              {/* Left: Search & Categories */}
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
                        <div key={t.id} className="card card-hover cc" onClick={() => {
                          setDivId(t.dvId);
                          setCat(DIVS.find(d => d.id === t.dvId).cats.find(c => c.id === t.cId));
                          goTpl(t);
                        }}>
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
                          style={{ 
                            flex: 1, 
                            padding: '8px 16px',
                            whiteSpace: "nowrap",
                            borderColor: divId === dv.id ? "var(--primary)" : "var(--border)",
                            background: divId === dv.id ? "var(--primary)" : "#fff",
                            color: divId === dv.id ? "#fff" : "var(--text-main)"
                          }}
                        >
                          {dv.label}
                        </button>
                      ))}
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
                      {curDiv.cats.map(c => (
                        <div key={c.id} className="card card-hover cc" onClick={() => goCat(c)} style={{ textAlign: "center", padding: "24px 16px" }}>
                          <div style={{ 
                            width: 48, height: 48, borderRadius: 12, background: c.c + "10", 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            margin: "0 auto 12px", fontSize: 24, color: c.c 
                          }}>{c.ic}</div>
                          <h4 style={{ fontSize: 14, marginBottom: 4 }}>{c.l}</h4>
                          <div style={{ fontSize: 10, color: c.c, fontWeight: 700 }}>{c.t.length} ITEMS</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Right: Quick Free Form */}
              <div className="card" style={{ position: 'sticky', top: 100, border: '1px solid var(--primary)', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>✨</span>
                  <h3 style={{ fontSize: 18, margin: 0 }}>자유 양식 퀵 프롬프트</h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>템플릿 없이 바로 요청 사항을 입력하세요.</p>
                
                <textarea 
                  className="input-text"
                  placeholder="예: 3년차 마케터를 위한 이직용 자기소개서 초안을 작성해줘"
                  rows={6}
                  style={{ marginBottom: 16, resize: 'none', fontSize: 14 }}
                  value={fld.freeContent || ""}
                  onChange={e => setFld({...fld, freeContent: e.target.value})}
                />

                <button 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                  disabled={!fld.freeContent || loading}
                  onClick={async () => {
                    const quickTpl = { id: 'free', n: '자유 작성', prompt: SYS_PROMPT, f: [{ k: 'content', l: '요청 사항' }] };
                    setTpl(quickTpl);
                    setFld({ content: fld.freeContent });
                    
                    // Manually trigger handleSubit with simulated flow
                    setLoading(true); setError(""); setRes(null);
                    try {
                      const msg = `## 자유 요청\n${fld.freeContent}`;
                      const text = await callApi(SYS_PROMPT, msg);
                      const jsonStr = text.replace(/```json|```/g, "").trim();
                      setRes(JSON.parse(jsonStr));
                      setView("result");
                    } catch (e) {
                      setError("변환 중 오류가 발생했습니다.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? "최적화 중..." : "즉시 최적화하기 →"}
                </button>

                {/* Recommendations */}
                {fld.freeContent && fld.freeContent.length > 5 && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: 13, color: 'var(--text-main)', marginBottom: 12 }}>추천 템플릿</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {allTemplates.filter(t => 
                        fld.freeContent.includes(t.n.substring(0, 2)) || t.d.includes(fld.freeContent.substring(0, 2))
                      ).slice(0, 3).map(t => (
                        <div 
                          key={t.id}
                          onClick={() => goTpl(t)}
                          style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: '1px solid transparent' }}
                          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>{t.n}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t.d}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Template List View */}
        {view === "tpls" && cat && (
          <div className="fade-in">
            <Breadcrumbs cat={cat} onHome={goHome} />
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: 20, background: cat.c + "10", 
                display: "flex", alignItems: "center", justifyContent: "center", 
                fontSize: 32, color: cat.c 
              }}>{cat.ic}</div>
              <div>
                <h2 style={{ fontSize: 32 }}>{cat.l}</h2>
                <p style={{ fontSize: 16, color: "var(--text-muted)" }}>{cat.d}</p>
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {cat.t.map(t => (
                <div key={t.id} className="card card-hover cc" onClick={() => goTpl(t)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: 18, marginBottom: 4, fontFamily: "Inter" }}>{t.n}</h3>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>{t.d}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {t.f.map(f => <span key={f.k} className="tag" style={{ background: "#f5f5f4", color: "var(--text-muted)", fontSize: 10 }}>{f.l}</span>)}
                    </div>
                  </div>
                  <span style={{ color: "var(--text-light)", fontSize: 24 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fill Form View */}
        {view === "fill" && tpl && (
          <div className="fade-in">
            <Breadcrumbs cat={cat} tpl={tpl} onHome={goHome} onViewTpls={() => setView("tpls")} />
            
            <div className="card" style={{ marginBottom: 32, borderLeft: "4px solid var(--primary)" }}>
              <h2 style={{ fontSize: 24, marginBottom: 4 }}>{tpl.n}</h2>
              <p style={{ color: "var(--text-muted)" }}>{tpl.d}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {tpl.f.map(f => (
                <div key={f.k}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>{f.l}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      className="input-text"
                      value={fld[f.k] || ''}
                      onChange={e => setFld(p => ({ ...p, [f.k]: e.target.value }))}
                      placeholder={f.p}
                      rows={4}
                      style={{ resize: 'vertical', minHeight: '120px' }}
                    />
                  ) : (
                    <input
                      className="input-text"
                      value={fld[f.k] || ''}
                      onChange={e => setFld(p => ({ ...p, [f.k]: e.target.value }))}
                      placeholder={f.p}
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading || tpl.f.every(f => !fld[f.k]?.trim())}>
                {loading ? "Optimizing..." : "Optimize Prompt →"}
              </button>
              <button className="btn-secondary" onClick={() => setView("tpls")}>Back</button>
            </div>
          </div>
        )}

        {/* Result View */}
        {view === "result" && res && !showDoc && (
          <div className="fade-in">
            <Breadcrumbs cat={cat} tpl={tpl} onHome={goHome} onViewTpls={() => setView("tpls")} />
            
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 28 }}>{res.title}</h2>
                <span className="tag" style={{ background: complexityColors[res.complexity] + "15", color: complexityColors[res.complexity] }}>
                  {res.complexity.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div className="card" style={{ borderColor: "#bbf7d0", background: "#f0fdf410" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#059669", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>✓ DO (Scope)</div>
                {res.scope_do?.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#059669", fontWeight: 700 }}>+</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ borderColor: "#fecaca", background: "#fef2f210" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>✕ DON'T (Guard)</div>
                {res.scope_dont?.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>−</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 24, borderLeft: "4px solid var(--primary)", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Optimized AI Prompt</span>
                <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => copyToClipboard(res.prompt, "p")}>
                  {copiedId === "p" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div style={{ 
                padding: 20, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border)", 
                fontSize: 14, lineHeight: 1.8, color: "var(--text-main)", whiteSpace: "pre-wrap",
                maxHeight: 400, overflowY: "auto"
              }}>{res.prompt}</div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn-primary" onClick={() => copyToClipboard(res.prompt, "p")}>
                {copiedId === "p" ? "Copied ✓" : "Copy Prompt"}
              </button>
              <button className="btn-primary" onClick={handleGenDoc} disabled={docLoading} style={{ background: "var(--accent)" }}>
                {docLoading ? "Generating..." : "📄 Create Document"}
              </button>
              <button className="btn-secondary" onClick={goHome}>Home</button>
            </div>
          </div>
        )}

        {/* Document View */}
        {showDoc && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 24, marginBottom: 4 }}>{res?.title}</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Real-time editor & Signature tools</p>
              </div>
              <button className="btn-secondary" onClick={() => setShowDoc(false)}>Back to Result</button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={startSig}>✍ Add Signature</button>
              {sigData && <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13, borderColor: "var(--accent)", color: "var(--accent)" }} onClick={() => {
                if (docRef.current) docRef.current.innerHTML += `<img src="${sigData}" style="height:60px;margin:16px 0;display:block" alt="signature"/>`;
              }}>Insert Signature</button>}
            </div>

            {sigMode && (
              <div className="card fade-in" style={{ marginBottom: 24, background: "var(--bg)" }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Draw your signature</p>
                <canvas 
                  ref={initCanvas} width={400} height={120}
                  onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
                  style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#fff", cursor: "crosshair", maxWidth: "100%" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button className="btn-primary" onClick={saveSig} style={{ padding: "8px 20px" }}>Save</button>
                  <button className="btn-secondary" onClick={() => setSigMode(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div 
              ref={docRef} 
              className="doc-editor" 
              contentEditable="true" 
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: docHtml }}
              style={{ marginBottom: 32 }}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-primary" onClick={() => window.print()}>Print / Save as PDF</button>
              <button className="btn-secondary" onClick={goHome}>Home</button>
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 24px", textAlign: "center", color: "var(--text-light)", fontSize: 12 }}>
        &copy; 2024 Brevy Prompt Studio. Crafted with precision for AI optimization.
      </footer>
      <Guide />
    </div>
  );
}
