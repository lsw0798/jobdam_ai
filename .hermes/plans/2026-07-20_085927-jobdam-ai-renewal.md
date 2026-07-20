# 잡담 AI 취업 솔루션 리뉴얼 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 기존 PHP 기반 잡담 서비스를 복사하지 않고, 현재 `C:\jobdam_ai`의 Vite/React UI 골격을 로그인·대시보드·사이드바·핵심 취업 도구·목업 저장소를 갖춘 배포 가능한 React SPA로 리뉴얼한 뒤, 검증된 레거시 MySQL 계약을 Node.js API로 연결한다.

**Architecture:** 1차 MVP는 GitHub Pages에서도 동작하도록 React SPA + 브라우저 목업 저장소로 완성한다. 화면은 메뉴 메타데이터와 라우트로 구성하고, 입력 완료 상태는 저장 성공 시 생성되는 진행 데이터에서 계산한다. 2차에서 Node/Express API를 별도 배포하고, `mock`/`mysql` 저장소 어댑터를 동일한 API 계약 뒤에 두어 레거시 DB를 안전하게 연결한다. 레거시 PHP/HTML은 UX와 데이터 의미를 조사하는 참고 자료일 뿐, 런타임에 포함하거나 그대로 복사하지 않는다.

**Tech Stack:** React 19, Vite, JavaScript, React Router (`HashRouter`), CSS Modules 또는 구조화된 CSS, Vitest + React Testing Library, Playwright, Node.js/Express, Zod, mysql2/promise, bcrypt, HTTP-only session cookies, MySQL 8, GitHub Actions/GitHub Pages (정적 프런트엔드), 별도 Node 호스팅.

---

## 1. 요구사항 보존 및 확인된 현황

### 요구사항 원본 보존

- 원본 파일은 그대로 유지한다: `C:\Users\swzza\Downloads\잡담 프로젝트 프롬프트.txt`
- 이 계획의 **부록 A**에 원문을 그대로 보관했다. 따라서 이후 구현 세션은 원본 파일을 다시 찾지 못해도 요구사항을 이 계획에서 확인할 수 있다.
- 작업 대상은 `C:\jobdam_ai`이며, 레거시 참조 대상은 `C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs`이다.

### 현재 `C:\jobdam_ai` 상태 (확인 완료)

- Vite + React 단일 프런트엔드만 존재한다.
- 실질적인 소스는 `src/App.jsx`, `src/main.jsx`, `src/styles.css` 세 파일이다.
- 현재 `App.jsx`에는 정적인 사이드바와 `activePage` 상태만 있고, 실제 라우팅·페이지·로그인·폼·저장·테스트·백엔드는 없다.
- `package.json`에는 React/Vite만 있으며 서버, 테스트, 린트 설정, `vite.config.*`가 없다.
- 따라서 기존 UI 골격은 유지 가능한 출발점이지만, 현재 구현을 확장하기보다 메뉴 정의와 페이지 컴포넌트로 재구성해야 한다.

### 조사된 레거시 기능과 데이터 위험

| 기능 | 조사한 레거시 위치 | 확인한 동작/데이터 | 리뉴얼 원칙 |
|---|---|---|---|
| 경험리스트 | `html/mypage/experience/write.html`, `script.js`, `set_save.html` | 사용자·지원기업·직무·역량·성적·자격/활동 목록을 읽고 저장한다. 저장 시 `user_add_*` 행을 삭제 후 다시 삽입하고 `batch_user(EXPERIENCE)`도 갱신한다. Word 형태의 다운로드가 있다. | UX는 React 반복행 폼으로 재구현한다. MySQL 연결 전까지 목업 저장소를 쓴다. 연결 시에는 반드시 트랜잭션, 파라미터 바인딩, 행 교체 의미 검증을 적용한다. |
| 이력서 | `html/mypage/info_add/write.html`, `script.js`, `set_save.html` | 사진 업로드와 학력(최대 5), 경력, 전공활동, 교육, 자격, 어학, 수상, 해외경험, 병역, 희망직무를 `user_add_*` 테이블에 저장한다. | HTML/PHP를 붙여 넣지 않는다. 섹션형 React 폼 및 명시적인 데이터 모델로 재작성한다. 파일 저장 경로와 레거시 스키마는 별도 계약 조사 후 연결한다. |
| 직무별 합격사례 자소서 | `html/job_bakseo/application_magician/` | `application_magician_question_detail`, `application_magician_my_question_writing`을 사용하며 STAR/문항형 작성·저장·문서 다운로드가 있다. | 1차는 소개/진입 화면을 만들고, 2차에서 데이터 계약을 확정한 뒤 React 플로우로 재작성한다. |
| 면접 답변 직접 작성 | `html/job_bakseo/frontend/src/` | 기존 `index.html`은 면접노트 목록·다운로드·삭제 및 여러 단계의 선택/작성 화면으로 이어진다. | 독립 React 플로우로 재구현한다. 레거시 절대 URL, jQuery, iframe 다운로드 방식을 재사용하지 않는다. |
| 진로·취업 동영상 | `html/mypage/view_board/list.html`, `script.js` | 카테고리별 영상 목록, 검색, 페이지 이동, 조회 로그가 있다. | 학습자용 읽기 전용 목록/검색부터 React로 만든다. 관리자 CRUD·조회 로그는 명세 확정 뒤 API로 분리한다. |

**보안 주의:** 레거시 PHP는 사용자 입력을 SQL 문자열에 직접 삽입하고, 여러 저장 작업에서 전체 행을 삭제 후 삽입한다. 이 동작을 그대로 복제하면 SQL injection, 동시성, 부분 저장 실패 위험이 생긴다. 새 Node API에서는 레거시 SQL을 복사하지 않고, 스키마 의미를 검증한 뒤 준비된 쿼리와 트랜잭션으로만 구현한다.

## 2. 구현 결정 및 범위

### MVP에서 확정할 동작

1. 로그인/회원가입 화면 및 목업 인증 보호 라우트
2. 좌측 사이드바, 메뉴 설명 툴팁, 활성 메뉴, 입력 완료/미완료 상태 색상
3. 사용한 기능/아직 활용하지 못한 기능을 분리하는 대시보드
4. 아래의 설명·진입 페이지와 요구된 외부 링크
5. 경험리스트, 이력서, `내가 작성한 자소서 저장하기`의 목업 입력·저장·목록·다운로드
6. 레거시에서 가져오라고 한 세 가지 핵심 진입 기능(자소서 합격사례, 면접 답변 직접 작성, 동영상 특강)의 React 소개/진입/목업 화면
7. GitHub Pages에 배포 가능한 상대 자산 경로 및 해시 라우팅

### 명시적으로 보류하되 UI에서 정직하게 표시할 기능

- 회사 지원동기, 성장과정, 입사 후 포부
- AI로 면접 답변 작성하기
- AI로 PT 면접 준비하기
- 공기업 면접 노트
- 실제 AI 생성 호출, 실운영 MySQL, 레거시 사용자 인증 이전

보류 기능은 작동하는 것처럼 보이는 가짜 폼을 만들지 않는다. 메뉴/카드에는 `준비 중` 배지와 현재 제공 범위를 표시하며, 클릭 시 이유와 향후 연결 위치를 보여 준다.

### 라우트 및 기능 표

| Route ID / 해시 경로 | 화면 | 완료 상태 기준 | 초기 데이터 원천 |
|---|---|---|---|
| `login`, `signup` | 첫 로그인·회원가입 | 해당 없음 | mock auth → API auth |
| `dashboard` | 사용/미사용 기능 대시보드 | 각 입력 기능의 저장 여부 | progress store |
| `experience` | 경험리스트 안내 | 없음 | 정적 콘텐츠 |
| `experience/write` | 경험리스트 작성 | 한 번 이상 유효 저장 | mock → legacy DB adapter |
| `career-analysis` | AI 직무·산업·기업 분석 안내 | 입력형 아님 | 외부 ChatGPT 링크 |
| `resume` | 이력서 작성 | 한 번 이상 유효 저장 | mock → legacy DB adapter |
| `cover-letters` | AI 자소서 허브(6개 버튼) | 저장 자소서 1건 이상 | route/link metadata |
| `cover-letters/other` | 기타 모든 항목 작성하기 설명 | 입력형 아님 | 외부 Naver 링크 |
| `cover-letters/library` | 내가 작성한 자소서 저장/보기/다운로드 | 문서 1건 이상 저장 | mock → API |
| `success-examples` | 합격사례로 직접 작성하기 안내/진입 | 문항 저장 1건 이상(2차) | mock → magician adapter |
| `speech` | AI 1분 스피치 안내 | 입력형 아님 | 외부 Naver 링크 |
| `interview-examples` | 직무별 합격사례 기반 면접답변 | 답변 1건 이상 저장(2차) | mock → interview adapter |
| `career-information` | 진로·취업 전문가 동영상 특강 | 입력형 아님 | mock catalog → video API |
| `coming-soon/:feature` | 보류 기능 안내 | 해당 없음 | 정적 metadata |

### 메뉴 정리 가정

현재 골격에는 `AI로 나의 진로결정하기`와 `AI로 직무분석하기/산업분석하기/기업분석하기` 하위 메뉴가 따로 존재하지만, 요구사항 원문은 하나의 **AI로 직무·산업·기업 분석하기** 안내 화면과 ChatGPT 링크만 명시한다. MVP에서는 이 요구사항을 우선해 하나의 메뉴/화면으로 통합한다. 하위 세 메뉴가 별도 제품 요구사항이라면, 추후 각각의 외부 링크 또는 내부 진단 명세를 받은 뒤 별도 route로 다시 추가한다.

### 배포/경로 규칙

- 클라이언트 내부 이동은 React Router route 상수와 `<Link>`만 사용한다.
- `HashRouter`를 사용하여 GitHub Pages 새로고침 404를 피한다.
- `vite.config.js`에 `base: './'`를 두고 모든 이미지/스타일은 `src` import 또는 상대 public 경로로 참조한다.
- `C:\...`, `/job_bakseo/...`, `/mypage/...` 같은 파일 시스템/레거시 절대 경로는 번들 또는 화면 코드에 넣지 않는다.
- 요구된 ChatGPT/Naver 링크처럼 **외부 서비스로 나가는 URL만** `target="_blank" rel="noreferrer"` 링크로 유지한다.
- GitHub Pages는 Node 서버를 실행할 수 없으므로 프런트엔드 데모는 `mock` 모드로 배포한다. 실제 API는 Render/Railway/Fly.io/사내 서버 등 별도 호스팅이 필요하다.

## 3. 데이터 모델 및 API 계약 초안

### 프런트엔드 목업 모델

```js
// src/services/storage/types.js (JSDoc으로 문서화)
const coverLetterDocument = {
  id: 'uuid',
  company: '지원기업',
  role: '지원직무',
  items: [
    { id: 'uuid', question: '자소서 항목', content: 'AI로 작성한 자기소개서 내용' },
  ],
  createdAt: 'ISO-8601',
  updatedAt: 'ISO-8601',
};

const progress = {
  experience: { completed: false, updatedAt: null },
  resume: { completed: false, updatedAt: null },
  coverLetterLibrary: { completed: false, updatedAt: null },
  successExamples: { completed: false, updatedAt: null },
  interviewExamples: { completed: false, updatedAt: null },
};
```

- `localStorage` key는 이름공간을 둔다. 예: `jobdam-ai:mock:v1:<userId>:experience`.
- `localStorage`는 출시용 DB 대체가 아니라 GitHub Pages 데모 및 백엔드 미연결 기간의 임시 저장소다.
- 저장 성공 이후에만 progress를 완료 처리한다. 단순 페이지 방문은 입력 완료로 바꾸지 않는다.

### Node API 계약 초안

```text
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/progress
GET    /api/experience
PUT    /api/experience
GET    /api/experience/export?format=doc

GET    /api/resume
PUT    /api/resume

GET    /api/cover-letters
POST   /api/cover-letters
GET    /api/cover-letters/:documentId
PUT    /api/cover-letters/:documentId
DELETE /api/cover-letters/:documentId
GET    /api/cover-letters/:documentId/export?format=doc

GET    /api/videos?category=&query=&page=
GET    /api/interview-notes                 # 2차
PUT    /api/interview-notes/:id             # 2차
```

- API 오류는 `{ "error": { "code", "message", "fieldErrors?" } }` 형태로 통일한다.
- 요청/응답은 Zod로 검증한다.
- 쓰기 작업은 로그인 사용자 ID를 세션에서만 얻으며, URL/body의 `userId`를 신뢰하지 않는다.
- `mock`과 `mysql`은 동일한 repository 인터페이스를 구현한다. 프런트엔드는 API 계약만 보며 레거시 테이블을 알지 못한다.

### 확인된 레거시 테이블 매핑 후보

| 새 도메인 | 레거시 테이블/필드 후보 | 연결 전 검증 항목 |
|---|---|---|
| 경험리스트 기본정보 | `user_master`, `univ_std_info_all` (`attribute11~15` 포함), `user_add_modeling`, `batch_user` | 기본키/unique key, NULL 규칙, 학교/대학 분기, 다른 서비스와 공유하는 필드인지 |
| 경험리스트 반복 항목 | `user_add_foreign_language`, `user_add_school_record`, `user_add_subject_record`, `user_add_award_career`, `user_add_certificate`, `user_add_duty_activitie`, `user_add_activitie`, `user_add_etc` | `val_1`, `val_4~8`의 데이터 사전, 최대 29행 제한, 삭제-재삽입의 업무상 의미 |
| 이력서 | `user_add_graduate`, `user_add_career`, `user_add_major_act`, `user_add_edu_act`, `user_add_license`, `user_add_language_score`, `user_add_award`, `user_add_nation`, `user_add_military`, `user_add_duty` | 사진 파일 스토리지, 코드 lookup 테이블, 5개 학력 제한, 기존 출력물의 필수 필드 |
| 합격사례 자소서 | `application_magician_question_detail`, `application_magician_my_question_writing` | 새 자유형 자소서 보관 요구와 실제 스키마가 맞는지, 회사/직무 필드가 어디에 있는지 |
| 면접/노트 | `application_note_*`, `application_note_my_target` 등 | 기능별 소유권, 결제/포인트 규칙, 삭제 및 다운로드 정책 |
| 동영상 | 레거시 `get_div_body.html`이 읽는 테이블 및 조회 로그 API | 공개/권한/카테고리/페이지네이션, 썸네일·동영상 URL 정리 |

`내가 작성한 자소서 저장하기`의 `지원기업`, `지원직무`, 다중 항목/내용 요구가 레거시 테이블에 직접 맞는지는 아직 증명되지 않았다. 스키마 덤프와 샘플(개인정보 제거)을 확인하기 전에는 새 테이블을 임의로 만들거나 기존 테이블을 오용하지 않는다.

## 4. 단계별 실행 계획

### Task 1: 요구사항과 레거시 데이터 계약을 프로젝트 문서로 고정한다

**Objective:** 구현자가 PHP 페이지가 아니라 요구사항·데이터 의미·제약을 기준으로 작업하게 한다.

**Files:**
- Create: `docs/product-requirements.md`
- Create: `docs/legacy-data-contract.md`
- Create: `docs/legacy-field-inventory.csv`
- Modify: `README.md`
- Reference only: `C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs\...`

**Step 1: 요구사항 원문을 `docs/product-requirements.md`에 보존한다.**

- 이 계획 부록 A의 원문을 복사하고, 각 요구사항에 stable ID를 부여한다. 예: `REQ-SIDEBAR-01`, `REQ-EXPERIENCE-03`, `REQ-COVERLETTER-08`.
- 원문 자체는 의미를 바꾸지 않고, 문서 하단의 구현 해석을 별도 표로 분리한다.

**Step 2: 레거시 접근을 읽기 전용 조사로 제한한다.**

- 각 지정 페이지와 그 페이지의 `script.js`, `set_save.*`, `download*`를 조사한다.
- 테이블, SQL 읽기/쓰기, 폼 필드, 코드 lookup, 파일 업로드, 출력 형식, 삭제/저장 의미를 `docs/legacy-field-inventory.csv`에 기록한다.
- DB 비밀번호, 개인정보가 담긴 설정 파일, 실운영 데이터를 Git에 복사하지 않는다.

**Step 3: 매핑 결정표를 작성한다.**

`docs/legacy-data-contract.md`에는 아래 항목을 반드시 포함한다.

```md
| Domain field | React field | Legacy table.column | Read | Write | Transform | Verified by |
| --- | --- | --- | --- | --- | --- | --- |
| 지원기업 | experience.targetCompany | univ_std_info_all.attribute11 | yes | candidate | trim only | schema + staging fixture |
```

**Step 4: 전환 기준을 명시한다.**

- `verified`가 아닌 필드는 API의 MySQL 모드에서 쓰지 않는다.
- `mock` 모드는 화면 검토를 위한 정상 경로이며, 연동 실패를 숨기기 위한 fallback이 아니다.

**Step 5: 문서 검토 및 커밋한다.**

Run: `git diff --check && git status --short`

Expected: whitespace 오류 없음, 문서 파일만 의도적으로 추가됨.

Commit:
```bash
git add docs README.md
git commit -m "docs: capture renewal requirements and legacy contract"
```

---

### Task 2: React SPA의 품질 기반과 GitHub Pages 호환 라우팅을 만든다

**Objective:** 현재 단일 `App.jsx` UI를 테스트 가능한 route 기반 앱으로 바꾸되, 정적 배포에서 깨지지 않게 한다.

**Files:**
- Modify: `package.json`
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Create: `vite.config.js`
- Create: `src/routing/routes.js`
- Create: `src/routing/AppRouter.jsx`
- Create: `src/test/setup.js`
- Create: `src/routing/AppRouter.test.jsx`
- Create: `.gitignore`

**Step 1: 테스트 도구를 추가한다.**

Install (implementation phase):
```bash
npm install react-router-dom
npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

`package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview --host 0.0.0.0"
  }
}
```

**Step 2: 실패하는 route 렌더링 테스트를 작성한다.**

```jsx
// src/routing/AppRouter.test.jsx
import { render, screen } from '@testing-library/react';
import { AppRouter } from './AppRouter';

test('unknown protected route redirects to dashboard after mock sign-in', async () => {
  render(<AppRouter initialPath="#/not-a-page" authenticated />);
  expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument();
});
```

Run: `npm run test -- src/routing/AppRouter.test.jsx`

Expected before implementation: FAIL because `AppRouter` does not exist.

**Step 3: route 상수를 한 곳에 정의한다.**

```js
// src/routing/routes.js
export const ROUTES = Object.freeze({
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  experience: '/experience',
  experienceWrite: '/experience/write',
  careerAnalysis: '/career-analysis',
  resume: '/resume',
  coverLetters: '/cover-letters',
  coverLetterOther: '/cover-letters/other',
  coverLetterLibrary: '/cover-letters/library',
  successExamples: '/success-examples',
  speech: '/speech',
  interviewExamples: '/interview-examples',
  careerInformation: '/career-information',
});
```

**Step 4: 해시 라우터와 상대 Vite base를 구현한다.**

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.js' },
});
```

- `src/main.jsx`는 `AppRouter`를 렌더한다.
- `AppRouter`는 `HashRouter`를 사용하고, 알 수 없는 경로를 앱의 정상 경로로 보낸다.
- 임시로 빈 페이지를 둬도 되지만, 더 이상 `activePage` 문자열만으로 화면을 바꾸지 않는다.

**Step 5: 테스트와 production build를 실행한다.**

Run: `npm run test && npm run build`

Expected: tests pass; `dist/`가 생성되고 번들 내에서 레거시 `C:\` 또는 `/job_bakseo/` 참조가 없음.

**Step 6: 커밋한다.**

```bash
git add package.json package-lock.json vite.config.js src .gitignore
git commit -m "feat: add route foundation and test tooling"
```

---

### Task 3: 메뉴 메타데이터·앱 셸·진행 상태 모델을 만든다

**Objective:** 사이드바와 대시보드가 하드코딩된 JSX가 아니라 한 개의 기능 카탈로그와 저장 상태를 사용하게 한다.

**Files:**
- Create: `src/features/navigation/menuCatalog.js`
- Create: `src/features/navigation/Sidebar.jsx`
- Create: `src/features/navigation/Sidebar.test.jsx`
- Create: `src/features/dashboard/DashboardPage.jsx`
- Create: `src/features/progress/progressService.js`
- Create: `src/features/progress/progressService.test.js`
- Create: `src/components/layout/AppShell.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css` (추후 기능별 CSS로 분리 시작)

**Step 1: progress 저장/계산의 실패 테스트를 작성한다.**

```js
import { markComplete, readProgress } from './progressService';

test('saved experience is shown as completed while an untouched resume remains incomplete', () => {
  markComplete('demo-user', 'experience');
  expect(readProgress('demo-user')).toMatchObject({
    experience: { completed: true },
    resume: { completed: false },
  });
});
```

Run: `npm run test -- src/features/progress/progressService.test.js`

Expected before implementation: FAIL.

**Step 2: menu catalog를 구현한다.**

각 항목은 아래 필드를 갖는다.

```js
{
  id: 'experience',
  label: '경험 리스트 작성',
  route: ROUTES.experience,
  kind: 'internal', // internal | external | comingSoon
  progressKey: 'experience',
  tooltip: '모든 경험과 그 과정에서 얻은 지식, 스킬, 역량을 체계적으로 정리합니다.',
  section: '기초공사 / 진로 / 직무·산업·기업 분석',
}
```

- 요구된 모든 메뉴 항목과 보류 항목을 catalog에 넣는다.
- 외부 URL은 별도의 `externalUrl`에만 둔다.
- 입력 화면이 없는 외부/정보 메뉴는 `progressKey`를 두지 않는다.

**Step 3: 접근성 있는 툴팁과 상태를 구현한다.**

- 버튼은 키보드로 focus 가능해야 한다.
- `title` 속성만 의존하지 말고, hover/focus 모두에서 보이는 설명 요소를 제공한다.
- 완료, 미완료, 준비 중은 텍스트와 색을 함께 사용한다. 색만으로 상태를 전달하지 않는다.
- sidebar에는 현재 route에만 `aria-current="page"`를 설정한다.

**Step 4: 대시보드를 구현한다.**

- `사용한 기능`과 `아직 활용하지 못한 기능`을 progress 계산 결과로 분리한다.
- 각 카드/버튼은 원 메뉴 route로 이동한다.
- 사용한 기능이 0개일 때의 빈 상태와, 모두 완료했을 때의 빈 상태를 각각 만든다.

**Step 5: 단위/UI 테스트를 통과시킨다.**

Run: `npm run test -- src/features/progress src/features/navigation`

Expected: 저장 완료 항목은 sidebar 및 dashboard에서 완료 스타일/사용 구역으로, 미완료 항목은 미사용 구역으로 나타남.

**Step 6: 커밋한다.**

```bash
git add src
git commit -m "feat: add navigation catalog and progress-aware dashboard"
```

---

### Task 4: 목업 로그인·회원가입과 보호 라우트를 구현한다

**Objective:** 사용자가 로그인한 뒤 자신의 목업 데이터와 기능 화면만 볼 수 있게 한다.

**Files:**
- Create: `src/features/auth/authService.js`
- Create: `src/features/auth/AuthProvider.jsx`
- Create: `src/features/auth/RequireAuth.jsx`
- Create: `src/features/auth/LoginPage.jsx`
- Create: `src/features/auth/SignupPage.jsx`
- Create: `src/features/auth/auth.test.jsx`
- Modify: `src/routing/AppRouter.jsx`
- Modify: `src/components/layout/AppShell.jsx`

**Step 1: 실패하는 인증 흐름 테스트를 작성한다.**

```jsx
test('a signed-up mock user is redirected to dashboard and can sign out', async () => {
  const user = userEvent.setup();
  render(<AppRouter initialPath="#/signup" />);
  await user.type(screen.getByLabelText('이메일'), 'demo@example.com');
  await user.type(screen.getByLabelText('비밀번호'), 'safe-demo-password');
  await user.click(screen.getByRole('button', { name: '회원가입' }));
  expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument();
});
```

**Step 2: mock auth를 구현한다.**

- 이메일 형식, 최소 비밀번호 길이, 중복 이메일을 검증한다.
- 데모용 사용자/세션은 목업 저장소에만 저장하고, 실서비스 보안 기능처럼 표시하지 않는다.
- 로그아웃 시 세션만 제거하고 사용자의 목업 데이터 삭제 여부는 명시적으로 묻는다.

**Step 3: 보호 규칙을 적용한다.**

- `/login`, `/signup` 외 route는 `RequireAuth`로 감싼다.
- 미로그인 방문은 로그인 화면으로 보내고, 로그인 후 원래 요청했던 route로 복귀시킨다.
- AppShell의 사용자 카드에는 이름/이메일과 로그아웃을 표시한다.

**Step 4: 테스트를 실행한다.**

Run: `npm run test -- src/features/auth`

Expected: 가입, 로그인, 로그아웃, 보호 route 리다이렉트가 모두 pass.

**Step 5: 커밋한다.**

```bash
git add src
git commit -m "feat: add mock authentication and protected routes"
```

---

### Task 5: 안내 페이지·외부 링크·준비 중 화면을 요구사항 문구대로 구현한다

**Objective:** 모든 메뉴가 의미 있는 화면으로 연결되고, 요구된 외부 도구는 안전하게 새 탭으로 연다.

**Files:**
- Create: `src/features/common/FeatureIntroPage.jsx`
- Create: `src/features/common/ComingSoonPage.jsx`
- Create: `src/features/career/CareerAnalysisPage.jsx`
- Create: `src/features/coverLetters/CoverLetterHubPage.jsx`
- Create: `src/features/coverLetters/OtherItemGuidePage.jsx`
- Create: `src/features/speech/SpeechPage.jsx`
- Create: `src/features/successExamples/SuccessExamplesPage.jsx`
- Create: `src/features/interview/InterviewExamplesPage.jsx`
- Create: `src/features/videos/CareerInformationPage.jsx`
- Create: `src/features/common/ExternalLink.test.jsx`
- Modify: `src/routing/AppRouter.jsx`
- Modify: `src/features/navigation/menuCatalog.js`

**Step 1: 외부 링크 정책의 실패 테스트를 쓴다.**

```jsx
test('career analysis opens the specified ChatGPT URL safely in a new tab', () => {
  render(<CareerAnalysisPage />);
  const link = screen.getByRole('link', { name: 'AI로 나의 진로 결정하기' });
  expect(link).toHaveAttribute('href', 'https://chatgpt.com/g/g-69726feb34888191863db9e65f238c80-jagibunseog-prediger-v6-0-jinro-cwieob');
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
});
```

**Step 2: 요구된 문구와 CTA를 구현한다.**

- 경험리스트 소개: 제목, 설명, 3개 bullet, `경험 리스트 작성하기` CTA
- 진로 분석: 제목 `진로·직무결정 고민 한번에 해결`, 5~7분 설명, 지정 ChatGPT CTA
- 자소서 허브: 6개 버튼. `직무 지원동기`는 지정 Naver 링크, `기타 모든 항목 작성하기`는 내부 설명 route, `내가 작성한 자소서 저장하기`는 library route, 나머지 보류 기능은 `준비 중`
- 기타 항목 안내: STAR 기반 설명과 지정 Naver CTA
- 1분 스피치: 적절한 설명(핵심 경험을 구조화해 60초 내 전달 내용으로 다듬는다는 범위)과 지정 Naver CTA
- 성공사례/면접/동영상: 원문 제목과 React 진입 CTA를 제공한다.

**Step 3: 보류 기능을 명확히 구분한다.**

- 클릭 가능한 가짜 제출 버튼이나 빈 iframe을 만들지 않는다.
- `준비 중` 화면에는 현재 미제공 기능과 향후 data/API 작업을 간략히 표시한다.

**Step 4: 테스트한다.**

Run: `npm run test -- src/features/common src/features/career src/features/coverLetters`

Expected: 모든 지정 링크가 정확하며, 보류 기능은 구현 완료로 표시되지 않음.

**Step 5: 커밋한다.**

```bash
git add src
git commit -m "feat: add feature guides external links and honest placeholders"
```

---

### Task 6: 경험리스트를 목업 저장·반복 행·다운로드가 가능한 React 기능으로 재구현한다

**Objective:** 레거시 경험리스트의 의미 있는 입력 구조와 Word 다운로드 흐름을 새 UI에서 제공한다.

**Files:**
- Create: `src/features/experience/ExperiencePage.jsx`
- Create: `src/features/experience/ExperienceEditorPage.jsx`
- Create: `src/features/experience/experienceSchema.js`
- Create: `src/features/experience/experienceService.js`
- Create: `src/features/experience/ExperienceEditor.test.jsx`
- Create: `src/features/export/createWordHtml.js`
- Create: `src/features/export/createWordHtml.test.js`
- Modify: `src/routing/AppRouter.jsx`
- Modify: `src/features/progress/progressService.js`

**Step 1: 데이터 형태와 필수 검증의 실패 테스트를 작성한다.**

```js
expect(validateExperience({ targetCompany: '', targetRole: '', competency: {} })).toEqual(
  expect.objectContaining({ valid: false }),
);
```

그리고 UI 테스트에 다음을 포함한다.

- 활동 행 추가/삭제
- 저장 후 새로 렌더해도 값 복원
- 저장 후 경험리스트 메뉴가 완료 상태로 변경
- 다운로드 버튼이 안전한 파일 Blob을 생성

**Step 2: 폼을 레거시의 의미로 나누되, 읽기 쉬운 UI로 재설계한다.**

필수 섹션:

1. 지원기업/기업직무, 학교·전공·학년·성적·졸업시기 등 기본정보
2. 직무역량: 필요지식, 필요스킬, 직무적합성, 지원기업 인재상
3. 성적·외국어: 활동내용과 지식/스킬/태도
4. 수상·자격
5. 직무(전공) 관련 활동
6. 대내·외 활동
7. 기타 활동

- 반복 행에는 안정적인 UUID를 사용한다. 배열 index를 React key나 데이터 ID로 쓰지 않는다.
- 레거시의 29행 제한은 데이터 계약 확인 전 화면의 임의 제한으로 강제하지 않는다. 호환성이 확인되면 명시적 제한과 오류 메시지를 추가한다.
- 자동저장은 MVP에서 만들지 않는다. 사용자가 `저장`을 눌렀을 때만 저장/완료 처리한다.

**Step 3: 다운로드를 안전하게 구현한다.**

- 레거시의 HTML-as-`.doc` 결과를 참고하되, 사용자 입력을 HTML escape한다.
- MVP의 기본 다운로드는 `경험리스트.doc`로 한다. 표와 한글이 포함된 HTML Blob으로 생성하며, 실제 `.docx`/PDF가 필요하면 별도 요구사항으로 승격한다.
- 파일은 브라우저에서 생성하며, 레거시 PHP 다운로드 URL이나 iframe을 사용하지 않는다.

**Step 4: 통과를 확인한다.**

Run: `npm run test -- src/features/experience src/features/export && npm run build`

Expected: 반복행, 저장, progress, export 테스트 pass; build pass.

**Step 5: 커밋한다.**

```bash
git add src
git commit -m "feat: rebuild experience list with mock persistence"
```

---

### Task 7: 이력서 입력 기능을 섹션형 React 폼으로 재구현한다

**Objective:** 레거시 이력서의 데이터 범위를 유지하면서, 사진/반복 항목/유효성 검사를 현대 UI로 바꾼다.

**Files:**
- Create: `src/features/resume/ResumePage.jsx`
- Create: `src/features/resume/ResumeEditor.jsx`
- Create: `src/features/resume/resumeSchema.js`
- Create: `src/features/resume/resumeService.js`
- Create: `src/features/resume/RepeatableSection.jsx`
- Create: `src/features/resume/ResumeEditor.test.jsx`
- Modify: `src/routing/AppRouter.jsx`
- Modify: `src/features/progress/progressService.js`

**Step 1: 실패 테스트를 작성한다.**

- 최소 한 개 학력의 학교 유형/학교명/상태가 없으면 저장되지 않는다.
- 학력 추가/삭제가 독립적으로 동작한다.
- 사진은 이미지 MIME type/용량 오류를 표시한다.
- 유효 저장 후 resume progress만 완료된다.

**Step 2: MVP 섹션을 구현한다.**

1. 프로필 사진(미리보기; 목업에서는 object URL 또는 제한된 base64)
2. 학력(레거시 호환 검토 전 UX 최대 5개)
3. 경력
4. 전공 관련 활동
5. 교육 활동
6. 자격증
7. 어학성적
8. 수상
9. 해외 경험
10. 병역 및 희망직무

**Step 3: 저장 모드를 분리한다.**

- 목업에서는 `resumeService`가 browser store를 사용한다.
- API 모드에서는 같은 service public API로 `PUT /api/resume`을 호출한다.
- 사진은 MySQL BLOB에 넣는다고 가정하지 않는다. 레거시 파일 스토리지와 접근 제어를 확인할 때까지 목업으로만 처리한다.

**Step 4: 테스트를 실행한다.**

Run: `npm run test -- src/features/resume && npm run build`

Expected: 유효성/반복 섹션/저장/완료상태 test pass.

**Step 5: 커밋한다.**

```bash
git add src
git commit -m "feat: rebuild resume editor with mock persistence"
```

---

### Task 8: 자소서 허브와 `내가 작성한 자소서 저장하기`를 완성한다

**Objective:** 기업/직무와 여러 자소서 항목·내용을 안전하게 저장, 보기, 편집, 다운로드할 수 있게 한다.

**Files:**
- Create: `src/features/coverLetters/CoverLetterLibraryPage.jsx`
- Create: `src/features/coverLetters/CoverLetterEditor.jsx`
- Create: `src/features/coverLetters/CoverLetterViewer.jsx`
- Create: `src/features/coverLetters/coverLetterSchema.js`
- Create: `src/features/coverLetters/coverLetterService.js`
- Create: `src/features/coverLetters/CoverLetterLibrary.test.jsx`
- Modify: `src/features/export/createWordHtml.js`
- Modify: `src/routing/AppRouter.jsx`
- Modify: `src/features/progress/progressService.js`

**Step 1: 실패 테스트를 작성한다.**

```jsx
test('a user can add a second cover-letter item and save a document', async () => {
  // 기업, 직무, 첫 문항/내용 입력 → 항목 추가 → 둘째 문항/내용 입력 → 저장
  // 목록에 기업명과 직무가 나타나는지 검증
});
```

추가 검증:

- 기업명, 직무, 최소 한 개의 문항과 내용이 비어 있으면 저장 거부
- 항목 삭제 시 마지막 필수 항목은 제거가 아니라 빈 상태/확인을 사용
- 저장 후 목록, 보기, 편집, 다운로드가 동일 문서를 사용

**Step 2: 요구된 필드를 그대로 구현한다.**

- 지원기업
- 지원직무
- `자소서 항목을 입력하세요` 입력란
- `AI로 작성한 내용을 복사해서 저장해 주세요` 안내 및 내용 입력란
- `항목 추가하기`, `저장`, `내가 작성한 자소서 보기`, `다운로드`

**Step 3: 목록과 다운로드를 구현한다.**

- 목록에는 지원기업, 지원직무, 최종 수정일, 보기/편집/다운로드를 표시한다.
- 다운로드는 모든 항목을 문서 순서대로 출력한다.
- 삭제 기능을 제공한다면 반드시 확인 대화상자와 접근성 있는 알림을 넣는다. 원문에 삭제 요구는 없으므로 MVP에서는 편집과 다운로드를 우선한다.

**Step 4: 통과를 확인한다.**

Run: `npm run test -- src/features/coverLetters && npm run build`

Expected: 다중 항목 저장, 복원, 보기, 다운로드, progress update pass.

**Step 5: 커밋한다.**

```bash
git add src
git commit -m "feat: add saved cover letter library"
```

---

### Task 9: 레거시 기반 합격사례·면접·영상 기능을 React 진입 화면과 목업 데이터로 이관한다

**Objective:** 기존 기능의 실제 사용자 흐름을 잃지 않되, jQuery/PHP 페이지/iframe 의존을 제거한다.

**Files:**
- Create: `src/features/successExamples/SuccessExampleWorkspace.jsx`
- Create: `src/features/interview/InterviewWorkspace.jsx`
- Create: `src/features/videos/VideoLibraryPage.jsx`
- Create: `src/features/videos/videoCatalogService.js`
- Create: `src/features/videos/VideoLibraryPage.test.jsx`
- Create: `src/features/interview/interviewService.js`
- Create: `src/features/successExamples/successExampleService.js`
- Modify: `src/features/successExamples/SuccessExamplesPage.jsx`
- Modify: `src/features/interview/InterviewExamplesPage.jsx`
- Modify: `src/features/videos/CareerInformationPage.jsx`
- Modify: `src/routing/AppRouter.jsx`

**Step 1: 기능별 재현 범위를 문서와 테스트로 확정한다.**

- 합격사례: 직무/문항 선택 → STAR 또는 구조화된 작성 → 저장 → 보기/다운로드
- 면접: 직무/질문 선택 → 답변 작성 → 글자/바이트 수 또는 말하기 시간 표시 → 저장/다운로드
- 동영상: 카테고리, 검색, 페이지네이션, 카드/상세 외부 재생 링크

**Step 2: UI 테스트를 먼저 작성한다.**

```jsx
test('video catalog filters by category and search term without a page reload', async () => {
  // mock catalog에서 취업 카테고리 + 검색어 선택 후 결과 검증
});
```

**Step 3: 목업 데이터를 만들어 UI를 검토한다.**

- 개인정보·실제 사용자 답변·실운영 영상 URL을 복사하지 않는다.
- 동영상에는 안전한 placeholder URL과 명확한 `샘플 데이터` 표시를 사용한다.
- 레거시의 포인트/결제 제한은 사업 규칙이 확정되지 않았으므로 MVP에 은닉 구현하지 않는다. 필요 시 접근 제한 정책을 별도 요구사항으로 만든다.

**Step 4: 레거시 데이터 계약이 검증될 때만 MySQL 어댑터로 전환한다.**

- `application_magician_my_question_writing`의 `master_cd`, `cd_seq`, group code와 새 문항 모델의 일대일/일대다 관계를 검증한다.
- 면접노트의 레거시 delete/download 기능은 새 API 권한 검사와 soft/hard delete 정책을 먼저 정의한 뒤 구현한다.

**Step 5: 테스트 및 커밋한다.**

Run: `npm run test -- src/features/successExamples src/features/interview src/features/videos && npm run build`

Commit:
```bash
git add src docs
git commit -m "feat: add mock workspaces for legacy learning tools"
```

---

### Task 10: Node/Express API를 별도 앱으로 만들고 mock/mysql 어댑터를 분리한다

**Objective:** 프런트엔드와 DB를 결합하지 않고, 배포 환경별로 목업과 MySQL을 안전하게 바꿀 수 있게 한다.

**Files:**
- Create: `server/package.json`
- Create: `server/src/app.js`
- Create: `server/src/server.js`
- Create: `server/src/config/env.js`
- Create: `server/src/config/mysql.js`
- Create: `server/src/middleware/requireAuth.js`
- Create: `server/src/middleware/errorHandler.js`
- Create: `server/src/routes/authRoutes.js`
- Create: `server/src/routes/experienceRoutes.js`
- Create: `server/src/routes/resumeRoutes.js`
- Create: `server/src/routes/coverLetterRoutes.js`
- Create: `server/src/routes/progressRoutes.js`
- Create: `server/src/repositories/mock/`
- Create: `server/src/repositories/mysql/`
- Create: `server/src/schemas/`
- Create: `server/test/`
- Create: `server/.env.example`
- Modify: `README.md`

**Step 1: API contract 테스트부터 작성한다.**

```js
import request from 'supertest';
import { createApp } from '../src/app.js';

test('PUT /api/experience rejects unauthenticated writes', async () => {
  const app = createApp({ repository: createMockRepository() });
  await request(app).put('/api/experience').send({}).expect(401);
});
```

추가 테스트:

- 유효한 로그인 후 경험리스트 저장/재조회
- 다른 사용자 ID를 body에 넣어도 다른 사용자 데이터에 쓸 수 없음
- 잘못된 자소서 문서 payload는 422
- repository 실패 시 JSON error contract

**Step 2: 서버 의존성과 환경 구성을 추가한다.**

```bash
cd server
npm install express zod mysql2 bcrypt cookie-parser cors
npm install -D vitest supertest
```

`server/.env.example`에는 실제 비밀값 없이 다음 키만 둔다.

```dotenv
PORT=3001
NODE_ENV=development
DATA_PROVIDER=mock
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
FRONTEND_ORIGIN=http://localhost:5173
SESSION_SECRET=replace-me
```

**Step 3: repository 경계를 구현한다.**

```js
// server/src/repositories/createRepository.js
export function createRepository({ provider, db }) {
  if (provider === 'mock') return createMockRepository();
  if (provider === 'mysql') return createMySqlRepository({ db });
  throw new Error(`Unsupported DATA_PROVIDER: ${provider}`);
}
```

- `mock` provider는 개발/contract test용이다.
- `mysql` provider는 Task 11에서 검증 완료한 domain만 활성화한다.
- raw PHP 파일, direct `$_SESSION`, jQuery endpoint를 import하거나 proxy하지 않는다.

**Step 4: 인증을 안전하게 구현한다.**

- 신규 Node 사용자 인증을 도입할 경우 bcrypt hash와 secure/httpOnly/sameSite 쿠키를 사용한다.
- 레거시 `user_master`가 인증 테이블인지, 해시 방식과 password reset 정책이 무엇인지 확인 전에는 기존 계정으로 로그인된다고 주장하지 않는다.
- 교차 origin API 배포 시 CORS origin을 allowlist하고 `credentials` 정책을 테스트한다.

**Step 5: API 테스트를 통과시키고 문서화한다.**

Run: `cd server && npm run test`

Expected: mock repository contract tests pass; MySQL 없이도 server test가 가능.

**Step 6: 커밋한다.**

```bash
git add server README.md
git commit -m "feat: add API contract with mock repository"
```

---

### Task 11: 검증된 레거시 MySQL을 트랜잭션 기반 어댑터로 연결한다

**Objective:** 기존 DB 데이터와 중복 기능을 유지하면서도 새 API에서 안전하게 읽고 쓴다.

**Files:**
- Create: `server/src/repositories/mysql/experienceRepository.js`
- Create: `server/src/repositories/mysql/resumeRepository.js`
- Create: `server/src/repositories/mysql/coverLetterRepository.js` (스키마 검증 후)
- Create: `server/src/repositories/mysql/lookupRepository.js`
- Create: `server/test/mysql/experienceRepository.integration.test.js`
- Create: `server/test/fixtures/legacy-schema.sql` (비식별·최소 스키마)
- Modify: `docs/legacy-data-contract.md`
- Modify: `server/src/repositories/createRepository.js`

**Step 1: staging 전용 스키마와 fixture를 준비한다.**

- 실운영 DB가 아닌 백업/복제한 staging MySQL에서만 작업한다.
- 테이블 DDL, unique key, foreign key, character set, timezone, code lookup 샘플을 확인한다.
- fixture에 실제 이름, 이메일, 전화번호, 비밀번호, 토큰을 넣지 않는다.

**Step 2: 경험리스트 round-trip 통합 테스트를 먼저 작성한다.**

```js
test('experience update is atomic and preserves the legacy field mapping', async () => {
  await repository.saveExperience(userId, payload);
  const loaded = await repository.getExperience(userId);
  expect(loaded.targetCompany).toBe(payload.targetCompany);
  expect(loaded.dutyActivities).toHaveLength(payload.dutyActivities.length);
});
```

- transaction 중 고의 오류를 주입해, 일부 table만 삭제/삽입되는 일이 없는지 검증한다.
- `user_add_*` 행 교체가 레거시 호환에 꼭 필요할 때만 하나의 transaction 안에서 처리한다.

**Step 3: parameterized query와 transaction을 구현한다.**

```js
await connection.beginTransaction();
try {
  await connection.execute(
    'UPDATE univ_std_info_all SET attribute11 = ?, attribute12 = ? WHERE user_id = ?',
    [payload.targetCompany, payload.targetRole, userId],
  );
  // verified child-table replacement only
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
}
```

- 문자열을 SQL에 연결하지 않는다.
- 레거시가 `univ_std_info_all` 행을 자동 생성한다는 보장이 없으므로 upsert 조건은 DDL 검증 후 결정한다.
- 레거시 `user_master` 공유 필드, `batch_user` 효과, lookup code는 동작 검증 후에만 변경한다.

**Step 4: 이력서/자소서 순서로 전환한다.**

- 경험리스트 read/write/다운로드를 먼저 staging에서 승인한다.
- 다음으로 이력서의 학력/반복 섹션과 파일 저장소를 검증한다.
- 자유형 자소서 데이터가 적합한 기존 테이블을 찾지 못하면 새 테이블 생성은 DB 소유자 승인과 migration 문서가 있어야 한다.

**Step 5: 통합 테스트와 rollback 검증을 실행한다.**

Run: `cd server && DATA_PROVIDER=mysql DATABASE_URL=<staging-only-url> npm run test -- mysql`

Expected: staging fixture의 read/write/rollback test pass; production DB에는 접근하지 않음.

**Step 6: 커밋한다.**

```bash
git add server docs
git commit -m "feat: add verified legacy mysql adapters"
```

---

### Task 12: 전체 UI 검증, 접근성, 배포 파이프라인을 완성한다

**Objective:** 요구된 화면/저장 흐름이 깨지지 않고 GitHub Pages에서 정적 데모로 열리게 한다.

**Files:**
- Create: `e2e/auth-dashboard.spec.js`
- Create: `e2e/experience.spec.js`
- Create: `e2e/cover-letters.spec.js`
- Create: `playwright.config.js`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`
- Modify: `package.json`

**Step 1: 핵심 E2E 시나리오를 작성한다.**

1. 회원가입 → 대시보드 → 미사용 메뉴 표시
2. 경험리스트 소개 → 작성 → 저장 → sidebar/dashboard 완료 상태 변경 → 다운로드
3. 이력서 최소 유효값 저장 → 완료 상태 변경
4. 자소서 다중 항목 저장 → 목록/보기/다운로드
5. 외부 링크가 같은 페이지를 덮어쓰지 않고 새 탭 특성을 가짐
6. 보류 기능이 `준비 중`으로 표시됨

**Step 2: 접근성 점검을 포함한다.**

- 키보드만으로 sidebar, 툴팁, 폼, 모달/확인 대화상자 사용
- visible focus, label, error message, heading hierarchy 확인
- 최소 너비 `1200px`에만 의존하지 않도록 tablet/mobile 레이아웃 또는 명확한 responsive 정책을 적용한다.

**Step 3: GitHub Actions를 구성한다.**

`ci.yml`은 pull request와 main push에서 다음을 실행한다.

```bash
npm ci
npm run test
npm run build
```

`deploy-pages.yml`은 main branch의 정적 build만 Pages artifact로 올린다. `VITE_DATA_MODE=mock`을 명시해 backend 부재가 기능 장애로 보이지 않게 한다.

**Step 4: 배포 산출물을 검증한다.**

- Pages 배포 URL에서 직접 새로고침해도 `#/dashboard` 등 해시 route가 열리는지 확인한다.
- 개발자 도구/번들 검색에서 `C:\Users\`, `C:\jobdam_ai`, `/job_bakseo/`, `/mypage/` 같은 레거시 런타임 경로가 없는지 확인한다.
- 정적 데모에 실제 DB credential, `.env`, 실사용자 정보가 포함되지 않는지 확인한다.

**Step 5: 최종 실행과 커밋한다.**

Run:
```bash
npm run test
npm run build
npx playwright test
```

Expected: 모든 테스트 pass, production build 완료, Pages artifact 생성 가능.

Commit:
```bash
git add e2e playwright.config.js .github README.md package.json package-lock.json
git commit -m "ci: verify and deploy static jobdam demo"
```

## 5. 완료 기준 (Acceptance Criteria)

- [ ] 로그인/회원가입 후에만 앱 기능 route를 볼 수 있다.
- [ ] sidebar에 요구된 기능이 있고, hover와 keyboard focus에서 정확한 설명이 보인다.
- [ ] 입력 완료/미완료 상태가 색과 텍스트로 구분되며 저장 성공에만 바뀐다.
- [ ] dashboard가 사용/미사용 기능을 진행 데이터에 따라 정확히 나눈다.
- [ ] 경험리스트 소개와 작성, 이력서 작성, 자소서 저장/보기/다운로드가 목업 모드에서 실제로 동작한다.
- [ ] 요구된 외부 링크 4개(ChatGPT, 직무 지원동기, 기타 항목, 1분 스피치)가 정확한 URL과 안전한 새 탭 속성으로 연결된다.
- [ ] 보류 기능은 가짜 구현 없이 준비 중이라고 명시된다.
- [ ] 레거시 PHP/HTML은 런타임에 복사·embed·iframe으로 사용하지 않는다.
- [ ] GitHub Pages 빌드에서는 내부 파일/페이지 참조가 상대 경로/해시 route로 동작하고, 절대 Windows/레거시 경로가 없다.
- [ ] MySQL 연결 전에는 mock 모드가 명확히 표시된다. MySQL 연결 후에는 검증된 staging schema, parameterized SQL, transaction, integration test가 있다.

## 6. 위험, 트레이드오프, 결정이 필요한 사항

1. **실제 DB 연결 정보 및 스키마 미확정:** 요구사항은 기존 DB 사용을 요구하지만 현재 제공된 내용에는 DDL, 인증 방식, 환경 구분이 없다. 따라서 첫 구현은 mock으로 진행하고, DB 소유자가 승인한 staging 환경에서만 adapter를 검증한다.
2. **기존 DB의 공유 테이블:** 경험리스트가 `user_master`, `univ_std_info_all`, `batch_user`를 건드린다. 잘못된 신규 API는 다른 기존 서비스 데이터를 손상시킬 수 있으므로, transaction 및 regression fixture가 필수다.
3. **GitHub Pages 제약:** 정적 Pages는 Node/MySQL을 호스팅하지 않는다. 공개 데모는 mock 모드가 정상이며 실제 저장 기능은 별도 API 호스팅과 CORS/cookie 설정이 필요하다.
4. **인증 이전 위험:** 기존 `user_master`가 로그인 테이블인지, password hash와 reset/탈퇴 정책이 무엇인지 확인되지 않았다. 기존 계정 로그인을 임의로 재현하면 안 된다.
5. **자소서 저장 테이블 불명확:** 기존 magician 테이블은 문항/STAR 흐름용으로 보이며, 원문 요구의 기업/직무/다중 자유항목 보관과 동일하다고 단정할 수 없다.
6. **다운로드 포맷:** 요구사항은 형식을 지정하지 않았다. MVP는 레거시 관례에 맞춘 안전한 Word 호환 `.doc` 다운로드로 시작하고, PDF 또는 진짜 `.docx`가 필요하면 예시 파일/브랜드 템플릿을 받고 별도 작업으로 한다.
7. **외부 AI 도구의 로그인/정책:** ChatGPT 및 Naver 도구는 사용자의 외부 계정/서비스 정책에 따라 열릴 수 있다. 새 앱은 결과를 자동 수집하거나 개인정보를 외부 URL에 query string으로 전달하지 않는다.

## 7. 구현 시작 순서

가장 안전하고 빠른 순서는 다음과 같다.

1. Task 1~5: 요구사항 문서화, SPA foundation, 로그인/메뉴/안내 화면
2. Task 6~8: 사용자 검토가 가능한 핵심 입력/저장/다운로드 목업 MVP
3. Task 9: 레거시 도구들의 새 UI 흐름 및 목업
4. Task 10~11: Node API와 staging MySQL 전환
5. Task 12: E2E, 접근성, CI, GitHub Pages 배포

---

## 부록 A — 사용자가 제공한 요구사항 원문 (보존본)

```text
작업 위치: C:\jobdam_ai\
웹 개발 하는중이야. 기존에 ui 틀은 대충 잡았어

# 프로젝트 설명
이름: 잡담 AI 취업 솔루션
내용: 사용자가 로그인해서 경험리스트, 이력서를 입력하면, ai, db 기반으로 맞춤형 취업 솔루션하는 웹이다
화면구성: 왼쪽에 각 기능 버튼이 있는 사이드바가 있고, 나머지 화면은 기능 내용 화면이다
특징: 기존에 이미 구현된 웹이 있고, 지금은 리뉴얼하는 작업이다. **기존 웹 위치**는 "C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs" 으로, 세부 기능은 해당 폴더에 구현된 것들 복사해서 쓰도록 할것이다. ui와 추가 기능을 리뉴얼하고, 중복되는 세부 기능, db는 기존의 것을 그대로 써야 하므로, 기존 프로젝트 폴더 이해를 하는 것이 중요함. 기존 웹은 구조도 엉망이고, 개발도 php등 옛날 기술로 했기 때문에 새로운 기술스택으로 변환해야 한다.(기존 웹에서 페이지를 그대로 복사 붙여넣기 하는것이 아님)

프론트는 리액트, 백엔드는 node.js, db는 mysql
db연결 바로 어려우면 일단 보류, 목업으로 진행
깃허브 배포해야 되니까 페이지 참조할때 절대경로 쓰면 안됨

다음은 사이드바의 기능 버튼 페이지별 구상도이다.

## 첫 화면 로그인, 회원가입 화면

## 사이드바
* 각 기능별로 넘어가는 페이지 버튼이 있음.
* 기능 페이지에 입력하는 페이지 있는데, 입력 완료 된 페이지 버튼/입력 아직 안 된 페이지 버튼 다른색으로 표시
* 마우스 hover하면 해당 기능에 대한 설명이 뜨게 하도록. 예를들어 "AI로 나의 진로 결정하기"기능 버튼 hover -> "기본사항을 간단히 입력하고 진단하면 나에게 적합한 최신 직무 분야를 찾아 줍니다."

## 메인 페이지 대시보드
* 왼쪽 사이드바 메뉴 기능 중에서 사용한 기능 버튼, 아직 활용하지 못한 기능 버튼으로 구역 나눠서 띄우기. 각 버튼 클릭하면 해당 페이지로 이동하도록

## 경험 리스트 작성
* 첫 화면 구성:
  맨 위 제목: "취업 성공자의 필수 코스 경험리스트"
  그 아래 설명: "경험 리스트는 저학년부터 고학년까지 모든 경험과 경험에서 얻은 지식, 스킬, 역량(직무적합성)을 정리하는 기능입니다.
  그 아래 구체적 설명 불릿 형식으로: "취업 상담 시 경험리스트 분석을 통한 취업 전략 수립" "자기소개서 작성시 활용(경험리스트에 작성한 ‘활동내용,역량’을 ‘AI로 자소서 작성'에 활용)" "면접질문 준비시 활용(경험리스트에 작성한 ‘활동내용, 역량’을 ‘AI로 면접답변 준비하기'에 활용)"
  맨 아래 "경험 리스트 작성하기" 버튼, 해당 버튼 클릭하면 페이지 이동, 해당 페이지는 기존 웹에서 경험리스트 기능 가져오기
* 기존 웹에서 경험리스트 위치: C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs\html\mypage\experience\write.html

## AI로 직무·산업·기업 분석하기
* 첫 화면 구성:
  맨 위 제목: “진로·직무결정 고민 한번에 해결"
  그 아래 설명: AI로 나의 진로결정하기는 안내에 따라 간단한 진단을 통해 나에게 적합한 세부 직무(직업), 산업을 추천해 주는 기능입니다. (5~7분 소요)"
  그 아래 구체적 설명: css 복잡하므로 추후 적용
  맨 아래 "AI로 나의 진로 결정하기" 버튼 클릭하면 링크 이동
* 링크: "https://chatgpt.com/g/g-69726feb34888191863db9e65f238c80-jagibunseog-prediger-v6-0-jinro-cwieob"

## 이력서 작성하기
* 기존 웹 이력서 작성 가져오기
* 기존 웹 위치: "C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs\html\mypage\info_add\write.html"

## AI로 나만의 자소서 작성
* 특징: 안에 여러 링크 연결된 버튼 있음
* 첫 화면 구성
  맨 위 제목: “AI로 자기소개서 작성하고 저장하기”
  그 아래 설명: 아래에 있는 모든 항목을 AI로 작성한 후 “내가 작성한 자소서 저장하기＂에 저장해 놓고 기업지원시, 면접답변 준비시 활용하세요.
  그 아래 링크 이동 버튼 6개 """ 회사 지원동기, 직무 지원동기, 성장과정, 입사 후 포부, 기타 모든 항목 작성하기, 내가 작성한 자소서 저장하기"
### 회사 지원동기
* 추후 개발, 보류
### 직무 지원동기
* 링크 연결 : "https://m.site.naver.com/24l4B"
### 성장과정
* 추후 개발, 보류
### 입사 후 포부
* 추후 개발, 보류
### 기타 모든 항목 작성하기
* 별도 설명 페이지 이동
* 설명 페이지 구성
  맨 위 제목: "AI로 인사담당자가 원하는 구조화된 내용 작성"
  그 아래 설명: ‘기타 모든 항목 작성하기’에서는 원하는 주제(역량) 키워드와 글자수를 입력하고 내용을 간략히 입력하면 핵심결론(성과포함) + STAR기반 사례로 구조화하여 작성해 줍니다.
  그 아래 세부 설명:  css 복잡하므로 추후 적용
  그 아래 링크 연결 버튼, 연결 링크: "https://m.site.naver.com/24l2E"
### 내가 작성한 자소서 저장하기
* 입력 후 db에 저장해야됨
* 입력내용:
  지원기업, 지원직무
  1. 자소서 항목을 입력하세요
  AI로 작성한 내용을 복사해서 저장해 주세요(설명)
  (자기소개서 항목 입력 칸)
  ( 자기소개서 내용 입력 칸)
  저장, 항목 추가하기 기능 버튼
* 맨 아래 다운로드, 내가 작성한 자소서 보기 기능 추가

## 항목의도 및 직무별 합격사례 보고 직접 작성하기
* 첫 화면 구성
  맨 위 제목: “나만의 사례로 차별화된 자기소개서 작성”
  그 아래 설명: ‘직무별 합격사례 보고 나만의 사례를 통해 차별화된 직무별 자기소개서를 작성하고 저장하는 기능입니다.
  그 아래 세부 설명:  css 복잡하므로 추후 적용
  맨 아래 "항목의도 및 직무별 합격사례 보고 직접 작성하기" 버튼, 해당 버튼 클릭하면 페이지 이동, 해당 페이지는 기존 웹에서 경험리스트 기능 가져오기
* 기존 웹에서 기능 위치: C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs\html\job_bakseo\application_magician\magician-intro.html

## AI로 1분 스피치 만들기
* 화면 구성
  맨 위 제목: "AI로 1분 스피치 만들기"
  그 아래 설명: (적당히 구상해서 작성)
  링크 이동 버튼
* 연결 링크: "https://m.site.naver.com/22Zv1"

## AI로 면접 답변 작성하기
* 추후 개발. 보류

## 직무별 합격사례보고 면접답변 직접 작성하기
* 화면 구성
  맨 위 제목: "직무별 합격사례보고 면접답변 직접 작성하기"
  해당 페이지 내용은 기존 웹에서 가져오기
* 기존 웹에서 기능 위치: "C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs\html\job_bakseo\frontend\src\index.html"

## AI로 PT 면접 준비하기
* 추후 개발. 보류

## 공기업 면접 노트
* 추후 개발. 보류

## 모든 취업 진로 정보가 여기에
* 화면 구성
  맨 위 제목: "진로·취업 전문가 동영상 특강"
  그 아래 버튼, 해당 버튼 클릭하면 페이지 이동, 해당 페이지는 기존 웹에서 가져오기
* 기존 웹에서 기능 위치: "C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs\html\mypage\view_board\list.html"
```
