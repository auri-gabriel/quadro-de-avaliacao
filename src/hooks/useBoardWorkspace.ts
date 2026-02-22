import { useEffect, useMemo, useState } from 'react';
import {
  createInitialBoard,
  createProject,
  duplicateProjectVersion,
  loadWorkspace,
  saveWorkspace,
} from '../lib/boardStorage';
import type {
  EvaluationProject,
  EvaluationRow,
  EvaluationWorkspace,
} from '../types/board';

export type ProjectField = 'name' | 'focalProblem' | 'author';
export type UpdateActiveProject = (
  updater: (currentProject: EvaluationProject) => EvaluationProject,
) => void;

export interface ImportedProjectInput {
  name?: string;
  focalProblem?: string;
  author?: string;
  version?: number;
  rows: EvaluationRow[];
}

export function useBoardWorkspace() {
  const [workspace, setWorkspace] = useState<EvaluationWorkspace>(() =>
    loadWorkspace(),
  );

  const activeProject = useMemo(() => {
    const byId = workspace.projects.find(
      (project) => project.id === workspace.activeProjectId,
    );

    return byId ?? workspace.projects[0];
  }, [workspace]);

  const rows = activeProject?.rows ?? createInitialBoard();

  const updateActiveProject: UpdateActiveProject = (
    updater: (currentProject: EvaluationProject) => EvaluationProject,
  ) => {
    setWorkspace((currentWorkspace) => {
      const activeProjectIndex = currentWorkspace.projects.findIndex(
        (project) => project.id === currentWorkspace.activeProjectId,
      );

      if (activeProjectIndex < 0) {
        return currentWorkspace;
      }

      const nextProjects = currentWorkspace.projects.map((project, index) => {
        if (index !== activeProjectIndex) {
          return project;
        }

        const nextProject = updater(project);
        return {
          ...nextProject,
          updatedAt: new Date().toISOString(),
        };
      });

      return {
        ...currentWorkspace,
        projects: nextProjects,
      };
    });
  };

  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  const selectProject = (nextProjectId: string) => {
    if (!workspace.projects.some((project) => project.id === nextProjectId)) {
      return;
    }

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      activeProjectId: nextProjectId,
    }));
  };

  const createNewProject = () => {
    setWorkspace((currentWorkspace) => {
      const nextProject = createProject(
        `Projeto ${currentWorkspace.projects.length + 1}`,
      );

      return {
        activeProjectId: nextProject.id,
        projects: [...currentWorkspace.projects, nextProject],
      };
    });
  };

  const createNewVersion = () => {
    if (!activeProject) {
      return;
    }

    const versionedProject = duplicateProjectVersion(activeProject);
    setWorkspace((currentWorkspace) => ({
      activeProjectId: versionedProject.id,
      projects: [...currentWorkspace.projects, versionedProject],
    }));
  };

  const deleteActiveProject = () => {
    setWorkspace((currentWorkspace) => {
      if (currentWorkspace.projects.length <= 1) {
        return currentWorkspace;
      }

      const activeProjectIndex = currentWorkspace.projects.findIndex(
        (project) => project.id === currentWorkspace.activeProjectId,
      );

      if (activeProjectIndex < 0) {
        return currentWorkspace;
      }

      const nextProjects = currentWorkspace.projects.filter(
        (project) => project.id !== currentWorkspace.activeProjectId,
      );

      const fallbackIndex = Math.max(0, activeProjectIndex - 1);
      const nextActiveProjectId =
        nextProjects[fallbackIndex]?.id ?? nextProjects[0]?.id;

      if (!nextActiveProjectId) {
        return currentWorkspace;
      }

      return {
        activeProjectId: nextActiveProjectId,
        projects: nextProjects,
      };
    });
  };

  const importProjectAsNew = (payload: ImportedProjectInput) => {
    setWorkspace((currentWorkspace) => {
      const nextProject = createProject(
        payload.name?.trim() ||
          `Projeto ${currentWorkspace.projects.length + 1}`,
        {
          focalProblem: payload.focalProblem ?? '',
          author: payload.author ?? '',
          version:
            typeof payload.version === 'number' && payload.version > 0
              ? Math.floor(payload.version)
              : 1,
          rows: payload.rows,
        },
      );

      return {
        activeProjectId: nextProject.id,
        projects: [...currentWorkspace.projects, nextProject],
      };
    });
  };

  const updateActiveProjectField = (field: ProjectField, value: string) => {
    updateActiveProject((currentProject) => ({
      ...currentProject,
      [field]: value,
    }));
  };

  return {
    workspace,
    activeProject,
    rows,
    updateActiveProject,
    selectProject,
    createNewProject,
    createNewVersion,
    deleteActiveProject,
    updateActiveProjectField,
    importProjectAsNew,
  };
}
