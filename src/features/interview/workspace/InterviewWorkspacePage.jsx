import { useMemo, useState } from 'react';
import {
  createInterviewWorkspaceService,
  INTERVIEW_REFERENCE_FIXTURES,
} from './interviewWorkspaceService';
import './interviewWorkspace.css';

const STEPS = ['기본정보', '기업·직무', '질문 선택', '답변 작성', '키워드', '연습·다운로드'];
const BIO_QUESTIONS = [
  ['question1', '지원하는 직무는 전공과 일치하는 편입니까?'],
  ['question2', '대학 재학 중 공백기간이 6개월 이상입니까?'],
  ['question3', '졸업 후 미취업 기간이 1년 이상입니까?'],
  ['question4', '편입학 경험이 있습니까?'],
  ['question5', '학과 변경·전과 경험이 있습니까?'],
  ['question7', '전 직장 퇴사 경험이 있습니까?'],
];

function customerText(value) {
  return String(value ?? '')
    .replace(/계약\s*검증용\s*/g, '')
    .replace(/계약\s*검증\s*/g, '')
    .replace(/계약\s*목업\s*/g, '')
    .replace(/DB\s*/gi, '')
    .trim();
}

function createInitialWorkspace(savedWorkspace) {
  return {
    bio: {
      applicationType: '',
      major: '',
      supportCompany: '',
      gender: '',
      question1: '',
      question2: '',
      question3: '',
      question4: '',
      question5: '',
      question6: '',
      question7: '',
      ...savedWorkspace?.bio,
    },
    functionCode: savedWorkspace?.functionCode ?? '',
    rankingMode: savedWorkspace?.rankingMode ?? 'important',
    questionIds: Array.isArray(savedWorkspace?.questionIds) ? savedWorkspace.questionIds : [],
    answers: Array.isArray(savedWorkspace?.answers) ? savedWorkspace.answers : [],
  };
}

function createAnswer(question, functionCode, savedAnswer) {
  return {
    cdQuestion: question.cdQuestion,
    cdFunction: functionCode,
    contents: savedAnswer?.contents ?? '',
    followContents: savedAnswer?.followContents ?? '',
    myUnderline: savedAnswer?.myUnderline ?? '',
    additionalQuestions: Array.isArray(savedAnswer?.additionalQuestions)
      ? savedAnswer.additionalQuestions.slice(0, 3)
      : [],
  };
}

function downloadWorkspace(workspace, format) {
  const mimeType = format === 'word' ? 'application/msword' : 'application/vnd.ms-excel';
  const extension = format === 'word' ? 'doc' : 'xls';
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = url;
    link.download = `jobdam-interview-note.${extension}`;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function InterviewWorkspacePage({ onSaved, service }) {
  const workspaceService = useMemo(
    () => service ?? createInterviewWorkspaceService(),
    [service],
  );
  const referenceData = workspaceService.getReferenceData?.() ?? INTERVIEW_REFERENCE_FIXTURES;
  const [workspace, setWorkspace] = useState(() => createInitialWorkspace(workspaceService.load?.()));
  const [step, setStep] = useState(1);
  const [saveError, setSaveError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const selectedFunction = referenceData.functions.find(
    ({ cdFunction }) => cdFunction === workspace.functionCode,
  );
  const availableQuestions = referenceData.questions.filter(
    (question) => question.cdFunction === workspace.functionCode,
  );
  const visibleQuestions = [...availableQuestions].sort((first, second) => (
    workspace.rankingMode === 'frequency'
      ? second.frequency - first.frequency
      : second.importance - first.importance
  ));
  const selectedQuestions = workspace.questionIds
    .map((cdQuestion) => referenceData.questions.find((question) => question.cdQuestion === cdQuestion))
    .filter(Boolean);

  function updateBio(field, value) {
    setWorkspace((current) => ({ ...current, bio: { ...current.bio, [field]: value } }));
  }

  function selectFunction(functionCode) {
    setWorkspace((current) => ({
      ...current,
      functionCode,
      questionIds: [],
      answers: [],
    }));
  }

  function toggleQuestion(question) {
    setWorkspace((current) => {
      const selected = current.questionIds.includes(question.cdQuestion);
      if (!selected && current.questionIds.length >= 50) return current;

      if (selected) {
        return {
          ...current,
          questionIds: current.questionIds.filter((id) => id !== question.cdQuestion),
          answers: current.answers.filter(({ cdQuestion }) => cdQuestion !== question.cdQuestion),
        };
      }

      const savedAnswer = current.answers.find(({ cdQuestion }) => cdQuestion === question.cdQuestion);
      return {
        ...current,
        questionIds: [...current.questionIds, question.cdQuestion],
        answers: [...current.answers, createAnswer(question, current.functionCode, savedAnswer)],
      };
    });
  }

  function updateAnswer(cdQuestion, field, value) {
    setWorkspace((current) => ({
      ...current,
      answers: current.answers.map((answer) => (
        answer.cdQuestion === cdQuestion ? { ...answer, [field]: value } : answer
      )),
    }));
  }

  function addQuestion(cdQuestion) {
    setWorkspace((current) => ({
      ...current,
      answers: current.answers.map((answer) => {
        if (answer.cdQuestion !== cdQuestion || answer.additionalQuestions.length >= 3) return answer;
        const index = answer.additionalQuestions.length;
        return {
          ...answer,
          additionalQuestions: [...answer.additionalQuestions, {
            cdFlag: `fixture-add-${index + 1}`,
            question: '',
            contents: '',
          }],
        };
      }),
    }));
  }

  function updateAdditionalQuestion(cdQuestion, index, field, value) {
    setWorkspace((current) => ({
      ...current,
      answers: current.answers.map((answer) => (
        answer.cdQuestion === cdQuestion
          ? {
            ...answer,
            additionalQuestions: answer.additionalQuestions.map((question, questionIndex) => (
              questionIndex === index ? { ...question, [field]: value } : question
            )),
          }
          : answer
      )),
    }));
  }

  function saveWorkspace() {
    try {
      const savedWorkspace = workspaceService.save(workspace);
      setSaveError('');
      setSavedMessage('면접노트가 저장되었습니다.');
      onSaved?.(savedWorkspace);
    } catch {
      setSavedMessage('');
      setSaveError('면접노트를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  return (
    <main className="interview-workspace">
      <header className="interview-workspace__header">
        <p className="interview-workspace__eyebrow">INTERVIEW PRACTICE</p>
        <h1>직무별 합격사례 면접답변 작성</h1>
        <p>직무별 질문과 합격사례를 참고해 나만의 답변과 핵심 키워드를 단계별로 작성하세요.</p>
      </header>

      <nav aria-label="면접답변 작성 단계" className="interview-workspace__steps">
        <ol>
          {STEPS.map((label, index) => (
            <li aria-current={step === index + 1 ? 'step' : undefined} key={label}>
              <span>{index + 1}</span>{label}
            </li>
          ))}
        </ol>
      </nav>

      {step === 1 && (
        <section className="interview-workspace__panel">
          <h2>기본정보</h2>
          <div className="interview-workspace__table-wrapper">
            <table className="interview-workspace__table">
              <caption>기본정보 및 BIO 질문</caption>
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col">입력 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">지원 구분</th>
                  <td>
                    <fieldset className="interview-workspace__table-options">
                      <legend className="interview-workspace__visually-hidden">지원 구분</legend>
                      <label><input checked={workspace.bio.applicationType === 'new'} name="applicationType" onChange={() => updateBio('applicationType', 'new')} type="radio" />신입(인턴)</label>
                      <label><input checked={workspace.bio.applicationType === 'experienced'} name="applicationType" onChange={() => updateBio('applicationType', 'experienced')} type="radio" />경력</label>
                    </fieldset>
                  </td>
                </tr>
                <tr>
                  <th scope="row"><label htmlFor="interview-major">전공</label></th>
                  <td><input id="interview-major" onChange={(event) => updateBio('major', event.target.value)} value={workspace.bio.major} /></td>
                </tr>
                <tr>
                  <th scope="row"><label htmlFor="interview-company">지원기업</label></th>
                  <td><input id="interview-company" onChange={(event) => updateBio('supportCompany', event.target.value)} value={workspace.bio.supportCompany} /></td>
                </tr>
                <tr>
                  <th scope="row">성별</th>
                  <td>
                    <fieldset className="interview-workspace__table-options">
                      <legend className="interview-workspace__visually-hidden">성별</legend>
                      <label><input checked={workspace.bio.gender === 'male'} name="gender" onChange={() => updateBio('gender', 'male')} type="radio" />남성</label>
                      <label><input checked={workspace.bio.gender === 'female'} name="gender" onChange={() => updateBio('gender', 'female')} type="radio" />여성</label>
                    </fieldset>
                  </td>
                </tr>
                {BIO_QUESTIONS.map(([field, label]) => (
                  <tr key={field}>
                    <th scope="row">{label}</th>
                    <td>
                      <fieldset className="interview-workspace__table-options">
                        <legend className="interview-workspace__visually-hidden">{label}</legend>
                        <label><input checked={workspace.bio[field] === 'yes'} name={field} onChange={() => updateBio(field, 'yes')} type="radio" />예</label>
                        <label><input checked={workspace.bio[field] === 'no'} name={field} onChange={() => updateBio(field, 'no')} type="radio" />아니오</label>
                      </fieldset>
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">총 평균학점</th>
                  <td>
                    <fieldset className="interview-workspace__table-options">
                      <legend className="interview-workspace__visually-hidden">총 평균학점</legend>
                      <label><input checked={workspace.bio.question6 === 'more'} name="question6" onChange={() => updateBio('question6', 'more')} type="radio" />3.2 이상</label>
                      <label><input checked={workspace.bio.question6 === 'less'} name="question6" onChange={() => updateBio('question6', 'less')} type="radio" />3.2 미만</label>
                    </fieldset>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button disabled={!workspace.bio.applicationType} onClick={() => setStep(2)} type="button">다음: 기업·직무 선택</button>
        </section>
      )}

      {step === 2 && (
        <section className="interview-workspace__panel">
          <h2>기업·직무 선택</h2>
          <p>지원기업: {workspace.bio.supportCompany || '입력하지 않음'}</p>
          <fieldset>
            <legend>지원직무</legend>
            {referenceData.functions.map((item) => (
              <label key={item.cdFunction}>
                <input
                  checked={workspace.functionCode === item.cdFunction}
                  name="functionCode"
                  onChange={() => selectFunction(item.cdFunction)}
                  type="radio"
                />
                {customerText(item.name)}
              </label>
            ))}
          </fieldset>
          <div className="interview-workspace__actions">
            <button onClick={() => setStep(1)} type="button">이전</button>
            <button disabled={!selectedFunction} onClick={() => setStep(3)} type="button">다음: 질문 선택</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="interview-workspace__panel">
          <h2>질문 선택</h2>
          <p>중요도와 최근 기출빈도를 기준으로 최대 50개의 질문을 선택하세요.</p>
          <div aria-label="질문 정렬 기준" className="interview-workspace__tabs" role="tablist">
            <button aria-selected={workspace.rankingMode === 'important'} onClick={() => setWorkspace((current) => ({ ...current, rankingMode: 'important' }))} role="tab" type="button">중요 질문</button>
            <button aria-selected={workspace.rankingMode === 'frequency'} onClick={() => setWorkspace((current) => ({ ...current, rankingMode: 'frequency' }))} role="tab" type="button">최빈도 질문</button>
          </div>
          <p>{workspace.questionIds.length} / 50개 선택</p>
          <div className="interview-workspace__question-list">
            {visibleQuestions.map((question) => (
              <article key={question.cdQuestion}>
                <label>
                  <input
                    checked={workspace.questionIds.includes(question.cdQuestion)}
                    disabled={!workspace.questionIds.includes(question.cdQuestion) && workspace.questionIds.length >= 50}
                    onChange={() => toggleQuestion(question)}
                    type="checkbox"
                  />
                  {customerText(question.subject)}
                </label>
                <p>중요도 {question.importance} · 최근 기출빈도 {question.frequency}</p>

              </article>
            ))}
          </div>
          <div className="interview-workspace__actions">
            <button onClick={() => setStep(2)} type="button">이전</button>
            <button disabled={workspace.questionIds.length === 0} onClick={() => setStep(4)} type="button">다음: 답변 작성</button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="interview-workspace__panel">
          <h2>답변 작성</h2>
          <div className="interview-workspace__table-wrapper">
            <table className="interview-workspace__table interview-workspace__table--answers">
              <caption>면접 답변 작성</caption>
              <thead>
                <tr>
                  <th scope="col">면접 질문</th>
                  <th scope="col">질문 의도</th>
                  <th scope="col">답변 방향</th>
                  <th scope="col">유사질문</th>
                  <th scope="col">Best 답변 사례</th>
                  <th scope="col">나의 답변</th>
                  <th scope="col">후속 질문 답변</th>
                  <th scope="col">추가 질문</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuestions.map((question) => {
                  const answer = workspace.answers.find(({ cdQuestion }) => cdQuestion === question.cdQuestion);
                  const subject = customerText(question.subject);
                  return (
                    <tr key={question.cdQuestion}>
                      <th scope="row">{subject}</th>
                      <td>{customerText(question.intent)}</td>
                      <td>{customerText(question.direction)}</td>
                      <td>{question.similarQuestions.map(customerText).join(', ') || '없음'}</td>
                      <td>{question.bestExamples.map(customerText).join(', ') || '등록된 사례가 없습니다.'}</td>
                      <td>
                        <label className="interview-workspace__visually-hidden" htmlFor={`interview-answer-${question.cdQuestion}`}>
                          나의 답변 — {subject}
                        </label>
                        <textarea
                          id={`interview-answer-${question.cdQuestion}`}
                          onChange={(event) => updateAnswer(question.cdQuestion, 'contents', event.target.value)}
                          value={answer?.contents ?? ''}
                        />
                      </td>
                      <td>
                        <label className="interview-workspace__visually-hidden" htmlFor={`interview-follow-${question.cdQuestion}`}>
                          후속 질문 답변 — {subject}
                        </label>
                        <textarea
                          id={`interview-follow-${question.cdQuestion}`}
                          onChange={(event) => updateAnswer(question.cdQuestion, 'followContents', event.target.value)}
                          value={answer?.followContents ?? ''}
                        />
                      </td>
                      <td className="interview-workspace__additional-cell">
                        {answer?.additionalQuestions.map((additionalQuestion, index) => (
                          <div className="interview-workspace__additional" key={additionalQuestion.cdFlag}>
                            <label htmlFor={`interview-extra-question-${question.cdQuestion}-${index}`}>추가 질문 {index + 1}</label>
                            <input
                              id={`interview-extra-question-${question.cdQuestion}-${index}`}
                              onChange={(event) => updateAdditionalQuestion(question.cdQuestion, index, 'question', event.target.value)}
                              value={additionalQuestion.question}
                            />
                            <label htmlFor={`interview-extra-answer-${question.cdQuestion}-${index}`}>추가 질문 답변 {index + 1}</label>
                            <textarea
                              id={`interview-extra-answer-${question.cdQuestion}-${index}`}
                              onChange={(event) => updateAdditionalQuestion(question.cdQuestion, index, 'contents', event.target.value)}
                              value={additionalQuestion.contents}
                            />
                          </div>
                        ))}
                        <button disabled={(answer?.additionalQuestions.length ?? 0) >= 3} onClick={() => addQuestion(question.cdQuestion)} type="button">추가 질문 추가</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="interview-workspace__actions">
            <button onClick={() => setStep(3)} type="button">이전</button>
            <button onClick={() => setStep(5)} type="button">다음: 키워드 작성</button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="interview-workspace__panel">
          <h2>키워드 작성</h2>
          <div className="interview-workspace__table-wrapper">
            <table className="interview-workspace__table interview-workspace__table--keywords">
              <caption>면접 키워드 작성</caption>
              <thead>
                <tr>
                  <th scope="col">면접 질문</th>
                  <th scope="col">키워드</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuestions.map((question) => {
                  const answer = workspace.answers.find(({ cdQuestion }) => cdQuestion === question.cdQuestion);
                  const subject = customerText(question.subject);
                  return (
                    <tr key={question.cdQuestion}>
                      <th scope="row">{subject}</th>
                      <td>
                        <label className="interview-workspace__visually-hidden" htmlFor={`interview-keywords-${question.cdQuestion}`}>
                          키워드 — {subject}
                        </label>
                        <textarea
                          id={`interview-keywords-${question.cdQuestion}`}
                          onChange={(event) => updateAnswer(question.cdQuestion, 'myUnderline', event.target.value)}
                          value={answer?.myUnderline ?? ''}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="interview-workspace__actions">
            <button onClick={() => setStep(4)} type="button">이전</button>
            <button onClick={() => setStep(6)} type="button">다음: 연습·다운로드</button>
          </div>
        </section>
      )}

      {step === 6 && (
        <section className="interview-workspace__panel">
          <h2>연습·다운로드</h2>
          <p>{customerText(selectedFunction?.name)} · 선택 질문 {workspace.questionIds.length}개</p>
          <div aria-live="polite">
            {saveError && <p role="alert">{saveError}</p>}
            {savedMessage && <p role="status">{savedMessage}</p>}
          </div>
          <div className="interview-workspace__actions">
            <button onClick={() => setStep(5)} type="button">이전</button>
            <button onClick={saveWorkspace} type="button">면접노트 저장</button>
            <button onClick={() => downloadWorkspace(workspace, 'word')} type="button">Word 다운로드</button>
            <button onClick={() => downloadWorkspace(workspace, 'excel')} type="button">Excel 다운로드</button>
          </div>
        </section>
      )}
    </main>
  );
}