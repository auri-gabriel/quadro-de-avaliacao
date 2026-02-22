import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  createInitialBoard,
  createProject,
  duplicateProjectVersion,
  loadWorkspace,
  saveWorkspace,
} from '../lib/boardStorage';
import type { EvaluationProject, EvaluationWorkspace } from '../types/board';

export type ProjectField = 'name' | 'focalProblem' | 'author';
export type UpdateActiveProject = (
  updater: (currentProject: EvaluationProject) => EvaluationProject,
) => void;

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

  const selectProject = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextProjectId = event.target.value;
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
    updateActiveProjectField,
  };
}
