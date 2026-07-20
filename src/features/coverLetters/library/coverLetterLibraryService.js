import {
  readStorageValue,
  resolveBrowserStorage,
  writeStorageValue,
} from '../../../lib/browserStorage';

export const COVER_LETTER_LIBRARY_STORAGE_KEY = 'jobdam-ai:cover-letter-library:v2';
export const COVER_LETTER_MAX_ITEMS = 6;

export const COVER_LETTER_FIXTURE_REFERENCES = Object.freeze({
  source: 'fixture',
  banner: 'DB 미연결 계약 목업 · 아래 기준정보는 실제 레거시 DB 행이 아닙니다.',
  duties: Object.freeze([
    Object.freeze({
      masterCd: 'fixture-duty-master-1',
      detailCd: 'fixture-duty-detail-1',
      dutyCode: 'fixture-duty-frontend',
      name: '프론트엔드 개발자',
    }),
    Object.freeze({
      masterCd: 'fixture-duty-master-2',
      detailCd: 'fixture-duty-detail-2',
      dutyCode: 'fixture-duty-data',
      name: '데이터 분석가',
    }),
  ]),
  keywords: Object.freeze([
    Object.freeze({ keywordCode: 'fixture-keyword-problem', name: '문제 해결' }),
    Object.freeze({ keywordCode: 'fixture-keyword-collaboration', name: '협업' }),
  ]),
  examples: Object.freeze([
    Object.freeze({
      exampleCd: 'fixture-example-1',
      keywordCode: 'fixture-keyword-problem',
      questionOri: '문제를 정의하고 해결한 경험을 설명해 주세요.',
      headline: '사용자 관찰에서 문제 해결을 시작했습니다.',
      conclusion: '측정 가능한 개선으로 문제 해결 역량을 증명했습니다.',
      content: '계약 UI 검증을 위한 fixture 사례 본문입니다.',
      endline: '같은 방식으로 지원 기업의 고객 문제를 해결하겠습니다.',
    }),
    Object.freeze({
      exampleCd: 'fixture-example-2',
      keywordCode: 'fixture-keyword-collaboration',
      questionOri: '협업으로 성과를 낸 경험을 설명해 주세요.',
      headline: '서로 다른 관점을 하나의 목표로 연결했습니다.',
      conclusion: '역할과 근거를 투명하게 공유해 일정을 지켰습니다.',
      content: '계약 UI 검증을 위한 협업 fixture 사례입니다.',
      endline: '입사 후에도 투명한 소통으로 팀 성과를 높이겠습니다.',
    }),
  ]),
});

const SENTENCE_TYPES = new Set(['headline', 'conclusion', 'content', 'endline']);
let masterIdSequence = 0;

function toText(value) {
  return typeof value === 'string' ? value : '';
}

function toIdentifier(value) {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return '';
}

function cloneReferences(references) {
  return {
    source: toText(references?.source) || 'fixture',
    banner: toText(references?.banner) || 'DB 미연결 계약 목업',
    duties: Array.isArray(references?.duties)
      ? references.duties.map((duty) => ({
        masterCd: toIdentifier(duty?.masterCd),
        detailCd: toIdentifier(duty?.detailCd),
        dutyCode: toIdentifier(duty?.dutyCode),
        name: toText(duty?.name),
      }))
      : [],
    keywords: Array.isArray(references?.keywords)
      ? references.keywords.map((keyword) => ({
        keywordCode: toIdentifier(keyword?.keywordCode),
        name: toText(keyword?.name),
      }))
      : [],
    examples: Array.isArray(references?.examples)
      ? references.examples.map((example) => ({
        exampleCd: toIdentifier(example?.exampleCd),
        keywordCode: toIdentifier(example?.keywordCode),
        questionOri: toText(example?.questionOri),
        headline: toText(example?.headline),
        conclusion: toText(example?.conclusion),
        content: toText(example?.content),
        endline: toText(example?.endline),
      }))
      : [],
  };
}

export function createCoverLetterMasterCd() {
  const uuid = globalThis.crypto?.randomUUID?.();
  masterIdSequence += 1;
  return `fixture-master-${uuid || masterIdSequence}`;
}

export function createCoverLetterItem(detailCd = 1) {
  return {
    detailCd,
    title: '',
    content: '',
    keywordCode: '',
    exampleCd: '',
    sentenceType: 'content',
  };
}

export function createCoverLetterDraft() {
  return {
    masterCd: createCoverLetterMasterCd(),
    applicationCompany: '',
    applicationRole: '',
    dutyCode: '',
    consent: false,
    items: [createCoverLetterItem(1)],
  };
}

function normalizeItem(item, index) {
  const value = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
  return {
    detailCd: toIdentifier(value.detailCd) || index + 1,
    title: toText(value.title),
    content: toText(value.content),
    keywordCode: toIdentifier(value.keywordCode),
    exampleCd: toIdentifier(value.exampleCd),
    sentenceType: SENTENCE_TYPES.has(value.sentenceType) ? value.sentenceType : 'content',
  };
}

export function normalizeCoverLetterRecord(record, { generateMasterCd = false } = {}) {
  const value = record && typeof record === 'object' && !Array.isArray(record) ? record : {};
  const masterCd = toIdentifier(value.masterCd) || (generateMasterCd ? createCoverLetterMasterCd() : '');
  if (masterCd === '') {
    return null;
  }

  const normalized = {
    masterCd,
    applicationCompany: toText(value.applicationCompany),
    applicationRole: toText(value.applicationRole),
    dutyCode: toIdentifier(value.dutyCode),
    consent: value.consent === true,
    items: Array.isArray(value.items)
      ? value.items.slice(0, COVER_LETTER_MAX_ITEMS).map(normalizeItem)
      : [],
  };

  for (const field of ['authorName', 'createdAt', 'updatedAt']) {
    if (typeof value[field] === 'string') {
      normalized[field] = value[field];
    }
  }

  return normalized;
}

export function createCoverLetterLegacyDto(record = {}) {
  const items = Array.isArray(record.items) ? record.items : [];
  return {
    masterCd: toIdentifier(record.masterCd),
    corp: toText(record.applicationCompany),
    duty: {
      code: toIdentifier(record.dutyCode),
      name: toText(record.applicationRole),
    },
    consent: record.consent === true,
    attribute5: record.consent === true ? 'Y' : 'N',
    isApprove: record.consent === true,
    details: items.slice(0, COVER_LETTER_MAX_ITEMS).map((item, index) => {
      const detailCd = toIdentifier(item?.detailCd) || index + 1;
      return {
        cd: detailCd,
        detailCd,
        subject: toText(item?.title),
        contents: toText(item?.content),
        keywordCode: toIdentifier(item?.keywordCode),
        exampleCd: toIdentifier(item?.exampleCd),
        selectKeyword: toIdentifier(item?.keywordCode),
        selectMyQuestion: toIdentifier(item?.exampleCd),
        txt_result: toText(item?.content),
        sentenceType: SENTENCE_TYPES.has(item?.sentenceType) ? item.sentenceType : 'content',
      };
    }),
  };
}

export function getCoverLetterLibraryStorageKey(userId) {
  return userId
    ? `${COVER_LETTER_LIBRARY_STORAGE_KEY}:${encodeURIComponent(String(userId))}`
    : COVER_LETTER_LIBRARY_STORAGE_KEY;
}

function readRecords(storage, storageKey) {
  try {
    const raw = readStorageValue(storage, storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((record) => normalizeCoverLetterRecord(record)).filter(Boolean).map((record) => ({
      ...record,
      legacyDto: createCoverLetterLegacyDto(record),
    }));
  } catch {
    return [];
  }
}

export function createCoverLetterLibraryService(
  storage = resolveBrowserStorage(),
  userId,
  options = {},
) {
  const storageKey = getCoverLetterLibraryStorageKey(userId);
  const now = options.now ?? (() => new Date().toISOString());
  const references = cloneReferences(options.references ?? COVER_LETTER_FIXTURE_REFERENCES);
  const adapterInfo = Object.freeze({
    kind: 'owner-scoped-local-mock',
    ownerId: userId == null ? 'anonymous-preview' : String(userId),
    serverConnected: false,
  });

  return {
    adapterInfo,
    getReferences() {
      return cloneReferences(references);
    },
    load() {
      return readRecords(storage, storageKey);
    },
    save(record) {
      if (Array.isArray(record?.items) && record.items.length > COVER_LETTER_MAX_ITEMS) {
        throw new Error(`자기소개서 질문은 최대 ${COVER_LETTER_MAX_ITEMS}개까지 저장할 수 있습니다.`);
      }

      const normalized = normalizeCoverLetterRecord(record, { generateMasterCd: true });
      if (!normalized) {
        return null;
      }

      const currentRecords = readRecords(storage, storageKey);
      const existing = currentRecords.find((candidate) => candidate.masterCd === normalized.masterCd);
      const timestamp = now();
      const savedRecord = {
        ...normalized,
        createdAt: normalized.createdAt ?? existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      savedRecord.legacyDto = createCoverLetterLegacyDto(savedRecord);

      const nextRecords = existing
        ? currentRecords.map((candidate) => (
          candidate.masterCd === savedRecord.masterCd ? savedRecord : candidate
        ))
        : [savedRecord, ...currentRecords];

      writeStorageValue(storage, storageKey, JSON.stringify(nextRecords));
      return savedRecord;
    },
    remove(masterCd) {
      const identifier = toIdentifier(masterCd);
      const currentRecords = readRecords(storage, storageKey);
      const nextRecords = currentRecords.filter((record) => record.masterCd !== identifier);
      writeStorageValue(storage, storageKey, JSON.stringify(nextRecords));
      return nextRecords.length !== currentRecords.length;
    },
  };
}

export const coverLetterLibraryService = createCoverLetterLibraryService();
