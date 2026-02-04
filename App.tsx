import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { SessionForm } from './components/SessionForm';
import { FocusMode } from './components/FocusMode';
import { AuthPage } from './components/AuthPage';
import { AdminDashboard } from './components/AdminDashboard';
import { SetupPage } from './components/SetupPage'; 
import { WritingSession, UserSettings, INITIAL_SETTINGS, Project, User } from './types';
import { getSessions, saveSession, getSettings, saveSettings, getProjects, saveProject, clearAllData } from './services/sessionService';
import { getCurrentUser, logout } from './services/authService';
import { isSupabaseConfigured, clearSupabaseConfig } from './lib/supabase'; 

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'form' | 'focus' | 'admin'>('dashboard');
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  
  // States to handle Async Loading
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [prefilledData, setPrefilledData] = useState<Partial<WritingSession>>({});

  // 0. Check Configuration
  // We check this before any hooks that might depend on it
  const isConfigured = isSupabaseConfigured();
  
  if (!isConfigured) {
    return <SetupPage />;
  }

  // 1. Check Auth on Mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.id);
      }
    } catch (error) {
      console.error("Auth check failed", error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadUserData = async (userId: string) => {
    setIsLoadingData(true);
    try {
      const [fetchedSessions, fetchedProjects, fetchedSettings] = await Promise.all([
        getSessions(userId),
        getProjects(userId),
        getSettings(userId)
      ]);
      setSessions(fetchedSessions);
      setProjects(fetchedProjects);
      setSettings(fetchedSettings);
    } catch (e) {
      console.error("Failed to load user data", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLoginSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);
    await loadUserData(loggedInUser.id);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setSessions([]);
    setProjects([]);
  };

  const handleDisconnectServer = () => {
    if(window.confirm("Deseja desconectar deste servidor Supabase?")) {
      clearSupabaseConfig();
    }
  };

  const handleNewSession = () => {
    setPrefilledData({});
    setView('form');
  };

  const handleFocusMode = () => {
    setView('focus');
  };

  const handleSaveSession = async (session: WritingSession) => {
    if (!user) return;
    // Optimistic Update
    setSessions(prev => [session, ...prev]);
    setView('dashboard');
    // Actual Save
    await saveSession(session, user.id);
    // Reload to ensure sync/IDs
    const freshSessions = await getSessions(user.id);
    setSessions(freshSessions);
  };

  const handleSaveProject = async (project: Project) => {
    if (!user) return;
    await saveProject(project, user.id);
    const freshProjects = await getProjects(user.id);
    setProjects(freshProjects);
  };

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    setSettings(newSettings);
    await saveSettings(newSettings, user.id);
  };

  const handleClearData = async () => {
    if (!user) return;
    await clearAllData(user.id);
    setSessions([]);
    setProjects([]);
    setSettings(INITIAL_SETTINGS);
  };

  const handleCancel = () => {
    setView('dashboard');
  };

  const handleFocusExit = (sessionData?: { startTime: string; endTime: string }) => {
    if (sessionData) {
       setPrefilledData({
         startTime: sessionData.startTime,
         endTime: sessionData.endTime,
         wasMultitasking: false
       });
       setView('form');
    } else {
       setView('dashboard');
    }
  };

  // Admin Logic
  const handleAdminPanel = () => {
    setView('admin');
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Conectando ao servidor...</div>;
  }

  if (!user) {
    return (
      <div className="relative">
        <AuthPage onLoginSuccess={handleLoginSuccess} />
        <button 
          onClick={handleDisconnectServer}
          className="fixed top-4 right-4 text-xs text-slate-400 hover:text-slate-600 underline z-50"
        >
          Alterar Servidor
        </button>
      </div>
    );
  }

  // Admin Mode
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <AdminDashboard 
          currentUser={user}
          onExit={() => setView('dashboard')}
          onInspectUser={() => {}} 
        />
      </div>
    );
  }

  // Normal User Views
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {isLoadingData && (
        <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 z-50">
          <div className="h-full bg-teal-500 animate-pulse w-1/3"></div>
        </div>
      )}
      
      {view === 'dashboard' && (
        <Dashboard 
          user={user}
          sessions={sessions} 
          projects={projects}
          settings={settings}
          onNewSession={handleNewSession} 
          onFocusMode={handleFocusMode}
          onUpdateSettings={handleUpdateSettings}
          onAddProject={handleSaveProject}
          onResetData={handleClearData}
          onLogout={handleLogout}
          onAdminPanel={handleAdminPanel}
          onSocial={() => alert("Recurso Social em manutenção.")}
        />
      )}
      
      {view === 'form' && (
        <div className="animate-fade-in">
          <SessionForm 
            projects={projects}
            onSubmit={handleSaveSession} 
            onCancel={handleCancel} 
            initialValues={prefilledData}
          />
        </div>
      )}

      {view === 'focus' && (
        <FocusMode onExit={handleFocusExit} />
      )}
    </div>
  );
}

export default App;
