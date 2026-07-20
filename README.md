# 잡담 AI 취업 솔루션

기존 PHP 기반 잡담 웹의 사용자 경험과 데이터 의미를 React/Node.js로 리뉴얼하는 프로젝트입니다.

## 현재 구현 범위

- React + Vite 기반 SPA (`HashRouter`, GitHub Pages 상대 경로 지원)
- 목업 로그인/회원가입과 브라우저 저장소 기반 입력 데이터
- 사이드바, 기능별 완료 상태, 사용/미사용 기능 대시보드
- 경험리스트·AI 자소서·합격사례 자소서·면접답변·취업진로정보를 레거시 화면 계약에 따라 단계적으로 이관
- Node/Express 목업 API: 인증 세션과 경험·자소서·합격사례·면접의 레거시 식별자/카디널리티 계약
- MySQL 연결은 레거시 스키마와 staging 데이터 계약을 검증한 뒤 추가

## 개발 실행

### Frontend

```bash
npm install
npm run dev
```

테스트와 build:

```bash
npm run test
npm run build
```

### Mock API

```bash
cd server
npm install
npm run dev
```

API는 기본적으로 `http://localhost:3001`에서 실행됩니다. 현재는 안전한 개발용 메모리 저장소만 사용하며, 서버를 재시작하면 API 데이터는 초기화됩니다. 프런트 데모 인증은 아직 브라우저 저장소 기반이므로 API와 자동 연동되지 않습니다. 화면의 `DB 미연결 계약 목업` 표시는 실제 MySQL 데이터가 아니라 식별자와 작성 흐름을 검증하기 위한 fixture입니다.

주요 계약 endpoint:

- `GET /api/health` — `mock-contract` 상태와 지원 계약 확인
- `GET|PUT /api/experience` — 인증 사용자 경험 문서
- `GET|POST /api/cover-letters`, `GET|PUT|DELETE /api/cover-letters/:masterCd` — master/detail 자소서 CRUD
- `GET|PUT /api/success-examples/workspace` — `masterCd`, `cdSeq`, 직무 그룹 코드를 보존하는 작성 상태
- `GET|PUT /api/interview/workspace` — `cdQuestion`, `cdFunction`, 후속 질문 식별자를 보존하는 작성 상태

위 endpoint는 개발용 데이터 내용이 아니라 **소유권, 식별자, 카디널리티와 검증 규칙**을 증명한다. DB가 제공하는 실제 기준정보는 향후 MySQL repository가 조회해야 한다.

## 배포

`.github/workflows/deploy-pages.yml`은 `main` 브랜치 push 시 정적 `dist/`를 GitHub Pages에 배포합니다. GitHub Pages 데모는 브라우저 목업 저장소를 사용하며 Node/MySQL을 호스팅하지 않습니다.

## 레거시 연동 주의

레거시 PHP 소스는 `C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs`에 있습니다. PHP/SQL을 복사하지 말고, 테이블 의미·필드·출력 형식을 `docs/legacy-data-contract.md`로 검증한 뒤 parameterized query와 transaction을 사용하는 Node repository로 이관해야 합니다.

DB가 제공하는 직무·문항·항목의도·질문의도·합격사례를 프런트에서 임의로 만들거나 사용자 입력 필드로 바꾸면 안 됩니다. 실제 DB가 없는 개발 환경에서는 `fixture-*` 식별자를 사용하는 계약 목업과 DB 미연결 상태를 명확히 표시합니다.
