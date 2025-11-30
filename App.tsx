
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { enUS, zhTW } from 'date-fns/locale';
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
  ListFilter,
  ArrowDownAZ,
  Tags,
  CalendarClock
} from 'lucide-react';

import { Project, ProjectStatus, ScheduleItem, DragData, CategoryConfig, AppSettings, Language, SortMode } from './types';
import { ProjectCard } from './components/ProjectCard';
import { CalendarCell } from './components/CalendarCell';
import { DraggableScheduleItem } from './components/DraggableScheduleItem';
import { ProjectFormModal } from './components/modals/ProjectFormModal';
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
  OTHER: { label: 'Other', color: 'bg-pink-900', iconKey: 'Layers' }
};

const getDefaultLanguage = (): Language => {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().includes('zh') ? 'zh-TW' : 'en';
  }
  return 'en';
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  warningDays: 7,
  criticalDays: 3,
  language: getDefaultLanguage()
};

// Mock Initial Data (Used as fallback if localStorage is empty)
const INITIAL_PROJECTS: Project[] = [
  // In Progress
  { id: 'p1', name: 'Cyberpunk Character Pack', description: 'Tier 1 Rewards', tags: ['Sci-Fi', 'NSFW'], status: ProjectStatus.IN_PROGRESS, type: 'ART', color: '' },
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
      className={`flex flex-col gap-3 rounded-lg transition-all duration-200 ${
        isOver ? 'bg-zinc-800/80 ring-2 ring-indigo-500/50 shadow-inner p-2 -mx-2' : ''
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
          ? 'opacity-100 border-zinc-700 bg-zinc-900/80 text-zinc-300' 
          : 'opacity-40 border-transparent text-zinc-600'
        }
        ${isOver 
          ? 'bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105 opacity-100' 
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
      return savedConfig ? JSON.parse(savedConfig) : DEFAULT_CATEGORY_CONFIG;
    } catch {
      return DEFAULT_CATEGORY_CONFIG;
    }
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_APP_SETTINGS;
      // Ensure language is set if loading from old config
      if (!settings.language) settings.language = getDefaultLanguage();
      return settings;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  });

  const lang = appSettings.language;
  const dateLocale = lang === 'zh-TW' ? zhTW : enUS;

  // Initialize State from LocalStorage
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEY_PROJECTS);
      let parsedProjects: Project[] = savedProjects ? JSON.parse(savedProjects) : INITIAL_PROJECTS;
      // Auto-update legacy fields
      parsedProjects = parsedProjects.map(p => ({
        ...p,
        tags: p.tags || [], // Ensure tags exist
        color: categoryConfig[p.type]?.color || categoryConfig.OTHER.color
      }));
      return parsedProjects;
    } catch {
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

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('DEFAULT');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Undo / History Logic
  const saveHistory = useCallback(() => {
    setHistory(prev => {
      // Limit history to 20 steps
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

  // Keyboard Shortcuts (Ctrl+Z)
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

  // Calendar Calculations
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Dynamic Week Days based on Locale
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

  // Helper Logic
  const isScheduledInPast = (projectId: string) => {
    const item = schedule.find(s => s.projectId === projectId);
    if (!item) return false;
    return isBefore(parseISO(item.date), today);
  };

  const getProjectScheduledDate = (projectId: string) => {
    const item = schedule.find(s => s.projectId === projectId);
    return item ? item.date : undefined;
  };

  const handleJumpToProject = (projectId: string, dateStr: string) => {
    const date = parseISO(dateStr);
    setCurrentMonth(date);
    setHighlightedProjectId(projectId);
    setTimeout(() => setHighlightedProjectId(null), 2000);
  };

  const handleScheduleItemClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // If ARCHIVED or Scheduled in Past -> Published Tab
    // Otherwise -> Pipeline Tab
    const isArchived = project.status === ProjectStatus.ARCHIVED;
    const isPast = isScheduledInPast(project.id);
    
    const targetTab = (isArchived || isPast) ? 'published' : 'pipeline';
    
    setSidebarTab(targetTab);
    setHighlightedProjectId(projectId);

    // Scroll into view (needs a tick for tab switch render)
    setTimeout(() => {
      const el = document.getElementById(`project-card-${projectId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => setHighlightedProjectId(null), 2000);
    }, 100);
  };

  const handleRemoveScheduleItem = (scheduleId: string) => {
    saveHistory(); // Save before mutate
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
             saveHistory(); // Save before overwrite
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
    // Pipeline: Not scheduled in past AND Not archived
    // Includes: PLANNING, IN_PROGRESS, COMPLETED, PAUSED
    return projects.filter(p => !isScheduledInPast(p.id) && p.status !== ProjectStatus.ARCHIVED);
  }, [projects, schedule]);

  const publishedProjects = useMemo(() => {
    // Published: Scheduled in past OR Archived
    return projects
      .filter(p => isScheduledInPast(p.id) || p.status === ProjectStatus.ARCHIVED)
      .sort((a, b) => {
        // Sort: Scheduled items first by date (newest first), then Unscheduled Archives
        const dateA = getProjectScheduledDate(a.id);
        const dateB = getProjectScheduledDate(b.id);
        
        if (dateA && dateB) return dateB.localeCompare(dateA);
        if (dateA) return -1;
        if (dateB) return 1;
        return 0; // Maintain order
      });
  }, [projects, schedule]);

  // Sort logic helper
  const sortProjects = useCallback((list: Project[]) => {
    if (sortMode === 'DEFAULT') return list;
    
    return [...list].sort((a, b) => {
      if (sortMode === 'ALPHA') {
        return a.name.localeCompare(b.name);
      }
      if (sortMode === 'CATEGORY') {
        // Sort by Type Label if possible, else type code
        const labelA = categoryConfig[a.type]?.label || a.type;
        const labelB = categoryConfig[b.type]?.label || b.type;
        return labelA.localeCompare(labelB);
      }
      if (sortMode === 'DATE') {
        const dateA = getProjectScheduledDate(a.id);
        const dateB = getProjectScheduledDate(b.id);
        
        // Items with dates come first, sorted ascending (nearest first)
        if (dateA && dateB) return dateA.localeCompare(dateB);
        if (dateA) return -1;
        if (dateB) return 1;
        
        // If no dates, fallback to name
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [sortMode, categoryConfig, schedule]);


  // Drag Handlers
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

    if (!over) return;

    // Check if state will actually change before saving history
    // Simple check: if valid drop, save history
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
          // Case 1: Dragging a Calendar Item -> Remove from Calendar
          setSchedule(prev => prev.filter(item => item.id !== data.scheduleId));
       } else if (data.type === 'PROJECT_SOURCE') {
          // Case 2: Dragging a Project Card -> Ask to Delete Project
          const project = projects.find(p => p.id === data.projectId);
          // Note: Browser confirm blocks JS, so history saved above works fine
          if (project && confirm(`Delete project "${project.name}" permanently?`)) {
             setSchedule(prev => prev.filter(s => s.projectId !== data.projectId));
             setProjects(prev => prev.filter(p => p.id !== data.projectId));
          } else {
             // If cancelled, undo the history save (optional, but history stack limit handles it)
          }
       }
    } else if (over.id.toString().startsWith('status-')) {
      const newStatus = over.data.current?.status as ProjectStatus;
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
    saveHistory(); // Save before delete
    // Direct delete - confirmation handled by UI state in Modal
    setSchedule(prev => prev.filter(s => s.projectId !== editingProjectId));
    setProjects(prev => prev.filter(p => p.id !== editingProjectId));
    setIsModalOpen(false);
    setEditingProjectId(null);
  };

  const handleToggleArchive = (project: Project) => {
    saveHistory(); // Save before archive toggle
    const isArchived = project.status === ProjectStatus.ARCHIVED;
    const newStatus = isArchived ? ProjectStatus.IN_PROGRESS : ProjectStatus.ARCHIVED;
    
    setProjects(prev => prev.map(p => 
       p.id === project.id ? { ...p, status: newStatus } : p
    ));
  };

  const handleSaveProject = (formData: Partial<Project>) => {
    saveHistory(); // Save before creating/updating
    
    const projectType = formData.type || 'VIDEO';
    const config = categoryConfig[projectType];
    
    if (editingProjectId) {
      // Update existing project
      setProjects(prev => prev.map(p => p.id === editingProjectId ? {
        ...p,
        ...formData,
        color: config.color // Update color just in case (though mostly derived)
      } as Project : p));
    } else {
      // Create new project
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: formData.name || 'Untitled',
        description: formData.description || '',
        tags: formData.tags || [],
        status: formData.status || ProjectStatus.PLANNING,
        type: projectType,
        color: config.color
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

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
        
        {/* Sidebar */}
        <aside className="w-[340px] shrink-0 border-r border-white/5 bg-zinc-900/50 flex flex-col z-10">
          
          {/* Sidebar Header & Tabs */}
          <div className="p-4 border-b border-white/5 pt-6 flex flex-col gap-3">
             {/* Tabs */}
            <div className="flex p-1 bg-zinc-950 rounded-lg border border-white/5">
              <button
                onClick={() => setSidebarTab('pipeline')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                  sidebarTab === 'pipeline' 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ListTodo size={14} /> {t('pipeline', lang)}
                <span className={`text-[10px] px-1.5 rounded-full ${sidebarTab === 'pipeline' ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-600'}`}>
                  {pipelineProjects.length}
                </span>
              </button>
              <button
                onClick={() => setSidebarTab('published')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                  sidebarTab === 'published' 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Archive size={14} /> {t('published', lang)}
                <span className={`text-[10px] px-1.5 rounded-full ${sidebarTab === 'published' ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-600'}`}>
                  {publishedProjects.length}
                </span>
              </button>
            </div>

            {/* Sort Toolbar - Only visible in Pipeline */}
            {sidebarTab === 'pipeline' && (
              <div className="flex items-center gap-1 justify-between px-1">
                 <button 
                  onClick={() => setSortMode('DEFAULT')}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded transition-colors ${sortMode === 'DEFAULT' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'}`}
                  title={t('sort_default', lang)}
                 >
                   <ListFilter size={14} />
                 </button>
                 <button 
                  onClick={() => setSortMode('ALPHA')}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded transition-colors ${sortMode === 'ALPHA' ? 'bg-zinc-800 text-white' : 'text-zinc-600