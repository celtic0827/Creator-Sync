
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
  isWithinInterval
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Undo2,
  Layers,
  List,
  LayoutGrid,
  Copy, Edit2, Trash2, Archive, RotateCcw
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; projectId: string } | null>(null);

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
  // When switching months, the original draggable item might be unmounted.
  // We check if the active item is off-screen, and if so, render a hidden proxy to keep the DnD session alive.
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
    const threshold = 100; // pixels from edge to trigger paging

    // Check Bottom Edge -> Next Month
    if (activeRect.top + activeRect.height > viewportHeight - threshold) {
        setCurrentMonth(prev => addMonths(prev, 1));
        pagingCooldown.current = true;
        setTimeout(() => { pagingCooldown.current = false; }, 800); // 800ms cooldown
    }
    // Check Top Edge -> Prev Month
    // We check top edge > 0 to ensure we don't trigger if cursor left the window upwards
    else if (activeRect.top < threshold && activeRect.top > -50) {
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
      setProjects(prev => [...prev, {
        id: crypto.randomUUID(), name: formData.name || 'Untitled', description: formData.description || '',
        tags: formData.tags || [], status: formData.status || activeStatuses[0].id,
        type: formData.type || 'VIDEO', color: config.color, checklist: []
      }]);
    }
    setIsModalOpen(false); setEditingProjectId(null);
  };

  const handleDeleteProject = () => {
    if (!editingProjectId) return;
    saveHistory();
    setSchedule(prev => prev.filter(s => s.projectId !== editingProjectId));
    setProjects(prev => prev.filter(p => p.id !== editingProjectId));
    setIsModalOpen(false); setEditingProjectId(null);
  };

  // --- Context Menu Handlers ---
  const handleContextMenu = useCallback((e: React.MouseEvent, projectId: string) => {
    setContextMenu({ x: e.clientX, y: e.clientY, projectId });
  }, []);

  const handleDuplicateProject = () => {
    if (!contextMenu) return;
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
    setIsModalOpen(true);
  };

  const handleArchiveToggle = () => {
    if (!contextMenu) return;
    const project = projects.find(p => p.id === contextMenu.projectId);
    if (!project) return;
    
    saveHistory();
    const isArchived = project.status === ProjectStatus.ARCHIVED;
    const newStatus = isArchived ? activeStatuses[0].id : ProjectStatus.ARCHIVED;
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus } : p));
  };

  const handleDeleteFromContext = () => {
    if (!contextMenu) return;
    const project = projects.find(p => p.id === contextMenu.projectId);
    if (project && confirm(`Delete project "${project.name}" permanently?`)) {
       saveHistory();
       setSchedule(prev => prev.filter(s => s.projectId !== project.id));
       setProjects(prev => prev.filter(p => p.id !== project.id));
    }
  };

  const handleEditFromContext = () => {
    if (!contextMenu) return;
    setEditingProjectId(contextMenu.projectId);
    setIsModalOpen(true);
  }

  // Generate Menu Actions
  const getMenuActions = (): ContextMenuAction[] => {
    if (!contextMenu) return [];
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
          onOpenCreateModal={() => { setEditingProjectId(null); setIsModalOpen(true); }}
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

        <main className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 relative transition-colors duration-200">
          <div className="flex items-center justify-between px-8 py-6 h-20">
             <div className="flex items-center gap-6">
               <div className="w-60">
                 <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight capitalize">
                   {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                 </h2>
               </div>
               <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-1">
                 <button onClick={() => setCurrentMonth(prev => addMonths(prev, -1))} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                 <button onClick={() => setCurrentMonth(new Date())} className="w-16 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white whitespace-nowrap">{t('today', lang)}</button>
                 <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"><ChevronRight size={16} /></button>
               </div>
               
               {/* Global Search Component inserted here */}
               <div className="mx-2">
                 <GlobalSearch 
                    projects={projects}
                    schedule={schedule}
                    categoryConfig={categoryConfig}
                    appSettings={appSettings}
                    lang={lang}
                    onNavigate={handleSearchNavigation}
                 />
               </div>

               <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 p-0.5">
                  <button onClick={() => toggleViewMode('COMPACT')} className={`p-1.5 rounded transition-all ${appSettings.calendarViewMode === 'COMPACT' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}><List size={14} /></button>
                  <button onClick={() => toggleViewMode('BLOCK')} className={`p-1.5 rounded transition-all ${appSettings.calendarViewMode === 'BLOCK' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}><LayoutGrid size={14} /></button>
               </div>
               <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-800/50 mx-2"></div>
               <button onClick={handleUndo} disabled={history.length === 0} className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all ${history.length > 0 ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 shadow-sm' : 'bg-transparent border-transparent text-zinc-400 cursor-default opacity-50'}`}><Undo2 size={16} /></button>
               <TrashDropZone activeDragId={activeDragId} lang={lang} />
             </div>
             <div className="flex items-center gap-3">
               <div className="text-right"><h1 className="text-xs font-bold tracking-tight text-zinc-500 dark:text-zinc-300 uppercase">Creator Sync</h1><p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">Pro Scheduler</p></div>
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 shadow-inner"><Layers size={16} /></div>
             </div>
          </div>

          <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col" onWheel={handleCalendarWheel}>
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (<div key={day} className="text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{day}</div>))}
            </div>
            <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 shadow-xl dark:shadow-2xl">
               <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 h-full min-h-[500px]">
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

        <ProjectFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProjectId(null); }} onSave={handleSaveProject} onDelete={editingProjectId ? handleDeleteProject : undefined} editingProject={editingProjectId ? projects.find(p => p.id === editingProjectId) : null} categoryConfig={categoryConfig} lang={lang} activeStatuses={activeStatuses} statusMode={appSettings.statusMode} />
        <ChecklistModal isOpen={!!checklistProjectId} onClose={() => setChecklistProjectId(null)} project={checklistProjectId ? projects.find(p => p.id === checklistProjectId) || null : null} onUpdateProject={(u) => setProjects(p => p.map(x => x.id === u.id ? u : x))} lang={lang} />
        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} categoryConfig={categoryConfig} onUpdateCategory={setCategoryConfig} onExportData={exportData} onImportData={importData} appSettings={appSettings} onUpdateAppSettings={setAppSettings} />
        <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} lang={lang} />
      </div>
    </DndContext>
  );
}
