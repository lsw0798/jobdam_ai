function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function formatText(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

function field(label, value) {
  return `<p><strong>${escapeHtml(label)}:</strong> ${formatText(value)}</p>`;
}

function competencySection(title, record = {}) {
  return `<section>
    <h2>${escapeHtml(title)}</h2>
    ${field('활동내용', record.activity)}
    ${field('지식', record.knowledge)}
    ${field('스킬', record.skill)}
    ${field('태도', record.attitude)}
  </section>`;
}

function repeatableSection(title, rows, dateFields) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return `<section>
    <h2>${escapeHtml(title)}</h2>
    ${safeRows.map((row, index) => `<article>
      <h3>${escapeHtml(title)} ${index + 1}</h3>
      ${field('활동내용', row?.activity)}
      ${dateFields.map(({ fieldName, label }) => field(label, row?.[fieldName])).join('')}
      ${field('지식', row?.knowledge)}
      ${field('스킬', row?.skill)}
      ${field('태도', row?.attitude)}
    </article>`).join('')}
  </section>`;
}

export function createExperienceWordHtml(document = {}) {
  const profile = document.profile ?? {};
  const application = document.application ?? {};
  const jobModeling = document.jobModeling ?? {};
  const competencyRecords = document.competencyRecords ?? {};
  const sections = document.sections ?? {};

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>경험 리스트</title>
  </head>
  <body>
    <h1>경험 리스트</h1>
    <section>
      <h2>기본·지원 정보</h2>
      ${field('이름', profile.userName)}
      ${field('학교', profile.schoolName)}
      ${field('학년', profile.grade)}
      ${field('휴대전화', profile.hp1)}
      ${field('이메일', profile.email)}
      ${field('SNS 홈페이지', profile.snsHomepage)}
      ${field('전공', application.subject)}
      ${field('지원 기업', application.applyCompany)}
      ${field('지원 직무', application.dutyCompany)}
      ${field('전체학점', application.myscore)}
      ${field('전공학점', application.subjectscore)}
      ${field('졸업 시기', application.graduationTerm)}
    </section>
    <section>
      <h2>직무 역량</h2>
      ${field('필요지식', jobModeling.jobModeling1)}
      ${field('필요스킬', jobModeling.jobModeling2)}
      ${field('직무적합성', jobModeling.jobModeling3)}
      ${field('인재상', jobModeling.jobModeling4)}
    </section>
    ${competencySection('외국어', competencyRecords.foreignLanguage)}
    ${competencySection('전체성적', competencyRecords.schoolRecord)}
    ${competencySection('전공성적', competencyRecords.subjectRecord)}
    ${repeatableSection('수상·자격증', sections.certificates, [{ fieldName: 'date', label: '취득일' }])}
    ${repeatableSection('직무·전공 활동', sections.dutyActivities, [
      { fieldName: 'dateFrom', label: '시작일' },
      { fieldName: 'dateTo', label: '종료일' },
    ])}
    ${repeatableSection('대내·외 활동', sections.activities, [{ fieldName: 'date', label: '활동일' }])}
    ${repeatableSection('기타', sections.others, [{ fieldName: 'date', label: '활동일' }])}
  </body>
</html>`;
}

export function downloadExperienceWord(document, {
  BlobConstructor = globalThis.Blob,
  documentApi = globalThis.document,
  objectUrlApi = globalThis.URL,
} = {}) {
  if (!BlobConstructor || !documentApi?.body?.append || !documentApi?.createElement || !objectUrlApi?.createObjectURL || !objectUrlApi?.revokeObjectURL) {
    throw new Error('이 브라우저에서는 파일 다운로드를 지원하지 않습니다.');
  }

  const blob = new BlobConstructor([createExperienceWordHtml(document)], {
    type: 'application/msword;charset=utf-8',
  });
  const objectUrl = objectUrlApi.createObjectURL(blob);
  let link;

  try {
    link = documentApi.createElement('a');
    link.href = objectUrl;
    link.download = 'downloadData.doc';
    link.style.display = 'none';
    documentApi.body.append(link);
    link.click();
  } finally {
    try {
      link?.remove?.();
    } finally {
      objectUrlApi.revokeObjectURL(objectUrl);
    }
  }
}
