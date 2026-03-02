import { type ChangeEvent, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import type { EvaluationProject, EvaluationWorkspace } from '../types/board';

type ProjectDraftField = 'name' | 'focalProblem' | 'author';

interface ProjectMetadataDraft {
  name: string;
  focalProblem: string;
  author: string;
}

interface BoardTemplateOption {
  id: string;
  name: string;
}

interface BoardHeaderProps {
  totalCards: number;
  activeLayers: number;
  totalLayers: number;
  primaryColumnLabel: string;
  primaryColumnCount: number;
  workspace: EvaluationWorkspace;
  activeProject?: EvaluationProject;
  templateOptions: BoardTemplateOption[];
  selectedTemplateId: string;
  canChangeTemplate: boolean;
  onChangeTemplate: (templateId: string) => void;
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
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  projectDraft: ProjectMetadataDraft;
  isProjectDraftDirty: boolean;
  onChangeProjectDraftField: (field: ProjectDraftField, value: string) => void;
  onSaveProjectDraft: () => void;
  onCancelProjectDraft: () => void;
}

export function BoardHeader({
  totalCards,
  activeLayers,
  totalLayers,
  primaryColumnLabel,
  primaryColumnCount,
  workspace,
  activeProject,
  templateOptions,
  selectedTemplateId,
  canChangeTemplate,
  onChangeTemplate,
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
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  projectDraft,
  isProjectDraftDirty,
  onChangeProjectDraftField,
  onSaveProjectDraft,
  onCancelProjectDraft,
}: BoardHeaderProps) {
  const { t } = useTranslation();

  return (
    <section className='board-header'>
      <div className='container-fluid board-layout py-4 py-xl-5'>
        <div className='board-header-grid'>
          <div className='board-header-overview'>
            <div>
              <span className='board-overline'>
                {t('boardHeader.overline')}
              </span>
              <h1 className='mb-2 fw-semibold'>{t('app.title')}</h1>
              <p className='board-subtitle mb-0'>{t('boardHeader.subtitle')}</p>
            </div>

            <article className='board-current-project'>
              <div className='board-current-project-main'>
                <span className='board-current-project-label'>
                  {t('boardHeader.activeProject')}
                </span>
                <strong className='board-current-project-name'>
                  {activeProject?.name ?? t('boardHeader.noProjectSelected')}
                </strong>
                <small className='board-current-project-meta'>
                  {t('boardHeader.version', {
                    version: activeProject?.version ?? '-',
                  })}
                  {activeProject?.author
                    ? ` • ${activeProject.author}`
                    : ` • ${t('boardHeader.authorUnknown')}`}
                </small>
              </div>
              <p className='board-current-project-focal mb-0'>
                {activeProject?.focalProblem
                  ? t('boardHeader.focalProblemPrefix', {
                      value: activeProject.focalProblem,
                    })
                  : t('boardHeader.focalProblemHint')}
              </p>
            </article>

            <div className='board-kpis'>
              <article className='kpi-card'>
                <div className='kpi-head'>
                  <span className='kpi-label'>{t('boardHeader.kpiCards')}</span>
                  <i className='bi bi-stickies' aria-hidden='true' />
                </div>
                <strong className='kpi-value'>{totalCards}</strong>
                <small className='kpi-helper'>
                  {t('boardHeader.kpiCardsHint')}
                </small>
              </article>
              <article className='kpi-card'>
                <div className='kpi-head'>
                  <span className='kpi-label'>
                    {t('boardHeader.kpiActiveLayers')}
                  </span>
                  <i className='bi bi-layers' aria-hidden='true' />
                </div>
                <strong className='kpi-value'>
                  {activeLayers}/{totalLayers}
                </strong>
                <small className='kpi-helper'>
                  {t('boardHeader.kpiActiveLayersHint')}
                </small>
              </article>
              <article className='kpi-card'>
                <div className='kpi-head'>
                  <span className='kpi-label'>{primaryColumnLabel}</span>
                  <i className='bi bi-people' aria-hidden='true' />
                </div>
                <strong className='kpi-value'>{primaryColumnCount}</strong>
                <small className='kpi-helper'>
                  {t('boardHeader.kpiBaseLayerHint')}
                </small>
              </article>
            </div>
          </div>

          <div className='project-manager mt-0'>
            <div className='d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-2'>
              <h2 className='h6 mb-0 fw-semibold text-uppercase'>
                {t('boardHeader.projectManagement')}
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
                  {t('boardHeader.openFile')}
                </button>
                <button
                  type='button'
                  className='btn btn-outline-secondary'
                  onClick={onExportBoard}
                >
                  <i className='bi bi-download me-1' aria-hidden='true' />
                  {t('boardHeader.exportJson')}
                </button>
              </div>
            </div>

            <div className='project-manager-row mt-2'>
              <label className='form-label mb-1' htmlFor='project-select'>
                {t('boardHeader.project')}
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
                  {t('boardHeader.newProject')}
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={onCreateProjectVersion}
                  disabled={!activeProject}
                >
                  <i className='bi bi-copy me-1' aria-hidden='true' />
                  {t('boardHeader.newVersion')}
                </button>
              </div>
            </div>

            <div className='project-manager-row mt-2'>
              <label className='form-label mb-1' htmlFor='template-select'>
                {t('boardHeader.boardTemplate')}
              </label>
              <div className='project-manager-actions'>
                <select
                  id='template-select'
                  className='form-select form-select-sm'
                  value={selectedTemplateId}
                  onChange={(event) => onChangeTemplate(event.target.value)}
                  disabled={!activeProject || !canChangeTemplate}
                >
                  {templateOptions.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='project-manager-grid'>
              <div>
                <label className='form-label mb-1' htmlFor='project-name'>
                  {t('boardHeader.name')}
                </label>
                <input
                  id='project-name'
                  className='form-control form-control-sm'
                  value={projectDraft.name}
                  disabled={!activeProject}
                  onChange={(event) =>
                    onChangeProjectDraftField('name', event.target.value)
                  }
                  placeholder={t('boardHeader.namePlaceholder')}
                />
              </div>
              <div>
                <label className='form-label mb-1' htmlFor='project-author'>
                  {t('boardHeader.author')}
                </label>
                <input
                  id='project-author'
                  className='form-control form-control-sm'
                  value={projectDraft.author}
                  disabled={!activeProject}
                  onChange={(event) =>
                    onChangeProjectDraftField('author', event.target.value)
                  }
                  placeholder={t('boardHeader.authorPlaceholder')}
                />
              </div>
              <div className='project-manager-focal'>
                <label className='form-label mb-1' htmlFor='project-focal'>
                  {t('boardHeader.focalProblem')}
                </label>
                <textarea
                  id='project-focal'
                  className='form-control form-control-sm'
                  value={projectDraft.focalProblem}
                  disabled={!activeProject}
                  rows={3}
                  onChange={(event) =>
                    onChangeProjectDraftField(
                      'focalProblem',
                      event.target.value,
                    )
                  }
                  placeholder={t('boardHeader.focalProblemPlaceholder')}
                />
              </div>
            </div>

            <div className='project-manager-footer'>
              <small className='text-body-secondary'>
                {isProjectDraftDirty
                  ? t('boardHeader.dirtyState')
                  : t('boardHeader.syncedState')}
              </small>
              <div className='project-manager-footer-actions'>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={onUndo}
                  disabled={!canUndo}
                >
                  <i
                    className='bi bi-arrow-counterclockwise me-1'
                    aria-hidden='true'
                  />
                  {t('boardHeader.undo')}
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={onRedo}
                  disabled={!canRedo}
                >
                  <i
                    className='bi bi-arrow-clockwise me-1'
                    aria-hidden='true'
                  />
                  {t('boardHeader.redo')}
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={onCancelProjectDraft}
                  disabled={!isProjectDraftDirty}
                >
                  {t('boardHeader.cancelChanges')}
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-primary'
                  onClick={onSaveProjectDraft}
                  disabled={!isProjectDraftDirty}
                >
                  <i className='bi bi-check2 me-1' aria-hidden='true' />
                  {t('boardHeader.saveData')}
                </button>
              </div>
            </div>

            <div className='project-manager-danger-zone'>
              <span className='project-manager-danger-label'>
                {t('boardHeader.destructiveActions')}
              </span>
              <div className='project-manager-danger-actions'>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-danger'
                  onClick={onResetBoard}
                >
                  <i className='bi bi-eraser me-1' aria-hidden='true' />
                  {t('boardHeader.clearBoard')}
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-danger'
                  onClick={onDeleteProject}
                  disabled={!canDeleteProject}
                >
                  <i className='bi bi-trash me-1' aria-hidden='true' />
                  {t('boardHeader.deleteProject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
