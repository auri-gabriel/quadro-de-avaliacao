import { type ChangeEvent, type RefObject } from 'react';
import type { EvaluationProject, EvaluationWorkspace } from '../types/board';

interface BoardHeaderProps {
  totalCards: number;
  activeLayers: number;
  stakeholdersCount: number;
  workspace: EvaluationWorkspace;
  activeProject?: EvaluationProject;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImportBoard: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onOpenFilePicker: () => void;
  onExportBoard: () => void;
  onResetBoard: () => void;
  onSelectProject: (event: ChangeEvent<HTMLSelectElement>) => void;
  onCreateProject: () => void;
  onCreateProjectVersion: () => void;
  onDeleteProject: () => void;
  canDeleteProject: boolean;
  onUpdateProjectField: (
    field: 'name' | 'focalProblem' | 'author',
    value: string,
  ) => void;
}

export function BoardHeader({
  totalCards,
  activeLayers,
  stakeholdersCount,
  workspace,
  activeProject,
  fileInputRef,
  onImportBoard,
  onOpenFilePicker,
  onExportBoard,
  onResetBoard,
  onSelectProject,
  onCreateProject,
  onCreateProjectVersion,
  onDeleteProject,
  canDeleteProject,
  onUpdateProjectField,
}: BoardHeaderProps) {
  return (
    <section className='board-header'>
      <div className='container-fluid board-layout py-4 py-xl-5'>
        <div className='board-header-grid'>
          <div className='d-flex flex-column gap-3'>
            <div>
              <h1 className='mb-2 fw-semibold'>Quadro de Avaliação</h1>
              <p className='board-subtitle mb-0'>
                Organize partes interessadas, problemas e soluções com cartões
                no estilo post-it.
              </p>
            </div>

            <div className='board-kpis'>
              <article className='kpi-card'>
                <span className='kpi-label'>Cartões</span>
                <strong className='kpi-value'>{totalCards}</strong>
              </article>
              <article className='kpi-card'>
                <span className='kpi-label'>Camadas ativas</span>
                <strong className='kpi-value'>{activeLayers}/3</strong>
              </article>
              <article className='kpi-card'>
                <span className='kpi-label'>Partes interessadas</span>
                <strong className='kpi-value'>{stakeholdersCount}</strong>
              </article>
            </div>
          </div>

          <div className='project-manager mt-0'>
            <div className='d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-2'>
              <h2 className='h6 mb-0 fw-semibold text-uppercase'>
                Gestão do projeto
              </h2>

              <div className='board-file-actions'>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.json,application/json'
                  className='d-none'
                  onChange={onImportBoard}
                />
                <button
                  type='button'
                  className='btn btn-outline-secondary'
                  onClick={onOpenFilePicker}
                >
                  <i className='bi bi-folder2-open me-1' aria-hidden='true' />
                  Abrir arquivo
                </button>
                <button
                  type='button'
                  className='btn btn-outline-secondary'
                  onClick={onExportBoard}
                >
                  <i className='bi bi-download me-1' aria-hidden='true' />
                  Salvar arquivo
                </button>
                <button
                  type='button'
                  className='btn btn-outline-secondary'
                  onClick={onResetBoard}
                >
                  <i className='bi bi-eraser me-1' aria-hidden='true' />
                  Limpar quadro
                </button>
              </div>
            </div>

            <div className='project-manager-row mt-2'>
              <label className='form-label mb-1' htmlFor='project-select'>
                Projeto
              </label>
              <div className='project-manager-actions'>
                <select
                  id='project-select'
                  className='form-select form-select-sm'
                  value={activeProject?.id ?? ''}
                  onChange={onSelectProject}
                >
                  {workspace.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} • v{project.version}
                    </option>
                  ))}
                </select>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={onCreateProject}
                >
                  <i className='bi bi-plus-square me-1' aria-hidden='true' />
                  Novo projeto
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={onCreateProjectVersion}
                  disabled={!activeProject}
                >
                  <i className='bi bi-copy me-1' aria-hidden='true' />
                  Nova versão
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-danger'
                  onClick={onDeleteProject}
                  disabled={!canDeleteProject}
                >
                  <i className='bi bi-trash me-1' aria-hidden='true' />
                  Excluir projeto
                </button>
              </div>
            </div>

            <div className='project-manager-grid'>
              <div>
                <label className='form-label mb-1' htmlFor='project-name'>
                  Nome
                </label>
                <input
                  id='project-name'
                  className='form-control form-control-sm'
                  value={activeProject?.name ?? ''}
                  onChange={(event) =>
                    onUpdateProjectField('name', event.target.value)
                  }
                  placeholder='Nome do projeto'
                />
              </div>
              <div>
                <label className='form-label mb-1' htmlFor='project-author'>
                  Autoria
                </label>
                <input
                  id='project-author'
                  className='form-control form-control-sm'
                  value={activeProject?.author ?? ''}
                  onChange={(event) =>
                    onUpdateProjectField('author', event.target.value)
                  }
                  placeholder='Nome do autor'
                />
              </div>
              <div className='project-manager-focal'>
                <label className='form-label mb-1' htmlFor='project-focal'>
                  Problema Focal
                </label>
                <input
                  id='project-focal'
                  className='form-control form-control-sm'
                  value={activeProject?.focalProblem ?? ''}
                  onChange={(event) =>
                    onUpdateProjectField('focalProblem', event.target.value)
                  }
                  placeholder='Descreva o problema focal'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
