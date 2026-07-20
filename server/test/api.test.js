import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createMockRepository } from '../src/repositories/mockRepository.js';

describe('mock API', () => {
  it('identifies itself as a contract mock instead of a connected legacy database', async () => {
    const app = createApp({ repository: createMockRepository() });

    await request(app)
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          status: 'ok',
          storageMode: 'mock-contract',
          contracts: ['experience', 'coverLetters', 'successExamples', 'interview'],
        });
      });
  });

  it('signs up a user and keeps their experience document private to the session', async () => {
    const app = createApp({ repository: createMockRepository() });
    const client = request.agent(app);

    await client
      .post('/api/auth/signup')
      .send({ name: '테스트 사용자', email: 'test@example.com', password: 'safe-password' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.user).toMatchObject({ name: '테스트 사용자', email: 'test@example.com' });
      });

    await client
      .put('/api/experience')
      .send({
        profile: {
          schoolId: 'SCHOOL-1',
          schoolName: '테스트대학교',
          grade: '4',
          hp1: '010-0000-0000',
          email: 'test@example.com',
          snsHomepage: '',
        },
        application: {
          subject: '컴퓨터공학',
          applyCompany: '잡담',
          dutyCompany: '프론트엔드 개발자',
          overallScore: '4.0',
          subjectScore: '4.1',
          graduationTerm: '2026-02',
        },
        jobModeling: {
          knowledge: '웹 표준',
          skill: 'React',
          jobFit: '사용자 문제 해결',
          idealTalent: '협업',
        },
        competencyRecords: {
          foreignLanguage: { activity: '영어', knowledge: '', skill: '', attitude: '' },
          schoolRecord: { activity: '전체성적', knowledge: '', skill: '', attitude: '' },
          subjectRecord: { activity: '전공성적', knowledge: '', skill: '', attitude: '' },
        },
        sections: {
          certificates: [{ activity: '정보처리기사', date: '2026-01-01', knowledge: '', skill: '', attitude: '' }],
          dutyActivities: [{ activity: '캡스톤', dateFrom: '2025-03-01', dateTo: '2025-12-01', knowledge: '', skill: '', attitude: '' }],
          activities: [],
          others: [],
        },
      })
      .expect(200);

    await client
      .get('/api/experience')
      .expect(200)
      .expect(({ body }) => {
        expect(body.document).toMatchObject({
          application: { applyCompany: '잡담', dutyCompany: '프론트엔드 개발자' },
          sections: { dutyActivities: [{ dateFrom: '2025-03-01', dateTo: '2025-12-01' }] },
        });
      });
  });

  it('rejects an experience write without a session', async () => {
    const app = createApp({ repository: createMockRepository() });

    await request(app)
      .put('/api/experience')
      .send({})
      .expect(401);
  });

  it('persists an AI cover-letter master with at most six legacy detail rows', async () => {
    const app = createApp({ repository: createMockRepository() });
    const client = request.agent(app);

    await client
      .post('/api/auth/signup')
      .send({ name: '자소서 사용자', email: 'letter@example.com', password: 'safe-password' })
      .expect(201);

    const document = {
      masterCd: 'fixture-master-1',
      corp: '테스트 기업',
      duty: { code: 'fixture-duty-1', name: '계약 검증 직무' },
      consent: true,
      details: Array.from({ length: 6 }, (_, index) => ({
        cd: index + 1,
        subject: `기업 문항 ${index + 1}`,
        contents: `사용자 답변 ${index + 1}`,
        keywordCode: `fixture-keyword-${index + 1}`,
        exampleCd: `fixture-example-${index + 1}`,
      })),
    };

    await client
      .post('/api/cover-letters')
      .send(document)
      .expect(201)
      .expect(({ body }) => {
        expect(body.document).toMatchObject({ masterCd: 'fixture-master-1', consent: true });
        expect(body.document.details).toHaveLength(6);
      });

    await client
      .get('/api/cover-letters')
      .expect(200)
      .expect(({ body }) => {
        expect(body.documents).toHaveLength(1);
        expect(body.documents[0].details[0]).toMatchObject({ cd: 1, keywordCode: 'fixture-keyword-1' });
      });

    await client
      .get('/api/cover-letters/fixture-master-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.document).toMatchObject({ masterCd: 'fixture-master-1', corp: '테스트 기업' });
      });

    await client
      .put('/api/cover-letters/fixture-master-1')
      .send({ ...document, corp: '수정된 테스트 기업' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.document.corp).toBe('수정된 테스트 기업');
      });

    await client
      .post('/api/cover-letters')
      .send({ ...document, masterCd: 'too-many', details: [...document.details, document.details[0]] })
      .expect(422);

    await client.delete('/api/cover-letters/fixture-master-1').expect(204);
    await client.get('/api/cover-letters/fixture-master-1').expect(404);
  });

  it('round-trips dynamic success-example identifiers without turning reference text into input fields', async () => {
    const app = createApp({ repository: createMockRepository() });
    const client = request.agent(app);

    await client
      .post('/api/auth/signup')
      .send({ name: '합격사례 사용자', email: 'success@example.com', password: 'safe-password' })
      .expect(201);

    const workspace = {
      selectGroups: ['fixture-group-1', 'fixture-group-2'],
      selectMode: 'BASIC',
      itemCode: 'fixture-item-1',
      masterCd: 'fixture-master-1',
      details: [
        {
          cdSeq: 1,
          contentText: '사용자가 직접 작성한 내용',
          star1Text: '',
          star2Text: '선택형 STAR 작성 내용',
          groupLookupCode: 'fixture-group-1',
        },
      ],
    };

    await client.put('/api/success-examples/workspace').send(workspace).expect(200);
    await client
      .get('/api/success-examples/workspace')
      .expect(200)
      .expect(({ body }) => {
        expect(body.workspace).toMatchObject({
          masterCd: 'fixture-master-1',
          selectGroups: ['fixture-group-1', 'fixture-group-2'],
          details: [{ cdSeq: 1, groupLookupCode: 'fixture-group-1' }],
        });
      });

    await client
      .put('/api/success-examples/workspace')
      .send({
        ...workspace,
        details: [{ ...workspace.details[0], groupLookupCode: 'fixture-unselected-group' }],
      })
      .expect(422);
  });

  it('persists interview answers by question and function IDs and enforces legacy limits', async () => {
    const app = createApp({ repository: createMockRepository() });
    const client = request.agent(app);

    await client
      .post('/api/auth/signup')
      .send({ name: '면접 사용자', email: 'interview@example.com', password: 'safe-password' })
      .expect(201);

    const workspace = {
      functionCode: 'fixture-function-1',
      questionIds: ['fixture-question-1'],
      answers: [
        {
          cdQuestion: 'fixture-question-1',
          cdFunction: 'fixture-function-1',
          contents: '나의 답변',
          myUnderline: '핵심 키워드',
          followContents: '예상 후속답변',
          addQuestions: [
            { cdFlag: 1, addQuestion: '추가 질문', addAnswer: '추가 답변', addUnderline: '추가 키워드' },
          ],
        },
      ],
    };

    await client.put('/api/interview/workspace').send(workspace).expect(200);
    await client
      .get('/api/interview/workspace')
      .expect(200)
      .expect(({ body }) => {
        expect(body.workspace.answers[0]).toMatchObject({
          cdQuestion: 'fixture-question-1',
          cdFunction: 'fixture-function-1',
          myUnderline: '핵심 키워드',
        });
      });

    await client
      .put('/api/interview/workspace')
      .send({ ...workspace, questionIds: Array.from({ length: 51 }, (_, index) => `q-${index}`) })
      .expect(422);

    await client
      .put('/api/interview/workspace')
      .send({
        ...workspace,
        answers: [{ ...workspace.answers[0], addQuestions: Array.from({ length: 4 }, (_, index) => ({
          cdFlag: index + 1,
          addQuestion: '질문',
          addAnswer: '답변',
          addUnderline: '',
        })) }],
      })
      .expect(422);

    await client
      .put('/api/interview/workspace')
      .send({
        ...workspace,
        answers: [{ ...workspace.answers[0], cdQuestion: 'fixture-unselected-question' }],
      })
      .expect(422);

    await client
      .put('/api/interview/workspace')
      .send({
        ...workspace,
        answers: [{ ...workspace.answers[0], cdFunction: 'fixture-other-function' }],
      })
      .expect(422);
  });

  it('bcrypt가 구분할 수 없는 72바이트 초과 비밀번호를 거부한다', async () => {
    const app = createApp({ repository: createMockRepository() });

    await request(app)
      .post('/api/auth/signup')
      .send({
        name: '긴 비밀번호 사용자',
        email: 'long-password@example.com',
        password: `${'a'.repeat(72)}X`,
      })
      .expect(422)
      .expect(({ body }) => {
        expect(body.error.fieldErrors.password).toContain('비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.');
      });
  });
});
