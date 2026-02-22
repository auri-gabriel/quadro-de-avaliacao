import { type ChangeEvent, type RefObject } from 'react';
import type { EvaluationProject, EvaluationWorkspace } from '../types/board';

type ProjectDraftField = 'name' | 'focalProblem' | 'author';

interface ProjectMetadataDraft {
  name: string;
  focalProblem: string;
  author: string;
}

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
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onCreateProjectVersion: () => void;
  onDeleteProject: () => void;
  canDeleteProject: boolean;
  projectDraft: ProjectMetadataDraft;
  isProjectDraftDirty: boolean;
  onChangeProjectDraftField: (field: ProjectDraftField, value: string) => void;
  onSaveProjectDraft: () => void;
  onCancelProjectDraft: () => void;
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
  projectDraft,
  isProjectDraftDirty,
  onChangeProjectDraftField,
  onSaveProjectDraft,
  onCancelProjectDraft,
}: BoardHeaderProps) {
  return (
    <section className='board-header'>
      <div className='container-fluid board-layout py-4 py-xl-5'>
        <div className='board-header-grid'>
          <div className='board-header-overview'>
            <div>
              <span className='board-overline'>Painel colaborativo</span>
              <h1 className='mb-2 fw-semibold'>Quadro de Avaliação</h1>
              <p className='board-subtitle mb-0'>
                Organize partes interessadas, problemas e soluções com cartões
                no estilo post-it.
              </p>
            </div>

            <article className='board-current-project'>
              <div className='board-current-project-main'>
                <span className='board-current-project-label'>
                  Projeto ativo
                </span>
                <strong className='board-current-project-name'>
                  {activeProject?.name ?? 'Sem projeto selecionado'}
                </strong>
                <small className='board-current-project-meta'>
                  Versão v{activeProject?.version ?? '-'}
                  {activeProject?.author
                    ? ` • ${activeProject.author}`
                    : ' • Autoria não informada'}
                </small>
              </div>
              <p className='board-current-project-focal mb-0'>
                {activeProject?.focalProblem
                  ? `Problema focal: ${activeProject.focalProblem}`
                  : 'Defina o problema focal para guiar a análise das camadas.'}
              </p>
            </article>

            <div className='board-kpis'>
              <article className='kpi-card'>
                <div className='kpi-head'>
                  <span className='kpi-label'>Cartões</span>
                  <i className='bi bi-stickies' aria-hidden='true' />
                </div>
                <strong className='kpi-value'>{totalCards}</strong>
                <small className='kpi-helper'>
                  Itens registrados no quadro
                </small>
              </article>
              <article className='kpi-card'>
                <div className='kpi-head'>
                  <span className='kpi-label'>Camadas ativas</span>
                  <i className='bi bi-layers' aria-hidden='true' />
                </div>
                <strong className='kpi-value'>{activeLayers}/3</strong>
                <small className='kpi-helper'>
                  Níveis com conteúdo preenchido
                </small>
              </article>
              <article className='kpi-card'>
                <div className='kpi-head'>
                  <span className='kpi-label'>Partes interessadas</span>
                  <i className='bi bi-people' aria-hidden='true' />
                </div>
                <strong className='kpi-value'>{stakeholdersCount}</strong>
                <small className='kpi-helper'>Registros na camada base</small>
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
                  Exportar JSON
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
                  onChange={(event) => onSelectProject(event.target.value)}
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
                  value={projectDraft.name}
                  disabled={!activeProject}
                  onChange={(event) =>
                    onChangeProjectDraftField('name', event.target.value)
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
                  value={projectDraft.author}
                  disabled={!activeProject}
                  onChange={(event) =>
                    onChangeProjectDraftField('author', event.target.value)
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
                  value={projectDraft.focalProblem}
                  disabled={!activeProject}
                  onChange={(event) =>
                    onChangeProjectDraftField(
                      'focalProblem',
                      event.target.value,
                    )
                  }
                  placeholder='Descreva o problema focal'
                />
              </div>
            </div>

            <div className='project-manager-footer'>
              <small className='text-body-secondary'>
                {isProjectDraftDirty
                  ? 'Existem alterações não salvas nos dados do projeto.'
                  : 'Dados do projeto sincronizados.'}
              </small>
              <div className='project-manager-footer-actions'>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={onCancelProjectDraft}
                  disabled={!isProjectDraftDirty}
                >
                  Cancelar alterações
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-primary'
                  onClick={onSaveProjectDraft}
                  disabled={!isProjectDraftDirty}
                >
                  <i className='bi bi-check2 me-1' aria-hidden='true' />
                  Salvar dados
                </button>
              </div>
            </div>

            <div className='project-manager-danger-zone'>
              <span className='project-manager-danger-label'>
                Ações destrutivas
              </span>
              <div className='project-manager-danger-actions'>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-danger'
                  onClick={onResetBoard}
                >
                  <i className='bi bi-eraser me-1' aria-hidden='true' />
                  Limpar quadro
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
          </div>
        </div>
      </div>
    </section>
  );
}
