import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { SessionForm } from './components/SessionForm';
import { FocusMode } from './components/FocusMode';
import { AuthPage } from './components/AuthPage';
import { AdminDashboard } from './components/AdminDashboard';
import { SocialHub } from './components/SocialHub';
import { WritingSession, UserSettings, INITIAL_SETTINGS, Project, User } from './types';
import { getSessions, saveSession, getSettings, saveSettings, getProjects, saveProject, clearAllData, setServiceUserId } from './services/sessionService';
import { getCurrentUser, logout } from './services/authService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'form' | 'focus' | 'admin' | 'social'>('dashboard');
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Inspection State (Admin viewing another user)
  const [inspectingUser, setInspectingUser] = useState<User | null>(null);
  const [inspectingData, setInspectingData] = useState<{ sessions: WritingSession[], projects: Project[], settings: UserSettings } | null>(null);

  // To hold data passed from Focus Mode to Form
  const [prefilledData, setPrefilledData] = useState<Partial<WritingSession>>({});

  // Initialize App and Check for User
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      handleLoginSuccess(currentUser);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    
    // Configure services to use this user's data
    setServiceUserId(loggedInUser.id);
    
    // Load their data
    setSessions(getSessions());
    setSettings(getSettings());
    setProjects(getProjects());
    
    setView('dashboard');
    setIsLoading(false);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setSessions([]); // Clear state for security
    setProjects([]);
    setInspectingUser(null);
  };

  const handleNewSession = () => {
    setPrefilledData({});
    setView('form');
  };

  const handleFocusMode = () => {
    setView('focus');
  };

  const handleSaveSession = (session: WritingSession) => {
    const updated = saveSession(session);
    setSessions(updated);
    setView('dashboard');
  };

  const handleSaveProject = (project: Project) => {
    const updatedProjects = saveProject(project);
    setProjects(updatedProjects);
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleClearData = () => {
    clearAllData();
    setSessions([]);
    setProjects([]);
    setSettings(INITIAL_SETTINGS);
  };

  const handleCancel = () => {
    setView('dashboard');
  };

  const handleFocusExit = (sessionData?: { startTime: string; endTime: string }) => {
    if (sessionData) {
       // If exiting with data (timer finished/stopped manually for logging), go to form
       setPrefilledData({
         startTime: sessionData.startTime,
         endTime: sessionData.endTime,
         wasMultitasking: false // Assume focus mode means single tasking
       });
       setView('form');
    } else {
       // Just closing without logging
       setView('dashboard');
    }
  };

  // Admin Logic
  const handleAdminPanel = () => {
    setView('admin');
    setInspectingUser(null);
  };

  const handleInspectUser = (targetUser: User, data: { sessions: WritingSession[], projects: Project[], settings: UserSettings }) => {
    setInspectingUser(targetUser);
    setInspectingData(data);
    // Don't change view, we will conditionally render Dashboard with read-only props inside the Admin logic or main flow
  };

  const handleCloseInspection = () => {
    setInspectingUser(null);
    setInspectingData(null);
    setView('admin');
  };

  // Social Logic
  const handleSocialPanel = () => {
    setView('social');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Carregando...</div>;
  }

  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // --- Render Logic ---

  // 1. Admin Mode - Inspection View
  if (inspectingUser && inspectingData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans border-8 border-amber-400">
        <Dashboard 
          user={inspectingUser}
          sessions={inspectingData.sessions} 
          projects={inspectingData.projects}
          settings={inspectingData.settings}
          onNewSession={() => {}} // Disabled
          onFocusMode={() => {}} // Disabled
          onUpdateSettings={() => {}} // Disabled
          onAddProject={() => {}} // Disabled
          onResetData={() => {}} // Disabled
          onLogout={() => {}} // Disabled
          readOnly={true}
          onAdminPanel={handleCloseInspection} // Acts as "Back" button
        />
      </div>
    );
  }

  // 2. Admin Mode - Dashboard List
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <AdminDashboard 
          currentUser={user}
          onExit={() => setView('dashboard')}
          onInspectUser={handleInspectUser}
        />
      </div>
    );
  }

  // 3. Social Mode
  if (view === 'social') {
    return (
      <SocialHub 
        currentUser={user}
        onExit={() => setView('dashboard')}
      />
    );
  }

  // 4. Normal User Views
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
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
          onSocial={handleSocialPanel}
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