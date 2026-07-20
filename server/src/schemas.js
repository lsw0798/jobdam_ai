import { Buffer } from 'node:buffer';
import { z } from 'zod';

const email = z.string().trim().email('유효한 이메일 주소를 입력하세요.');
const password = z.string()
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    '비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.',
  );

export const signupSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력하세요.').max(100),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password,
});

const shortText = z.string().trim().max(500);
const longText = z.string().trim().max(20_000);
const legacyId = z.union([
  z.number().int().nonnegative(),
  z.string().trim().min(1).max(200),
]);

const competencyRecordSchema = z.object({
  activity: longText,
  knowledge: longText,
  skill: longText,
  attitude: longText,
});

const datedExperienceSchema = competencyRecordSchema.extend({
  date: shortText,
});

const rangedExperienceSchema = competencyRecordSchema.extend({
  dateFrom: shortText,
  dateTo: shortText,
});

export const experienceSchema = z.object({
  profile: z.object({
    schoolId: shortText,
    schoolName: shortText,
    grade: shortText,
    hp1: shortText,
    email: shortText,
    snsHomepage: shortText,
  }),
  application: z.object({
    subject: shortText,
    applyCompany: shortText,
    dutyCompany: shortText,
    overallScore: shortText,
    subjectScore: shortText,
    graduationTerm: shortText,
  }),
  jobModeling: z.object({
    knowledge: longText,
    skill: longText,
    jobFit: longText,
    idealTalent: longText,
  }),
  competencyRecords: z.object({
    foreignLanguage: competencyRecordSchema,
    schoolRecord: competencyRecordSchema,
    subjectRecord: competencyRecordSchema,
  }),
  sections: z.object({
    certificates: z.array(datedExperienceSchema).max(29),
    dutyActivities: z.array(rangedExperienceSchema).max(29),
    activities: z.array(datedExperienceSchema).max(29),
    others: z.array(datedExperienceSchema).max(29),
  }),
});

const coverLetterDetailSchema = z.object({
  cd: legacyId,
  subject: longText.min(1, '기업 자소서 문항을 입력하세요.'),
  contents: longText,
  keywordCode: legacyId.optional(),
  exampleCd: legacyId.optional(),
});

export const coverLetterSchema = z.object({
  masterCd: legacyId,
  corp: shortText.min(1, '지원기업을 입력하세요.'),
  duty: z.object({
    code: legacyId,
    name: shortText.min(1, '지원직무를 선택하세요.'),
  }),
  consent: z.literal(true, { errorMap: () => ({ message: '사례 제공에 동의해야 합니다.' }) }),
  details: z.array(coverLetterDetailSchema)
    .min(1, '기업 자소서 문항을 한 개 이상 입력하세요.')
    .max(6, '레거시 저장 계약은 문항을 최대 6개까지 지원합니다.'),
});

const successExampleDetailSchema = z.object({
  cdSeq: legacyId,
  contentText: longText,
  star1Text: longText,
  star2Text: longText,
  groupLookupCode: legacyId,
});

export const successExamplesWorkspaceSchema = z.object({
  selectGroups: z.array(legacyId)
    .min(1, '직무를 한 개 이상 선택하세요.')
    .max(3, '직무는 최대 3개까지 선택할 수 있습니다.'),
  selectMode: shortText.min(1),
  itemCode: legacyId,
  masterCd: legacyId,
  details: z.array(successExampleDetailSchema).min(1),
}).superRefine((workspace, context) => {
  const selectedGroups = new Set(workspace.selectGroups.map(String));

  workspace.details.forEach((detail, index) => {
    if (!selectedGroups.has(String(detail.groupLookupCode))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '선택한 직무 그룹에 속한 작성 내용만 저장할 수 있습니다.',
        path: ['details', index, 'groupLookupCode'],
      });
    }
  });
});

const addQuestionSchema = z.object({
  cdFlag: z.number().int().min(1).max(3),
  addQuestion: longText,
  addAnswer: longText,
  addUnderline: longText,
});

const interviewAnswerSchema = z.object({
  cdQuestion: legacyId,
  cdFunction: legacyId,
  contents: longText,
  myUnderline: longText,
  followContents: longText,
  addQuestions: z.array(addQuestionSchema).max(3, '추가 질문은 최대 3개까지 작성할 수 있습니다.'),
});

export const interviewWorkspaceSchema = z.object({
  functionCode: legacyId,
  questionIds: z.array(legacyId)
    .min(1, '면접 질문을 한 개 이상 선택하세요.')
    .max(50, '면접 질문은 최대 50개까지 선택할 수 있습니다.'),
  answers: z.array(interviewAnswerSchema).max(50),
}).superRefine((workspace, context) => {
  const questionIds = new Set(workspace.questionIds.map(String));

  workspace.answers.forEach((answer, index) => {
    if (!questionIds.has(String(answer.cdQuestion))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '선택한 면접 질문의 답변만 저장할 수 있습니다.',
        path: ['answers', index, 'cdQuestion'],
      });
    }

    if (String(answer.cdFunction) !== String(workspace.functionCode)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '선택한 직무 코드와 답변의 직무 코드가 일치해야 합니다.',
        path: ['answers', index, 'cdFunction'],
      });
    }
  });
});
