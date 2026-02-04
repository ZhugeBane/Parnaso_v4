import { WritingSession, UserSettings, INITIAL_SETTINGS, Project } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// --- Sessions (Async) ---

export const getSessions = async (userId: string): Promise<WritingSession[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from('writing_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }

  // Map SQL columns back to WritingSession type
  return data.map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    date: row.date,
    wordCount: row.word_count,
    startTime: row.session_data.startTime,
    endTime: row.session_data.endTime,
    stressLevel: row.session_data.stressLevel,
    usedSkeleton: row.session_data.usedSkeleton,
    usedDrafts: row.session_data.usedDrafts,
    autoCorrectionFrequency: row.session_data.autoCorrectionFrequency,
    difficultyLevel: row.session_data.difficultyLevel,
    specificDifficulties: row.session_data.specificDifficulties,
    wasMultitasking: row.session_data.wasMultitasking,
    multitaskingDescription: row.session_data.multitaskingDescription,
    usedTimeStrategy: row.session_data.usedTimeStrategy,
    timeStrategyDescription: row.session_data.timeStrategyDescription,
    selfRewarded: row.session_data.selfRewarded,
    rewardDescription: row.session_data.rewardDescription,
    sessionRating: row.session_data.sessionRating,
  }));
};

export const saveSession = async (session: WritingSession, userId: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  // Split flat object into SQL columns and JSONB data
  const { id, projectId, date, wordCount, ...sessionData } = session;

  const { error } = await supabase!.from('writing_sessions').insert({
    user_id: userId,
    project_id: projectId || null,
    date: date,
    word_count: wordCount,
    session_data: sessionData
  });

  if (error) console.error("Error saving session", error);
};

// --- Settings (Async) ---

export const getSettings = async (userId: string): Promise<UserSettings> => {
  if (!isSupabaseConfigured()) return INITIAL_SETTINGS;

  const { data } = await supabase!
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) {
    return {
      dailyWordGoal: data.daily_goal,
      weeklyWordGoal: data.weekly_goal
    };
  }
  return INITIAL_SETTINGS;
};

export const saveSettings = async (settings: UserSettings, userId: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase!.from('user_settings').upsert({
    user_id: userId,
    daily_goal: settings.dailyWordGoal,
    weekly_goal: settings.weeklyWordGoal
  });
  
  if (error) console.error(error);
};

// --- Projects (Async) ---

export const getProjects = async (userId: string): Promise<Project[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabase!
    .from('projects')
    .select('*')
    .eq('user_id', userId);

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    targetWordCount: p.target_word_count,
    color: p.color,
    status: p.status as any,
    createdAt: p.created_at
  }));
};

export const saveProject = async (project: Project, userId: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  const payload = {
    user_id: userId,
    name: project.name,
    description: project.description,
    target_word_count: project.targetWordCount,
    color: project.color,
    status: project.status
  };

  // If ID looks like a UUID (from Supabase), we upsert. If it's a timestamp (local legacy), we insert new.
  if (project.id.length > 20) {
    await supabase!.from('projects').update(payload).eq('id', project.id);
  } else {
    await supabase!.from('projects').insert(payload);
  }
};

// --- Admin Helpers ---

export const getGlobalStats = async () => {
  if (!isSupabaseConfigured()) return { totalWords: 0, totalSessions: 0 };
  
  // Aggregate using SQL count/sum would be better, but fetching all for now to keep logic simple relative to previous
  const { data } = await supabase!.from('writing_sessions').select('word_count');
  
  const totalSessions = data?.length || 0;
  const totalWords = data?.reduce((acc, curr) => acc + (curr.word_count || 0), 0) || 0;

  return { totalWords, totalSessions };
};

// --- Migration / Fallback ---
export const clearAllData = async (userId: string) => {
  if (!isSupabaseConfigured()) return;
  await supabase!.from('writing_sessions').delete().eq('user_id', userId);
  await supabase!.from('projects').delete().eq('user_id', userId);
};
