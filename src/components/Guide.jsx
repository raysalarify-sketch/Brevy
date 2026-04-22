import React, { useState } from 'react';

const Guide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button className="floating-help-btn" onClick={() => setIsOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="12" x2="12.01" y2="12"></line>
        </svg>
      </button>

      {/* Guide Modal */}
      {isOpen && (
        <div className="guide-overlay" onClick={() => setIsOpen(false)}>
          <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="guide-header">
              <h2>Quick Guide</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="guide-steps">
              <div className="guide-step">
                <div className="step-num">1</div>
                <div className="step-text">
                  <h3>템플릿 선택</h3>
                  <p>홈 화면에서 작성하고자 하는 문서 유형(보고서, 기획서 등)을 선택하세요.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="step-num">2</div>
                <div className="step-text">
                  <h3>핵심 내용 입력</h3>
                  <p>AI가 프롬프트를 생성할 수 있도록 요청 사항의 핵심 키워드나 문장을 입력합니다.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="step-num">3</div>
                <div className="step-text">
                  <h3>프롬프트 생성</h3>
                  <p>'Generate' 버튼을 누르면 안티그래비티 AI가 최적화된 프롬프트를 작성해 드립니다.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="step-num">4</div>
                <div className="step-text">
                  <h3>복사 및 활용</h3>
                  <p>완성된 프롬프트를 복사하여 ChatGPT나 Claude 등 원하는 AI 도구에 바로 활용하세요.</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg)', borderRadius: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <strong>Tip:</strong> 검색창을 활용하면 원하는 양식을 더 빠르게 찾을 수 있습니다!
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Guide;
