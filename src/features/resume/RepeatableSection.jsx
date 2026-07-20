export function RepeatableSection({ columns, items, title, onAdd, onRemove, renderItem }) {
  const columnCount = columns.length + 1;

  return (
    <section aria-label={`${title} 입력`} className="resume-repeatable-section">
      <div className="resume-repeatable-section__heading">
        <h2>{title}</h2>
        <button type="button" onClick={onAdd}>{title} 추가</button>
      </div>

      <div className="resume-table-wrapper">
        <table
          className={`resume-data-table resume-data-table--${columnCount}-columns`}
        >
          <caption className="resume-data-table__caption">{title} 입력 표</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">{column.label}</th>
              ))}
              <th className="resume-data-table__manage-heading" scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr aria-label={`${title} ${index + 1}`} key={item.id}>
                {renderItem(item, index)}
                <td className="resume-data-table__manage-cell">
                  <button
                    aria-label={`${title} 항목 삭제`}
                    className="resume-data-table__remove-button"
                    type="button"
                    onClick={() => onRemove(item.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && <p>등록된 {title} 항목이 없습니다.</p>}
    </section>
  );
}
