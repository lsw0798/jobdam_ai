# 레거시 화면·데이터 이관 계약

> 기준 스냅샷: 2026-07-20. 이 문서는 레거시 PHP 화면의 활성 메뉴에서 UI, 요청 이름, 저장 처리, SQL까지 추적한 논리 계약이다. DB 접속정보와 실제 사용자 데이터는 포함하지 않는다.

## 1. 적용 원칙

- 활성 레거시 메뉴가 연결하는 화면을 기준으로 한다. 이름이 비슷한 다른 모듈이나 날짜 백업 파일은 기준으로 삼지 않는다.
- DB가 제공하는 문항·항목의도·질문의도·사례·직무 코드를 프런트에서 임의 생성하지 않는다.
- 신규 Node 저장소는 기존 테이블과 컬럼 의미를 보존하되 parameterized query와 transaction을 사용한다.
- 개발 환경에서 MySQL을 사용할 수 없으면 동일한 API/DTO 계약의 목업 adapter를 사용하고, 목업임을 UI와 코드에서 명확히 구분한다.
- 레거시의 전체 삭제 후 재삽입, 사용자 소유권이 빠진 조건절 같은 위험한 구현은 그대로 복제하지 않는다.
- 화면 입력값, DB 기준정보, 표시 전용 조합값을 구분한다.

## 2. 활성 메뉴와 화면 대응

| 신규 메뉴 | 활성 레거시 진입점 | 핵심 계약 |
| --- | --- | --- |
| 경험 리스트 작성 | `/mypage/experience/write.html` | 기본·지원정보, 직무역량, 성적·외국어, 4개 고정 경험 테이블 |
| AI로 나만의 자소서 작성 | `/job_bakseo/application_ai_corp/intro.html` | 기업·직무 → 최대 6개 지속 문항 → 사례 검색·작성 → 이력·다운로드 |
| 항목의도 및 직무별 합격사례 보고 직접 작성하기 | `/job_bakseo/application_magician/magician-intro.html` | 직무·기본/심화항목 선택, DB 항목의도·필요역량·사례, 동적 작성행 |
| 직무별 합격사례보고 면접답변 직접 작성하기 | `/job_bakseo/frontend/src/index.html` | 기본정보 → 직무 → 질문 최대 50개 → 답변·키워드·후속질문 → 연습/다운로드 |
| 모든 취업 진로 정보가 여기에 | `/jobData/28.html`, `/mypage/view_board/list.html?grp=n`, 홈 전문가 강의 영역 | 외부 사이트 디렉터리, DB 동영상 자료실, 정적 전문가 강의의 세 콘텐츠 유형 |

## 3. 경험리스트

### 3.1 화면·요청·DB 필드

| 영역 | 레거시 요청 이름 | DB 매핑 |
| --- | --- | --- |
| 사용자 정보 | 이름은 표시 전용; `school_id`, `school_name`, `homepage`, `grade`, `hp1`, `email`, `sns_homepage` | `user_master.user_name/homepage/hp1/email/sns_homepage`; `univ_std_info_all.school_id/school_name/grade` |
| 지원정보 | `subject`, `apply_conpany`, `duty_company`, `myscore`, `subjectscore`, `graduationTerm` | `univ_std_info_all.subject`, `attribute11`, `attribute12`, `attribute13`, `attribute14`, `attribute15` |
| 직무역량 | `job_modeling1`~`job_modeling4` | `user_add_modeling.job_modeling1..4`: 필요지식·필요스킬·직무적합성·인재상 |
| 외국어 | `foreign_language_*` | `user_add_foreign_language.val_1/val_4/val_5/val_6` |
| 전체성적 | `school_record_*` | `user_add_school_record.val_1/val_4/val_5/val_6` |
| 전공성적 | `subject_record_*` | `user_add_subject_record.val_1/val_4/val_5/val_6` |
| 수상·자격증 | `certificate_activities_N`, `certificate_date_N`, `certificate_knowledge_N`, `certificate_skill_N`, `certificate_attitude_N` | `user_add_certificate(user_id,val_1,val_7,val_4,val_5,val_6)` |
| 직무·전공 활동 | `duty_activitie_activities_N`, `duty_date_from_N`, `duty_date_to_N`, `duty_activitie_knowledge_N`, `duty_activitie_skill_N`, `duty_activitie_attitude_N` | `user_add_duty_activitie(user_id,val_1,val_7,val_8,val_4,val_5,val_6)` |
| 대내·외 활동 | `activitie_activities_N`, `activitie_date_N`, `activitie_knowledge_N`, `activitie_skill_N`, `activitie_attitude_N` | `user_add_activitie(user_id,val_1,val_7,val_4,val_5,val_6)` |
| 기타 | `etc_activities_N`, `etc_date_N`, `etc_knowledge_N`, `etc_skill_N`, `etc_attitude_N` | `user_add_etc(user_id,val_1,val_7,val_4,val_5,val_6)` |

### 3.2 반복·저장·다운로드 규칙

- 경험 분류는 category 컬럼이 아니라 네 개의 고정 테이블로 표현한다.
- 각 반복 영역은 행 추가·삭제를 지원하며 저장기는 `N=1..29`를 읽는다.
- 저장 완료 상태는 `batch_user(user_id,batch_kind='EXPERIENCE',batch_status='Y',edit_date)`에 기록한다.
- 다운로드는 먼저 동일 데이터를 저장한 뒤 DB를 재조회해 HTML 기반 Word 파일 `downloadData.doc`를 만든다.
- `grade`는 학년이고, 전체학점은 `myscore/attribute13`이다. 둘을 같은 필드로 취급하지 않는다.
- 자격증·대내외활동·기타는 단일 일자, 직무활동은 시작일과 종료일을 사용한다.

## 4. AI 기업·직무 맞춤 자소서

### 4.1 사용자 흐름

1. `새로 작성하기` 또는 `지난 작성내용 불러오기`
2. 사례 제공 동의, 지원기업 직접 입력, DB 직무 선택
3. 기업이 요구한 자소서 질문 직접 입력
4. 질문별 키워드 선택과 합격사례 검색
5. 사례를 참고해 직접 작성하고 문장 검색·수정·검증
6. 작성글 확인, 이력 수정·삭제, Word/Excel 출력

### 4.2 DB 계약

| 역할 | 테이블·컬럼 |
| --- | --- |
| 사용자 문서 master | `application_ai_lookup_my_master(cd,user_id,corp,duty,edit_date,reg_date,attribute5)` |
| 질문·답변 detail | `application_ai_lookup_my_detail(cd,cd_my_master,subject,contents,edit_date,reg_date)` |
| 직무·키워드 연결 | `application_ai_lookup_data(duty,keyword,question_cd)` |
| 전공 추천 직무 | `application_ai_note_major_duty(major,main_major,duty,major_text)` |
| 키워드·검증 코드 | `application_ai_lookup_code_all(lookup_type,lookup_code,lookup_code_name,attribute1)` |
| 합격사례·문장 | `application_ai_lookup_question_master(cd,question_ori,headline,conclusion,content,endline)` |
| 주의사항 동의 | `user_job_bakseo_qoa_all(user_id,reg_date,attribute3)` |

### 4.3 카디널리티와 요청 이름

- 화면은 `my_subject1`~`my_subject10`을 렌더링하지만 활성 `set_save.html`은 `my_subject1`~`my_subject6`만 지속한다. 새 adapter의 호환 한계는 6개로 명시한다.
- 기본 master 요청: `step`, `cd_my_master`, `corp`, `duty`, `isApprove`.
- 질문 사례 선택: `selectMyQuestion`, `selectKeyword`.
- 최종 작성값: `txt_result` → `application_ai_lookup_my_detail.contents`.
- 목록은 기업·직군·수정일자와 수정·출력·삭제를 제공한다.
- 활성 다운로드는 `AI자소서.doc`와 `AI자소서.xls`이며 기업·직무·질문·내용·작성자·작성일을 DB에서 읽는다.

## 5. 항목의도·직무별 합격사례 자소서

### 5.1 기준정보와 사용자 데이터의 소유권

| 데이터 | 소유권 | 테이블·컬럼 |
| --- | --- | --- |
| 직무 그룹·기본/심화 항목 | DB 기준정보 | `application_magician_lookup_code_all(lookup_type,lookup_code,lookup_code_name,status_code)` |
| 항목의도·작성방법 | DB 읽기 전용 | `ITEM_DESC.attribute1`, `ITEM_DESC.attribute2` |
| 필요역량 | DB 읽기 전용 | `ITEM_ATTRIBUTE.attribute1..4`: 지식·기술·태도·자격증 |
| 사례 키워드 master | DB 읽기 전용 | `application_magician_question_master(cd,letter_group,letter_item,letter_keyword,status_code)` |
| 사례·동적 작성 단계 | 사례는 DB 읽기 전용, 답변은 사용자 작성 | `application_magician_question_detail(cd,cd_seq,content_guide,content,content_guide_star,content_modify_yn,display_order)` |
| 최근 선택 직무 | 사용자 선택 | `application_magician_user_job(user_id,select_group,edit_date,reg_date)` |
| 사용자 작성 결과 | 사용자 작성 | `application_magician_my_question_writing(cd,user_id,master_cd,cd_seq,content_text,result_text,headLine_text,star_1_text,star_2_text,edit_date,reg_date,group_lookup_code)` |

### 5.2 요청·동작 계약

- 직무는 자유 텍스트가 아니라 `selectGroup` 코드이며 최대 3개를 선택한다.
- 작성 모드는 `selectMode`, 항목 식별자는 `master_cd`, 상세 식별자는 `cd_seq`다.
- 동적 입력 이름은 `content_{master_cd}_{cd_seq}`, `star1_{master_cd}_{cd_seq}`, `star2_{master_cd}_{cd_seq}`다.
- `항목의도`, `작성방법`, `필요역량`, 사례는 사용자 입력칸이 아니다.
- STAR는 S/T/A/R 네 고정 필드가 아니라 해당 DB 행에 `content_guide_star`가 있을 때만 제공되는 선택 작성 모드다.
- 나의 자소서와 작성 항목 이력을 조회·수정할 수 있어야 한다.

## 6. 직무별 합격사례 면접답변

### 6.1 6단계 흐름

1. 기본정보 확인
2. 기업·직무 선택
3. 맞춤/필수/직접선택 탭에서 질문 최대 50개 선택
4. 질문의도·답변방향·유사질문·직무별 사례를 읽고 답변 작성
5. 답변 키워드, 예상 후속답변, 추가 질문·답변 최대 3쌍 작성
6. 연습 및 다운로드

### 6.2 요청 계약

- 직무 선택: `function_kind`, `duty_business`, `choice_none`.
- 질문 선택: `duty_select`, `question_kind`; 선택 ID는 `^`로 연결한다.
- 답변 저장: `saveWord={questionId}`, `duty_select`, `myAnswer_{questionId}`, `myKeyword_{questionId}`, `predictionAnswer_{questionId}`.
- 추가 질문: `anotherQuestion1{id}`~`anotherQuestion3{id}`, `anotherAnswer1{id}`~`anotherAnswer3{id}`, `hideLevel{id}`.
- 질문의도·답변방향·합격사례는 DB 읽기 전용이고 사용자 입력값이 아니다.
- 면접 답변은 고정 STAR 필드가 아니라 일반 답변·키워드·후속답변 구조다.

### 6.3 DB 계약

| 역할 | 테이블·컬럼 |
| --- | --- |
| 직무·질문 코드 | `lookup_code_all(lookup_type,lookup_code,lookup_code_name,attribute2,sort_no)` |
| 선택 master·직무 | `application_note_my_master(user_id,cd_duty,attribute1,edit_date,reg_date)`, `application_note_my_function(user_id,cd_function,edit_date,reg_date)` |
| 질문 master | `application_note_question_master(cd,cd_target,question_name,importance,read_count,question_intention,answer_direction,question_intention_analysis,question_intention_analysis2,answer_direction_analysis,sort_order)` |
| 질문-직무 mapping | `application_note_question_master_duty(cd_mymaster,function_code)` |
| 합격답변 사례 | `application_note_question_detail(cd,cd_my_master,question_name,sort_order)`, `application_note_question_detail_duty(cd_my_detail,function_code)` |
| 선택 질문·작성 답변 | `application_note_my_target(user_id,cd_question,cd_function,contents,follow_contents,my_underline,edit_flag,edit_date,reg_date)` |
| 추가 질문 | `application_note_my_add_question(user_id,cd_question,cd_function,cd_flag,add_question,add_answer,add_underline,edit_date,reg_date)` |

## 7. 모든 취업·진로 정보

이 메뉴는 다음 세 가지 레거시 콘텐츠 유형을 탭 또는 명확한 하위 영역으로 분리한다.

### 7.1 모든취업사이트

- 데이터 원본: `jobData/28.html`의 정적 사이트명·URL.
- 12분류: 취업정보 제공, 분야/직무별 취업정보, 여성 특화, 기업정보/분석, 진로·직무·직업 찾기, 외국어·자격증, 자격증·교육, 자기계발·진로설정, 공기업 수험·채용, 창업, 공모전, 아르바이트·채용포털.
- 검색·DB 콘텐츠는 없고 페이지 앵커와 새 창 외부 링크를 제공한다.
- 스냅샷 집계는 링크 103개, 고유 목적지 100개다.
- 진입 사용 로그만 `log_user(user_id,kind_log,reg_date,attribute1='JOBSTORE')`에 기록한다.

### 7.2 진로취업동영상

- `bbs_press` 기반 DB 게시판이다.
- 필터: 진로(0), 취업(1), 인적성/NCS(2), 기업분석(3), 간호분야(4), 전체.
- 검색 대상: `subject`, `contents_summary`; 페이지당 5건, 페이지 블록 10개, `cd DESC`.
- 목록: 동영상 미리보기, 제목, 등록일, 조회수.
- 상세 모달: 영상, 제목, 등록일·조회수, 강의시간, 강사소개, 강의소개.
- 상세 열기 시 `hit = hit + 1`; 카테고리별 사용 로그를 `log_user`에 기록한다.

`bbs_press` 핵심 열:

`cd`, `grp`, `subject`, `contents_summary`, `contents`, `contents_thumbnail`, `odr`, `lecture_time`, `instructor_introduction`, `lecture_introduction`, `hit`, `reg_date`, `isdel`, `edit_date`, `user_id`, `step`, `level`.

`contents`는 URL 문자열이 아니라 iframe 등 원본 embed HTML이고, `odr`는 이 화면에서 `0=구글`, `1=유튜브` 소스 코드로 재사용된다.

### 7.3 인사전문가 강의

- DB 게시판과 다른 정적 콘텐츠다.
- 기업·자소서 4분류 15개와 면접 3분류 7개, 총 22개의 실제 YouTube 강의를 제공한다.
- 임의 `example.com` 영상이나 새 분류로 대체하지 않는다.

## 8. API adapter 경계

프런트는 SQL 테이블을 직접 알지 않고 다음 의미 단위의 API를 사용한다.

- 경험리스트 문서 조회·저장·Word 다운로드 준비
- AI 자소서 master/detail 목록·조회·저장·삭제 및 직무/키워드/사례 기준정보 조회
- 합격사례 자소서 직무/항목/사례 기준정보 조회와 동적 답변 upsert
- 면접 직무/질문/사례 조회, 질문 선택, 답변·키워드·후속질문 upsert
- 취업사이트 디렉터리 조회, 동영상 검색·상세·조회수, 전문가 강의 조회

각 API 응답은 레거시 식별자(`cd`, `master_cd`, `cd_seq`, `function_code`, `cd_question`)를 보존해야 한다. 표시명만 저장하면 기존 DB와 조인하거나 이력을 복원할 수 없다.

## 9. 기준 파일 체크섬

조사 중 OneDrive 원본이 변경된 정황이 있어 아래 스냅샷을 구현 기준으로 고정한다.

| 파일 | SHA-256 |
| --- | --- |
| `mypage/experience/write.html` | `c227e7d92e142433a0448081a3abf71cfb9dca78c8a7db5c372d3d88207552ee` |
| `mypage/experience/set_save.html` | `7cacde4d119ed903f1029f6ce44c15f2c07dcf5d8759d2c771d2f8183f34f5f3` |
| `application_ai_corp/set_save.html` | `453b7271e2d5e790f27e72f2ed78ec685187c5bd00bfc1169de9b29d866da3c0` |
| `application_magician/src/save_answer.html` | `6bfc523c11d504cefa7182c83876716ef1370a4096142b6aae3dcf468be9e538` |
| `frontend/src/views/set_save_write_answer.html` | `34f43b8eb589c673b4ac23ab02f259d9b48c027fe3137623cb8033a6ff871aea` |
| `jobData/28.html` | `14777e21cb06ec0d89f17e62e4561f514f5ede56d7249684ad88d8a02f1868a2` |

## 10. MySQL 연결 전 필수 검증

1. staging DB에서 테이블별 PK, unique key, nullability, 길이, charset과 실제 식별자 타입을 확인한다.
2. UI 10개/저장기 6개처럼 레거시 내부가 충돌하는 경우 활성 저장 endpoint의 지속 계약을 우선하고 제품 결정 사항을 별도 기록한다.
3. 한 사용자 저장이 여러 테이블을 변경하면 단일 transaction으로 감싼다.
4. 모든 update/delete 조건에 인증된 사용자 소유권을 포함한다.
5. 운영 데이터를 변경하기 전 익명화 fixture로 레거시 조회·다운로드 결과와 adapter 응답을 비교한다.
6. credentials, 운영 DSN, 실제 사용자 데이터는 저장소·문서·프런트 번들에 포함하지 않는다.

## 11. 핵심 source evidence 색인

경로 `L`은 `C:\Users\swzza\OneDrive\바탕 화면\jobdam\htdocs\html`이다.

### 경험리스트

- 활성 메뉴와 진입: `L/inc_html/head.html:178-182`, `L/mypage/experience/write.html:1-6,62-67,121-123`
- 기본·지원·직무역량 필드: `L/mypage/experience/write.html:157-240`
- 외국어·성적·반복영역: `L/mypage/experience/write.html:244-435,599-659`
- 동적 반복행 이름: `L/mypage/experience/script.js:283-344`
- SQL 저장과 최대 29행: `L/mypage/experience/set_save.html:20-207`
- 저장 후 Word 다운로드: `L/mypage/experience/script.js:503-510`, `L/mypage/experience/downloadExperience.php:9-13,109-327`

### AI 기업·직무 자소서

- 인트로 두 진입: `L/job_bakseo/application_ai_corp/intro.html:144-164`
- 기업·직무·동의: `L/job_bakseo/application_ai_corp/write_1.html:198-292`
- UI 10문항: `L/job_bakseo/application_ai_corp/write_2.html:190-328`
- 실제 지속 6문항과 master/detail SQL: `L/job_bakseo/application_ai_corp/set_save.html:24-122`
- 키워드·사례 탐색: `L/job_bakseo/application_ai_corp/write_4_search.html:233-329`, `L/job_bakseo/application_ai_corp/example/get_list.php:28-81`
- 목록·수정·삭제·출력: `L/job_bakseo/application_ai_corp/my_corp_letter.html:208-246`, `my_corp_letter_delete.html:18-30`, `script.js:807-836`

### 항목의도·직무별 합격사례 자소서

- 직무 최대 3개와 코드 선택: `L/job_bakseo/application_magician/magician-base.html:236-296,359-362`
- 기본/심화 항목과 이력: `L/job_bakseo/application_magician/magician-form.html:69-129,159-210`
- 항목의도·작성방법·필요역량·사례 키워드: `L/job_bakseo/application_magician/src/menu.html:49-118`, `src/item_info.html:22-117`
- DB 사례와 동적 작성행·선택 STAR: `L/job_bakseo/application_magician/src/intro_detail.html:34-53,70-178,180-314`
- 직렬화·POST·저장 SQL: `L/job_bakseo/application_magician/scripts/magician-form.js:271-289`, `src/save_answer.html:16-76`

### 직무별 면접답변

- 6단계 표시: `L/job_bakseo/frontend/src/views/02_TargetSelection.html:84-117`
- 직무 코드 선택: `L/job_bakseo/frontend/src/views/02_TargetSelection.html:15-33,171-229`
- 질문 탭·최대 50개: `L/job_bakseo/frontend/src/views/03_QuestionSelection_2.html:293-335,539-625`
- 질문의도·답변방향·사례: `L/job_bakseo/frontend/src/views/04_1_WriteAnswer.html:160-188,267-352`
- 답변·키워드·후속질문: `L/job_bakseo/frontend/src/views/04_1_WriteAnswer.html:355-465,500-604`
- 답변 POST·SQL: `L/job_bakseo/frontend/src/public/js/WriteAnswer.js:16-44`, `src/views/set_save_write_answer.html:16-32`

### 모든 취업·진로 정보

- 모든취업사이트 활성 연결: `L/inc_html/ndesign_section2.html:432`, `L/camp/script.js:22-25`
- 12분류·103링크 원본: `L/jobData/28.html:13-1092`
- 동영상 필터·검색·페이징·상세: `L/mypage/view_board/get_div_menu.html:162-235`, `get_div_body.html:17-37,168-184,377-423,465-578`
- `bbs_press` 저장·조회수·로그: `L/mypage/view_board/set_save.html:29-57`, `set_value.html:14-22`, `set_log_count.html:14-42`
- 전문가 강의 활성 7분류 22개: `L/inc_html/ndesign_section2.html:319-410`