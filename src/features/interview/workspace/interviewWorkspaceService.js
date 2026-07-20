import {
  readStorageValue,
  resolveBrowserStorage,
  writeStorageValue,
} from '../../../lib/browserStorage';

export const INTERVIEW_WORKSPACE_STORAGE_KEY = 'jobdam-ai:interview-workspace:v2';

const BIO_FIELDS = [
  'applicationType',
  'major',
  'supportCompany',
  'gender',
  'question1',
  'question2',
  'question3',
  'question4',
  'question5',
  'question6',
  'question7',
];

function text(value) {
  return typeof value === 'string' ? value : '';
}

export const INTERVIEW_REFERENCE_FIXTURES = Object.freeze({
  sourceKind: 'mock-contract',
  notice: 'DB 미연결 계약 목업입니다. 실제 직무·질문·사례 데이터가 아니며 fixture-* 식별자로 연결 구조만 검증합니다.',
  functions: Object.freeze([
    Object.freeze({ cdFunction: 'fixture-function-a', name: '계약 목업 직무 A' }),
    Object.freeze({ cdFunction: 'fixture-function-b', name: '계약 목업 직무 B' }),
  ]),
  questions: Object.freeze([
    Object.freeze({
      cdQuestion: 'fixture-question-1',
      cdFunction: 'fixture-function-a',
      subject: '계약 검증 질문 1',
      ranking: 'important',
      importance: 5,
      frequency: 4,
      intent: '계약 목업 질문의도',
      direction: '계약 목업 답변방향',
      similarQuestions: Object.freeze(['계약 목업 유사질문']),
      bestExamples: Object.freeze(['계약 검증용 Best 답변 사례']),
    }),
    Object.freeze({
      cdQuestion: 'fixture-question-2',
      cdFunction: 'fixture-function-a',
      subject: '계약 검증 질문 2',
      ranking: 'frequency',
      importance: 3,
      frequency: 5,
      intent: '두 번째 계약 목업 질문의도',
      direction: '두 번째 계약 목업 답변방향',
      similarQuestions: Object.freeze([]),
      bestExamples: Object.freeze([]),
    }),
    Object.freeze({
      cdQuestion: 'fixture-question-3',
      cdFunction: 'fixture-function-b',
      subject: '계약 검증 질문 3',
      ranking: 'important',
      importance: 4,
      frequency: 2,
      intent: '세 번째 계약 목업 질문의도',
      direction: '세 번째 계약 목업 답변방향',
      similarQuestions: Object.freeze([]),
      bestExamples: Object.freeze([]),
    }),
  ]),
});

export function getInterviewWorkspaceStorageKey(userId) {
  return userId
    ? `${INTERVIEW_WORKSPACE_STORAGE_KEY}:${encodeURIComponent(String(userId))}`
    : INTERVIEW_WORKSPACE_STORAGE_KEY;
}

function normalizeBio(bio = {}) {
  return Object.fromEntries(BIO_FIELDS.map((field) => [field, text(bio[field])]));
}

function normalizeAdditionalQuestion(question = {}, index = 0) {
  return {
    cdFlag: text(question.cdFlag) || `fixture-add-${index + 1}`,
    question: text(question.question),
    contents: text(question.contents),
  };
}

function normalizeAnswer(answer = {}) {
  const additionalQuestions = Array.isArray(answer.additionalQuestions)
    ? answer.additionalQuestions.slice(0, 3).map(normalizeAdditionalQuestion)
    : [];

  return {
    cdQuestion: text(answer.cdQuestion),
    cdFunction: text(answer.cdFunction),
    contents: text(answer.contents),
    followContents: text(answer.followContents),
    myUnderline: text(answer.myUnderline),
    additionalQuestions,
  };
}

function normalizeWorkspace(workspace = {}) {
  const questionIds = Array.isArray(workspace.questionIds)
    ? workspace.questionIds.slice(0, 50).map(String)
    : [];
  const answers = Array.isArray(workspace.answers)
    ? workspace.answers.map(normalizeAnswer).filter(({ cdQuestion }) => questionIds.includes(cdQuestion))
    : [];

  return {
    bio: normalizeBio(workspace.bio),
    functionCode: text(workspace.functionCode),
    rankingMode: workspace.rankingMode === 'frequency' ? 'frequency' : 'important',
    questionIds,
    answers,
  };
}

function validateWorkspace(workspace = {}) {
  if (Array.isArray(workspace.questionIds) && workspace.questionIds.length > 50) {
    throw new Error('면접 질문은 최대 50개까지 선택할 수 있습니다.');
  }

  const functionCode = text(workspace.functionCode);
  const questionIds = new Set(Array.isArray(workspace.questionIds) ? workspace.questionIds.map(String) : []);
  for (const answer of Array.isArray(workspace.answers) ? workspace.answers : []) {
    if (Array.isArray(answer.additionalQuestions) && answer.additionalQuestions.length > 3) {
      throw new Error('추가 질문은 질문별 최대 3개까지 작성할 수 있습니다.');
    }
    if (!questionIds.has(String(answer.cdQuestion)) || text(answer.cdFunction) !== functionCode) {
      throw new Error('선택한 질문과 직무 식별자에 연결된 답변만 저장할 수 있습니다.');
    }
  }
}

export function createInterviewWorkspaceService(storage = resolveBrowserStorage(), userId) {
  const storageKey = getInterviewWorkspaceStorageKey(userId);

  return {
    getReferenceData() {
      return INTERVIEW_REFERENCE_FIXTURES;
    },
    load() {
      try {
        const serializedWorkspace = readStorageValue(storage, storageKey);
        return serializedWorkspace ? normalizeWorkspace(JSON.parse(serializedWorkspace)) : null;
      } catch {
        return null;
      }
    },
    save(workspace) {
      validateWorkspace(workspace);
      const savedWorkspace = normalizeWorkspace(workspace);
      writeStorageValue(storage, storageKey, JSON.stringify(savedWorkspace));
      return savedWorkspace;
    },
  };
}