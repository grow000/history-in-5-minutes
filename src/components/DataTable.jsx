// Учебная таблица: на широком экране — таблица, на телефоне — карточки
export default function DataTable({ table }) {
  if (!table?.rows?.length) return null
  return (
    <figure className="dtable">
      {table.title && <figcaption className="dtable__title">{table.title}</figcaption>}
      <div className="dtable__scroll">
        <table>
          <thead>
            <tr>
              {table.columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} data-label={table.columns[j]}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
