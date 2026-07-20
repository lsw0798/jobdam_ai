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

function itemSections(letter) {
  const items = Array.isArray(letter?.items) ? letter.items : [];
  return items.map((item, index) => `
    <section>
      <h2>${index + 1}. ${formatText(item?.title)}</h2>
      <p>${formatText(item?.content)}</p>
      <p><strong>키워드 코드:</strong> ${formatText(item?.keywordCode)}</p>
      <p><strong>사례 ID:</strong> ${formatText(item?.exampleCd)}</p>
    </section>`).join('');
}

export function createCoverLetterHtml(letter = {}) {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>AI 자기소개서</title>
  </head>
  <body>
    <h1>AI 기업·직무 맞춤 자소서</h1>
    <p><strong>지원기업:</strong> ${formatText(letter.applicationCompany)}</p>
    <p><strong>지원직무:</strong> ${formatText(letter.applicationRole)}</p>
    <p><strong>작성자:</strong> ${formatText(letter.authorName)}</p>
    <p><strong>작성일:</strong> ${formatText(letter.updatedAt ?? letter.createdAt)}</p>
    ${itemSections(letter)}
    <p>본 문서는 브라우저 계약 목업에서 생성되었습니다.</p>
  </body>
</html>`;
}

export function createCoverLetterExcelHtml(letter = {}) {
  const items = Array.isArray(letter.items) ? letter.items : [];
  const rows = items.map((item, index) => `<tr>
    <td>${index + 1}</td>
    <td>${formatText(item?.title)}</td>
    <td>${formatText(item?.content)}</td>
    <td>${formatText(item?.keywordCode)}</td>
    <td>${formatText(item?.exampleCd)}</td>
  </tr>`).join('');

  return `<!doctype html>
<html lang="ko">
  <head><meta charset="utf-8"><title>AI 자기소개서</title></head>
  <body>
    <table>
      <tbody>
        <tr><th>지원기업</th><td>${formatText(letter.applicationCompany)}</td></tr>
        <tr><th>지원직무</th><td>${formatText(letter.applicationRole)}</td></tr>
        <tr><th>작성자</th><td>${formatText(letter.authorName)}</td></tr>
        <tr><th>작성일</th><td>${formatText(letter.updatedAt ?? letter.createdAt)}</td></tr>
      </tbody>
    </table>
    <table>
      <thead><tr><th>순번</th><th>질문</th><th>내용</th><th>키워드 코드</th><th>사례 ID</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p>본 문서는 브라우저 계약 목업에서 생성되었습니다.</p>
  </body>
</html>`;
}

function downloadHtml(html, filename, mimeType, {
  BlobConstructor = globalThis.Blob,
  documentApi = globalThis.document,
  objectUrlApi = globalThis.URL,
} = {}) {
  if (!BlobConstructor || !documentApi?.body?.append || !documentApi?.createElement || !objectUrlApi?.createObjectURL || !objectUrlApi?.revokeObjectURL) {
    throw new Error('이 브라우저에서는 파일 다운로드를 지원하지 않습니다.');
  }

  const blob = new BlobConstructor([html], { type: mimeType });
  const objectUrl = objectUrlApi.createObjectURL(blob);
  let link;

  try {
    link = documentApi.createElement('a');
    link.href = objectUrl;
    link.download = filename;
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

export function downloadCoverLetterWord(letter, platform) {
  downloadHtml(
    createCoverLetterHtml(letter),
    'AI자소서.doc',
    'application/msword;charset=utf-8',
    platform,
  );
}

export function downloadCoverLetterExcel(letter, platform) {
  downloadHtml(
    createCoverLetterExcelHtml(letter),
    'AI자소서.xls',
    'application/vnd.ms-excel;charset=utf-8',
    platform,
  );
}

export function downloadCoverLetter(letter, platform) {
  return downloadCoverLetterWord(letter, platform);
}
