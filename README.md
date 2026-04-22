# Brevy — Prompt Studio v3.0

업무 요청을 AI가 이해하는 언어로 변환하고, 문서까지 바로 생성하는 올인원 프롬프트 도구

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 프롬프트 변환 | 스코프 가드 + 품질 가드 포함 최적화 프롬프트 |
| 문서 생성 & 미리보기 | AI가 실제 문서(HTML) 생성, 브라우저에서 미리보기 |
| 인라인 편집 | 생성된 문서를 미리보기에서 직접 수정 |
| 서명 | 마우스/터치로 서명 → 문서에 삽입 |
| 입력란 | 클릭으로 입력 필드 추가 |
| 다운로드 | HTML, TXT 파일 다운로드 |
| 인쇄/PDF | 브라우저 인쇄로 PDF 저장 |
| 공유 | Web Share API 또는 클립보드 복사 |

## 카테고리 (31개 템플릿)

- 사무용 10개: 서류, 엑셀, 이메일, 기획, 마케팅, HR, 법무, 회계, CS, 영업
- 개발용 9개: UI, API, 버그, 로직, DB, 테스트, 배포, 성능, 보안
- 개인용 8개: 이력서, 민원, 여행, 건강, 가계부, 경조사, 이사, 학습

## 설치

```bash
git clone <repo> && cd brevy
npm install
cp .env.example .env   # API 키 입력
npm run dev             # localhost:3000
npm run build           # dist/ 빌드
```

## 기술 스택
React 18 + Vite | Anthropic Claude API | Canvas API | Web Share API

## 라이선스
MIT
