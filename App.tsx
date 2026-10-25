
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  DragStartEvent, 
  DragEndEvent, 
  DragMoveEvent,
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor,
  pointerWithin,
  MeasuringStrategy
} from '@dnd-kit/core';
import { 
  format, 
  endOfMonth, 
  eachDayOfInterval, 
  endOfWeek, 
  addMonths,
  startOfWeek,
  startOfMonth,
  isWithinInterval,
  addDays,
  subDays,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Undo2,
  Layers,
  List,
  LayoutGrid,
  Copy, Edit2, Trash2, Archive, RotateCcw, CalendarPlus, FastForward, Rewind
} from 'lucide-react';

import { Project, ScheduleItem, DragData, SidebarTab, ProjectStatus } from './types';
import { ProjectCard } from './components/ProjectCard';
import { CalendarCell } from './components/CalendarCell';
import { DraggableScheduleItem } from './components/DraggableScheduleItem';
import { ProjectFormModal } from './components/modals/ProjectFormModal';
import { ChecklistModal } from './components/modals/ChecklistModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { HelpModal } from './components/modals/HelpModal';
import { Sidebar } from './components/Sidebar';
import { TrashDropZone } from './components/TrashDropZone';
import { ContextMenu, ContextMenuAction } from './components/ContextMenu';
import { GlobalSearch } from './components/GlobalSearch';
import { t } from './translations';
import { useAppStore } from './hooks/useAppStore';

export default function App() {
  // --- Data & Logic from Hook ---
  const {
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
  } = useAppStore();

  // --- UI State ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);
  const scrollCooldown = useRef(false);
  const pagingCooldown = useRef(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [checklistProjectId, setChecklistProjectId] = useState<string | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ 
    x: number; 
    y: number; 
    type: 'project' | 'cell'; 
    projectId?: string; 
    targetDate?: string; 
  } | null>(null);
  const [targetScheduleDate, setTargetScheduleDate] = useState<string | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // --- DnD Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // --- Helpers & Handlers ---

  const handleCalendarWheel = useCallback((e: React.WheelEvent) => {
    if (scrollCooldown.current) return;
    if (e.deltaY > 0) setCurrentMonth(prev => addMonths(prev, 1));
    else if (e.deltaY < 0) setCurrentMonth(prev => addMonths(prev, -1));
    scrollCooldown.current = true;
    setTimeout(() => { scrollCooldown.current = false; }, 400);
  }, []);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ 
      start: startOfWeek(startOfMonth(currentMonth)), 
      end: endOfWeek(endOfMonth(currentMonth)) 
    });
  }, [currentMonth]);

  const weekDays = useMemo(() => {
    const base = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() + i);
      return format(d, 'EEE', { locale: dateLocale });
    });
  }, [dateLocale]);

  // --- Preservation Logic for Draggable Items ---
  const activeDraggableHiddenProxy = useMemo(() => {
    if (!activeDragData || activeDragData.type !== 'SCHEDULE_ITEM' || !activeDragData.scheduleId || !activeDragData.originDate) {
        return null;
    }
    
    // Check if the origin date is currently visible in the calendarDays grid
    const start = calendarDays[0];
    const end = calendarDays[calendarDays.length - 1];
    
    // Set times to ensure inclusive comparison
    const s = new Date(start); s.setHours(0,0,0,0);
    const e = new Date(end); e.setHours(23,59,59,999);
    const origin = new Date(activeDragData.originDate); origin.setHours(12,0,0,0);

    const isVisible = isWithinInterval(origin, { start: s, end: e });

    if (isVisible) return null;

    // Not visible, return the item and project to render a proxy
    const item = schedule.find(s => s.id === activeDragData.scheduleId);
    const project = projects.find(p => p.id === activeDragData.projectId);
    
    if (item && project) {
        return { item, project };
    }
    return null;
  }, [activeDragData, calendarDays, schedule, projects]);

  const handleJumpToProject = useCallback((projectId: string, dateStr: string) => {
    setCurrentMonth(new Date(dateStr + 'T00:00:00'));
    setHighlightedProjectId(projectId);
    setTimeout(() => setHighlightedProjectId(null), 2000);
  }, []);

  // Common logic for finding a project in the sidebar and scrolling to it
  const scrollToSidebarProject = useCallback((projectId: string) => {
    const isPublished = publishedProjects.some(p => p.id === projectId);
    const targetTab: SidebarTab = isPublished ? 'published' : 'pipeline';
    
    if (sidebarTab !== targetTab) {
        setSidebarTab(targetTab);
    }
    
    setHighlightedProjectId(projectId);
    
    // We need a slight delay to allow the tab switch (React render) to happen
    // before we try to find the DOM element
    setTimeout(() => {
      const container = document.getElementById('sidebar-content-container');
      const target = document.getElementById(`project-card-${projectId}`);

      if (container && target) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const relativeTop = targetRect.top - containerRect.top;
          const targetScrollTop = container.scrollTop + relativeTop - (container.clientHeight / 2) + (target.clientHeight / 2);

          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
      }
      setTimeout(() => setHighlightedProjectId(null), 2000);
    }, 100); 
  }, [publishedProjects, sidebarTab]);

  const handleScheduleItemClick = useCallback((projectId: string) => {
    scrollToSidebarProject(projectId);
  }, [scrollToSidebarProject]);

  const handleSearchNavigation = useCallback((projectId: string, scheduledDate?: string) => {
      if (scheduledDate) {
          // If scheduled, jump to the date on the calendar
          handleJumpToProject(projectId, scheduledDate);
      } else {
          // If not scheduled, find it in the sidebar
          scrollToSidebarProject(projectId);
      }
  }, [handleJumpToProject, scrollToSidebarProject]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    setActiveDragData(event.active.data.current as DragData);
    setContextMenu(null); // Close context menu on drag
  };

  const handleDragMove = (event: DragMoveEvent) => {
    // Check cooldown
    if (pagingCooldown.current) return;

    // We need the translated rect (where the item is currently on screen)
    const activeRect = event.active.rect.current.translated;
    if (!activeRect) return;

    // Detect if we are dragging inside the Calendar area (approximate sidebar width is 340px)
    // We don't want to switch months if user is just organizing the sidebar
    if (activeRect.left < 360) return;

    const viewportHeight = window.innerHeight;
    
    // Configurable thresholds
    const topThreshold = 100; // Loose threshold for going back (previous month)
    const bottomThreshold = 15; // Strict threshold for going forward (prevent accidental drops)

    // Check Bottom Edge -> Next Month
    if (activeRect.top + activeRect.height > viewportHeight - bottomThreshold) {
        setCurrentMonth(prev => addMonths(prev, 1));
        pagingCooldown.current = true;
        setTimeout(() => { pagingCooldown.current = false; }, 800); // 800ms cooldown
    }
    // Check Top Edge -> Prev Month
    // We check top edge > -50 to ensure we don't trigger if cursor left the window completely upwards in a weird way
    else if (activeRect.top < topThreshold && activeRect.top > -50) {
        setCurrentMonth(prev => addMonths(prev, -1));
        pagingCooldown.current = true;
        setTimeout(() => { pagingCooldown.current = false; }, 800);
    }
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
      const existing = schedule.find(s => s.projectId === data.projectId);
      if (existing) {
        setSchedule(prev => prev.map(item => item.id === existing.id ? { ...item, date: targetDate } : item));
      } else {
        setSchedule(prev => [...prev, { id: crypto.randomUUID(), date: targetDate, projectId: data.projectId, note: 'Release' }]);
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
        setProjects(prev => prev.map(p => p.id === data.projectId ? { ...p, status: newStatus } : p));
      }
    }
  };

  const handleSaveProject = (formData: Partial<Project>) => {
    saveHistory();
    const config = categoryConfig[formData.type || 'VIDEO'];
    if (editingProjectId) {
      setProjects(prev => prev.map(p => p.id === editingProjectId ? { ...p, ...formData, color: config.color } as Project : p));
    } else {
      const newProjectId = crypto.randomUUID();
      setProjects(prev => [...prev, {
        id: newProjectId, name: formData.name || 'Untitled', description: formData.description || '',
        tags: formData.tags || [], status: formData.status || activeStatuses[0].id,
        type: formData.type || 'VIDEO', color: config.color, checklist: []
      }]);

      // If created from a calendar cell right-click, schedule it automatically!
      if (targetScheduleDate) {
        setSchedule(prev => [...prev, {
          id: crypto.randomUUID(),
          date: targetScheduleDate,
          projectId: newProjectId,
          note: 'Release'
        }]);
      }
    }
    setIsModalOpen(false); 
    setEditingProjectId(null);
    setTargetScheduleDate(null);
  };

  const handleDeleteProject = () => {
    if (!editingProjectId) return;
    saveHistory();
    setSchedule(prev => prev.filter(s => s.projectId !== editingProjectId));
    setProjects(prev => prev.filter(p => p.id !== editingProjectId));
    setIsModalOpen(false); 
    setEditingProjectId(null);
    setTargetScheduleDate(null);
  };

  // --- Context Menu Handlers ---
  const handleContextMenu = useCallback((e: React.MouseEvent, projectId: string) => {
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'project', projectId });
  }, []);

  const handleCellContextMenu = useCallback((e: React.MouseEvent, dateStr: string) => {
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'cell', targetDate: dateStr });
  }, []);

  const handleDuplicateProject = () => {
    if (!contextMenu || contextMenu.type !== 'project' || !contextMenu.projectId) return;
    const original = projects.find(p => p.id === contextMenu.projectId);
    if (!original) return;

    saveHistory();
    const newId = crypto.randomUUID();
    const copy: Project = { 
      ...original, 
      id: newId, 
      name: `${original.name} (Copy)`,
      checklist: original.checklist?.map(c => ({...c, id: crypto.randomUUID(), isCompleted: false})) || []
    };
    
    setProjects(prev => [...prev, copy]);
    // Immediate edit
    setEditingProjectId(newId);
    setTargetScheduleDate(null);
    setIsModalOpen(true);
  };

  const handleArchiveToggle = () => {
    if (!contextMenu || contextMenu.type !== 'project' || !contextMenu.projectId) return;
    const project = projects.find(p => p.id === contextMenu.projectId);
    if (!project) return;
    
    saveHistory();
    const isArchived = project.status === ProjectStatus.ARCHIVED;
    const newStatus = isArchived ? activeStatuses[0].id : ProjectStatus.ARCHIVED;
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus } : p));
  };

  const handleDeleteFromContext = () => {
    if (!contextMenu || contextMenu.type !== 'project' || !contextMenu.projectId) return;
    const project = projects.find(p => p.id === contextMenu.projectId);
    if (project && confirm(`Delete project "${project.name}" permanently?`)) {
       saveHistory();
       setSchedule(prev => prev.filter(s => s.projectId !== project.id));
       setProjects(prev => prev.filter(p => p.id !== project.id));
    }
  };

  const handleEditFromContext = () => {
    if (!contextMenu || contextMenu.type !== 'project' || !contextMenu.projectId) return;
    setEditingProjectId(contextMenu.projectId);
    setTargetScheduleDate(null);
    setIsModalOpen(true);
  };

  const handleShiftBackward = useCallback((dateStr: string) => {
    const affected = schedule.filter(s => s.date >= dateStr);
    if (affected.length === 0) return;
    saveHistory();
    setSchedule(prev => {
      return prev.map(item => {
        if (item.date >= dateStr) {
          const d = parseISO(item.date);
          return { ...item, date: format(addDays(d, 1), 'yyyy-MM-dd') };
        }
        return item;
      });
    });
    showToast(
      lang === 'zh-TW'
        ? `已將 ${dateStr} 起共 ${affected.length} 個排程專案順延 1 天 (+1 天)`
        : `Postponed ${affected.length} projects from ${dateStr} by 1 day (+1 Day)`
    );
  }, [schedule, saveHistory, setSchedule, showToast, lang]);

  const handleRemoveAndShiftForward = useCallback((dateStr: string) => {
    const targetItems = schedule.filter(s => s.date === dateStr);
    const subsequent = schedule.filter(s => s.date > dateStr);
    
    // If no items on current date AND no subsequent items, nothing to do
    if (targetItems.length === 0 && subsequent.length === 0) return;

    saveHistory();
    setSchedule(prev => {
      return prev
        .filter(item => item.date !== dateStr)
        .map(item => {
          if (item.date > dateStr) {
            const d = parseISO(item.date);
            return { ...item, date: format(subDays(d, 1), 'yyyy-MM-dd') };
          }
          return item;
        });
    });

    if (targetItems.length > 0) {
      showToast(
        lang === 'zh-TW'
          ? `已刪除 ${dateStr} 的 ${targetItems.length} 個專案排程，後續 ${subsequent.length} 個專案已前移 1 天 (-1 天)`
          : `Removed ${targetItems.length} project(s) on ${dateStr} & shifted ${subsequent.length} next forward (-1 Day)`
      );
    } else {
      showToast(
        lang === 'zh-TW'
          ? `${dateStr} 當日無排程，已將後續 ${subsequent.length} 個專案前移 1 天 (-1 天)`
          : `Shifted subsequent ${subsequent.length} project(s) forward by 1 day (-1 Day)`
      );
    }
  }, [schedule, saveHistory, setSchedule, showToast, lang]);

  // Generate Menu Actions
  const getMenuActions = (): ContextMenuAction[] => {
    if (!contextMenu) return [];

    if (contextMenu.type === 'cell') {
      if (!contextMenu.targetDate) return [];
      const dateStr = contextMenu.targetDate;
      const targetItems = schedule.filter(s => s.date === dateStr);
      const subsequentItems = schedule.filter(s => s.date > dateStr);
      const affectedBackwardItems = schedule.filter(s => s.date >= dateStr);

      const hasTarget = targetItems.length > 0;
      const hasSubsequent = subsequentItems.length > 0;
      const canShiftForward = hasTarget || hasSubsequent;

      let forwardLabel = '';
      if (hasTarget) {
        forwardLabel = lang === 'zh-TW'
          ? `刪除當日專案 (${targetItems.length}) 並將後續前移 (-1 天)`
          : `Delete date project (${targetItems.length}) & shift next (-1 Day)`;
      } else if (hasSubsequent) {
        forwardLabel = lang === 'zh-TW'
          ? `將後續專案往前推一天 (-1 天)`
          : `Shift subsequent projects forward (-1 Day)`;
      } else {
        forwardLabel = lang === 'zh-TW'
          ? `將後續專案前移 (無後續專案)`
          : `Shift subsequent projects (No projects)`;
      }

      return [
        { 
          id: 'create_project_here', 
          label: lang === 'zh-TW' 
            ? `在此日期新增專案 (${dateStr})` 
            : `New Project on ${dateStr}`, 
          icon: CalendarPlus, 
          onClick: () => {
            setTargetScheduleDate(dateStr);
            setEditingProjectId(null);
            setIsModalOpen(true);
          } 
        },
        {
          id: 'shift_backward',
          dividerAbove: true,
          disabled: affectedBackwardItems.length === 0,
          label: affectedBackwardItems.length === 0
            ? (lang === 'zh-TW' ? `將此日及後續專案順延 (無專案)` : `Postpone from this date (No projects)`)
            : (lang === 'zh-TW' ? `將此日及後續專案順延一天 (+1 天)` : `Postpone from this date (+1 Day)`),
          icon: FastForward,
          onClick: () => handleShiftBackward(dateStr)
        },
        {
          id: 'remove_and_shift_forward',
          disabled: !canShiftForward,
          label: forwardLabel,
          icon: Rewind,
          danger: hasTarget,
          onClick: () => handleRemoveAndShiftForward(dateStr)
        }
      ];
    }

    if (!contextMenu.projectId) return [];
    const project = projects.find(p => p.id === contextMenu.projectId);
    if (!project) return [];
    
    const isArchived = project.status === ProjectStatus.ARCHIVED;

    return [
      { id: 'duplicate', labelKey: 'menu_duplicate', icon: Copy, onClick: handleDuplicateProject },
      { id: 'edit', labelKey: 'edit', icon: Edit2, onClick: handleEditFromContext },
      { id: 'archive', labelKey: isArchived ? 'restore' : 'archive', icon: isArchived ? RotateCcw : Archive, onClick: handleArchiveToggle },
      { id: 'delete', labelKey: 'menu_delete', icon: Trash2, onClick: handleDeleteFromContext, danger: true },
    ];
  };

  // Keyboard undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const toggleViewMode = (mode: 'COMPACT' | 'BLOCK') => setAppSettings(p => ({ ...p, calendarViewMode: mode }));

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={pointerWithin} 
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart} 
      onDragMove={handleDragMove} 
      onDragEnd={handleDragEnd}
    >
      <div 
        className={`flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/30 ${lang === 'zh-TW' ? 'lang-zh' : ''}`}
        onContextMenu={(e) => {
           // Prevent context menu on background, but allow if it bubbled up from a card
           if(contextMenu) return; 
           // Optional: You could allow native context menu on empty areas
        }}
      >
        
        <Sidebar 
          pipelineProjects={pipelineProjects}
          publishedProjects={publishedProjects}
          activeStatuses={activeStatuses}
          categoryConfig={categoryConfig}
          appSettings={appSettings}
          lang={lang}
          onOpenCreateModal={() => { setTargetScheduleDate(null); setEditingProjectId(null); setIsModalOpen(true); }}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          getProjectScheduledDate={getProjectScheduledDate}
          onJumpToProject={handleJumpToProject}
          onEditProject={(p) => { setEditingProjectId(p.id); setIsModalOpen(true); }}
          onToggleArchive={(p) => {
            saveHistory();
            const isArchived = p.status === ProjectStatus.ARCHIVED;
            setProjects(prev => prev.map(proj => proj.id === p.id ? { ...proj, status: isArchived ? activeStatuses[0].id : ProjectStatus.ARCHIVED } : proj));
          }}
          onOpenChecklist={(pid) => setChecklistProjectId(pid)}
          onContextMenu={handleContextMenu}
          highlightedProjectId={highlightedProjectId}
        />

        <main className="flex-1 min-w-0 flex flex-col bg-zinc-50 dark:bg-zinc-950 relative transition-colors duration-200">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4 lg:py-6 h-20 min-w-0">
             <div className="flex items-center gap-2 md:gap-3 xl:gap-5 min-w-0 flex-1 overflow-x-auto no-scrollbar py-1">
               <div className="shrink-0">
                 <h2 className="text-xl lg:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight capitalize whitespace-nowrap">
                   {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                 </h2>
               </div>
               <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-1 shrink-0">
                 <button onClick={() => setCurrentMonth(prev => addMonths(prev, -1))} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                 <button onClick={() => setCurrentMonth(new Date())} className="w-14 sm:w-16 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white whitespace-nowrap">{t('today', lang)}</button>
                 <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"><ChevronRight size={16} /></button>
               </div>
               
               {/* Global Search Component inserted here */}
               <div className="shrink-0">
                 <GlobalSearch 
                    projects={projects}
                    schedule={schedule}
                    categoryConfig={categoryConfig}
                    appSettings={appSettings}
                    lang={lang}
                    onNavigate={handleSearchNavigation}
                 />
               </div>

               <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 p-0.5 shrink-0">
                  <button onClick={() => toggleViewMode('COMPACT')} className={`p-1.5 rounded transition-all ${appSettings.calendarViewMode === 'COMPACT' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}><List size={14} /></button>
                  <button onClick={() => toggleViewMode('BLOCK')} className={`p-1.5 rounded transition-all ${appSettings.calendarViewMode === 'BLOCK' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}><LayoutGrid size={14} /></button>
               </div>
               <div className="hidden sm:block h-6 w-px bg-zinc-300 dark:bg-zinc-800/50 mx-1 shrink-0"></div>
               <button onClick={handleUndo} disabled={history.length === 0} className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-all ${history.length > 0 ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 shadow-sm' : 'bg-transparent border-transparent text-zinc-400 cursor-default opacity-50'}`}><Undo2 size={16} /></button>
               <TrashDropZone activeDragId={activeDragId} lang={lang} />
             </div>
             <div className="flex items-center gap-2 lg:gap-3 shrink-0 ml-3">
               <div className="text-right hidden sm:block"><h1 className="text-xs font-bold tracking-tight text-zinc-500 dark:text-zinc-300 uppercase">Creator Sync</h1><p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">Pro Scheduler</p></div>
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 shadow-inner"><Layers size={16} /></div>
             </div>
          </div>

          <div className="flex-1 min-w-0 px-4 lg:px-8 pb-4 lg:pb-8 overflow-hidden flex flex-col" onWheel={handleCalendarWheel}>
            <div className="grid grid-cols-7 mb-2 min-w-0">
              {weekDays.map(day => (<div key={day} className="text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest truncate">{day}</div>))}
            </div>
            <div className="flex-1 min-w-0 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 shadow-xl dark:shadow-2xl custom-scrollbar">
               <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 h-full min-h-[500px] min-w-0">
                {calendarDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  return (
                    <CalendarCell 
                      key={day.toISOString()} 
                      date={day} 
                      items={scheduleLookup[dateStr] || []} 
                      projects={projects}
                      categoryConfig={categoryConfig}
                      highlightedProjectId={highlightedProjectId}
                      onItemClick={handleScheduleItemClick}
                      onRemoveItem={(sid) => { saveHistory(); setSchedule(p => p.filter(s => s.id !== sid)); }}
                      onEditProject={(p) => { setEditingProjectId(p.id); setIsModalOpen(true); }}
                      onContextMenu={handleContextMenu}
                      onCellContextMenu={handleCellContextMenu}
                      viewMode={appSettings.calendarViewMode}
                      appSettings={appSettings}
                    />
                  );
                })}
               </div>
            </div>
          </div>
        </main>

        <DragOverlay>
          {activeDragId && (
            activeDragData?.type === 'PROJECT_SOURCE' ? 
              <div className="w-[300px]"><ProjectCard project={projects.find(p => p.id === activeDragData.projectId)!} categoryConfig={categoryConfig} isOverlay appSettings={appSettings} /></div> : 
              <div className="w-auto"><DraggableScheduleItem item={schedule.find(s => s.id === activeDragData.scheduleId)!} project={projects.find(p => p.id === activeDragData.projectId)!} categoryConfig={categoryConfig} isOverlay viewMode={appSettings.calendarViewMode} appSettings={appSettings} /></div>
          )}
        </DragOverlay>

        {/* HIDDEN PROXY: Keeps draggable mounted if its original cell is unmounted during month switch */}
        <div style={{ display: 'none' }}>
           {activeDraggableHiddenProxy && (
               <DraggableScheduleItem 
                 item={activeDraggableHiddenProxy.item}
                 project={activeDraggableHiddenProxy.project}
                 categoryConfig={categoryConfig}
                 appSettings={appSettings}
                 viewMode={appSettings.calendarViewMode}
               />
           )}
        </div>

        {contextMenu && (
          <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            onClose={() => setContextMenu(null)}
            actions={getMenuActions()}
            lang={lang}
          />
        )}

        <ProjectFormModal 
          isOpen={isModalOpen} 
          onClose={() => { 
            setIsModalOpen(false); 
            setEditingProjectId(null); 
            setTargetScheduleDate(null); 
          }} 
          onSave={handleSaveProject} 
          onDelete={editingProjectId ? handleDeleteProject : undefined} 
          editingProject={editingProjectId ? projects.find(p => p.id === editingProjectId) : null} 
          targetScheduleDate={targetScheduleDate}
          categoryConfig={categoryConfig} 
          lang={lang} 
          activeStatuses={activeStatuses} 
          statusMode={appSettings.statusMode} 
        />
        <ChecklistModal isOpen={!!checklistProjectId} onClose={() => setChecklistProjectId(null)} project={checklistProjectId ? projects.find(p => p.id === checklistProjectId) || null : null} onUpdateProject={(u) => setProjects(p => p.map(x => x.id === u.id ? u : x))} lang={lang} />
        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} categoryConfig={categoryConfig} onUpdateCategory={setCategoryConfig} onExportData={exportData} onImportData={importData} appSettings={appSettings} onUpdateAppSettings={setAppSettings} />
        <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} lang={lang} />

        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 px-4 py-2 bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 text-xs font-medium rounded-full shadow-2xl backdrop-blur-md border border-zinc-700/50 dark:border-zinc-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span>{toastMessage}</span>
            <button 
              onClick={() => {
                handleUndo();
                setToastMessage(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 dark:bg-zinc-900/10 hover:bg-white/30 dark:hover:bg-zinc-900/20 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Undo2 size={12} />
              {lang === 'zh-TW' ? '復原' : 'Undo'}
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
}
