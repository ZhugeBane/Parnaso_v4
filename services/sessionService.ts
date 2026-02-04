import { WritingSession, UserSettings, INITIAL_SETTINGS, Project } from '../types';

// We will set this ID when the app loads or user logs in
let currentUserId = 'guest';

// Helper to notify React components of changes
export const notifyStorageChange = () => {
  window.dispatchEvent(new Event('storage'));
};

export const setServiceUserId = (id: string) => {
  currentUserId = id;
};

const getKeys = (userId: string = currentUserId) => ({
  STORAGE_KEY: `parnaso_${userId}_sessions`,
  SETTINGS_KEY: `parnaso_${userId}_settings`,
  PROJECTS_KEY: `parnaso_${userId}_projects`
});

// --- Backup & Restore System ---

export const getAllDataJSON = (): string => {
  const data: Record<string, string | null> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('parnaso_')) {
      data[key] = localStorage.getItem(key);
    }
  }
  return JSON.stringify(data, null, 2);
};

export const importDataJSON = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    let count = 0;
    Object.keys(data).forEach(key => {
      if (key.startsWith('parnaso_')) {
        localStorage.setItem(key, data[key]);
        count++;
      }
    });
    notifyStorageChange();
    return count > 0;
  } catch (e) {
    console.error("Erro ao importar dados", e);
    return false;
  }
};

// --- Sessions ---
export const getSessions = (): WritingSession[] => {
  const { STORAGE_KEY } = getKeys();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return []; 
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

// HELPER FOR COMPETITIONS: Read other users sessions (ReadOnly)
export const getUserSessionsById = (userId: string): WritingSession[] => {
  const { STORAGE_KEY } = getKeys(userId);
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveSession = (session: WritingSession): WritingSession[] => {
  const { STORAGE_KEY } = getKeys();
  const sessions = getSessions();
  const newSessions = [session, ...sessions];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
  notifyStorageChange();
  return newSessions;
};

export const clearSessions = () => {
  const { STORAGE_KEY } = getKeys();
  localStorage.removeItem(STORAGE_KEY);
  notifyStorageChange();
};

// --- Settings ---
export const getSettings = (): UserSettings => {
  const { SETTINGS_KEY } = getKeys();
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    return INITIAL_SETTINGS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings): UserSettings => {
  const { SETTINGS_KEY } = getKeys();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  notifyStorageChange();
  return settings;
};

// --- Projects ---
export const getProjects = (): Project[] => {
  const { PROJECTS_KEY } = getKeys();
  const stored = localStorage.getItem(PROJECTS_KEY);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveProject = (project: Project): Project[] => {
  const { PROJECTS_KEY } = getKeys();
  const projects = getProjects();
  // Check if update or new
  const index = projects.findIndex(p => p.id === project.id);
  let newProjects;
  if (index >= 0) {
    newProjects = [...projects];
    newProjects[index] = project;
  } else {
    newProjects = [...projects, project];
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
  notifyStorageChange();
  return newProjects;
};

// --- Global Reset ---
export const clearAllData = () => {
  const { STORAGE_KEY, SETTINGS_KEY, PROJECTS_KEY } = getKeys();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(PROJECTS_KEY, JSON.stringify([]));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
  notifyStorageChange();
};

// --- Admin Specific Access ---

export const getUserDataForAdmin = (targetUserId: string) => {
  const keys = getKeys(targetUserId);
  
  const sessionsStr = localStorage.getItem(keys.STORAGE_KEY);
  const projectsStr = localStorage.getItem(keys.PROJECTS_KEY);
  const settingsStr = localStorage.getItem(keys.SETTINGS_KEY);

  return {
    sessions: sessionsStr ? JSON.parse(sessionsStr) : [],
    projects: projectsStr ? JSON.parse(projectsStr) : [],
    settings: settingsStr ? JSON.parse(settingsStr) : INITIAL_SETTINGS
  };
};

export const deleteUserData = (targetUserId: string) => {
  const keys = getKeys(targetUserId);
  localStorage.removeItem(keys.STORAGE_KEY);
  localStorage.removeItem(keys.PROJECTS_KEY);
  localStorage.removeItem(keys.SETTINGS_KEY);
  notifyStorageChange();
};

export const getGlobalStats = (userIds: string[]) => {
  let totalWords = 0;
  let totalSessions = 0;

  userIds.forEach(id => {
    const keys = getKeys(id);
    const sessionsStr = localStorage.getItem(keys.STORAGE_KEY);
    if (sessionsStr) {
      try {
        const sessions: WritingSession[] = JSON.parse(sessionsStr);
        totalSessions += sessions.length;
        totalWords += sessions.reduce((acc, s) => acc + s.wordCount, 0);
      } catch (e) {
        // ignore errors
      }
    }
  });

  return { totalWords, totalSessions };
};
