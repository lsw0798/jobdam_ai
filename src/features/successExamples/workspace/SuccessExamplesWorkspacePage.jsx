import { useMemo, useState } from 'react';
import {
  createSuccessExamplesWorkspaceService,
  SUCCESS_EXAMPLES_REFERENCE_FIXTURES,
} from './successExamplesWorkspaceService';
import './successExamplesWorkspace.css';

const MAX_GROUPS = 3;
const ITEM_MODES = [
  { code: 'BASIC', label: '기본항목' },
  { code: 'ADVANCED', label: '심화항목' },
];

function customerText(value) {
  return String(value ?? '')
    .replace(/계약\s*검증용\s*/g, '')
    .replace(/계약\s*목업\s*/g, '')
    .replace(/DB\s*/gi, '')
    .trim();
}

function getInitialGroups(savedWorkspace) {
  return Array.isArray(savedWorkspace?.selectGroups)
    ? savedWorkspace.selectGroups.slice(0, MAX_GROUPS)
    : [];
}

function createWritingDetails(example, existingDetails, groupLookupCode) {
  const savedDetails = Array.isArray(existingDetails) ? existingDetails : [];

  return example.details.map((detail) => {
    const savedDetail = savedDetails.find((candidate) => String(candidate.cdSeq) === String(detail.cdSeq));
    return {
      cdSeq: detail.cdSeq,
      contentText: savedDetail?.contentText ?? '',
      star1Text: savedDetail?.star1Text ?? '',
      star2Text: savedDetail?.star2Text ?? '',
      groupLookupCode: savedDetail?.groupLookupCode ?? groupLookupCode,
    };
  });
}

export function SuccessExamplesWorkspacePage({ onSaved, service }) {
  const workspaceService = useMemo(
    () => service ?? createSuccessExamplesWorkspaceService(),
    [service],
  );
  const referenceData = workspaceService.getReferenceData?.()
    ?? SUCCESS_EXAMPLES_REFERENCE_FIXTURES;
  const savedWorkspace = useMemo(() => workspaceService.load?.() ?? null, [workspaceService]);
  const [step, setStep] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState(() => getInitialGroups(savedWorkspace));
  const [selectMode, setSelectMode] = useState(savedWorkspace?.selectMode ?? '');
  const [itemCode, setItemCode] = useState(savedWorkspace?.itemCode ?? '');
  const [masterCd, setMasterCd] = useState(savedWorkspace?.masterCd ?? '');
  const [writingMode, setWritingMode] = useState('');
  const [writingDetails, setWritingDetails] = useState(() => (
    Array.isArray(savedWorkspace?.details) ? savedWorkspace.details : []
  ));
  const [saveError, setSaveError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const selectedItem = referenceData.items.find((item) => item.code === itemCode) ?? null;
  const visibleItems = referenceData.items.filter((item) => item.mode === selectMode);
  const visibleExamples = referenceData.examples.filter((example) => (
    example.itemCode === itemCode
    && example.groupCodes.some((code) => selectedGroups.includes(code))
  ));
  const selectedExample = visibleExamples.find((example) => example.masterCd === masterCd) ?? null;
  const hasStarGuide = selectedExample?.details.some((detail) => detail.contentGuideStar) ?? false;

  function toggleGroup(groupCode) {
    setSelectedGroups((currentGroups) => {
      if (currentGroups.includes(groupCode)) {
        return currentGroups.filter((code) => code !== groupCode);
      }
      if (currentGroups.length >= MAX_GROUPS) return currentGroups;
      return [...currentGroups, groupCode];
    });
  }

  function chooseMode(modeCode) {
    setSelectMode(modeCode);
    setItemCode('');
    setMasterCd('');
    setWritingMode('');
    setWritingDetails([]);
  }

  function chooseExample(example) {
    setMasterCd(example.masterCd);
    setWritingMode(example.details.some((detail) => detail.contentGuideStar) ? 'COMBINE' : '');
    setWritingDetails(createWritingDetails(
      example,
      savedWorkspace?.masterCd === example.masterCd ? savedWorkspace.details : [],
      selectedGroups[0],
    ));
    setSaveError('');
    setSavedMessage('');
  }

  function updateWritingDetail(cdSeq, field, value) {
    setWritingDetails((currentDetails) => currentDetails.map((detail) => (
      String(detail.cdSeq) === String(cdSeq) ? { ...detail, [field]: value } : detail
    )));
  }

  function handleSave() {
    const workspace = {
      selectGroups: selectedGroups,
      selectMode,
      itemCode,
      masterCd,
      details: writingDetails,
    };

    let saved;
    try {
      saved = workspaceService.save(workspace);
    } catch {
      saved = null;
    }

    if (!saved) {
      setSavedMessage('');
      setSaveError('자소서 작성 내용을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setSaveError('');
    setSavedMessage('자소서 작성 내용이 저장되었습니다.');
    onSaved?.(saved);
  }

  return (
    <main className="success-examples-workspace">
      <header className="success-examples-workspace__header">
        <p className="success-examples-workspace__eyebrow">COVER LETTER PRACTICE</p>
        <h1>항목의도·직무별 합격사례 자소서</h1>
        <p>직무와 항목을 선택하고 합격사례를 참고해 자기소개서를 단계별로 작성하세요.</p>
      </header>

      {step === 1 && (
        <section aria-labelledby="success-examples-step-1" className="success-examples-workspace__panel">
          <p className="success-examples-workspace__step-label">1단계</p>
          <h2 id="success-examples-step-1">직무 그룹 선택</h2>
          <p>관심 직무 그룹을 최대 3개 선택하세요.</p>
          <fieldset className="success-examples-workspace__choices">
            <legend className="sr-only">직무 그룹</legend>
            {referenceData.groups.map((group) => {
              const checked = selectedGroups.includes(group.code);
              const disabled = !checked && selectedGroups.length >= MAX_GROUPS;

              return (
                <label className="success-examples-workspace__choice" key={group.code}>
                  <input
                    checked={checked}
                    disabled={disabled}
                    name="selectGroups"
                    onChange={() => toggleGroup(group.code)}
                    type="checkbox"
                    value={group.code}
                  />
                  <span>{customerText(group.name)}</span>
                </label>
              );
            })}
          </fieldset>
          <p aria-live="polite" className="success-examples-workspace__selection-count">
            {selectedGroups.length} / {MAX_GROUPS}개 선택
          </p>
          <button
            className="success-examples-workspace__primary-button"
            disabled={selectedGroups.length === 0}
            onClick={() => setStep(2)}
            type="button"
          >
            다음: 항목 선택
          </button>
        </section>
      )}

      {step === 2 && (
        <section aria-labelledby="success-examples-step-2" className="success-examples-workspace__panel">
          <p className="success-examples-workspace__step-label">2단계</p>
          <h2 id="success-examples-step-2">기본·심화 항목 선택</h2>
          <fieldset className="success-examples-workspace__choices">
            <legend>항목 구분</legend>
            {ITEM_MODES.map((mode) => (
              <label className="success-examples-workspace__choice" key={mode.code}>
                <input
                  aria-label={mode.label}
                  checked={selectMode === mode.code}
                  name="selectMode"
                  onChange={() => chooseMode(mode.code)}
                  type="radio"
                  value={mode.code}
                />
                <span>{mode.label}</span>
              </label>
            ))}
          </fieldset>
          {selectMode && (
            <fieldset className="success-examples-workspace__choices">
              <legend>자기소개서 항목</legend>
              {visibleItems.map((item) => (
                <label className="success-examples-workspace__choice" key={item.code}>
                  <input
                    checked={itemCode === item.code}
                    name="itemCode"
                    onChange={() => {
                      setItemCode(item.code);
                      setMasterCd('');
                      setWritingMode('');
                      setWritingDetails([]);
                    }}
                    type="radio"
                    value={item.code}
                  />
                  <span>{customerText(item.name)}</span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="success-examples-workspace__actions">
            <button onClick={() => setStep(1)} type="button">이전</button>
            <button
              className="success-examples-workspace__primary-button"
              disabled={!selectedItem}
              onClick={() => setStep(3)}
              type="button"
            >
              다음: 항목 안내
            </button>
          </div>
        </section>
      )}

      {step === 3 && selectedItem && (
        <section aria-labelledby="success-examples-step-3" className="success-examples-workspace__panel">
          <p className="success-examples-workspace__step-label">3단계</p>
          <h2 id="success-examples-step-3">항목 안내</h2>
          <p className="success-examples-workspace__readonly-note">
            아래 항목 의도와 작성 방법을 참고하세요.
          </p>
          <dl className="success-examples-workspace__reference-list">
            <div><dt>항목의도</dt><dd>{customerText(selectedItem.intent)}</dd></div>
            <div><dt>작성방법</dt><dd>{customerText(selectedItem.method)}</dd></div>
            <div><dt>필요역량 · 지식(K)</dt><dd>{customerText(selectedItem.competencies.knowledge)}</dd></div>
            <div><dt>필요역량 · 기술(S)</dt><dd>{customerText(selectedItem.competencies.skill)}</dd></div>
            <div><dt>필요역량 · 태도(A)</dt><dd>{customerText(selectedItem.competencies.attitude)}</dd></div>
            <div><dt>필요역량 · 자격증(C)</dt><dd>{customerText(selectedItem.competencies.certificate)}</dd></div>
          </dl>
          <div className="success-examples-workspace__actions">
            <button onClick={() => setStep(2)} type="button">이전</button>
            <button
              className="success-examples-workspace__primary-button"
              onClick={() => setStep(4)}
              type="button"
            >
              다음: 사례 선택
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section aria-labelledby="success-examples-step-4" className="success-examples-workspace__panel">
          <p className="success-examples-workspace__step-label">4단계</p>
          <h2 id="success-examples-step-4">합격사례 선택</h2>
          <fieldset className="success-examples-workspace__choices">
            <legend>합격사례</legend>
            {visibleExamples.map((example) => (
              <label className="success-examples-workspace__choice" key={example.masterCd}>
                <input
                  checked={masterCd === example.masterCd}
                  name="masterCd"
                  onChange={() => chooseExample(example)}
                  type="radio"
                  value={example.masterCd}
                />
                <span>{customerText(example.keyword)}</span>
              </label>
            ))}
          </fieldset>

          {selectedExample && (
            <div className="success-examples-workspace__example-detail">
              {selectedExample.details.map((detail) => (
                <article className="success-examples-workspace__reference-card" key={detail.cdSeq}>
                  <h3>{customerText(detail.contentGuide)}</h3>
                  {detail.contentGuideStar && <p>{customerText(detail.contentGuideStar)}</p>}
                  <div aria-label="사례 본문">{customerText(detail.content)}</div>
                </article>
              ))}

              {hasStarGuide && (
                <fieldset className="success-examples-workspace__choices">
                  <legend>선택 작성 방식</legend>
                  <label className="success-examples-workspace__choice">
                    <input
                      aria-label="사례 합쳐보기"
                      checked={writingMode === 'COMBINE'}
                      name="writingMode"
                      onChange={() => setWritingMode('COMBINE')}
                      type="radio"
                    />
                    <span>사례 합쳐보기</span>
                  </label>
                  <label className="success-examples-workspace__choice">
                    <input
                      aria-label="STAR 방식"
                      checked={writingMode === 'STAR'}
                      name="writingMode"
                      onChange={() => setWritingMode('STAR')}
                      type="radio"
                    />
                    <span>STAR 방식</span>
                  </label>
                </fieldset>
              )}
            </div>
          )}

          <div className="success-examples-workspace__actions">
            <button onClick={() => setStep(3)} type="button">이전</button>
            <button
              className="success-examples-workspace__primary-button"
              disabled={!selectedExample}
              onClick={() => setStep(5)}
              type="button"
            >
              다음: 직접 작성
            </button>
          </div>
        </section>
      )}

      {step === 5 && selectedExample && (
        <section aria-labelledby="success-examples-step-5" className="success-examples-workspace__panel">
          <p className="success-examples-workspace__step-label">5단계</p>
          <h2 id="success-examples-step-5">직접 작성</h2>
          <p>합격사례를 참고해 나만의 내용으로 작성하세요.</p>
          <div className="success-examples-workspace__writing-list">
            {selectedExample.details.map((referenceDetail) => {
              const writingDetail = writingDetails.find(
                (detail) => String(detail.cdSeq) === String(referenceDetail.cdSeq),
              );
              const field = hasStarGuide
                ? (writingMode === 'STAR' ? 'star2Text' : 'star1Text')
                : 'contentText';
              const labelPrefix = hasStarGuide
                ? (writingMode === 'STAR' ? 'STAR 방식 작성' : '사례 합쳐보기 작성')
                : '사용자 작성';

              return (
                <article className="success-examples-workspace__writing-card" key={referenceDetail.cdSeq}>
                  <h3>{customerText(referenceDetail.contentGuide)}</h3>
                  <p className="success-examples-workspace__readonly-example">{customerText(referenceDetail.content)}</p>
                  <label htmlFor={`success-writing-${referenceDetail.cdSeq}`}>
                    {labelPrefix} — {customerText(referenceDetail.contentGuide)}
                  </label>
                  <textarea
                    id={`success-writing-${referenceDetail.cdSeq}`}
                    name={`${field}_${masterCd}_${referenceDetail.cdSeq}`}
                    onChange={(event) => updateWritingDetail(
                      referenceDetail.cdSeq,
                      field,
                      event.target.value,
                    )}
                    value={writingDetail?.[field] ?? ''}
                  />

                </article>
              );
            })}
          </div>
          <div aria-live="polite" className="success-examples-workspace__feedback">
            {saveError && <p role="alert">{saveError}</p>}
            {savedMessage && <p role="status">{savedMessage}</p>}
          </div>
          <div className="success-examples-workspace__actions">
            <button onClick={() => setStep(4)} type="button">이전</button>
            <button
              className="success-examples-workspace__primary-button"
              onClick={handleSave}
              type="button"
            >
              작성 내용 저장
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
