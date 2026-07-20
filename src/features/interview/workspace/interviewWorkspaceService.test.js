import { describe, expect, it } from 'vitest';
import {
  createInterviewWorkspaceService,
  getInterviewWorkspaceStorageKey,
  INTERVIEW_WORKSPACE_STORAGE_KEY,
} from './interviewWorkspaceService';

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe('interviewWorkspaceService', () => {
  it('allowlisted 식별자·답변 필드만 저장하고 다시 불러온다', () => {
    const storage = createMemoryStorage();
    const service = createInterviewWorkspaceService(storage);
    const workspace = {
      bio: { applicationType: 'new', supportCompany: '잡담', password: 'must-not-be-stored' },
      functionCode: 'fixture-function-a',
      rankingMode: 'frequency',
      questionIds: ['fixture-question-1'],
      answers: [{
        cdQuestion: 'fixture-question-1',
        cdFunction: 'fixture-function-a',
        contents: '일반 답변',
        followContents: '후속 답변',
        myUnderline: '핵심 키워드',
        additionalQuestions: [{ cdFlag: 'fixture-add-1', question: '추가 질문', contents: '추가 답변' }],
        questionIntent: 'DB 소유 필드는 저장하지 않습니다.',
      }],
      password: 'must-not-be-stored',
    };

    const savedWorkspace = service.save(workspace);

    expect(INTERVIEW_WORKSPACE_STORAGE_KEY).toBe('jobdam-ai:interview-workspace:v2');
    expect(savedWorkspace).toMatchObject({
      bio: { applicationType: 'new', supportCompany: '잡담' },
      functionCode: 'fixture-function-a',
      rankingMode: 'frequency',
      questionIds: ['fixture-question-1'],
      answers: [{
        cdQuestion: 'fixture-question-1',
        cdFunction: 'fixture-function-a',
        contents: '일반 답변',
        followContents: '후속 답변',
        myUnderline: '핵심 키워드',
        additionalQuestions: [{ cdFlag: 'fixture-add-1', question: '추가 질문', contents: '추가 답변' }],
      }],
    });
    expect(savedWorkspace).not.toHaveProperty('password');
    expect(savedWorkspace.bio).not.toHaveProperty('password');
    expect(savedWorkspace.answers[0]).not.toHaveProperty('questionIntent');
    expect(service.load()).toEqual(savedWorkspace);
  });

  it('손상된 브라우저 저장값은 빈 상태로 처리한다', () => {
    const storage = createMemoryStorage();
    storage.setItem(INTERVIEW_WORKSPACE_STORAGE_KEY, '{not-valid-json');

    expect(createInterviewWorkspaceService(storage).load()).toBeNull();
  });

  it('사용자별 저장소를 분리해 다른 사용자의 면접 답변을 읽지 않는다', () => {
    const storage = createMemoryStorage();
    const firstUserService = createInterviewWorkspaceService(storage, 'user-one');
    const secondUserService = createInterviewWorkspaceService(storage, 'user-two');

    firstUserService.save({ role: '프론트엔드 개발자' });

    expect(storage.getItem(getInterviewWorkspaceStorageKey('user-one'))).not.toBeNull();
    expect(secondUserService.load()).toBeNull();
  });

  it('사용할 수 없는 저장소에서는 저장 성공처럼 반환하지 않는다', () => {
    const service = createInterviewWorkspaceService(null);

    expect(service.load()).toBeNull();
    expect(() => service.save({ role: '프론트엔드 개발자' })).toThrow('브라우저 저장소');
  });
});
