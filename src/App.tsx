import { useEffect, useState } from 'react';
import { RichTextCell } from './components/RichTextCell';
import { createInitialBoard, loadBoard, saveBoard } from './lib/boardStorage';
import type { EvaluationRow } from './types/board';

function App() {
  const [rows, setRows] = useState<EvaluationRow[]>(() => loadBoard());

  useEffect(() => {
    saveBoard(rows);
  }, [rows]);

  const handleCellChange = (
    rowIndex: number,
    field: 'stakeholders' | 'issues' | 'ideas',
    value: string,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleResetBoard = () => {
    setRows(createInitialBoard());
  };

  return (
    <div className='app-shell'>
      <header className='board-header'>
        <div className='container py-4'>
          <h1 className='mb-0 fw-semibold'>Análise: Quadro de Avaliação</h1>
        </div>
      </header>

      <main className='container py-4 py-md-5'>
        <div className='row g-4 align-items-start'>
          <div className='col-12 col-xl-9'>
            <div className='table-responsive board-table-wrapper'>
              <table className='table table-bordered align-middle mb-0 board-table'>
                <thead>
                  <tr>
                    <th scope='col'>Camadas</th>
                    <th scope='col'>Partes Interessadas</th>
                    <th scope='col'>Questões / Problemas</th>
                    <th scope='col'>Ideias / Soluções</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={row.layerId}>
                      <th scope='row' className='board-group-cell'>
                        {row.layerLabel}
                      </th>
                      <td>
                        <RichTextCell
                          id={`stakeholders-${row.layerId}`}
                          label={`Partes interessadas para ${row.layerLabel}`}
                          value={row.stakeholders}
                          onChange={(nextValue) =>
                            handleCellChange(
                              rowIndex,
                              'stakeholders',
                              nextValue,
                            )
                          }
                          placeholder='Registrar partes interessadas'
                        />
                      </td>
                      <td>
                        <RichTextCell
                          id={`issues-${row.layerId}`}
                          label={`Questões e problemas para ${row.layerLabel}`}
                          value={row.issues}
                          onChange={(nextValue) =>
                            handleCellChange(rowIndex, 'issues', nextValue)
                          }
                          placeholder='Registrar questões e problemas'
                        />
                      </td>
                      <td>
                        <RichTextCell
                          id={`ideas-${row.layerId}`}
                          label={`Ideias e soluções para ${row.layerLabel}`}
                          value={row.ideas}
                          onChange={(nextValue) =>
                            handleCellChange(rowIndex, 'ideas', nextValue)
                          }
                          placeholder='Registrar ideias e soluções'
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className='mt-3'>
              <button
                type='button'
                className='btn btn-outline-secondary'
                onClick={handleResetBoard}
              >
                Limpar quadro
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
