import {
  readStorageValue,
  resolveBrowserStorage,
  writeStorageValue,
} from '../../lib/browserStorage';

export const EXPERIENCE_STORAGE_KEY = 'jobdam-ai:experience-list:v2';
export const EXPERIENCE_MAX_ROWS = 29;

export const EXPERIENCE_LEGACY_SECTION_IDS = Object.freeze({
  profile: Object.freeze(['user_master', 'univ_std_info_all']),
  application: 'univ_std_info_all',
  jobModeling: 'user_add_modeling',
  foreignLanguage: 'user_add_foreign_language',
  schoolRecord: 'user_add_school_record',
  subjectRecord: 'user_add_subject_record',
  certificates: 'user_add_certificate',
  dutyActivities: 'user_add_duty_activitie',
  activities: 'user_add_activitie',
  others: 'user_add_etc',
});

export const EXPERIENCE_LEGACY_FIELD_COLUMNS = Object.freeze({
  applyCompany: 'attribute11',
  dutyCompany: 'attribute12',
  myscore: 'attribute13',
  subjectscore: 'attribute14',
  graduationTerm: 'attribute15',
});

const PROFILE_FIELDS = [
  'userName',
  'schoolId',
  'schoolName',
  'homepage',
  'grade',
  'hp1',
  'email',
  'snsHomepage',
];
const APPLICATION_FIELDS = [
  'subject',
  'applyCompany',
  'dutyCompany',
  'myscore',
  'subjectscore',
  'graduationTerm',
];
const JOB_MODELING_FIELDS = [
  'jobModeling1',
  'jobModeling2',
  'jobModeling3',
  'jobModeling4',
];
const COMPETENCY_FIELDS = ['activity', 'knowledge', 'skill', 'attitude'];
const REPEATABLE_SECTIONS = Object.freeze({
  certificates: ['activity', 'date', 'knowledge', 'skill', 'attitude'],
  dutyActivities: ['activity', 'dateFrom', 'dateTo', 'knowledge', 'skill', 'attitude'],
  activities: ['activity', 'date', 'knowledge', 'skill', 'attitude'],
  others: ['activity', 'date', 'knowledge', 'skill', 'attitude'],
});

let clientIdSequence = 0;

function toText(value) {
  return typeof value === 'string' ? value : '';
}

function normalizeTextObject(source, fields) {
  const value = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  return Object.fromEntries(fields.map((field) => [field, toText(value[field])]));
}

export function createExperienceClientId(prefix = 'row') {
  const uuid = globalThis.crypto?.randomUUID?.();
  clientIdSequence += 1;
  return `${prefix}-${uuid || clientIdSequence}`;
}

function normalizeRow(source, fields, prefix, usedIds = new Set()) {
  const value = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  let clientId = toText(value.clientId).trim();

  if (!clientId || usedIds.has(clientId)) {
    clientId = createExperienceClientId(prefix);
  }
  usedIds.add(clientId);

  return {
    clientId,
    ...normalizeTextObject(value, fields),
  };
}

export function createExperienceRow(sectionKey) {
  const fields = REPEATABLE_SECTIONS[sectionKey] ?? REPEATABLE_SECTIONS.certificates;
  return normalizeRow({}, fields, sectionKey);
}

export function createEmptyExperienceDocument({ ensureRows = true } = {}) {
  return {
    profile: normalizeTextObject({}, PROFILE_FIELDS),
    application: normalizeTextObject({}, APPLICATION_FIELDS),
    jobModeling: normalizeTextObject({}, JOB_MODELING_FIELDS),
    competencyRecords: {
      foreignLanguage: normalizeTextObject({}, COMPETENCY_FIELDS),
      schoolRecord: normalizeTextObject({}, COMPETENCY_FIELDS),
      subjectRecord: normalizeTextObject({}, COMPETENCY_FIELDS),
    },
    sections: Object.fromEntries(Object.keys(REPEATABLE_SECTIONS).map((sectionKey) => [
      sectionKey,
      ensureRows ? [createExperienceRow(sectionKey)] : [],
    ])),
  };
}

export function normalizeExperienceDocument(source, { ensureRows = false } = {}) {
  const value = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  const competencyRecords = value.competencyRecords && typeof value.competencyRecords === 'object'
    ? value.competencyRecords
    : {};
  const sourceSections = value.sections && typeof value.sections === 'object'
    ? value.sections
    : {};
  const usedIds = new Set();
  const sections = {};

  for (const [sectionKey, fields] of Object.entries(REPEATABLE_SECTIONS)) {
    const sourceRows = Array.isArray(sourceSections[sectionKey])
      ? sourceSections[sectionKey].slice(0, EXPERIENCE_MAX_ROWS)
      : [];
    const rows = sourceRows.map((row) => normalizeRow(row, fields, sectionKey, usedIds));
    sections[sectionKey] = ensureRows && rows.length === 0
      ? [normalizeRow({}, fields, sectionKey, usedIds)]
      : rows;
  }

  const normalized = {
    profile: normalizeTextObject(value.profile, PROFILE_FIELDS),
    application: normalizeTextObject(value.application, APPLICATION_FIELDS),
    jobModeling: normalizeTextObject(value.jobModeling, JOB_MODELING_FIELDS),
    competencyRecords: {
      foreignLanguage: normalizeTextObject(competencyRecords.foreignLanguage, COMPETENCY_FIELDS),
      schoolRecord: normalizeTextObject(competencyRecords.schoolRecord, COMPETENCY_FIELDS),
      subjectRecord: normalizeTextObject(competencyRecords.subjectRecord, COMPETENCY_FIELDS),
    },
    sections,
  };

  if (typeof value.createdAt === 'string') {
    normalized.createdAt = value.createdAt;
  }
  if (typeof value.updatedAt === 'string') {
    normalized.updatedAt = value.updatedAt;
  }

  return normalized;
}

function addCompetencyRequest(request, prefix, record) {
  request[`${prefix}_activities`] = record.activity;
  request[`${prefix}_knowledge`] = record.knowledge;
  request[`${prefix}_skill`] = record.skill;
  request[`${prefix}_attitude`] = record.attitude;
}

function addRepeatedRequest(request, rows, names) {
  rows.slice(0, EXPERIENCE_MAX_ROWS).forEach((row, index) => {
    const legacyIndex = index + 1;
    for (const [field, requestPrefix] of Object.entries(names)) {
      request[`${requestPrefix}_${legacyIndex}`] = toText(row[field]);
    }
  });
}

export function createLegacyExperienceRequest(source) {
  const document = normalizeExperienceDocument(source);
  const { profile, application, jobModeling, competencyRecords, sections } = document;
  const request = {
    school_id: profile.schoolId,
    school_name: profile.schoolName,
    homepage: profile.homepage,
    grade: profile.grade,
    hp1: profile.hp1,
    email: profile.email,
    sns_homepage: profile.snsHomepage,
    subject: application.subject,
    apply_conpany: application.applyCompany,
    duty_company: application.dutyCompany,
    myscore: application.myscore,
    subjectscore: application.subjectscore,
    graduationTerm: application.graduationTerm,
    job_modeling1: jobModeling.jobModeling1,
    job_modeling2: jobModeling.jobModeling2,
    job_modeling3: jobModeling.jobModeling3,
    job_modeling4: jobModeling.jobModeling4,
  };

  addCompetencyRequest(request, 'foreign_language', competencyRecords.foreignLanguage);
  addCompetencyRequest(request, 'school_record', competencyRecords.schoolRecord);
  addCompetencyRequest(request, 'subject_record', competencyRecords.subjectRecord);
  addRepeatedRequest(request, sections.certificates, {
    activity: 'certificate_activities',
    date: 'certificate_date',
    knowledge: 'certificate_knowledge',
    skill: 'certificate_skill',
    attitude: 'certificate_attitude',
  });
  addRepeatedRequest(request, sections.dutyActivities, {
    activity: 'duty_activitie_activities',
    dateFrom: 'duty_date_from',
    dateTo: 'duty_date_to',
    knowledge: 'duty_activitie_knowledge',
    skill: 'duty_activitie_skill',
    attitude: 'duty_activitie_attitude',
  });
  addRepeatedRequest(request, sections.activities, {
    activity: 'activitie_activities',
    date: 'activitie_date',
    knowledge: 'activitie_knowledge',
    skill: 'activitie_skill',
    attitude: 'activitie_attitude',
  });
  addRepeatedRequest(request, sections.others, {
    activity: 'etc_activities',
    date: 'etc_date',
    knowledge: 'etc_knowledge',
    skill: 'etc_skill',
    attitude: 'etc_attitude',
  });

  return request;
}

export function getExperienceStorageKey(userId) {
  return userId
    ? `${EXPERIENCE_STORAGE_KEY}:${encodeURIComponent(String(userId))}`
    : EXPERIENCE_STORAGE_KEY;
}

export function createExperienceService(
  storage = resolveBrowserStorage(),
  now = () => new Date().toISOString(),
  userId,
) {
  const storageKey = getExperienceStorageKey(userId);
  const adapterInfo = Object.freeze({
    kind: 'owner-scoped-local-mock',
    ownerId: userId == null ? 'anonymous-preview' : String(userId),
    serverConnected: false,
  });

  return {
    adapterInfo,
    load() {
      const serializedDocument = readStorageValue(storage, storageKey);

      if (!serializedDocument) {
        return null;
      }

      try {
        const normalized = normalizeExperienceDocument(JSON.parse(serializedDocument));
        return {
          ...normalized,
          legacyContract: {
            adapter: adapterInfo.kind,
            batchKind: 'EXPERIENCE',
            batchStatus: 'Y',
            fieldColumns: EXPERIENCE_LEGACY_FIELD_COLUMNS,
            sectionIds: EXPERIENCE_LEGACY_SECTION_IDS,
          },
          legacyRequest: createLegacyExperienceRequest(normalized),
        };
      } catch {
        return null;
      }
    },
    save(document) {
      const timestamp = now();
      const normalized = normalizeExperienceDocument(document);
      const savedDocument = {
        ...normalized,
        legacyContract: {
          adapter: adapterInfo.kind,
          batchKind: 'EXPERIENCE',
          batchStatus: 'Y',
          fieldColumns: EXPERIENCE_LEGACY_FIELD_COLUMNS,
          sectionIds: EXPERIENCE_LEGACY_SECTION_IDS,
        },
        legacyRequest: createLegacyExperienceRequest(normalized),
        createdAt: normalized.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      writeStorageValue(storage, storageKey, JSON.stringify(savedDocument));
      return savedDocument;
    },
  };
}
