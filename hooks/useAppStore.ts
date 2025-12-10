
import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, isBefore, addMonths } from 'date-fns';
import zhTW from 'date-fns/locale/zh-TW';
import enUS from 'date-fns/locale/en-US';
import { 
  Project, 
  ScheduleItem, 
  CategoryConfig, 
  AppSettings, 
  ProjectStatus, 
  Language,
  StatusDefinition,
  ProjectType
} from '../types';

// --- Constants & Defaults ---

const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  VIDEO: { label: 'Video / Content', color: 'bg-red-600', iconKey: 'Video' },
  ART: { label: 'Art / Illustration', color: 'bg-sky-600', iconKey: 'Image' },
  WRITING: { label: 'Writing / Lore', color: 'bg-amber-600', iconKey: 'FileText' },
  AUDIO: { label: 'Audio / Podcast', color: 'bg-emerald-600', iconKey: 'Mic' },
  '3D': { label: '3D / Assets', color: 'bg-violet-600', iconKey: 'Box' },
  LIVE: { label: 'Live / Stream', color: 'bg-cyan-600', iconKey: 'Zap' },
  SOCIAL: { label: 'Social / Promo', color: 'bg-orange-600', iconKey: 'Globe' },
  OTHER: { label: 'Other', color: 'bg-pink-900', iconKey: 'Layers' }
};

const DEFAULT_STATUS_DEFS: StatusDefinition[] = [
  { id: ProjectStatus.PLANNING, label: 'Planning' },
  { id: ProjectStatus.IN_PROGRESS, label: 'In Progress' },
  { id: ProjectStatus.COMPLETED, label: 'Completed', isCompleted: true },
  { id: ProjectStatus.PAUSED, label: 'Paused' }
];

const getDefaultLanguage = (): Language => {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().includes('zh') ? 'zh-TW' : 'en';
  }
  return 'en';
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  warningDays: 7,
  criticalDays: 3,
  language: getDefaultLanguage(),
  theme: 'dark',
  statusMode: 'DEFAULT',
  customStatuses: [...DEFAULT_STATUS_DEFS],
  calendarViewMode: 'COMPACT',
  categoryOrder: ['VIDEO', 'ART', 'WRITING', 'AUDIO', '3D', 'LIVE', 'SOCIAL', 'OTHER']
};

const INITIAL_PROJECTS: Project[] = [
  { 
    id: 'p1', name: 'Cyberpunk Character Pack', description: 'Tier 1 Rewards', tags: ['Sci-Fi', 'NSFW'], 
    status: ProjectStatus.IN_PROGRESS, type: 'ART', color: '',
    checklist: [
      { id: 'c1', text: 'Sketch variations', isCompleted: true },
      { id: 'c2', text: 'Lineart', isCompleted: true },
      { id: 'c3', text: 'Flat colors', isCompleted: false },
      { id: 'c4', text: 'Shading & Highlights', isCompleted: false },
      { id: 'c5', text: 'Export High-Res', isCompleted: false },
    ]
  },
  { id: 'p4', name: 'Sketchbook Scan Vol. 5', description: 'Raw PDF', tags: ['Bonus'], status: ProjectStatus.IN_PROGRESS, type: 'ART', color: '' },
  { id: 'p6', name: 'Speedpaint: Neon City', description: 'Timelapse video', tags: ['YouTube', 'Short'], status: ProjectStatus.IN_PROGRESS, type: 'VIDEO', color: '' },
  { id: 'p2', name: 'Fantasy Map Tutorial', description: 'Step-by-step', tags: ['Tutorial', 'Voiceover'], status: ProjectStatus.PLANNING, type: 'VIDEO', color: '' },
  { id: 'p3', name: 'Podcast Episode #42', description: 'Audio file', tags: ['Guest'], status: ProjectStatus.COMPLETED, type: 'AUDIO', color: '' },
];

const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id: 's1', date: format(new Date(), 'yyyy-MM-dd'), projectId: 'p1', note: 'Early Access' },
];

// LocalStorage Keys
const STORAGE_KEYS = {
  PROJECTS: 'patreon_scheduler_projects_v2',
  SCHEDULE: 'patreon_scheduler_schedule_v2',
  CONFIG: 'patreon_scheduler_config_v1',
  SETTINGS: 'patreon_scheduler_settings_v1',
};

interface HistoryState {
  projects: Project[];
  schedule: ScheduleItem[];
}

export const useAppStore = () => {
  // --- State Initialization ---
  
  const [categoryConfig, setCategoryConfig] = useState<CategoryConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const parsed = saved ? JSON.parse(saved) : null;
      return (parsed && typeof parsed === 'object') ? parsed : DEFAULT_CATEGORY_CONFIG;
    } catch { return DEFAULT_CATEGORY_CONFIG; }
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings = saved ? JSON.parse(saved) : { ...DEFAULT_APP_SETTINGS };
      if (!settings.language) settings.language = getDefaultLanguage();
      if (!settings.theme) settings.theme = 'dark';
      if (!settings.statusMode) settings.statusMode = 'DEFAULT';
      if (!settings.customStatuses) settings.customStatuses = [...DEFAULT_STATUS_DEFS];
      if (!settings.calendarViewMode) settings.calendarViewMode = 'COMPACT';
      // Migration: Ensure categoryOrder exists
      if (!settings.categoryOrder || settings.categoryOrder.length === 0) {
          settings.categoryOrder = [...DEFAULT_APP_SETTINGS.categoryOrder];
      }
      return settings;
    } catch { return { ...DEFAULT_APP_SETTINGS }; }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      let parsed: Project[] = saved ? JSON.parse(saved) : INITIAL_PROJECTS;
      if (!Array.isArray(parsed)) return INITIAL_PROJECTS;
      
      // Auto-repair legacy data
      return parsed.map(p => {
         const typeConfig = p.type ? (categoryConfig || DEFAULT_CATEGORY_CONFIG)[p.type] : undefined;
         return {
           ...p,
           tags: Array.isArray(p.tags) ? p.tags : [],
           color: (typeConfig ? typeConfig.color : null) || 'bg-zinc-800',
           checklist: Array.isArray(p.checklist) ? p.checklist : []
         };
      });
    } catch { return INITIAL_PROJECTS; }
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
    } catch { return INITIAL_SCHEDULE; }
  });

  const [history, setHistory] = useState<HistoryState[]>([]);

  // --- Persistence & Effects ---

  useEffect(() => localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule)), [schedule]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(categoryConfig)), [categoryConfig]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings)), [appSettings]);

  useEffect(() => {
    if (appSettings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [appSettings.theme]);

  // Data Migration for new Categories
  useEffect(() => {
     setCategoryConfig(prev => {
        const requiredKeys = Object.keys(DEFAULT_CATEGORY_CONFIG);
        const missingKeys = requiredKeys.filter(key => !prev[key as keyof CategoryConfig]);
        if (missingKeys.length > 0) {
           const updated = { ...prev };
           missingKeys.forEach(key => {
              updated[key as keyof CategoryConfig] = DEFAULT_CATEGORY_CONFIG[key as keyof CategoryConfig];
           });
           return updated;
        }
        return prev;
     });
  }, []);

  // --- Computed Values ---

  const lang = appSettings.language;
  const dateLocale = lang === 'zh-TW' ? zhTW : enUS;

  const activeStatuses = useMemo(() => {
    return appSettings.statusMode === 'CUSTOM' ? appSettings.customStatuses : DEFAULT_STATUS_DEFS;
  }, [appSettings.statusMode, appSettings.customStatuses]);

  const scheduleLookup = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    schedule.forEach(item => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }, [schedule]);

  const isScheduledInPast = useCallback((projectId: string) => {
    const item = schedule.find(s => s.projectId === projectId);
    if (!item) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    return isBefore(new Date(item.date + 'T00:00:00'), today);
  }, [schedule]);

  const getProjectScheduledDate = useCallback((projectId: string) => {
    const item = schedule.find(s => s.projectId === projectId);
    return item ? item.date : undefined;
  }, [schedule]);

  const pipelineProjects = useMemo(() => {
    return projects.filter(p => !isScheduledInPast(p.id) && p.status !== ProjectStatus.ARCHIVED);
  }, [projects, isScheduledInPast]);

  const publishedProjects = useMemo(() => {
    return projects
      .filter(p => isScheduledInPast(p.id) || p.status === ProjectStatus.ARCHIVED)
      .sort((a, b) => {
        const dateA = getProjectScheduledDate(a.id);
        const dateB = getProjectScheduledDate(b.id);
        if (dateA && dateB) return dateB.localeCompare(dateA);
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
      });
  }, [projects, isScheduledInPast, getProjectScheduledDate]);

  // --- Actions ---

  const saveHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev, { projects: [...projects], schedule: [...schedule] }];
      return newHistory.slice(-20);
    });
  }, [projects, schedule]);

  const handleUndo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const lastState = prev[prev.length - 1];
      setProjects(lastState.projects);
      setSchedule(lastState.schedule);
      return prev.slice(0, -1);
    });
  }, []);

  const exportData = () => {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      projects, schedule, categoryConfig, appSettings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creator-sync-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.projects && json.schedule) {
             saveHistory();
             setProjects(json.projects);
             setSchedule(json.schedule);
             if (json.categoryConfig) setCategoryConfig(json.categoryConfig);
             if (json.appSettings) setAppSettings(json.appSettings);
             alert('Database restored successfully.');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) { alert('Failed to parse file.'); }
    };
    reader.readAsText(file);
  };

  return {
    projects, setProjects,
    schedule, setSchedule,
    categoryConfig, setCategoryConfig,
    appSettings, setAppSettings,
    history, saveHistory, handleUndo,
    activeStatuses,
    scheduleLookup,
    pipelineProjects,
    publishedProjects,
    getProjectScheduledDate,
    lang, dateLocale,
    exportData, importData,
    DEFAULT_CATEGORY_CONFIG
  };
};
