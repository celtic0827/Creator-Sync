
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
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  addMonths, 
  subMonths, 
  isBefore,
  startOfToday,
  parseISO
} from 'date-fns';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  ListTodo,
  Archive,
  Layers,
  Inbox,
  X,
  Check,
  Settings,
  Edit2,
  Tag,
  AlertTriangle,
  CircleHelp,
  BookOpen,
  MousePointer2,
  Calendar,
  Database,
  Download,
  Upload,
  Undo2,
  ShieldCheck
} from 'lucide-react';

import { Project, ProjectStatus, ScheduleItem, DragData, ProjectType, CategoryConfig, CategoryDefinition } from './types';
import { ProjectCard } from './components/ProjectCard';
import { CalendarCell } from './components/CalendarCell';
import { DraggableScheduleItem } from './components/DraggableScheduleItem';
import { DynamicIcon, ICON_MAP, COLOR_PALETTE } from './components/IconUtils';

// Default Category Configuration
const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  VIDEO: { label: 'Video / Content', color: 'bg-red-600', iconKey: 'Video' },
  ART: { label: 'Art / Illustration', color: 'bg-sky-600', iconKey: 'Image' },
  WRITING: { label: 'Writing / Lore', color: 'bg-amber-600', iconKey: 'FileText' },
  AUDIO: { label: 'Audio / Podcast', color: 'bg-emerald-600', iconKey: 'Mic' },
  '3D': { label: '3D / Assets', color: 'bg-violet-600', iconKey: 'Box' },
  OTHER: { label: 'Other', color: 'bg-pink-900', iconKey: 'Layers' }
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
const TrashDropZone: React.FC<{ activeDragId: string | null }> = ({ activeDragId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'trash-zone',
  });

  const isActive = !!activeDragId;

  return (
    <div 
      ref={setNodeRef}
      id="trash-zone" 
      className={`
        flex items-center gap-2 px-4 py-1.5 rounded-md transition-all duration-200 border z-50 select-none
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
       <span className="text-xs font-semibold">Drop to Delete</span>
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

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    tagsString: '',
    type: 'VIDEO' as ProjectType,
    status: ProjectStatus.PLANNING
  });

  // Settings / Config Editor State
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('VIDEO'); // Can be a ProjectType or 'DATA'
  const [editCategoryForm, setEditCategoryForm] = useState<CategoryDefinition>({ label: '', color: '', iconKey: '' });
  
  // Safe accessor to avoid 'unknown' type errors if inference fails
  const safeEditCategoryForm = editCategoryForm as CategoryDefinition;

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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
      categoryConfig
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
    setIsDeleteConfirming(false);
    setNewProjectForm({
      name: '',
      description: '',
      tagsString: '',
      type: 'VIDEO',
      status: ProjectStatus.PLANNING
    });
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setIsDeleteConfirming(false);
    setNewProjectForm({
      name: project.name,
      description: project.description,
      tagsString: project.tags.join(', '),
      type: project.type,
      status: project.status
    });
    setIsModalOpen(true);
  };

  const handleDeleteProject = () => {
    if (!editingProjectId) return;
    saveHistory(); // Save before delete
    // Direct delete - confirmation handled by UI state
    setSchedule(prev => prev.filter(s => s.projectId !== editingProjectId));
    setProjects(prev => prev.filter(p => p.id !== editingProjectId));
    setIsModalOpen(false);
    setEditingProjectId(null);
    setIsDeleteConfirming(false);
  };

  const handleToggleArchive = (project: Project) => {
    saveHistory(); // Save before archive toggle
    const isArchived = project.status === ProjectStatus.ARCHIVED;
    const newStatus = isArchived ? ProjectStatus.IN_PROGRESS : ProjectStatus.ARCHIVED;
    
    setProjects(prev => prev.map(p => 
       p.id === project.id ? { ...p, status: newStatus } : p
    ));
  };

  const handleSaveProject = () => {
    if (!newProjectForm.name) return;
    saveHistory(); // Save before creating/updating
    
    const config = categoryConfig[newProjectForm.type];
    
    // Parse tags
    const tags = newProjectForm.tagsString
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (editingProjectId) {
      // Update existing project
      setProjects(prev => prev.map(p => p.id === editingProjectId ? {
        ...p,
        name: newProjectForm.name,
        description: newProjectForm.description,
        tags: tags,
        status: newProjectForm.status as ProjectStatus,
        type: newProjectForm.type,
        color: config.color // Update color just in case (though mostly derived)
      } : p));
    } else {
      // Create new project
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: newProjectForm.name,
        description: newProjectForm.description,
        tags: tags,
        status: newProjectForm.status as ProjectStatus,
        type: newProjectForm.type,
        color: config.color
      };
      setProjects(prev => [...prev, newProject]);
    }

    setNewProjectForm({ name: '', description: '', tagsString: '', type: 'VIDEO', status: ProjectStatus.PLANNING });
    setIsModalOpen(false);
    setEditingProjectId(null);
  };

  const handleSettingsTabChange = (key: string) => {
    setActiveSettingsTab(key);
    if (key !== 'DATA') {
       setEditCategoryForm(categoryConfig[key as ProjectType]);
    }
  };

  const handleSaveCategory = () => {
    if (activeSettingsTab && activeSettingsTab !== 'DATA') {
      setCategoryConfig(prev => ({
        ...prev,
        [activeSettingsTab]: safeEditCategoryForm
      }));
    }
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
          <div className="p-4 border-b border-white/5 pt-6 flex flex-col gap-4">
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
                <ListTodo size={14} /> Pipeline
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
                <Archive size={14} /> Published
                <span className={`text-[10px] px-1.5 rounded-full ${sidebarTab === 'published' ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-600'}`}>
                  {publishedProjects.length}
                </span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            {/* Pipeline View */}
            {sidebarTab === 'pipeline' && (
              <div className="flex flex-col gap-6">
                {/* Pipeline now includes PLANNING, IN_PROGRESS, COMPLETED, PAUSED */}
                {[ProjectStatus.PLANNING, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED, ProjectStatus.PAUSED].map(status => {
                   const statusProjects = pipelineProjects.filter(p => p.status === status);
                   return (
                    <StatusZone key={status} status={status}>
                      <div className="flex items-center gap-2">
                         <div className="h-px flex-1 bg-zinc-800"></div>
                         <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                           {status.replace('_', ' ')}
                         </h3>
                         <div className="h-px flex-1 bg-zinc-800"></div>
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
                              onJumpToDate={scheduledDate ? (date) => handleJumpToProject(project.id, date) : undefined}
                              onEdit={() => handleEditProject(project)}
                              onToggleArchive={() => handleToggleArchive(project)}
                            />
                          );
                        })}
                        {statusProjects.length === 0 && (
                          <div className="text-[10px] text-zinc-700 text-center py-2 border border-dashed border-zinc-800/50 rounded">
                            Drop items here
                          </div>
                        )}
                      </div>
                    </StatusZone>
                   );
                })}
                
                {pipelineProjects.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                    <Inbox size={32} className="mb-3 opacity-20" />
                    <p className="text-xs">No pending projects</p>
                  </div>
                )}

                <button 
                  onClick={openCreateModal}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-800 py-3 text-xs font-medium text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors mt-2"
                >
                  <Plus size={14} /> New Project
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
                            onJumpToDate={scheduledDate ? (date) => handleJumpToProject(project.id, date) : undefined}
                            onEdit={() => handleEditProject(project)}
                            onToggleArchive={() => handleToggleArchive(project)}
                          />
                        </div>
                      );
                    })
                 ) : (
                   <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                      <Archive size={32} className="mb-3 opacity-20" />
                      <p className="text-xs">Archive is empty</p>
                   </div>
                 )}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-white/5 bg-zinc-950 flex items-center gap-2">
             <button 
               onClick={() => {
                 setIsSettingsModalOpen(true);
                 handleSettingsTabChange('VIDEO'); // Default to first category
               }}
               className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors"
               title="App Settings & Configuration"
             >
               <Settings size={14} /> Settings
             </button>
             <button 
               onClick={() => setIsHelpModalOpen(true)}
               className="flex items-center justify-center gap-2 px-3 py-2 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-900 rounded-md transition-colors"
               title="Help Guide"
             >
               <CircleHelp size={16} />
             </button>
          </div>
        </aside>

        {/* Main Calendar Area */}
        <main className="flex-1 flex flex-col bg-zinc-950 relative">
          
          {/* Calendar Toolbar */}
          <div className="flex items-center justify-between px-8 py-6 h-20">
             
             {/* Left: Navigation & Trash */}
             <div className="flex items-center gap-6">
               <div className="w-60">
                 <h2 className="text-2xl font-bold text-white tracking-tight">
                   {format(currentMonth, 'MMMM yyyy')}
                 </h2>
               </div>
               
               <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
                 <button 
                   onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                   className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                 >
                   <ChevronLeft size={16} />
                 </button>
                 <button 
                   onClick={() => setCurrentMonth(new Date())}
                   className="px-3 py-1 text-xs font-medium text-zinc-300 hover:text-white"
                 >
                   Today
                 </button>
                 <button 
                   onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                   className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                 >
                   <ChevronRight size={16} />
                 </button>
               </div>

               <div className="h-6 w-px bg-zinc-800/50 mx-2"></div>

                {/* Undo Button */}
                <button
                   onClick={handleUndo}
                   disabled={history.length === 0}
                   className={`
                     flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all
                     ${history.length > 0
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 cursor-pointer shadow-sm'
                        : 'bg-transparent border-transparent text-zinc-700 cursor-default opacity-50'
                     }
                   `}
                   title={`Undo last action (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Z)`}
                >
                   <Undo2 size={16} />
                </button>

                {/* Trash Drop Zone */}
                <TrashDropZone activeDragId={activeDragId} />
             </div>

             {/* Right: Low-key Logo */}
             <div className="flex items-center gap-3">
               <div className="text-right">
                <h1 className="text-xs font-bold tracking-tight text-zinc-300 uppercase">Creator Sync</h1>
                <p className="text-[10px] text-zinc-600 font-medium">Pro Scheduler</p>
               </div>
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 shadow-inner">
                 <Layers size={16} />
               </div>
             </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
            
            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* The Grid */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-800 shadow-2xl">
               <div className="grid grid-cols-7 gap-px bg-zinc-800 h-full min-h-[500px]">
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
                 <ProjectCard project={getActiveOverlayProject()!} categoryConfig={categoryConfig} isOverlay />
              </div>
            ) : (
               <div className="w-auto">
                 <DraggableScheduleItem 
                   item={getActiveOverlayScheduleItem()!} 
                   project={getActiveOverlayProject()!} 
                   categoryConfig={categoryConfig}
                   isOverlay
                 />
               </div>
            )
          ) : null}
        </DragOverlay>

        {/* Create/Edit Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                <h3 className="text-sm font-semibold text-white">
                  {editingProjectId ? 'Edit Project' : 'Create New Project'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-400">Project Name</label>
                  <input 
                    type="text" 
                    value={newProjectForm.name}
                    onChange={e => setNewProjectForm(prev => ({...prev, name: e.target.value}))}
                    placeholder="e.g. New Content Pack"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-400">Description</label>
                  <input 
                    type="text" 
                    value={newProjectForm.description}
                    onChange={e => setNewProjectForm(prev => ({...prev, description: e.target.value}))}
                    placeholder="Short details..."
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                   <div className="flex justify-between items-center">
                      <label className="text-[11px] font-medium text-zinc-400">Tags</label>
                      <span className="text-[9px] text-zinc-600">Comma separated</span>
                   </div>
                   <div className="relative">
                      <Tag size={12} className="absolute left-3 top-2.5 text-zinc-600" />
                      <input 
                        type="text" 
                        value={newProjectForm.tagsString}
                        onChange={e => setNewProjectForm(prev => ({...prev, tagsString: e.target.value}))}
                        placeholder="e.g. NSFW, Bonus, Draft"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-950 pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                   </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-400">Category Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewProjectForm(prev => ({...prev, type: key as ProjectType}))}
                        className={`
                          flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border text-xs transition-all
                          ${newProjectForm.type === key 
                            ? 'bg-zinc-800 border-indigo-500 text-white shadow-md' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                          }
                        `}
                      >
                         <div className={`${config.color} p-1 rounded-full text-white/90`}>
                           <DynamicIcon iconKey={config.iconKey} className="w-4 h-4" />
                         </div>
                         <span className="scale-90 truncate w-full text-center">{config.label.split(' / ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-400">Status</label>
                  <select 
                     value={newProjectForm.status}
                     onChange={e => setNewProjectForm(prev => ({...prev, status: e.target.value as ProjectStatus}))}
                     className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                     {Object.values(ProjectStatus).map(s => (
                       <option key={s} value={s}>{s.replace('_', ' ')}</option>
                     ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 p-4">
                 {editingProjectId ? (
                    isDeleteConfirming ? (
                        <div className="flex items-center gap-2 mr-auto bg-red-950/30 px-2 py-1 rounded border border-red-900/50">
                            <AlertTriangle size={12} className="text-red-400" />
                            <span className="text-[10px] text-red-200 font-medium">Really Delete?</span>
                            <div className="flex gap-1 ml-1">
                                <button 
                                  onClick={handleDeleteProject}
                                  className="text-white bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded text-[10px] font-bold"
                                >
                                    YES
                                </button>
                                <button 
                                  onClick={() => setIsDeleteConfirming(false)}
                                  className="text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-[10px]"
                                >
                                    NO
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                          type="button"
                          onClick={() => setIsDeleteConfirming(true)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/50 p-1.5 rounded transition-colors group"
                          title="Delete Project"
                        >
                           <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                    )
                 ) : (
                    <div></div> // Spacer
                 )}

                <div className="flex items-center gap-2">
                  <button onClick={() => setIsModalOpen(false)} className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white">Cancel</button>
                  <button 
                    onClick={handleSaveProject}
                    disabled={!newProjectForm.name}
                    className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={14} /> {editingProjectId ? 'Save Changes' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal (Unified Catalogue & Data Backup) */}
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="w-full max-w-3xl h-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Left: Navigation Sidebar */}
                <div className="w-56 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
                   <div className="p-4 border-b border-zinc-800">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Settings size={16} /> Settings
                      </h3>
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[350px]">
                      
                      {/* System Section */}
                      <div className="px-2 py-2">
                        <div className="text-[10px] font-bold text-zinc-500 px-2 mb-1 uppercase tracking-wider">System</div>
                        <button 
                          onClick={() => handleSettingsTabChange('DATA')}
                          className={`w-full flex items-center gap-3 p-2 rounded-md transition-all ${
                            activeSettingsTab === 'DATA' 
                              ? 'bg-zinc-800 border border-zinc-700 shadow-sm text-white' 
                              : 'hover:bg-zinc-900 border border-transparent text-zinc-400 hover:text-white'
                          }`}
                        >
                           <Database size={14} />
                           <div className="text-xs font-semibold">Data Backup</div>
                        </button>
                      </div>

                      {/* Catalogue Section */}
                      <div className="px-2 pb-2">
                        <div className="text-[10px] font-bold text-zinc-500 px-2 mb-1 mt-2 uppercase tracking-wider">Catalogue</div>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                           <button
                             key={key}
                             onClick={() => handleSettingsTabChange(key as ProjectType)}
                             className={`w-full flex items-center gap-3 p-2 rounded-md transition-all ${
                               activeSettingsTab === key 
                                 ? 'bg-zinc-800 border border-zinc-700 shadow-sm' 
                                 : 'hover:bg-zinc-900 border border-transparent'
                             }`}
                           >
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${config.color}`}>
                                 <DynamicIcon iconKey={config.iconKey} className="text-white w-3 h-3" />
                              </div>
                              <div className="text-left flex-1 min-w-0">
                                 <div className="text-xs font-semibold text-zinc-200 truncate">{config.label}</div>
                              </div>
                           </button>
                        ))}
                      </div>
                   </div>
                   <div className="p-3 border-t border-zinc-800">
                      <button onClick={() => setIsSettingsModalOpen(false)} className="w-full py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded hover:bg-zinc-800">
                         Close
                      </button>
                   </div>
                </div>

                {/* Right: Content Area */}
                <div className="flex-1 bg-zinc-950 flex flex-col p-5">
                   {activeSettingsTab === 'DATA' ? (
                      // Data Management View
                      <div className="flex flex-col h-full">
                         <div className="pb-4 border-b border-zinc-800 mb-6">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wide">Data Management</h2>
                            <p className="text-xs text-zinc-500 mt-1">Export your data for backup or transfer to another device.</p>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4">
                            {/* Export Card */}
                            <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors flex flex-col gap-3">
                               <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                  {/* Upload Icon for Export (Sending Out) */}
                                  <Upload size={20} />
                               </div>
                               <div>
                                  <h4 className="text-sm font-semibold text-zinc-200">Export JSON</h4>
                                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                                    Download a complete backup of projects, schedule, and settings.
                                  </p>
                               </div>
                               <button 
                                 onClick={handleExportData}
                                 className="mt-auto w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded border border-zinc-700"
                               >
                                  Download Backup
                               </button>
                            </div>

                            {/* Import Card */}
                            <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors flex flex-col gap-3">
                               <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                   {/* Download Icon for Import (Bringing In) */}
                                  <Download size={20} />
                               </div>
                               <div>
                                  <h4 className="text-sm font-semibold text-zinc-200">Import JSON</h4>
                                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                                    Restore from a backup file. <span className="text-red-400">Warning: Overwrites current data.</span>
                                  </p>
                               </div>
                               <label className="mt-auto w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded border border-zinc-700 text-center cursor-pointer">
                                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                                  Select File to Restore
                               </label>
                            </div>
                         </div>
                      </div>
                   ) : activeSettingsTab ? (
                      // Catalogue Editor View
                      <div className="flex flex-col h-full gap-4">
                         
                         {/* Header: Title & Save */}
                         <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <div>
                               <h2 className="text-sm font-bold text-white uppercase tracking-wide">{activeSettingsTab} Config</h2>
                            </div>
                            <button 
                              onClick={handleSaveCategory}
                              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                            >
                              <Check size={14} /> Save
                            </button>
                         </div>
                         
                         {/* Row 1: Name Input & Preview */}
                         <div className="flex gap-4">
                            <div className="flex-1 space-y-1">
                               <label className="text-[10px] font-bold text-zinc-500 uppercase">Label Name</label>
                               <input 
                                 type="text" 
                                 value={safeEditCategoryForm.label}
                                 onChange={(e) => setEditCategoryForm(prev => ({...prev, label: e.target.value}))}
                                 className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-zinc-500 uppercase">Preview</label>
                               <div className="flex items-center gap-2 px-3 py-1.5 h-[38px] rounded border border-zinc-800 bg-zinc-900/50">
                                  <div className={`w-5 h-5 rounded flex items-center justify-center ${safeEditCategoryForm.color}`}>
                                    <DynamicIcon iconKey={safeEditCategoryForm.iconKey} className="text-white w-3 h-3" />
                                  </div>
                                  <span className="text-xs font-medium text-white max-w-[100px] truncate">{safeEditCategoryForm.label}</span>
                               </div>
                            </div>
                         </div>

                         {/* Row 2: Color Palette (Updated to 12 cols x 2 rows) */}
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Color Theme (Bright / Dark)</label>
                            <div className="grid grid-cols-12 gap-1.5">
                               {COLOR_PALETTE.map(color => (
                                  <button
                                    key={color}
                                    onClick={() => setEditCategoryForm(prev => ({...prev, color}))}
                                    className={`w-6 h-6 rounded-full transition-transform ${color} ${
                                       safeEditCategoryForm.color === color ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                                    }`}
                                  />
                               ))}
                            </div>
                         </div>

                         {/* Row 3: Icon Grid (Updated to 9 cols x 3 rows with double vertical gap) */}
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Icon Symbol</label>
                            <div className="grid grid-cols-9 gap-x-1.5 gap-y-3">
                               {Object.keys(ICON_MAP).map(iconKey => (
                                  <button
                                    key={iconKey}
                                    onClick={() => setEditCategoryForm(prev => ({...prev, iconKey}))}
                                    className={`aspect-square w-9 rounded flex items-center justify-center transition-all ${
                                       safeEditCategoryForm.iconKey === iconKey 
                                         ? 'bg-zinc-800 text-white ring-1 ring-indigo-500' 
                                         : 'bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
                                    }`}
                                    title={iconKey}
                                  >
                                     <DynamicIcon iconKey={iconKey} className="w-4 h-4" />
                                  </button>
                               ))}
                            </div>
                         </div>

                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                         <Edit2 size={32} className="mb-2 opacity-20" />
                         <p className="text-xs">Select a category to edit</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* Help Guide Modal */}
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="w-full max-w-4xl max-h-[85vh] rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 p-5 bg-zinc-900/30">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                         <BookOpen size={20} />
                      </div>
                      <div>
                         <h2 className="text-lg font-bold text-white tracking-tight">Creator Sync Guide</h2>
                         <p className="text-xs text-zinc-500">Mastering your production pipeline</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setIsHelpModalOpen(false)} 
                     className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                      
                      {/* Section 1: Concept */}
                      <section className="space-y-3">
                         <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                           <Layers size={14} className="text-indigo-500" /> Core Workflow
                         </h3>
                         <div className="prose prose-sm prose-invert text-zinc-400 text-xs leading-relaxed space-y-2">
                            <p>
                               Creator Sync connects your <strong>Project Pipeline</strong> (Sidebar) with your <strong>Release Schedule</strong> (Calendar).
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                               <li>
                                  <strong className="text-zinc-300">Left Sidebar:</strong> Your backlog. Create projects here. They move through <em>Planning</em> → <em>In Progress</em> → <em>Completed</em>.
                               </li>
                               <li>
                                  <strong className="text-zinc-300">Calendar:</strong> Your release dates. Drag projects from the sidebar onto a date to schedule them.
                               </li>
                               <li>
                                  <strong className="text-zinc-300">Drag & Drop:</strong> Everything is movable. Drag sidebar items to change status. Drag calendar items to reschedule.
                               </li>
                            </ul>
                         </div>
                      </section>

                      {/* Section 2: Scheduling */}
                      <section className="space-y-3">
                         <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                           <Calendar size={14} className="text-emerald-500" /> Scheduling & Navigation
                         </h3>
                         <div className="prose prose-sm prose-invert text-zinc-400 text-xs leading-relaxed space-y-2">
                            <p>
                               Once a project is on the calendar, it is considered "Scheduled".
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                               <li>
                                  <span className="text-zinc-300">Jump to Date:</span> Click the small date button on a sidebar card to jump to its month in the calendar.
                               </li>
                               <li>
                                  <span className="text-zinc-300">Locate Project:</span> Click any item on the calendar grid to auto-scroll the sidebar to the original project card.
                               </li>
                               <li>
                                  <span className="text-zinc-300">Remove Schedule:</span> Hover over a calendar item and click the <X size={10} className="inline" /> button, or drag it to the Trash at the top. This removes the date but keeps the project.
                               </li>
                            </ul>
                         </div>
                      </section>

                      {/* Section 3: Statuses */}
                      <section className="space-y-3">
                         <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                           <ListTodo size={14} className="text-amber-500" /> Project Statuses
                         </h3>
                         <div className="space-y-3">
                            <div className="flex gap-3">
                               <div className="w-16 shrink-0 text-[10px] font-bold text-zinc-500 text-right mt-0.5">PLANNING</div>
                               <p className="text-xs text-zinc-400">Ideas, concepts, and drafts. Not yet in full production.</p>
                            </div>
                            <div className="flex gap-3">
                               <div className="w-16 shrink-0 text-[10px] font-bold text-zinc-300 text-right mt-0.5">IN PROGRESS</div>
                               <p className="text-xs text-zinc-400">Active work. Most of your daily focus should be here.</p>
                            </div>
                            <div className="flex gap-3">
                               <div className="w-16 shrink-0 text-[10px] font-bold text-emerald-500 text-right mt-0.5">COMPLETED</div>
                               <p className="text-xs text-zinc-400">Production finished, ready for release. Waiting to be scheduled.</p>
                            </div>
                            <div className="flex gap-3">
                               <div className="w-16 shrink-0 text-[10px] font-bold text-zinc-600 text-right mt-0.5">PAUSED</div>
                               <p className="text-xs text-zinc-400">On hold indefinitely.</p>
                            </div>
                         </div>
                      </section>

                      {/* Section 4: Archiving */}
                      <section className="space-y-3">
                         <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                           <Archive size={14} className="text-violet-500" /> Published vs. Archive
                         </h3>
                         <div className="prose prose-sm prose-invert text-zinc-400 text-xs leading-relaxed space-y-2">
                            <p>
                               To keep your Pipeline clean, use the tabs at the top of the sidebar.
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                               <li>
                                  <strong className="text-zinc-300">Pipeline Tab:</strong> Shows active and upcoming work.
                               </li>
                               <li>
                                  <strong className="text-zinc-300">Published Tab:</strong> Automatically holds projects that were scheduled in the past.
                               </li>
                               <li>
                                  <strong className="text-zinc-300">Archive Button <Archive size={10} className="inline text-zinc-500" />:</strong> On any card, click the archive box icon to manually force a project into the Published tab (e.g., if you cancelled it or finished it without scheduling).
                               </li>
                            </ul>
                         </div>
                      </section>

                      {/* Section 5: Deletion */}
                      <section className="space-y-3 border-t border-zinc-800 pt-6 mt-2">
                         <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                           <Trash2 size={14} className="text-red-500" /> Trash & Deletion
                         </h3>
                         <div className="flex items-start gap-4 bg-red-950/10 border border-red-900/20 p-4 rounded-lg">
                            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="text-xs text-zinc-400 space-y-1">
                               <p><strong className="text-red-300">Dragging to Trash:</strong> Dragging a <em>Calendar Item</em> to the top trash bin removes the date. Dragging a <em>Sidebar Project</em> to the trash bin deletes the project entirely.</p>
                               <p>You can also delete projects via the <Edit2 size={10} className="inline" /> Edit menu.</p>
                            </div>
                         </div>
                      </section>

                      {/* Section 6: Data & Safety */}
                      <section className="space-y-3 border-t border-zinc-800 pt-6 mt-2">
                         <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                           <ShieldCheck size={14} className="text-blue-500" /> Data & Safety
                         </h3>
                         <div className="prose prose-sm prose-invert text-zinc-400 text-xs leading-relaxed space-y-2">
                            <ul className="list-disc pl-4 space-y-1">
                               <li>
                                  <strong className="text-zinc-300">Undo Action <Undo2 size={10} className="inline"/>:</strong> Made a mistake? Press <code>Ctrl+Z</code> or click the Undo arrow in the top toolbar to revert your last action (Drag, Delete, Edit).
                               </li>
                               <li>
                                  <strong className="text-zinc-300">Backup & Restore:</strong> Go to <em>Settings <Settings size={10} className="inline"/></em> → <em>Data Backup</em> to export your entire workspace to a JSON file. Use this to move data between devices.
                               </li>
                            </ul>
                         </div>
                      </section>
                   </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                   <button 
                     onClick={() => setIsHelpModalOpen(false)}
                     className="px-6 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-bold rounded-md transition-colors"
                   >
                     Got it
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </DndContext>
  );
}
