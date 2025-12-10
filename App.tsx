


import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  DragStartEvent, 
  DragEndEvent, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor,
  useDroppable
} from '@dnd-kit/core';
import { 
  format, 
  endOfMonth, 
  eachDayOfInterval, 
  endOfWeek, 
  addMonths, 
  isBefore
} from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import zhTW from 'date-fns/locale/zh-TW';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  ListTodo,
  Archive,
  Layers,
  Inbox,
  Settings,
  CircleHelp,
  Undo2,
  ArrowDownAZ,
  CalendarClock,
  Shapes,
  List,
  LayoutGrid
} from 'lucide-react';

import { Project, ProjectStatus, ScheduleItem, DragData, CategoryConfig, CategoryDefinition, AppSettings, Language, SortMode, StatusDefinition } from './types';
import { ProjectCard } from './components/ProjectCard';
import { CalendarCell } from './components/CalendarCell';
import { DraggableScheduleItem } from './components/DraggableScheduleItem';
import { ProjectFormModal } from './components/modals/ProjectFormModal';
import { ChecklistModal } from './components/modals/ChecklistModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { HelpModal } from './components/modals/HelpModal';
import { t, getStatusText } from './translations';

// Helpers to replace missing date-fns imports
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const subMonths = (date: Date, amount: number) => addMonths(date, -amount);
const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const parseISO = (str: string) => {
  // Ensure local time parsing for YYYY-MM-DD
  if (str.length === 10) return new Date(str + 'T00:00:00');
  return new Date(str);
};

// Default Category Configuration
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

// Default Status Configuration
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
  calendarViewMode: 'COMPACT'
};

// Mock Initial Data (Used as fallback if localStorage is empty)
const INITIAL_PROJECTS: Project[] = [
  // In Progress
  { 
    id: 'p1', 
    name: 'Cyberpunk Character Pack', 
    description: 'Tier 1 Rewards', 
    tags: ['Sci-Fi', 'NSFW'], 
    status: ProjectStatus.IN_PROGRESS, 
    type: 'ART', 
    color: '',
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
  { id: 'p7', name: 'Lore: The Great War', description: 'Worldbuilding post', tags: ['History', 'Public'], status: ProjectStatus.IN_PROGRESS, type: 'WRITING', color: '' },
  { id: 'p8', name: 'NPC Portraits Pack', description: 'VTT Assets', tags: ['D&D', 'Token'], status: ProjectStatus.IN_PROGRESS, type: 'ART', color: '' },
  
  // Planning
  { id: 'p2', name: 'Fantasy Map Tutorial', description: 'Step-by-step', tags: ['Tutorial', 'Voiceover'], status: ProjectStatus.PLANNING, type: 'VIDEO', color: '' },
  { id: 'p5', name: 'Hi-Res Wallpapers', description: '4K Downloads', tags: ['Desktop', 'Phone'], status: ProjectStatus.PLANNING, type: 'ART', color: '' },
  { id: 'p9', name: 'Monthly Poll', description: 'Next theme voting', tags: ['Community'], status: ProjectStatus.PLANNING, type: 'OTHER', color: '' },
  
  // Completed
  { id: 'p3', name: 'Podcast Episode #42', description: 'Audio file', tags: ['Guest'], status: ProjectStatus.COMPLETED, type: 'AUDIO', color: '' },
  { id: 'p14', name: 'Previous Month Bundle', description: 'Zip file link', tags: ['Gumroad'], status: ProjectStatus.COMPLETED, type: 'OTHER', color: '' },
];

const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id: 's1', date: format(new Date(), 'yyyy-MM-dd'), projectId: 'p1', note: 'Early Access' },
  { id: 's2', date: '2023-01-01', projectId: 'p3', note: 'Released' } 
];

// LocalStorage Keys
const STORAGE_KEY_PROJECTS = 'patreon_scheduler_projects_v2';
const STORAGE_KEY_SCHEDULE = 'patreon_scheduler_schedule_v2';
const STORAGE_KEY_CONFIG = 'patreon_scheduler_config_v1';
const STORAGE_KEY_SETTINGS = 'patreon_scheduler_settings_v1';
const STORAGE_KEY_SORT = 'patreon_scheduler_sort_v1';

type SidebarTab = 'pipeline' | 'published';

// History State Interface for Undo
interface HistoryState {
  projects: Project[];
  schedule: ScheduleItem[];
}

// Status Zone Component for Droppable Sidebar Sections
const StatusZone: React.FC<{ status: string; children: React.ReactNode }> = ({ status, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status}`,
    data: { status }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-lg transition-all duration-200 ${
        isOver ? 'bg-zinc-200 dark:bg-zinc-800/80 ring-2 ring-indigo-500/50 shadow-inner p-2 -mx-2' : ''
      }`}
    >
      {children}
    </div>
  );
};

// Trash Drop Zone Component
const TrashDropZone: React.FC<{ activeDragId: string | null; lang: Language }> = ({ activeDragId, lang }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'trash-zone',
  });

  const isActive = !!activeDragId;

  return (
    <div 
      ref={setNodeRef}
      id="trash-zone" 
      className={`
        flex items-center gap-2 px-6 py-1.5 rounded-md transition-all duration-200 border z-50 select-none whitespace-nowrap
        ${isActive 
          ? 'opacity-100 border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 shadow-sm' 
          : 'opacity-40 border-transparent text-zinc-500 dark:text-zinc-600'
        }
        ${isOver 
          ? 'bg-red-50 dark:bg-red-500/20 border-red-500 text-red-600 dark:text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105 opacity-100' 
          : ''
        }
     `}
    >
       <Trash2 size={16} />
       <span className="text-xs font-semibold">{t('dropToDelete', lang)}</span>
    </div>
  );
};

export default function App() {
  // Load Config
  const [categoryConfig, setCategoryConfig] = useState<CategoryConfig>(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      const parsed = savedConfig ? JSON.parse(savedConfig) : null;
      return (parsed && typeof parsed === 'object') ? parsed : DEFAULT_CATEGORY_CONFIG;
    } catch {
      return DEFAULT_CATEGORY_CONFIG;
    }
  });

  // Data Migration for New Categories (Fixed 8 slots)
  useEffect(() => {
     setCategoryConfig(prev => {
        const requiredKeys = Object.keys(DEFAULT_CATEGORY_CONFIG);
        const missingKeys = requiredKeys.filter(key => !prev[key as keyof CategoryConfig]);
        
        if (missingKeys.length > 0) {
           console.log("Migrating Category Config, adding:", missingKeys);
           const updated = { ...prev };
           missingKeys.forEach(key => {
              updated[key as keyof CategoryConfig] = DEFAULT_CATEGORY_CONFIG[key as keyof CategoryConfig];
           });
           return updated;
        }
        return prev;
     });
  }, []);

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const settings = savedSettings ? JSON.parse(savedSettings) : { ...DEFAULT_APP_SETTINGS };
      
      // Initialize new fields if they don't exist
      if (!settings.language) settings.language = getDefaultLanguage();
      if (!settings.theme) settings.theme = 'dark'; // Default to dark for existing users
      if (!settings.statusMode) settings.statusMode = 'DEFAULT';
      if (!settings.customStatuses) settings.customStatuses = [...DEFAULT_STATUS_DEFS];
      if (!settings.calendarViewMode) settings.calendarViewMode = 'COMPACT';
      return settings;
    } catch {
      return { ...DEFAULT_APP_SETTINGS };
    }
  });

  const lang = appSettings.language;
  const dateLocale = lang === 'zh-TW' ? zhTW : enUS;

  // Apply Theme
  useEffect(() => {
    if (appSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appSettings.theme]);

  // Compute Active Statuses based on Settings
  const activeStatuses = useMemo(() => {
    return appSettings.statusMode === 'CUSTOM' 
      ? appSettings.customStatuses 
      : DEFAULT_STATUS_DEFS;
  }, [appSettings.statusMode, appSettings.customStatuses]);

  // Initialize State from LocalStorage
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEY_PROJECTS);
      let parsedProjects: Project[] = savedProjects ? JSON.parse(savedProjects) : INITIAL_PROJECTS;
      
      if (!Array.isArray(parsedProjects)) return INITIAL_PROJECTS;

      // Auto-update legacy fields with Safe Access
      parsedProjects = parsedProjects.map(p => {
        const safeCategoryConfig = categoryConfig || DEFAULT_CATEGORY_CONFIG;
        const defaultConfig = safeCategoryConfig.OTHER || { color: 'bg-zinc-800', label: 'Other', iconKey: 'Layers' };
        
        const typeConfig = p.type ? safeCategoryConfig[p.type] : undefined;
        
        return {
          ...p,
          tags: Array.isArray(p.tags) ? p.tags : [],
          color: (typeConfig ? typeConfig.color : null) || defaultConfig.color || 'bg-zinc-800',
          checklist: Array.isArray(p.checklist) ? p.checklist : []
        };
      });
      return parsedProjects;
    } catch (e) {
      console.error("Failed to load projects", e);
      return INITIAL_PROJECTS;
    }
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const savedSchedule = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      return savedSchedule ? JSON.parse(savedSchedule) : INITIAL_SCHEDULE;
    } catch {
      return INITIAL_SCHEDULE;
    }
  });

  // History Stack for Undo
  const [history, setHistory] = useState<HistoryState[]>([]);

  // Persist State
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(categoryConfig));
  }, [categoryConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(appSettings));
  }, [appSettings]);

  // Safe Migration
  useEffect(() => {
    if (activeStatuses.length === 0) return;
    
    const validIds = new Set(activeStatuses.map(s => s.id));
    validIds.add(ProjectStatus.ARCHIVED);

    const orphanedProjects = projects.filter(p => !validIds.has(p.status));

    if (orphanedProjects.length > 0) {
      console.log('Migrating orphaned projects:', orphanedProjects.length);
      const defaultStatusId = activeStatuses[0].id;
      
      setProjects(prev => prev.map(p => {
        if (!validIds.has(p.status)) {
           return { ...p, status: defaultStatusId };
        }
        return p;
      }));
    }
  }, [activeStatuses, projects]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const scrollCooldown = useRef(false);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    try {
      const savedSort = localStorage.getItem(STORAGE_KEY_SORT);
      return (savedSort as SortMode) || 'DEFAULT';
    } catch {
      return 'DEFAULT';
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SORT, sortMode);
  }, [sortMode]);

  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  // Checklist Modal State
  const [checklistProjectId, setChecklistProjectId] = useState<string | null>(null);
  
  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const handleCalendarWheel = useCallback((e: React.WheelEvent) => {
    if (scrollCooldown.current) return;

    if (e.deltaY > 0) {
       setCurrentMonth(prev => addMonths(prev, 1));
    } else if (e.deltaY < 0) {
       setCurrentMonth(prev => subMonths(prev, 1));
    }

    scrollCooldown.current = true;
    setTimeout(() => {
        scrollCooldown.current = false;
    }, 400);
  }, []);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const weekDays = useMemo(() => {
      const baseDate = startOfWeek(new Date());
      const days = [];
      for (let i = 0; i < 7; i++) {
          const d = new Date(baseDate);
          d.setDate(baseDate.getDate() + i);
          days.push(format(d, 'EEE', { locale: dateLocale }));
      }
      return days;
  }, [dateLocale]);

  const today = startOfToday();

  const isScheduledInPast = (projectId: string) => {
    const item = schedule.find(s => s.projectId === projectId);
    if (!item) return false;
    return isBefore(parseISO(item.date), today);
  };

  const getProjectScheduledDate = (projectId: string) => {
    const item = schedule.find(s => s.projectId === projectId);
    return item ? item.date : undefined;
  };

  const sortProjects = useCallback((projectsToSort: Project[], mode: SortMode) => {
    return [...projectsToSort].sort((a, b) => {
      switch (mode) {
        case 'ALPHA': {
          return a.name.localeCompare(b.name);
        }
        case 'CATEGORY': {
          const catA = categoryConfig[a.type]?.label || '';
          const catB = categoryConfig[b.type]?.label || '';
          return catA.localeCompare(catB);
        }
        case 'DATE': {
          const dateA = getProjectScheduledDate(a.id);
          const dateB = getProjectScheduledDate(b.id);
          if (dateA && dateB) return dateA.localeCompare(dateB);
          if (dateA) return -1;
          if (dateB) return 1;
          return 0;
        }
        default:
          return 0;
      }
    });
  }, [categoryConfig, schedule]);

  const handleJumpToProject = (projectId: string, dateStr: string) => {
    const date = parseISO(dateStr);
    setCurrentMonth(date);
    setHighlightedProjectId(projectId);
    setTimeout(() => setHighlightedProjectId(null), 2000);
  };

  const handleScheduleItemClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const isArchived = project.status === ProjectStatus.ARCHIVED;
    const isPast = isScheduledInPast(project.id);
    
    const targetTab = (isArchived || isPast) ? 'published' : 'pipeline';
    
    setSidebarTab(targetTab);
    setHighlightedProjectId(projectId);

    setTimeout(() => {
      const el = document.getElementById(`project-card-${projectId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => setHighlightedProjectId(null), 2000);
    }, 100);
  };

  const handleRemoveScheduleItem = (scheduleId: string) => {
    saveHistory();
    setSchedule(prev => prev.filter(s => s.id !== scheduleId));
  };

  const handleExportData = () => {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      projects,
      schedule,
      categoryConfig,
      appSettings
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

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.projects && json.schedule) {
          if (confirm('This will overwrite all current projects and schedule data. Continue?')) {
             saveHistory();
             setProjects(json.projects);
             setSchedule(json.schedule);
             if (json.categoryConfig) setCategoryConfig(json.categoryConfig);
             if (json.appSettings) setAppSettings(json.appSettings);
             alert('Database restored successfully.');
             setIsSettingsModalOpen(false);
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse file.');
      }
    };
    reader.readAsText(file);
  };

  const pipelineProjects = useMemo(() => {
    return projects.filter(p => !isScheduledInPast(p.id) && p.status !== ProjectStatus.ARCHIVED);
  }, [projects, schedule]);

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
  }, [projects, schedule]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id as string);
    setActiveDragData(active.data.current as DragData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const data = active.data.current as DragData;

    setActiveDragId(null);
    setActiveDragData(null);

    if (!over || !data) return;

    if (over.id.toString().startsWith('date-') || over.id === 'trash-zone' || over.id.toString().startsWith('status-')) {
       saveHistory();
    }

    if (over.id.toString().startsWith('date-')) {
      const targetDate = over.data.current?.date as string;
      const existingScheduleItem = schedule.find(s => s.projectId === data.projectId);

      if (existingScheduleItem) {
        setSchedule(prev => prev.map(item => 
          item.id === existingScheduleItem.id 
            ? { ...item, date: targetDate } 
            : item
        ));
      } else {
        const newItem: ScheduleItem = {
          id: crypto.randomUUID(),
          date: targetDate,
          projectId: data.projectId,
          note: 'Release'
        };
        setSchedule(prev => [...prev, newItem]);
      }
    } else if (over.id === 'trash-zone') {
       if (data.type === 'SCHEDULE_ITEM' && data.scheduleId) {
          setSchedule(prev => prev.filter(item => item.id !== data.scheduleId));
       } else if (data.type === 'PROJECT_SOURCE') {
          const project = projects.find(p => p.id === data.projectId);
          if (project && confirm(`Delete project "${project.name}" permanently?`)) {
             setSchedule(prev => prev.filter(s => s.projectId !== data.projectId));
             setProjects(prev => prev.filter(p => p.id !== data.projectId));
          }
       }
    } else if (over.id.toString().startsWith('status-')) {
      const newStatus = over.data.current?.status as string;
      if (newStatus && data.projectId) {
        setProjects(prev => prev.map(p => 
          p.id === data.projectId ? { ...p, status: newStatus } : p
        ));
      }
    }
  };

  const openCreateModal = () => {
    setEditingProjectId(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setIsModalOpen(true);
  };

  const handleDeleteProject = () => {
    if (!editingProjectId) return;
    saveHistory();
    setSchedule(prev => prev.filter(s => s.projectId !== editingProjectId));
    setProjects(prev => prev.filter(p => p.id !== editingProjectId));
    setIsModalOpen(false);
    setEditingProjectId(null);
  };

  const handleToggleArchive = (project: Project) => {
    saveHistory();
    const isArchived = project.status === ProjectStatus.ARCHIVED;
    const newStatus = isArchived ? activeStatuses[0].id : ProjectStatus.ARCHIVED;
    
    setProjects(prev => prev.map(p => 
       p.id === project.id ? { ...p, status: newStatus } : p
    ));
  };

  // Generic Update Project Function (Used for Checklists without closing modals)
  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleSaveProject = (formData: Partial<Project>) => {
    saveHistory();
    
    const projectType = formData.type || 'VIDEO';
    const config = categoryConfig[projectType];
    
    if (editingProjectId) {
      setProjects(prev => prev.map(p => p.id === editingProjectId ? {
        ...p,
        ...formData,
        color: config.color
      } as Project : p));
    } else {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: formData.name || 'Untitled',
        description: formData.description || '',
        tags: formData.tags || [],
        status: formData.status || activeStatuses[0].id,
        type: projectType,
        color: config.color,
        checklist: []
      };
      setProjects(prev => [...prev, newProject]);
    }

    setIsModalOpen(false);
    setEditingProjectId(null);
  };

  const getActiveOverlayProject = () => {
    if (!activeDragData) return null;
    return projects.find(p => p.id === activeDragData.projectId);
  };

  const getActiveOverlayScheduleItem = () => {
     if (!activeDragData || activeDragData.type !== 'SCHEDULE_ITEM') return null;
     return schedule.find(s => s.id === activeDragData.scheduleId);
  }

  // Handle View Mode Toggle
  const toggleViewMode = (mode: 'COMPACT' | 'BLOCK') => {
    setAppSettings(prev => ({ ...prev, calendarViewMode: mode }));
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className={`flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/30 ${lang === 'zh-TW' ? 'lang-zh' : ''}`}>
        
        {/* Sidebar */}
        <aside className="w-[340px] shrink-0 border-r border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 flex flex-col z-10 transition-colors duration-200">
          
          {/* Sidebar Header & Tabs */}
          <div className="p-4 border-b border-zinc-200 dark:border-white/5 pt-6 flex flex-col gap-3">
             {/* Tabs */}
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-white/5">
              <button
                onClick={() => setSidebarTab('pipeline')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                  sidebarTab === 'pipeline' 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-transparent' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <ListTodo size={14} /> {t('pipeline', lang)}
                <span className={`text-[10px] px-1.5 rounded-full ${sidebarTab === 'pipeline' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200' : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-600'}`}>
                  {pipelineProjects.length}
                </span>
              </button>
              <button
                onClick={() => setSidebarTab('published')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                  sidebarTab === 'published' 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-transparent' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Archive size={14} /> {t('published', lang)}
                <span className={`text-[10px] px-1.5 rounded-full ${sidebarTab === 'published' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200' : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-600'}`}>
                  {publishedProjects.length}
                </span>
              </button>
            </div>

            {/* Sorting Toolbar (Only visible in Pipeline) */}
            {sidebarTab === 'pipeline' && (
              <div className="flex gap-1">
                <button
                  onClick={() => setSortMode('DEFAULT')}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded transition-all ${sortMode === 'DEFAULT' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                  title={t('sort_default', lang)}
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setSortMode('ALPHA')}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded transition-all ${sortMode === 'ALPHA' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                  title={t('sort_alpha', lang)}
                >
                  <ArrowDownAZ size={14} />
                </button>
                <button
                  onClick={() => setSortMode('CATEGORY')}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded transition-all ${sortMode === 'CATEGORY' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                  title={t('sort_category', lang)}
                >
                  <Shapes size={14} />
                </button>
                <button
                  onClick={() => setSortMode('DATE')}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded transition-all ${sortMode === 'DATE' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                  title={t('sort_date', lang)}
                >
                  <CalendarClock size={14} />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            {/* Pipeline View */}
            {sidebarTab === 'pipeline' && (
              <div className="flex flex-col gap-6">
                {/* Dynamically Render Status Columns based on Active Statuses */}
                {activeStatuses.map(statusDef => {
                   let statusProjects = pipelineProjects.filter(p => p.status === statusDef.id);
                   statusProjects = sortProjects(statusProjects, sortMode);

                   return (
                    <StatusZone key={statusDef.id} status={statusDef.id}>
                      {/* Modern Left-Aligned Header with Count Badge */}
                      <div className="flex items-center justify-between mb-2 mt-2 px-1">
                         <div className="flex items-center gap-2">
                           <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                             {appSettings.statusMode === 'CUSTOM' ? statusDef.label : getStatusText(statusDef.id, lang, statusDef.label)}
                           </h3>
                           <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                             {statusProjects.length}
                           </span>
                         </div>
                         <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/50 ml-3"></div>
                      </div>

                      <div className="space-y-2 min-h-[10px]">
                        {statusProjects.map(project => {
                          const scheduledDate = getProjectScheduledDate(project.id);
                          return (
                            <ProjectCard 
                              key={project.id} 
                              project={project} 
                              categoryConfig={categoryConfig}
                              scheduledDate={scheduledDate}
                              appSettings={appSettings}
                              onJumpToDate={scheduledDate ? (date) => handleJumpToProject(project.id, date) : undefined}
                              onEdit={() => handleEditProject(project)}
                              onToggleArchive={() => handleToggleArchive(project)}
                              onOpenChecklist={() => setChecklistProjectId(project.id)}
                            />
                          );
                        })}
                        {statusProjects.length === 0 && (
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-700 text-center py-4 border border-dashed border-zinc-200 dark:border-zinc-800/50 rounded bg-zinc-50/50 dark:bg-zinc-900/20">
                            {t('dropHere', lang)}
                          </div>
                        )}
                      </div>
                    </StatusZone>
                   );
                })}
                
                {pipelineProjects.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-zinc-400 dark:text-zinc-600">
                    <Inbox size={32} className="mb-3 opacity-20" />
                    <p className="text-xs">{t('noPending', lang)}</p>
                  </div>
                )}

                <button 
                  onClick={openCreateModal}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 dark:border-zinc-800 py-3 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mt-2"
                >
                  <Plus size={14} /> {t('newProject', lang)}
                </button>
              </div>
            )}

            {/* Published View */}
            {sidebarTab === 'published' && (
              <div className="space-y-2">
                 {publishedProjects.length > 0 ? (
                    publishedProjects.map(project => {
                      const scheduledDate = getProjectScheduledDate(project.id);
                      return (
                        <div key={project.id} className="opacity-80 hover:opacity-100 transition-opacity">
                           <ProjectCard 
                            project={project} 
                            categoryConfig={categoryConfig}
                            scheduledDate={scheduledDate}
                            appSettings={appSettings}
                            onJumpToDate={scheduledDate ? (date) => handleJumpToProject(project.id, date) : undefined}
                            onEdit={() => handleEditProject(project)}
                            onToggleArchive={() => handleToggleArchive(project)}
                            onOpenChecklist={() => setChecklistProjectId(project.id)}
                          />
                        </div>
                      );
                    })
                 ) : (
                   <div className="flex flex-col items-center justify-center h-40 text-zinc-400 dark:text-zinc-600">
                      <Archive size={32} className="mb-3 opacity-20" />
                      <p className="text-xs">{t('archiveEmpty', lang)}</p>
                   </div>
                 )}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-950 flex items-center gap-2 transition-colors">
             <button 
               onClick={() => setIsSettingsModalOpen(true)}
               className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
               title="App Settings & Configuration"
             >
               <Settings size={14} /> {t('settings', lang)}
             </button>
             <button 
               onClick={() => setIsHelpModalOpen(true)}
               className="flex items-center justify-center gap-2 px-3 py-2 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
               title="Help Guide"
             >
               <CircleHelp size={16} />
             </button>
          </div>
        </aside>

        {/* Main Calendar Area */}
        <main className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 relative transition-colors duration-200">
          
          {/* Calendar Toolbar */}
          <div className="flex items-center justify-between px-8 py-6 h-20">
             
             {/* Left: Navigation & Trash */}
             <div className="flex items-center gap-6">
               <div className="w-60">
                 <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight capitalize">
                   {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                 </h2>
               </div>
               
               <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-1">
                 <button 
                   onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                   className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                 >
                   <ChevronLeft size={16} />
                 </button>
                 <button 
                   onClick={() => setCurrentMonth(new Date())}
                   className="w-16 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white whitespace-nowrap"
                 >
                   {t('today', lang)}
                 </button>
                 <button 
                   onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                   className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                 >
                   <ChevronRight size={16} />
                 </button>
               </div>

               <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-800/50 mx-2"></div>

               {/* View Mode Toggle */}
               <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 p-0.5">
                  <button 
                    onClick={() => toggleViewMode('COMPACT')}
                    className={`p-1.5 rounded transition-all ${appSettings.calendarViewMode === 'COMPACT' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                    title={t('view_compact', lang)}
                  >
                    <List size={14} />
                  </button>
                  <button 
                    onClick={() => toggleViewMode('BLOCK')}
                    className={`p-1.5 rounded transition-all ${appSettings.calendarViewMode === 'BLOCK' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                    title={t('view_block', lang)}
                  >
                    <LayoutGrid size={14} />
                  </button>
               </div>

               <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-800/50 mx-2"></div>

                {/* Undo Button */}
                <button
                   onClick={handleUndo}
                   disabled={history.length === 0}
                   className={`
                     flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all
                     ${history.length > 0
                        ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer shadow-sm'
                        : 'bg-transparent border-transparent text-zinc-400 dark:text-zinc-700 cursor-default opacity-50'
                     }
                   `}
                   title={`${t('undo', lang)} (Ctrl+Z)`}
                >
                   <Undo2 size={16} />
                </button>

                {/* Trash Drop Zone */}
                <TrashDropZone activeDragId={activeDragId} lang={lang} />
             </div>

             {/* Right: Low-key Logo */}
             <div className="flex items-center gap-3">
               <div className="text-right">
                <h1 className="text-xs font-bold tracking-tight text-zinc-500 dark:text-zinc-300 uppercase">Creator Sync</h1>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">Pro Scheduler</p>
               </div>
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 shadow-inner">
                 <Layers size={16} />
               </div>
             </div>
          </div>

          {/* Calendar Grid Container */}
          <div 
             className="flex-1 px-8 pb-8 overflow-hidden flex flex-col"
             onWheel={handleCalendarWheel}
          >
            
            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* The Grid */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 shadow-xl dark:shadow-2xl">
               <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 h-full min-h-[500px]">
                {calendarDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayItems = schedule.filter(s => s.date === dateStr);
                  return (
                    <CalendarCell 
                      key={day.toISOString()} 
                      date={day} 
                      items={dayItems} 
                      projects={projects}
                      categoryConfig={categoryConfig}
                      highlightedProjectId={highlightedProjectId}
                      onItemClick={handleScheduleItemClick}
                      onRemoveItem={handleRemoveScheduleItem}
                      viewMode={appSettings.calendarViewMode}
                    />
                  );
                })}
               </div>
            </div>
          </div>
        </main>

        <DragOverlay>
          {activeDragId ? (
            activeDragData?.type === 'PROJECT_SOURCE' ? (
              <div className="w-[300px]">
                 <ProjectCard 
                  project={getActiveOverlayProject()!} 
                  categoryConfig={categoryConfig} 
                  isOverlay 
                  appSettings={appSettings} 
                 />
              </div>
            ) : (
               <div className="w-auto">
                 <DraggableScheduleItem 
                   item={getActiveOverlayScheduleItem()!} 
                   project={getActiveOverlayProject()!} 
                   categoryConfig={categoryConfig}
                   isOverlay
                   viewMode={appSettings.calendarViewMode}
                 />
               </div>
            )
          ) : null}
        </DragOverlay>

        {/* Separated Modals */}
        <ProjectFormModal 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingProjectId(null); }}
          onSave={handleSaveProject}
          onDelete={editingProjectId ? handleDeleteProject : undefined}
          editingProject={editingProjectId ? projects.find(p => p.id === editingProjectId) : null}
          categoryConfig={categoryConfig}
          lang={lang}
          activeStatuses={activeStatuses}
          statusMode={appSettings.statusMode}
        />

        <ChecklistModal 
          isOpen={!!checklistProjectId}
          onClose={() => setChecklistProjectId(null)}
          project={checklistProjectId ? projects.find(p => p.id === checklistProjectId) || null : null}
          onUpdateProject={handleUpdateProject}
          lang={lang}
        />

        <SettingsModal 
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          categoryConfig={categoryConfig}
          onUpdateCategory={setCategoryConfig}
          onExportData={handleExportData}
          onImportData={handleImportData}
          appSettings={appSettings}
          onUpdateAppSettings={setAppSettings}
        />

        <HelpModal 
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
          lang={lang}
        />

      </div>
    </DndContext>
  );
}
