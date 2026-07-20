import { useState } from 'react';
import { RepeatableSection } from './RepeatableSection';
import { resumeService } from './resumeService';
import './ResumePage.css';

let entrySequence = 0;

function createEntryId(prefix) {
  const randomId = globalThis.crypto?.randomUUID?.();
  entrySequence += 1;
  return `${prefix}-${randomId ?? `${Date.now()}-${entrySequence}`}`;
}

function createEducation() {
  return {
    id: createEntryId('education'),
    schoolType: '',
    schoolName: '',
    period: '',
    major: '',
    status: '',
  };
}

function createCareer() {
  return {
    id: createEntryId('career'),
    company: '',
    role: '',
    period: '',
    description: '',
  };
}

function createCertificate() {
  return {
    id: createEntryId('certificate'),
    name: '',
    organization: '',
    acquiredDate: '',
  };
}

function createLanguageScore() {
  return {
    id: createEntryId('language'),
    exam: '',
    score: '',
    date: '',
  };
}

function createAward() {
  return {
    id: createEntryId('award'),
    competition: '',
    award: '',
    date: '',
  };
}

function createDesiredJobField() {
  return {
    id: createEntryId('desired-job-field'),
    field: '',
  };
}

function createEmptyResume() {
  return {
    profileName: '',
    desiredRole: '',
    educations: [createEducation()],
    careers: [createCareer()],
    certificates: [createCertificate()],
    languageScores: [createLanguageScore()],
    awards: [createAward()],
    desiredJobFields: [createDesiredJobField()],
  };
}

function hydrateEntry(entry, createEntry) {
  const emptyEntry = createEntry();

  return {
    ...emptyEntry,
    ...(entry ?? {}),
    id: entry?.id || emptyEntry.id,
  };
}

function hydrateCollection(entries, createEntry) {
  if (Array.isArray(entries)) {
    return entries.map((entry) => hydrateEntry(entry, createEntry));
  }

  return [createEntry()];
}

function createResumeFromStored(storedResume) {
  if (!storedResume) {
    return createEmptyResume();
  }

  return {
    profileName: storedResume.profileName ?? '',
    desiredRole: storedResume.desiredRole ?? '',
    educations: hydrateCollection(storedResume.educations, createEducation),
    careers: hydrateCollection(storedResume.careers, createCareer),
    certificates: hydrateCollection(storedResume.certificates, createCertificate),
    languageScores: hydrateCollection(storedResume.languageScores, createLanguageScore),
    awards: hydrateCollection(storedResume.awards, createAward),
    desiredJobFields: hydrateCollection(storedResume.desiredJobFields, createDesiredJobField),
  };
}

function hasValidEducation(educations) {
  return educations.some((education) => (
    [education.schoolType, education.schoolName, education.status].every(Boolean)
  ));
}

export function ResumePage({ service = resumeService, onSaved }) {
  const [resume, setResume] = useState(() => createResumeFromStored(service.load()));
  const [validationMessage, setValidationMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function updateProfileField(field, value) {
    setResume((currentResume) => ({ ...currentResume, [field]: value }));
  }

  function updateEntry(collection, id, field, value) {
    setResume((currentResume) => ({
      ...currentResume,
      [collection]: currentResume[collection].map((entry) => (
        entry.id === id ? { ...entry, [field]: value } : entry
      )),
    }));
  }

  function addEntry(collection, createEntry) {
    setResume((currentResume) => ({
      ...currentResume,
      [collection]: [...currentResume[collection], createEntry()],
    }));
  }

  function removeEntry(collection, id) {
    setResume((currentResume) => ({
      ...currentResume,
      [collection]: currentResume[collection].filter((entry) => entry.id !== id),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!hasValidEducation(resume.educations)) {
      setValidationMessage('학교 구분, 학교명, 졸업 상태를 포함한 학력 정보를 한 건 이상 입력해 주세요.');
      setSuccessMessage('');
      return;
    }

    try {
      service.save(resume);
    } catch {
      setValidationMessage('이력서를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
      setSuccessMessage('');
      return;
    }

    onSaved?.(resume);
    setValidationMessage('');
    setSuccessMessage('이력서가 저장되었습니다.');
  }

  return (
    <main className="resume-page">
      <header className="resume-page__header">
        <p className="resume-page__eyebrow">잡담 AI 이력서</p>
        <h1>이력서 작성</h1>
        <p>나의 경험과 강점을 채용 담당자에게 명확하게 전달하세요.</p>
      </header>

      <form aria-label="이력서 작성 양식" onSubmit={handleSubmit}>
        <section aria-labelledby="basic-information-title" className="resume-section">
          <h2 id="basic-information-title">기본 정보</h2>
          <div className="resume-table-wrapper">
            <table
              className="resume-data-table resume-data-table--2-columns"
            >
              <caption className="resume-data-table__caption">기본 정보 입력 표</caption>
              <thead>
                <tr>
                  <th scope="col">이름</th>
                  <th scope="col">희망 직무</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <label htmlFor="profile-name">이름</label>
                    <input
                      id="profile-name"
                      name="profileName"
                      type="text"
                      value={resume.profileName}
                      onChange={(event) => updateProfileField('profileName', event.target.value)}
                    />
                  </td>
                  <td>
                    <label htmlFor="desired-role">희망 직무</label>
                    <input
                      id="desired-role"
                      name="desiredRole"
                      type="text"
                      value={resume.desiredRole}
                      onChange={(event) => updateProfileField('desiredRole', event.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <RepeatableSection
          columns={[
            { key: 'schoolType', label: '학교 구분' },
            { key: 'schoolName', label: '학교명' },
            { key: 'period', label: '재학 기간' },
            { key: 'major', label: '전공' },
            { key: 'status', label: '졸업 상태' },
          ]}
          items={resume.educations}
          title="학력"
          onAdd={() => addEntry('educations', createEducation)}
          onRemove={(id) => removeEntry('educations', id)}
          renderItem={(education) => (
            <>
              <td>
                <label htmlFor={`school-type-${education.id}`}>학교 구분</label>
                <select
                  id={`school-type-${education.id}`}
                  name="schoolType"
                  value={education.schoolType}
                  onChange={(event) => updateEntry('educations', education.id, 'schoolType', event.target.value)}
                >
                  <option value="" disabled>선택하세요</option>
                  <option value="고등학교">고등학교</option>
                  <option value="대학교">대학교</option>
                  <option value="대학원">대학원</option>
                </select>
              </td>
              <td>
                <label htmlFor={`school-name-${education.id}`}>학교명</label>
                <input
                  id={`school-name-${education.id}`}
                  name="schoolName"
                  type="text"
                  value={education.schoolName}
                  onChange={(event) => updateEntry('educations', education.id, 'schoolName', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`education-period-${education.id}`}>재학 기간</label>
                <input
                  id={`education-period-${education.id}`}
                  name="educationPeriod"
                  type="text"
                  value={education.period}
                  onChange={(event) => updateEntry('educations', education.id, 'period', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`major-${education.id}`}>전공</label>
                <input
                  id={`major-${education.id}`}
                  name="major"
                  type="text"
                  value={education.major}
                  onChange={(event) => updateEntry('educations', education.id, 'major', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`education-status-${education.id}`}>졸업 상태</label>
                <select
                  id={`education-status-${education.id}`}
                  name="educationStatus"
                  value={education.status}
                  onChange={(event) => updateEntry('educations', education.id, 'status', event.target.value)}
                >
                  <option value="" disabled>선택하세요</option>
                  <option value="재학">재학</option>
                  <option value="휴학">휴학</option>
                  <option value="졸업">졸업</option>
                  <option value="수료">수료</option>
                </select>
              </td>
            </>
          )}
        />

        <RepeatableSection
          columns={[
            { key: 'company', label: '회사명' },
            { key: 'role', label: '담당 직무' },
            { key: 'period', label: '재직 기간' },
            { key: 'description', label: '업무 설명' },
          ]}
          items={resume.careers}
          title="경력"
          onAdd={() => addEntry('careers', createCareer)}
          onRemove={(id) => removeEntry('careers', id)}
          renderItem={(career) => (
            <>
              <td>
                <label htmlFor={`company-name-${career.id}`}>회사명</label>
                <input
                  id={`company-name-${career.id}`}
                  name="companyName"
                  type="text"
                  value={career.company}
                  onChange={(event) => updateEntry('careers', career.id, 'company', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`career-role-${career.id}`}>담당 직무</label>
                <input
                  id={`career-role-${career.id}`}
                  name="careerRole"
                  type="text"
                  value={career.role}
                  onChange={(event) => updateEntry('careers', career.id, 'role', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`career-period-${career.id}`}>재직 기간</label>
                <input
                  id={`career-period-${career.id}`}
                  name="careerPeriod"
                  type="text"
                  value={career.period}
                  onChange={(event) => updateEntry('careers', career.id, 'period', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`career-description-${career.id}`}>업무 설명</label>
                <textarea
                  id={`career-description-${career.id}`}
                  name="careerDescription"
                  rows="4"
                  value={career.description}
                  onChange={(event) => updateEntry('careers', career.id, 'description', event.target.value)}
                />
              </td>
            </>
          )}
        />

        <RepeatableSection
          columns={[
            { key: 'name', label: '자격증명' },
            { key: 'organization', label: '발급 기관' },
            { key: 'acquiredDate', label: '취득일' },
          ]}
          items={resume.certificates}
          title="자격증"
          onAdd={() => addEntry('certificates', createCertificate)}
          onRemove={(id) => removeEntry('certificates', id)}
          renderItem={(certificate) => (
            <>
              <td>
                <label htmlFor={`certificate-name-${certificate.id}`}>자격증명</label>
                <input
                  id={`certificate-name-${certificate.id}`}
                  name="certificateName"
                  type="text"
                  value={certificate.name}
                  onChange={(event) => updateEntry('certificates', certificate.id, 'name', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`certificate-organization-${certificate.id}`}>발급 기관</label>
                <input
                  id={`certificate-organization-${certificate.id}`}
                  name="certificateOrganization"
                  type="text"
                  value={certificate.organization}
                  onChange={(event) => updateEntry('certificates', certificate.id, 'organization', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`certificate-date-${certificate.id}`}>취득일</label>
                <input
                  id={`certificate-date-${certificate.id}`}
                  name="certificateDate"
                  type="date"
                  value={certificate.acquiredDate}
                  onChange={(event) => updateEntry('certificates', certificate.id, 'acquiredDate', event.target.value)}
                />
              </td>
            </>
          )}
        />

        <RepeatableSection
          columns={[
            { key: 'exam', label: '시험명' },
            { key: 'score', label: '점수' },
            { key: 'date', label: '응시일' },
          ]}
          items={resume.languageScores}
          title="어학 성적"
          onAdd={() => addEntry('languageScores', createLanguageScore)}
          onRemove={(id) => removeEntry('languageScores', id)}
          renderItem={(languageScore) => (
            <>
              <td>
                <label htmlFor={`language-exam-${languageScore.id}`}>시험명</label>
                <input
                  id={`language-exam-${languageScore.id}`}
                  name="languageExam"
                  type="text"
                  value={languageScore.exam}
                  onChange={(event) => updateEntry('languageScores', languageScore.id, 'exam', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`language-score-${languageScore.id}`}>점수</label>
                <input
                  id={`language-score-${languageScore.id}`}
                  name="languageScore"
                  type="text"
                  value={languageScore.score}
                  onChange={(event) => updateEntry('languageScores', languageScore.id, 'score', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`language-date-${languageScore.id}`}>응시일</label>
                <input
                  id={`language-date-${languageScore.id}`}
                  name="languageDate"
                  type="date"
                  value={languageScore.date}
                  onChange={(event) => updateEntry('languageScores', languageScore.id, 'date', event.target.value)}
                />
              </td>
            </>
          )}
        />

        <RepeatableSection
          columns={[
            { key: 'competition', label: '대회명' },
            { key: 'award', label: '수상명' },
            { key: 'date', label: '수상일' },
          ]}
          items={resume.awards}
          title="수상"
          onAdd={() => addEntry('awards', createAward)}
          onRemove={(id) => removeEntry('awards', id)}
          renderItem={(award) => (
            <>
              <td>
                <label htmlFor={`award-competition-${award.id}`}>대회명</label>
                <input
                  id={`award-competition-${award.id}`}
                  name="awardCompetition"
                  type="text"
                  value={award.competition}
                  onChange={(event) => updateEntry('awards', award.id, 'competition', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`award-name-${award.id}`}>수상명</label>
                <input
                  id={`award-name-${award.id}`}
                  name="awardName"
                  type="text"
                  value={award.award}
                  onChange={(event) => updateEntry('awards', award.id, 'award', event.target.value)}
                />
              </td>
              <td>
                <label htmlFor={`award-date-${award.id}`}>수상일</label>
                <input
                  id={`award-date-${award.id}`}
                  name="awardDate"
                  type="date"
                  value={award.date}
                  onChange={(event) => updateEntry('awards', award.id, 'date', event.target.value)}
                />
              </td>
            </>
          )}
        />

        <RepeatableSection
          columns={[
            { key: 'field', label: '희망 직무 분야' },
          ]}
          items={resume.desiredJobFields}
          title="희망 직무 분야"
          onAdd={() => addEntry('desiredJobFields', createDesiredJobField)}
          onRemove={(id) => removeEntry('desiredJobFields', id)}
          renderItem={(desiredJobField) => (
            <td>
                <label htmlFor={`desired-job-field-${desiredJobField.id}`}>희망 직무 분야</label>
                <input
                  id={`desired-job-field-${desiredJobField.id}`}
                  name="desiredJobField"
                  type="text"
                  value={desiredJobField.field}
                  onChange={(event) => updateEntry('desiredJobFields', desiredJobField.id, 'field', event.target.value)}
                />
            </td>
          )}
        />

        <div className="resume-page__feedback" aria-live="polite">
          {validationMessage && <p role="alert">{validationMessage}</p>}
          {successMessage && <p role="status">{successMessage}</p>}
        </div>
        <div className="resume-page__actions">
          <button type="submit">저장하기</button>
        </div>
      </form>
    </main>
  );
}
