export const DEFAULT_EXPERIENCE_WORD_FILENAME = '경험리스트.doc';

const HTML_ESCAPE_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const CATEGORY_LABELS = {
  certificate: '자격증',
  dutyActivity: '직무 활동',
  extracurricular: '교외 활동',
  other: '기타',
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPE_ENTITIES[character]);
}

function renderTextField(label, value) {
  return `<p><strong>${label}</strong> ${escapeHtml(value)}</p>`;
}

function renderExperience(experience, index) {
  const category = CATEGORY_LABELS[experience.category] ?? experience.category;

  return `
    <section>
      <h2>경험 ${index + 1}</h2>
      ${renderTextField('분류', category)}
      ${renderTextField('활동', experience.activity)}
      ${renderTextField('기간', experience.period)}
      ${renderTextField('지식', experience.knowledge)}
      ${renderTextField('스킬', experience.skill)}
      ${renderTextField('태도', experience.attitude)}
    </section>`;
}

export function createExperienceWordHtml(document = {}) {
  const experiences = Array.isArray(document.experiences) ? document.experiences : [];

  return `<!DOCTYPE html>
<html lang="ko" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>경험 리스트</title>
</head>
<body>
  <h1>경험 리스트</h1>
  ${renderTextField('지원 기업', document.targetCompany)}
  ${renderTextField('지원 직무', document.targetRole)}
  ${renderTextField('학교', document.school)}
  ${renderTextField('전공', document.major)}
  ${renderTextField('학점', document.grade)}
  ${renderTextField('졸업 시기', document.graduationTerm)}
  ${renderTextField('지식', document.knowledge)}
  ${renderTextField('스킬', document.skills)}
  ${renderTextField('직무 적합성', document.jobFit)}
  ${renderTextField('인재상', document.idealTalent)}
  ${experiences.map(renderExperience).join('')}
</body>
</html>`;
}

export function downloadExperienceWord(
  document,
  {
    BlobConstructor = globalThis.Blob,
    documentRef = globalThis.document,
    urlApi = globalThis.URL,
  } = {},
) {
  if (!BlobConstructor || !documentRef?.body?.append || !documentRef?.createElement || !urlApi?.createObjectURL || !urlApi?.revokeObjectURL) {
    throw new Error('이 브라우저에서는 파일 다운로드를 지원하지 않습니다.');
  }

  const blob = new BlobConstructor([createExperienceWordHtml(document)], {
    type: 'application/msword;charset=utf-8',
  });
  const objectUrl = urlApi.createObjectURL(blob);
  let link;

  try {
    link = documentRef.createElement('a');
    link.href = objectUrl;
    link.download = DEFAULT_EXPERIENCE_WORD_FILENAME;
    link.style.display = 'none';
    documentRef.body.append(link);
    link.click();
    return blob;
  } finally {
    try {
      link?.remove?.();
    } finally {
      urlApi.revokeObjectURL(objectUrl);
    }
  }
}
