import {
  readStorageValue,
  resolveBrowserStorage,
  writeStorageValue,
} from '../../../lib/browserStorage';

export const SUCCESS_EXAMPLES_WORKSPACE_STORAGE_KEY = 'jobdam-ai:success-examples-workspace:v2';

export const SUCCESS_EXAMPLES_REFERENCE_FIXTURES = Object.freeze({
  source: 'contract-fixture',
  notice: 'DB 미연결 계약 목업 — 실제 DB 기준정보나 합격사례가 아닙니다.',
  groups: Object.freeze([
    Object.freeze({ code: 'fixture-group-1', name: '계약 목업 직무 A' }),
    Object.freeze({ code: 'fixture-group-2', name: '계약 목업 직무 B' }),
    Object.freeze({ code: 'fixture-group-3', name: '계약 목업 직무 C' }),
    Object.freeze({ code: 'fixture-group-4', name: '계약 목업 직무 D' }),
  ]),
  items: Object.freeze([
    Object.freeze({
      code: 'fixture-item-basic-1',
      mode: 'BASIC',
      name: '계약 목업 기본항목 A',
      intent: '계약 목업 항목의도 A',
      method: '계약 목업 작성방법 A',
      competencies: Object.freeze({
        knowledge: '계약 목업 지식 A',
        skill: '계약 목업 기술 A',
        attitude: '계약 목업 태도 A',
        certificate: '계약 목업 자격증 A',
      }),
    }),
    Object.freeze({
      code: 'fixture-item-advanced-1',
      mode: 'ADVANCED',
      name: '계약 목업 심화항목 A',
      intent: '계약 목업 심화 항목의도 A',
      method: '계약 목업 심화 작성방법 A',
      competencies: Object.freeze({
        knowledge: '계약 목업 심화 지식 A',
        skill: '계약 목업 심화 기술 A',
        attitude: '계약 목업 심화 태도 A',
        certificate: '계약 목업 심화 자격증 A',
      }),
    }),
  ]),
  examples: Object.freeze([
    Object.freeze({
      masterCd: 'fixture-master-basic-1',
      itemCode: 'fixture-item-basic-1',
      keyword: '계약 목업 사례 키워드 A',
      groupCodes: Object.freeze(['fixture-group-1', 'fixture-group-2']),
      details: Object.freeze([
        Object.freeze({
          cdSeq: 'fixture-detail-basic-1',
          contentGuide: '계약 목업 작성 단계 안내 A1',
          content: '계약 목업 사례 본문 A1',
          contentGuideStar: '',
        }),
        Object.freeze({
          cdSeq: 'fixture-detail-basic-2',
          contentGuide: '계약 목업 작성 단계 안내 A2',
          content: '계약 목업 사례 본문 A2',
          contentGuideStar: '',
        }),
      ]),
    }),
    Object.freeze({
      masterCd: 'fixture-master-star-1',
      itemCode: 'fixture-item-basic-1',
      keyword: '계약 목업 STAR 사례 키워드 B',
      groupCodes: Object.freeze(['fixture-group-1']),
      details: Object.freeze([
        Object.freeze({
          cdSeq: 'fixture-detail-star-1',
          contentGuide: '계약 목업 작성 단계 안내 B1',
          content: '계약 목업 사례 본문 B1',
          contentGuideStar: '계약 목업 STAR 작성 안내 B1',
        }),
        Object.freeze({
          cdSeq: 'fixture-detail-star-2',
          contentGuide: '계약 목업 작성 단계 안내 B2',
          content: '계약 목업 사례 본문 B2',
          contentGuideStar: '계약 목업 STAR 작성 안내 B2',
        }),
      ]),
    }),
  ]),
});

export function getSuccessExamplesWorkspaceStorageKey(userId) {
  return userId
    ? `${SUCCESS_EXAMPLES_WORKSPACE_STORAGE_KEY}:${encodeURIComponent(String(userId))}`
    : SUCCESS_EXAMPLES_WORKSPACE_STORAGE_KEY;
}

function toText(value) {
  return typeof value === 'string' ? value : '';
}

function toLegacyId(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  return '';
}

function normalizeDetail(detail = {}) {
  return {
    cdSeq: toLegacyId(detail.cdSeq),
    contentText: toText(detail.contentText),
    star1Text: toText(detail.star1Text),
    star2Text: toText(detail.star2Text),
    groupLookupCode: toLegacyId(detail.groupLookupCode),
  };
}

function normalizeWorkspace(workspace = {}) {
  return {
    selectGroups: Array.isArray(workspace.selectGroups)
      ? workspace.selectGroups.map(toLegacyId).filter((value) => value !== '').slice(0, 3)
      : [],
    selectMode: toText(workspace.selectMode),
    itemCode: toLegacyId(workspace.itemCode),
    masterCd: toLegacyId(workspace.masterCd),
    details: Array.isArray(workspace.details) ? workspace.details.map(normalizeDetail) : [],
  };
}

export function createSuccessExamplesWorkspaceService(
  storage = resolveBrowserStorage(),
  userId,
  referenceData = SUCCESS_EXAMPLES_REFERENCE_FIXTURES,
) {
  const storageKey = getSuccessExamplesWorkspaceStorageKey(userId);
  const historyStorageKey = `${storageKey}:history`;

  function listHistory() {
    const serializedHistory = readStorageValue(storage, historyStorageKey);
    if (!serializedHistory) return [];

    try {
      const parsedHistory = JSON.parse(serializedHistory);
      return Array.isArray(parsedHistory) ? parsedHistory.map(normalizeWorkspace) : [];
    } catch {
      return [];
    }
  }

  return {
    getReferenceData() {
      return referenceData;
    },
    listHistory,
    load() {
      const serializedWorkspace = readStorageValue(storage, storageKey);
      if (!serializedWorkspace) return null;

      try {
        return normalizeWorkspace(JSON.parse(serializedWorkspace));
      } catch {
        return null;
      }
    },
    save(workspace) {
      const savedWorkspace = normalizeWorkspace(workspace);
      const history = listHistory();
      const matchingIndex = history.findIndex(
        (record) => String(record.masterCd) === String(savedWorkspace.masterCd),
      );

      if (matchingIndex >= 0) {
        history[matchingIndex] = savedWorkspace;
      } else {
        history.push(savedWorkspace);
      }

      writeStorageValue(storage, storageKey, JSON.stringify(savedWorkspace));
      writeStorageValue(storage, historyStorageKey, JSON.stringify(history));
      return savedWorkspace;
    },
  };
}
