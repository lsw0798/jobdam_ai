import { useEffect, useMemo, useState } from 'react';
import { downloadExperienceWord } from './experienceExport';
import {
  createEmptyExperienceDocument,
  createExperienceRow,
  createExperienceService,
  EXPERIENCE_MAX_ROWS,
  normalizeExperienceDocument,
} from './experienceService';
import './experience.css';

const PROFILE_FIELDS = Object.freeze([
  { field: 'userName', id: 'experience-user-name', label: '이름 (표시 전용)', readOnly: true },
  { field: 'schoolId', id: 'experience-school-id', label: '학교 ID' },
  { field: 'schoolName', id: 'experience-school-name', label: '학교' },
  { field: 'grade', id: 'experience-grade', label: '학년' },
  { field: 'homepage', id: 'experience-homepage', label: '개인 홈페이지', type: 'url' },
  { field: 'hp1', id: 'experience-hp1', label: '휴대전화', type: 'tel' },
  { field: 'email', id: 'experience-email', label: '이메일', type: 'email' },
  { field: 'snsHomepage', id: 'experience-sns-homepage', label: 'SNS 홈페이지', type: 'url' },
]);

const APPLICATION_FIELDS = Object.freeze([
  { field: 'subject', id: 'experience-subject', label: '전공' },
  { field: 'applyCompany', id: 'experience-apply-company', label: '지원 기업' },
  { field: 'dutyCompany', id: 'experience-duty-company', label: '지원 직무' },
  { field: 'myscore', id: 'experience-myscore', label: '전체학점' },
  { field: 'subjectscore', id: 'experience-subjectscore', label: '전공학점' },
  { field: 'graduationTerm', id: 'experience-graduation-term', label: '졸업 시기' },
]);

const JOB_MODELING_FIELDS = Object.freeze([
  { as: 'textarea', field: 'jobModeling1', id: 'experience-job-modeling-1', label: '필요지식' },
  { as: 'textarea', field: 'jobModeling2', id: 'experience-job-modeling-2', label: '필요스킬' },
  { as: 'textarea', field: 'jobModeling3', id: 'experience-job-modeling-3', label: '직무적합성' },
  { as: 'textarea', field: 'jobModeling4', id: 'experience-job-modeling-4', label: '인재상' },
]);

const COMPETENCY_SECTIONS = Object.freeze([
  { key: 'foreignLanguage', label: '외국어' },
  { key: 'schoolRecord', label: '전체성적' },
  { key: 'subjectRecord', label: '전공성적' },
]);

const COMPETENCY_FIELDS = Object.freeze([
  { field: 'activity', label: '활동내용' },
  { as: 'textarea', field: 'knowledge', label: '지식' },
  { as: 'textarea', field: 'skill', label: '스킬' },
  { as: 'textarea', field: 'attitude', label: '태도' },
]);

const REPEATABLE_SECTIONS = Object.freeze([
  {
    key: 'certificates',
    label: '수상·자격증',
    dateFields: [{ field: 'date', label: '취득일' }],
  },
  {
    key: 'dutyActivities',
    label: '직무·전공 활동',
    dateFields: [
      { field: 'dateFrom', label: '시작일' },
      { field: 'dateTo', label: '종료일' },
    ],
  },
  {
    key: 'activities',
    label: '대내·외 활동',
    dateFields: [{ field: 'date', label: '활동일' }],
  },
  {
    key: 'others',
    label: '기타',
    dateFields: [{ field: 'date', label: '활동일' }],
  },
]);

function FieldControl({
  as: Element = 'input',
  id,
  onChange,
  readOnly = false,
  type = 'text',
  value,
}) {
  return (
    <Element
      id={id}
      onChange={onChange}
      readOnly={readOnly}
      type={Element === 'input' ? type : undefined}
      value={value}
    />
  );
}

function TableScrollArea({ children, label }) {
  return (
    <div
      aria-label={`${label} 표 스크롤 영역`}
      className="experience-table-scroll"
      role="region"
      tabIndex="0"
    >
      {children}
    </div>
  );
}

function KeyValueTable({ fields, label, onChange, record, titleId }) {
  return (
    <TableScrollArea label={label}>
      <table aria-labelledby={titleId} className="experience-data-table experience-data-table--key-value">
        <thead>
          <tr>
            <th scope="col">구분</th>
            <th scope="col">내용</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(({ as, field, id, label: fieldLabel, readOnly = false, type }) => (
            <tr key={field}>
              <th scope="row">
                <label htmlFor={id}>{fieldLabel}</label>
              </th>
              <td>
                <FieldControl
                  as={as}
                  id={id}
                  onChange={readOnly ? undefined : (event) => onChange(field, event.target.value)}
                  readOnly={readOnly}
                  type={type}
                  value={record[field]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScrollArea>
  );
}

function CompetencyTable({ onChange, records, titleId }) {
  return (
    <TableScrollArea label="성적·외국어 역량 기록">
      <table aria-labelledby={titleId} className="experience-data-table experience-data-table--competency">
        <thead>
          <tr>
            <th scope="col">구분</th>
            {COMPETENCY_FIELDS.map(({ field, label }) => <th key={field} scope="col">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {COMPETENCY_SECTIONS.map(({ key, label }) => (
            <tr key={key}>
              <th scope="row">{label}</th>
              {COMPETENCY_FIELDS.map(({ as, field, label: fieldLabel }) => {
                const id = `experience-${key}-${field}`;
                return (
                  <td key={field}>
                    <label className="experience-visually-hidden" htmlFor={id}>
                      {label} {fieldLabel}
                    </label>
                    <FieldControl
                      as={as}
                      id={id}
                      onChange={(event) => onChange(key, field, event.target.value)}
                      value={records[key][field]}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScrollArea>
  );
}

function RepeatableTableRow({
  canDelete,
  dateFields,
  label,
  number,
  onChange,
  onDelete,
  row,
}) {
  const fieldId = (field) => `experience-${row.clientId}-${field}`;
  const renderField = ({ as, field, label: fieldLabel, type = 'text' }) => {
    const id = fieldId(field);
    return (
      <td key={field}>
        <label className="experience-visually-hidden" htmlFor={id}>
          {label} {number} {fieldLabel}
        </label>
        <FieldControl
          as={as}
          id={id}
          onChange={(event) => onChange(row.clientId, field, event.target.value)}
          type={type}
          value={row[field]}
        />
      </td>
    );
  };

  return (
    <tr>
      <th scope="row">{number}</th>
      {renderField({ field: 'activity', label: '활동내용' })}
      {dateFields.map(({ field, label: dateLabel }) => renderField({
        field,
        label: dateLabel,
        type: 'date',
      }))}
      {renderField({ as: 'textarea', field: 'knowledge', label: '지식' })}
      {renderField({ as: 'textarea', field: 'skill', label: '스킬' })}
      {renderField({ as: 'textarea', field: 'attitude', label: '태도' })}
      <td className="experience-table-action-cell">
        {canDelete ? (
          <button
            aria-label={`${label} ${number} 삭제`}
            className="danger experience-delete-button"
            onClick={() => onDelete(row.clientId)}
            type="button"
          >
            삭제
          </button>
        ) : <span aria-hidden="true">—</span>}
      </td>
    </tr>
  );
}

function RepeatableSection({
  dateFields,
  label,
  onAdd,
  onChange,
  onDelete,
  rows,
  sectionKey,
}) {
  const titleId = `experience-${sectionKey}-title`;

  return (
    <section aria-labelledby={titleId} className="experience-panel">
      <h2 id={titleId}>{label}</h2>
      <TableScrollArea label={label}>
        <table
          aria-labelledby={titleId}
          className={`experience-data-table experience-data-table--repeatable${dateFields.length > 1 ? ' experience-data-table--wide' : ''}`}
        >
          <thead>
            <tr>
              <th scope="col">구분</th>
              <th scope="col">활동내용</th>
              {dateFields.map(({ field, label: dateLabel }) => (
                <th key={field} scope="col">{dateLabel}</th>
              ))}
              <th scope="col">지식</th>
              <th scope="col">스킬</th>
              <th scope="col">태도</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <RepeatableTableRow
                canDelete={rows.length > 1}
                dateFields={dateFields}
                key={row.clientId}
                label={label}
                number={index + 1}
                onChange={(rowId, field, value) => onChange(sectionKey, rowId, field, value)}
                onDelete={(rowId) => onDelete(sectionKey, rowId)}
                row={row}
              />
            ))}
          </tbody>
        </table>
      </TableScrollArea>
      <div className="experience-section-footer">
        <p className="experience-row-count">{rows.length} / {EXPERIENCE_MAX_ROWS}행</p>
        <button
          className="secondary"
          disabled={rows.length >= EXPERIENCE_MAX_ROWS}
          onClick={() => onAdd(sectionKey)}
          type="button"
        >
          {label} 행 추가
        </button>
      </div>
    </section>
  );
}

export function ExperienceEditorPage({
  downloadDocument = downloadExperienceWord,
  onSaved,
  service,
}) {
  const experienceService = useMemo(
    () => service ?? createExperienceService(),
    [service],
  );
  const [document, setDocument] = useState(() => createEmptyExperienceDocument());
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    try {
      const savedDocument = experienceService.load?.();
      if (savedDocument) {
        setDocument(normalizeExperienceDocument(savedDocument, { ensureRows: true }));
      }
    } catch {
      setErrorMessage('저장된 경험 리스트를 불러오지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
    }
  }, [experienceService]);

  function updateGroupField(group, field, value) {
    setDocument((current) => ({
      ...current,
      [group]: { ...current[group], [field]: value },
    }));
  }

  function updateCompetencyField(sectionKey, field, value) {
    setDocument((current) => ({
      ...current,
      competencyRecords: {
        ...current.competencyRecords,
        [sectionKey]: {
          ...current.competencyRecords[sectionKey],
          [field]: value,
        },
      },
    }));
  }

  function updateRepeatableField(sectionKey, rowId, field, value) {
    setDocument((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [sectionKey]: current.sections[sectionKey].map((row) => (
          row.clientId === rowId ? { ...row, [field]: value } : row
        )),
      },
    }));
  }

  function addRow(sectionKey) {
    setDocument((current) => {
      const rows = current.sections[sectionKey];
      if (rows.length >= EXPERIENCE_MAX_ROWS) {
        return current;
      }
      return {
        ...current,
        sections: {
          ...current.sections,
          [sectionKey]: [...rows, createExperienceRow(sectionKey)],
        },
      };
    });
  }

  function deleteRow(sectionKey, rowId) {
    setDocument((current) => {
      const rows = current.sections[sectionKey];
      if (rows.length <= 1) {
        return current;
      }
      return {
        ...current,
        sections: {
          ...current.sections,
          [sectionKey]: rows.filter((row) => row.clientId !== rowId),
        },
      };
    });
  }

  function persistCurrentDocument() {
    let savedDocument;

    try {
      savedDocument = experienceService.save?.(document);
    } catch {
      savedDocument = null;
    }

    if (!savedDocument) {
      setStatusMessage('');
      setErrorMessage('경험 리스트를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
      return null;
    }

    setDocument(normalizeExperienceDocument(savedDocument, { ensureRows: true }));
    setErrorMessage('');
    onSaved?.(savedDocument);
    return savedDocument;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const savedDocument = persistCurrentDocument();
    if (savedDocument) {
      setStatusMessage('경험 리스트가 저장되었습니다.');
    }
  }

  function handleDownload() {
    const savedDocument = persistCurrentDocument();
    if (!savedDocument) {
      return;
    }

    try {
      downloadDocument(savedDocument);
      setErrorMessage('');
      setStatusMessage('Word 파일을 다운로드했습니다.');
    } catch {
      setStatusMessage('');
      setErrorMessage('Word 파일을 다운로드하지 못했습니다. 브라우저 다운로드 권한을 확인해 주세요.');
    }
  }

  return (
    <main className="experience-editor-page">
      <header className="experience-editor-header">
        <p className="experience-editor-eyebrow">나의 경험 정리</p>
        <h1>경험 리스트 작성</h1>
        <p className="experience-editor-description">
          지원 준비에 필요한 정보와 경험에서 얻은 역량을 항목별로 정리해 보세요.
        </p>
      </header>

      <form className="experience-editor-form" onSubmit={handleSubmit}>
        <section aria-labelledby="experience-profile-title" className="experience-panel">
          <h2 id="experience-profile-title">기본 정보</h2>
          <KeyValueTable
            fields={PROFILE_FIELDS}
            label="기본 정보"
            onChange={(field, value) => updateGroupField('profile', field, value)}
            record={document.profile}
            titleId="experience-profile-title"
          />
        </section>

        <section aria-labelledby="experience-application-title" className="experience-panel">
          <h2 id="experience-application-title">지원 정보</h2>
          <KeyValueTable
            fields={APPLICATION_FIELDS}
            label="지원 정보"
            onChange={(field, value) => updateGroupField('application', field, value)}
            record={document.application}
            titleId="experience-application-title"
          />
        </section>

        <section aria-labelledby="experience-job-modeling-title" className="experience-panel">
          <h2 id="experience-job-modeling-title">직무 역량</h2>
          <KeyValueTable
            fields={JOB_MODELING_FIELDS}
            label="직무 역량"
            onChange={(field, value) => updateGroupField('jobModeling', field, value)}
            record={document.jobModeling}
            titleId="experience-job-modeling-title"
          />
        </section>

        <section aria-labelledby="experience-competency-title" className="experience-panel">
          <h2 id="experience-competency-title">성적·외국어 역량 기록</h2>
          <CompetencyTable
            onChange={updateCompetencyField}
            records={document.competencyRecords}
            titleId="experience-competency-title"
          />
        </section>

        {REPEATABLE_SECTIONS.map(({ dateFields, key, label }) => (
          <RepeatableSection
            dateFields={dateFields}
            key={key}
            label={label}
            onAdd={addRow}
            onChange={updateRepeatableField}
            onDelete={deleteRow}
            rows={document.sections[key]}
            sectionKey={key}
          />
        ))}

        {errorMessage && <p role="alert">{errorMessage}</p>}
        {statusMessage && <p role="status">{statusMessage}</p>}
        <div className="experience-editor-actions">
          <button className="secondary" onClick={handleDownload} type="button">Word 다운로드</button>
          <button type="submit">저장하기</button>
        </div>
      </form>
    </main>
  );
}
