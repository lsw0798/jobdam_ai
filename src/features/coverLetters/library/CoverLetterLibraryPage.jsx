import { useMemo, useState } from 'react';
import {
  downloadCoverLetterExcel,
  downloadCoverLetterWord,
} from './coverLetterExport';
import {
  COVER_LETTER_FIXTURE_REFERENCES,
  COVER_LETTER_MAX_ITEMS,
  coverLetterLibraryService,
  createCoverLetterDraft,
  createCoverLetterItem,
  normalizeCoverLetterRecord,
} from './coverLetterLibraryService';
import './CoverLetterLibraryPage.css';

const STAGES = Object.freeze([
  { id: 'support', label: '지원 정보' },
  { id: 'questions', label: '질문 입력' },
  { id: 'writing', label: '사례·작성' },
  { id: 'review', label: '최종 확인' },
]);

const SENTENCE_TYPES = Object.freeze([
  { id: 'headline', label: '헤드라인' },
  { id: 'conclusion', label: '결론' },
  { id: 'content', label: '본문' },
  { id: 'endline', label: '마무리' },
]);

function identifiersEqual(first, second) {
  return first !== '' && second !== '' && String(first) === String(second);
}

function safeReferences(service) {
  try {
    return service.getReferences?.() ?? COVER_LETTER_FIXTURE_REFERENCES;
  } catch {
    return COVER_LETTER_FIXTURE_REFERENCES;
  }
}

function safeLoad(service) {
  try {
    const records = service.load?.();
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function draftFromRecord(record) {
  const normalized = normalizeCoverLetterRecord(record);
  if (!normalized) {
    return createCoverLetterDraft();
  }
  return {
    ...normalized,
    items: normalized.items.length > 0 ? normalized.items : [createCoverLetterItem(1)],
  };
}

function nextDetailCd(items) {
  for (let candidate = 1; candidate <= COVER_LETTER_MAX_ITEMS; candidate += 1) {
    if (!items.some((item) => item.detailCd === candidate)) {
      return candidate;
    }
  }
  return items.length + 1;
}

function recordPayload(draft) {
  const payload = {
    masterCd: draft.masterCd,
    applicationCompany: draft.applicationCompany,
    applicationRole: draft.applicationRole,
    dutyCode: draft.dutyCode,
    consent: draft.consent,
    items: draft.items.map((item) => ({
      detailCd: item.detailCd,
      title: item.title,
      content: item.content,
      keywordCode: item.keywordCode,
      exampleCd: item.exampleCd,
      sentenceType: item.sentenceType,
    })),
  };

  for (const field of ['authorName', 'createdAt']) {
    if (typeof draft[field] === 'string') {
      payload[field] = draft[field];
    }
  }
  return payload;
}

function SupportStage({
  draft,
  errors,
  onAdvance,
  onChange,
  references,
}) {
  return (
    <section aria-labelledby="cover-letter-support-title" className="cover-letter-library-page__stage">
      <h2 id="cover-letter-support-title">지원 정보·동의</h2>
      <p>사례 제공에 동의한 뒤 지원기업과 지원직무를 선택하세요.</p>
      <div className="cover-letter-library-page__grid">
        <div className="cover-letter-library-page__field cover-letter-library-page__field--wide">
          <label className="cover-letter-library-page__consent" htmlFor="cover-letter-consent">
            <input
              aria-invalid={errors.consent ? true : undefined}
              checked={draft.consent}
              id="cover-letter-consent"
              onChange={(event) => onChange('consent', event.target.checked)}
              type="checkbox"
            />
            합격사례 제공 동의
          </label>
        </div>
        <div className="cover-letter-library-page__field">
          <label htmlFor="cover-letter-company">지원기업</label>
          <input
            aria-invalid={errors.applicationCompany ? true : undefined}
            id="cover-letter-company"
            onChange={(event) => onChange('applicationCompany', event.target.value)}
            type="text"
            value={draft.applicationCompany}
          />
        </div>
        <div className="cover-letter-library-page__field">
          <label htmlFor="cover-letter-duty">지원직무</label>
          <select
            aria-invalid={errors.dutyCode ? true : undefined}
            id="cover-letter-duty"
            onChange={(event) => onChange('dutyCode', event.target.value)}
            value={String(draft.dutyCode ?? '')}
          >
            <option value="">- 전체 직무 -</option>
            {references.duties.map((duty) => (
              <option key={String(duty.dutyCode)} value={String(duty.dutyCode)}>{duty.name}</option>
            ))}
          </select>

        </div>
      </div>
      <div className="cover-letter-library-page__actions">
        <button onClick={onAdvance} type="button">질문 입력 단계로</button>
      </div>
    </section>
  );
}

function QuestionsStage({
  draft,
  errors,
  onAdd,
  onAdvance,
  onBack,
  onDelete,
  onUpdate,
}) {
  return (
    <section aria-labelledby="cover-letter-questions-title" className="cover-letter-library-page__stage">
      <h2 id="cover-letter-questions-title">기업 질문 직접 입력</h2>
      <p>기업이 요구한 자기소개서 질문은 사용자가 직접 입력합니다. 지속 저장은 최대 6개입니다.</p>
      {draft.items.map((item, index) => (
        <fieldset className="cover-letter-library-page__question" key={`${String(item.detailCd)}-${index}`}>
          <legend>질문 {index + 1}</legend>
          <div className="cover-letter-library-page__field">
            <label htmlFor={`cover-letter-question-${index}`}>기업 질문 {index + 1}</label>
            <input
              aria-invalid={errors[`question-${index}`] ? true : undefined}
              id={`cover-letter-question-${index}`}
              onChange={(event) => onUpdate(index, 'title', event.target.value)}
              type="text"
              value={item.title}
            />
          </div>
          {draft.items.length > 1 && (
            <div className="cover-letter-library-page__actions">
              <button className="danger" onClick={() => onDelete(index)} type="button">질문 {index + 1} 삭제</button>
            </div>
          )}
        </fieldset>
      ))}
      <p>{draft.items.length} / {COVER_LETTER_MAX_ITEMS}개</p>
      <button
        className="secondary"
        disabled={draft.items.length >= COVER_LETTER_MAX_ITEMS}
        onClick={onAdd}
        type="button"
      >
        기업 질문 추가
      </button>
      <div className="cover-letter-library-page__actions">
        <button className="secondary" onClick={onBack} type="button">지원 정보로</button>
        <button onClick={onAdvance} type="button">사례 참고·직접 작성 단계로</button>
      </div>
    </section>
  );
}

function WritingStage({
  draft,
  errors,
  onAdvance,
  onBack,
  onUpdate,
  references,
}) {
  return (
    <section aria-labelledby="cover-letter-writing-title" className="cover-letter-library-page__stage">
      <h2 id="cover-letter-writing-title">키워드·합격사례 참고 및 직접 작성</h2>
      <p>키워드와 합격사례를 참고해 질문별 자기소개서를 작성하세요.</p>
      {draft.items.map((item, index) => {
        const selectedExample = references.examples.find((example) => (
          identifiersEqual(example.exampleCd, item.exampleCd)
        ));
        const availableExamples = item.keywordCode === ''
          ? references.examples
          : references.examples.filter((example) => identifiersEqual(example.keywordCode, item.keywordCode));
        const sentenceType = SENTENCE_TYPES.find((type) => type.id === item.sentenceType) ?? SENTENCE_TYPES[2];

        return (
          <fieldset className="cover-letter-library-page__writing-item" key={`${String(item.detailCd)}-${index}`}>
            <legend>질문 {index + 1}: {item.title}</legend>
            <div className="cover-letter-library-page__reference-grid">
              <div className="cover-letter-library-page__field">
                <label htmlFor={`cover-letter-keyword-${index}`}>질문 {index + 1} 키워드</label>
                <select
                  aria-invalid={errors[`keyword-${index}`] ? true : undefined}
                  id={`cover-letter-keyword-${index}`}
                  onChange={(event) => onUpdate(index, 'keywordCode', event.target.value)}
                  value={String(item.keywordCode ?? '')}
                >
                  <option value="">- 질문항목 키워드 -</option>
                  {references.keywords.map((keyword) => (
                    <option key={String(keyword.keywordCode)} value={String(keyword.keywordCode)}>
                      {keyword.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cover-letter-library-page__field">
                <label htmlFor={`cover-letter-example-${index}`}>질문 {index + 1} 합격사례</label>
                <select
                  aria-invalid={errors[`example-${index}`] ? true : undefined}
                  id={`cover-letter-example-${index}`}
                  onChange={(event) => onUpdate(index, 'exampleCd', event.target.value)}
                  value={String(item.exampleCd ?? '')}
                >
                  <option value="">- 합격사례 -</option>
                  {availableExamples.map((example) => (
                    <option key={String(example.exampleCd)} value={String(example.exampleCd)}>
                      {example.questionOri}
                    </option>
                  ))}
                </select>
              </div>

              {selectedExample && (
                <section
                  aria-label={`질문 ${index + 1} 합격사례 참조`}
                  className="cover-letter-library-page__reference"
                  role="region"
                >
                  <h3>합격사례 참조</h3>
                  <p><strong>원 질문:</strong> {selectedExample.questionOri}</p>
                  <p><strong>헤드라인:</strong> {selectedExample.headline}</p>
                  <p><strong>결론:</strong> {selectedExample.conclusion}</p>
                  <p><strong>본문:</strong> {selectedExample.content}</p>
                  <p><strong>마무리:</strong> {selectedExample.endline}</p>
                </section>
              )}
            </div>

            <fieldset>
              <legend>질문 {index + 1} 문장 참조 유형</legend>
              <div className="cover-letter-library-page__sentence-types">
                {SENTENCE_TYPES.map((type) => (
                  <label htmlFor={`cover-letter-sentence-${index}-${type.id}`} key={type.id}>
                    <input
                      checked={item.sentenceType === type.id}
                      id={`cover-letter-sentence-${index}-${type.id}`}
                      name={`cover-letter-sentence-${index}`}
                      onChange={() => onUpdate(index, 'sentenceType', type.id)}
                      type="radio"
                      value={type.id}
                    />
                    {type.label}
                  </label>
                ))}
              </div>
              {selectedExample && (
                <p><strong>{sentenceType.label} 참조:</strong> {selectedExample[item.sentenceType]}</p>
              )}
            </fieldset>

            <div className="cover-letter-library-page__field">
              <label htmlFor={`cover-letter-content-${index}`}>질문 {index + 1} 직접 작성 내용</label>
              <textarea
                aria-invalid={errors[`content-${index}`] ? true : undefined}
                id={`cover-letter-content-${index}`}
                onChange={(event) => onUpdate(index, 'content', event.target.value)}
                value={item.content}
              />
            </div>
          </fieldset>
        );
      })}
      <div className="cover-letter-library-page__actions">
        <button className="secondary" onClick={onBack} type="button">질문 입력으로</button>
        <button onClick={onAdvance} type="button">최종 확인 단계로</button>
      </div>
    </section>
  );
}

function ReviewStage({ draft, onBack, onSave }) {
  return (
    <section aria-labelledby="cover-letter-review-title" className="cover-letter-library-page__stage">
      <h2 id="cover-letter-review-title">최종 확인</h2>
      <dl>
        <dt>지원기업</dt>
        <dd>{draft.applicationCompany}</dd>
        <dt>지원직무</dt>
        <dd>{draft.applicationRole}</dd>

      </dl>
      {draft.items.map((item, index) => (
        <div className="cover-letter-library-page__review-item" key={`${String(item.detailCd)}-${index}`}>
          <h3><span aria-hidden="true">{index + 1}. </span><span>{item.title}</span></h3>
          <p>{item.content}</p>

        </div>
      ))}
      <div className="cover-letter-library-page__actions">
        <button className="secondary" onClick={onBack} type="button">작성 단계로</button>
        <button onClick={onSave} type="button">자기소개서 저장</button>
      </div>
    </section>
  );
}

export function CoverLetterLibraryPage({
  exportDocument = downloadCoverLetterWord,
  exportSpreadsheet = downloadCoverLetterExcel,
  onSaved,
  service = coverLetterLibraryService,
}) {
  const references = useMemo(() => safeReferences(service), [service]);
  const [savedLetters, setSavedLetters] = useState(() => safeLoad(service));
  const [draft, setDraft] = useState(() => createCoverLetterDraft());
  const [stage, setStage] = useState('support');
  const [validationErrors, setValidationErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  function clearFeedback(errorKey) {
    setErrorMessage('');
    setStatusMessage('');
    if (errorKey) {
      setValidationErrors((current) => {
        if (!current[errorKey]) {
          return current;
        }
        const next = { ...current };
        delete next[errorKey];
        return next;
      });
    }
  }

  function updateSupport(field, rawValue) {
    if (field === 'dutyCode') {
      const duty = references.duties.find((candidate) => String(candidate.dutyCode) === rawValue);
      setDraft((current) => ({
        ...current,
        dutyCode: duty?.dutyCode ?? '',
        applicationRole: duty?.name ?? '',
      }));
    } else {
      setDraft((current) => ({ ...current, [field]: rawValue }));
    }
    clearFeedback(field);
  }

  function updateItem(index, field, rawValue) {
    let value = rawValue;
    if (field === 'keywordCode') {
      value = references.keywords.find((keyword) => String(keyword.keywordCode) === rawValue)?.keywordCode ?? '';
    }
    if (field === 'exampleCd') {
      value = references.examples.find((example) => String(example.exampleCd) === rawValue)?.exampleCd ?? '';
    }

    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
    const errorPrefix = field === 'title' ? 'question' : field;
    clearFeedback(`${errorPrefix}-${index}`);
  }

  function goToQuestions() {
    const errors = {
      ...(draft.consent ? {} : { consent: true }),
      ...(draft.applicationCompany.trim() ? {} : { applicationCompany: true }),
      ...(draft.dutyCode !== '' ? {} : { dutyCode: true }),
    };
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setStatusMessage('');
      setErrorMessage('사례 제공 동의와 지원기업, 지원직무를 확인해 주세요.');
      return;
    }
    setValidationErrors({});
    setErrorMessage('');
    setStage('questions');
  }

  function addQuestion() {
    if (draft.items.length >= COVER_LETTER_MAX_ITEMS) {
      return;
    }
    setDraft((current) => ({
      ...current,
      items: [...current.items, createCoverLetterItem(nextDetailCd(current.items))],
    }));
    clearFeedback();
  }

  function deleteQuestion(index) {
    if (draft.items.length <= 1) {
      return;
    }
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
    setValidationErrors({});
    clearFeedback();
  }

  function goToWriting() {
    const errors = Object.fromEntries(draft.items.flatMap((item, index) => (
      item.title.trim() ? [] : [[`question-${index}`, true]]
    )));
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setStatusMessage('');
      setErrorMessage('기업이 요구한 질문을 직접 입력해 주세요.');
      return;
    }
    setValidationErrors({});
    setErrorMessage('');
    setStage('writing');
  }

  function goToReview() {
    const errors = {};
    draft.items.forEach((item, index) => {
      if (item.keywordCode === '') errors[`keyword-${index}`] = true;
      if (item.exampleCd === '') errors[`example-${index}`] = true;
      if (!item.content.trim()) errors[`content-${index}`] = true;
    });
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setStatusMessage('');
      setErrorMessage('각 질문의 키워드·합격사례와 직접 작성 내용을 확인해 주세요.');
      return;
    }
    setValidationErrors({});
    setErrorMessage('');
    setStage('review');
  }

  function handleSave() {
    let savedRecord;
    try {
      savedRecord = service.save?.(recordPayload(draft));
    } catch {
      savedRecord = null;
    }
    if (!savedRecord) {
      setStatusMessage('');
      setErrorMessage('자기소개서를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setSavedLetters((current) => {
      const exists = current.some((record) => identifiersEqual(record.masterCd, savedRecord.masterCd));
      return exists
        ? current.map((record) => (identifiersEqual(record.masterCd, savedRecord.masterCd) ? savedRecord : record))
        : [savedRecord, ...current];
    });
    setDraft(draftFromRecord(savedRecord));
    setErrorMessage('');
    setStatusMessage('자기소개서가 저장되었습니다.');
    onSaved?.(savedRecord);
  }

  function handleEdit(record) {
    setDraft(draftFromRecord(record));
    setStage('support');
    setValidationErrors({});
    setErrorMessage('');
    setStatusMessage('수정할 문서를 불러왔습니다.');
  }

  function handleDelete(masterCd) {
    let removed;
    try {
      removed = service.remove?.(masterCd);
    } catch {
      removed = false;
    }
    if (!removed) {
      setStatusMessage('');
      setErrorMessage('자기소개서 이력을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setSavedLetters((current) => current.filter((record) => !identifiersEqual(record.masterCd, masterCd)));
    setErrorMessage('');
    setStatusMessage('자기소개서 이력을 삭제했습니다.');
  }

  function handleExport(record, exporter, format) {
    try {
      exporter(record);
      setErrorMessage('');
      setStatusMessage(`${format} 파일 다운로드를 시작했습니다.`);
    } catch {
      setStatusMessage('');
      setErrorMessage(`${format} 파일을 출력하지 못했습니다. 브라우저 다운로드 설정을 확인해 주세요.`);
    }
  }

  return (
    <main className="cover-letter-library-page">
      <header className="cover-letter-library-page__header">
        <p className="cover-letter-library-page__eyebrow">AI COVER LETTER</p>
        <h1>AI 기업·직무 맞춤 자소서 작성</h1>
        <p>기업 질문 입력부터 키워드·합격사례 참고, 작성, 확인, 이력 관리까지 단계별로 진행합니다.</p>
      </header>

      <ol aria-label="자기소개서 작성 단계" className="cover-letter-library-page__steps">
        {STAGES.map((candidate) => (
          <li aria-current={candidate.id === stage ? 'step' : undefined} key={candidate.id}>{candidate.label}</li>
        ))}
      </ol>

      {stage === 'support' && (
        <SupportStage
          draft={draft}
          errors={validationErrors}
          onAdvance={goToQuestions}
          onChange={updateSupport}
          references={references}
        />
      )}
      {stage === 'questions' && (
        <QuestionsStage
          draft={draft}
          errors={validationErrors}
          onAdd={addQuestion}
          onAdvance={goToWriting}
          onBack={() => setStage('support')}
          onDelete={deleteQuestion}
          onUpdate={updateItem}
        />
      )}
      {stage === 'writing' && (
        <WritingStage
          draft={draft}
          errors={validationErrors}
          onAdvance={goToReview}
          onBack={() => setStage('questions')}
          onUpdate={updateItem}
          references={references}
        />
      )}
      {stage === 'review' && (
        <ReviewStage
          draft={draft}
          onBack={() => setStage('writing')}
          onSave={handleSave}
        />
      )}

      <div aria-live="polite" className="cover-letter-library-page__feedback">
        {errorMessage && <p role="alert">{errorMessage}</p>}
        {statusMessage && <p role="status">{statusMessage}</p>}
      </div>

      <section aria-labelledby="saved-cover-letters-title" className="cover-letter-library-page__saved">
        <h2 id="saved-cover-letters-title">자기소개서 보관함</h2>
        <p>지난 작성내용 · 수정/삭제/Word/Excel 출력</p>
        {savedLetters.length === 0 && <p>저장된 작성내용이 없습니다.</p>}
        {savedLetters.map((record) => (
          <article
            aria-label={`${record.applicationCompany || '기업 미입력'} · ${record.applicationRole || '직무 미선택'}`}
            className="cover-letter-library-page__saved-letter"
            key={`${typeof record.masterCd}-${String(record.masterCd)}`}
          >
            <h3>{record.applicationCompany || '기업 미입력'}</h3>
            <p>{record.applicationRole || '직무 미선택'}</p>
            <p>수정일: {record.updatedAt || '날짜 정보 없음'}</p>
            {record.items.map((item, index) => (
              <section key={`${String(item.detailCd)}-${index}`}>
                <h4>{item.title}</h4>
                <p>{item.content}</p>
              </section>
            ))}
            <div className="cover-letter-library-page__history-actions">
              <button className="secondary" onClick={() => handleEdit(record)} type="button">수정</button>
              <button className="danger" onClick={() => handleDelete(record.masterCd)} type="button">삭제</button>
              <button className="secondary" onClick={() => handleExport(record, exportDocument, 'Word')} type="button">Word 다운로드</button>
              <button className="secondary" onClick={() => handleExport(record, exportSpreadsheet, 'Excel')} type="button">Excel 다운로드</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
