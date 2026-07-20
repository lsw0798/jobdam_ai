import { describe, expect, it } from 'vitest';
import {
  createSuccessExamplesWorkspaceService,
  SUCCESS_EXAMPLES_REFERENCE_FIXTURES,
} from './successExamplesWorkspaceService';

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

const workspace = {
  selectGroups: ['fixture-group-1', 'fixture-group-2'],
  selectMode: 'BASIC',
  itemCode: 'fixture-item-basic-1',
  masterCd: 'fixture-master-basic-1',
  details: [
    {
      cdSeq: 'fixture-detail-basic-1',
      contentText: '사용자가 작성한 단계별 내용',
      star1Text: '',
      star2Text: '사용자가 작성한 선택형 STAR 내용',
      groupLookupCode: 'fixture-group-1',
    },
  ],
};

describe('successExamplesWorkspaceService', () => {
  it('DB 기준정보와 식별자를 보존한 사용자 작성 DTO를 분리한다', () => {
    const service = createSuccessExamplesWorkspaceService(createMemoryStorage());

    expect(SUCCESS_EXAMPLES_REFERENCE_FIXTURES.notice).toContain('DB 미연결 계약 목업');
    expect(service.getReferenceData()).toBe(SUCCESS_EXAMPLES_REFERENCE_FIXTURES);

    const saved = service.save({
      ...workspace,
      applicationIntent: '저장되어서는 안 되는 읽기 전용 기준정보',
    });

    expect(saved).toEqual(workspace);
    expect(service.load()).toEqual(workspace);
    expect(JSON.stringify(saved)).not.toContain('applicationIntent');
  });

  it('masterCd별 작성 이력을 조회하고 같은 이력을 수정한다', () => {
    const storage = createMemoryStorage();
    const service = createSuccessExamplesWorkspaceService(storage, 'owner-1');
    const secondWorkspace = {
      ...workspace,
      itemCode: 'fixture-item-advanced-1',
      masterCd: 'fixture-master-star-1',
    };

    service.save(workspace);
    service.save(secondWorkspace);
    service.save({
      ...workspace,
      details: [{ ...workspace.details[0], contentText: '수정한 사용자 작성 내용' }],
    });

    const restoredService = createSuccessExamplesWorkspaceService(storage, 'owner-1');
    expect(restoredService.listHistory()).toHaveLength(2);
    expect(restoredService.listHistory()[0]).toMatchObject({
      masterCd: 'fixture-master-basic-1',
      details: [{ cdSeq: 'fixture-detail-basic-1', contentText: '수정한 사용자 작성 내용' }],
    });
    expect(restoredService.load()).toMatchObject({ masterCd: 'fixture-master-basic-1' });
  });
});
