
import React, { useState } from 'react';
import { ListTodo, Archive, List, ArrowDownAZ, Shapes, CalendarClock, Inbox, Plus, Settings, CircleHelp, ArrowUpWideNarrow, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Project, CategoryConfig, AppSettings, Language, SidebarTab, SortMode, StatusDefinition, ProjectStatus, Priority } from '../types';
import { ProjectCard } from './ProjectCard';
import { StatusZone } from './StatusZone';
import { t, getStatusText } from '../translations';

interface SidebarProps {
  pipelineProjects: Project[];
  publishedProjects: Project[];
  activeStatuses: StatusDefinition[];
  categoryConfig: CategoryConfig;
  appSettings: AppSettings;
  lang: Language;
  onOpenCreateModal: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  getProjectScheduledDate: (projectId: string) => string | undefined;
  onJumpToProject: (projectId: string, dateStr: string) => void;
  onEditProject: (project: Project) => void;
  onToggleArchive: (project: Project) => void;
  onOpenChecklist: (projectId: string) => void;
  onContextMenu?: (e: React.MouseEvent, projectId: string) => void;
  highlightedProjectId?: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  pipelineProjects,
  publishedProjects,
  activeStatuses,
  categoryConfig,
  appSettings,
  lang,
  onOpenCreateModal,
  onOpenSettings,
  onOpenHelp,
  sidebarTab,
  setSidebarTab,
  getProjectScheduledDate,
  onJumpToProject,
  onEditProject,
  onToggleArchive,
  onOpenChecklist,
  onContextMenu,
  highlightedProjectId,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    try {
      return (localStorage.getItem('patreon_scheduler_sort_v1') as SortMode) || 'DEFAULT';
    } catch { return 'DEFAULT'; }
  });

  const handleSetSortMode = (mode: SortMode) => {
    setSortMode(mode);
    localStorage.setItem('patreon_scheduler_sort_v1', mode);
  };

  const getPriorityWeight = (priority?: Priority): number => {
      if (priority === 'HIGH') return 3;
      if (priority === 'LOW') return 1;
      return 2; // Medium or undefined
  };

  const sortProjects = (projectsToSort: Project[], mode: SortMode) => {
    return [...projectsToSort].sort((a, b) => {
      // Helper for Category Sort Index
      const getCatIndex = (type: string) => {
         if (!appSettings.categoryOrder) return 999;
         const idx = appSettings.categoryOrder.indexOf(type as any);
         return idx === -1 ? 999 : idx;
      };

      switch (mode) {
        case 'ALPHA': 
             return a.name.localeCompare(b.name);
        
        case 'PRIORITY':
             const pA = getPriorityWeight(a.priority);
             const pB = getPriorityWeight(b.priority);
             if (pA !== pB) return pB - pA;
             
             const catA1 = getCatIndex(a.type);
             const catB1 = getCatIndex(b.type);
             if (catA1 !== catB1) return catA1 - catB1;

             return a.name.localeCompare(b.name);

        case 'CATEGORY': 
             const catA2 = getCatIndex(a.type);
             const catB2 = getCatIndex(b.type);
             if (catA2 !== catB2) return catA2 - catB2;
             
             const wA = getPriorityWeight(a.priority);
             const wB = getPriorityWeight(b.priority);
             if (wA !== wB) return wB - wA;

             return a.name.localeCompare(b.name);
        
        case 'DATE':
             const dateA = getProjectScheduledDate(a.id);
             const dateB = getProjectScheduledDate(b.id);
             if (dateA && dateB) return dateA.localeCompare(dateB);
             if (dateA) return -1;
             if (dateB) return 1;
             return 0;

        case 'DEFAULT':
        default:
             const dpA = getPriorityWeight(a.priority);
             const dpB = getPriorityWeight(b.priority);
             if (dpA !== dpB) return dpB - dpA;

             const dcA = getCatIndex(a.type);
             const dcB = getCatIndex(b.type);
             if (dcA !== dcB) return dcA - dcB;

             return a.name.localeCompare(b.name);
      }
    });
  };

  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 border-r border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 flex flex-col z-10 transition-all duration-200 items-center py-4 justify-between select-none">
        {/* Top: Toggle and Tab Switchers */}
        <div className="flex flex-col items-center gap-3 w-full px-1.5">
          <button
            onClick={onToggleCollapse}
            title={t('expand_sidebar', lang)}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <PanelLeftOpen size={18} />
          </button>

          <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800/80 my-0.5" />

          {/* Pipeline Tab Icon */}
          <button
            onClick={() => { setSidebarTab('pipeline'); }}
            title={`${t('pipeline', lang)} (${pipelineProjects.length})`}
            className={`relative p-2 rounded-lg transition-all ${
              sidebarTab === 'pipeline' 
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' 
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ListTodo size={18} />
            {pipelineProjects.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs">
                {pipelineProjects.length > 99 ? '99+' : pipelineProjects.length}
              </span>
            )}
          </button>

          {/* Published Tab Icon */}
          <button
            onClick={() => { setSidebarTab('published'); }}
            title={`${t('published', lang)} (${publishedProjects.length})`}
            className={`relative p-2 rounded-lg transition-all ${
              sidebarTab === 'published' 
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' 
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Archive size={18} />
            {publishedProjects.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-zinc-500 dark:bg-zinc-600 text-white text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs">
                {publishedProjects.length > 99 ? '99+' : publishedProjects.length}
              </span>
            )}
          </button>

          {/* Dedicated Mini Return-to-Pipeline Drop Target */}
          {activeStatuses.length > 0 && (
            <div className="w-full mt-2" title={t('drop_to_pipeline', lang)}>
              <StatusZone status={activeStatuses[0].id}>
                <div className="w-10 h-10 mx-auto rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400 flex flex-col items-center justify-center text-zinc-400 hover:text-indigo-600 transition-all cursor-pointer">
                  <Inbox size={16} />
                </div>
              </StatusZone>
            </div>
          )}
        </div>

        {/* Bottom: Action Buttons */}
        <div className="flex flex-col items-center gap-2 w-full px-1.5">
          <button
            onClick={onOpenCreateModal}
            className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-sm"
            title={t('newProject', lang)}
          >
            <Plus size={16} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
            title={t('settings', lang)}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onOpenHelp}
            className="p-2 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
            title="Help Guide"
          >
            <CircleHelp size={16} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[300px] sm:w-[320px] lg:w-[340px] shrink-0 border-r border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 flex flex-col z-10 transition-colors duration-200">
      {/* Header & Tabs */}
      <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-white/5 pt-4 sm:pt-6 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-white/5 flex-1 min-w-0">
            <button
              onClick={() => setSidebarTab('pipeline')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 text-xs font-semibold rounded-md transition-all truncate ${
                sidebarTab === 'pipeline' 
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-transparent' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <ListTodo size={14} className="shrink-0" />
              <span className="truncate">{t('pipeline', lang)}</span>
              <span className={`text-[10px] px-1.5 rounded-full shrink-0 ${sidebarTab === 'pipeline' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200' : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-600'}`}>
                {pipelineProjects.length}
              </span>
            </button>
            <button
              onClick={() => setSidebarTab('published')}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 text-xs font-semibold rounded-md transition-all truncate ${
                sidebarTab === 'published' 
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-transparent' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <Archive size={14} className="shrink-0" />
              <span className="truncate">{t('published', lang)}</span>
              <span className={`text-[10px] px-1.5 rounded-full shrink-0 ${sidebarTab === 'published' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200' : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-600'}`}>
                {publishedProjects.length}
              </span>
            </button>
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={t('collapse_sidebar', lang)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Sorting Toolbar */}
        {sidebarTab === 'pipeline' && (
          <div className="flex gap-1">
            {[
              { mode: 'DEFAULT', icon: List, label: 'sort_default' },
              { mode: 'PRIORITY', icon: ArrowUpWideNarrow, label: 'sort_priority' },
              { mode: 'ALPHA', icon: ArrowDownAZ, label: 'sort_alpha' },
              { mode: 'CATEGORY', icon: Shapes, label: 'sort_category' },
              { mode: 'DATE', icon: CalendarClock, label: 'sort_date' }
            ].map((btn) => (
              <button
                key={btn.mode}
                onClick={() => handleSetSortMode(btn.mode as SortMode)}
                className={`flex-1 flex items-center justify-center p-1.5 rounded transition-all ${
                  sortMode === btn.mode 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
                title={t(btn.label, lang)}
              >
                <btn.icon size={14} />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div id="sidebar-content-container" className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 custom-scrollbar">
        {sidebarTab === 'pipeline' && (
          <div className="flex flex-col gap-6">
            {activeStatuses.map(statusDef => {
               let statusProjects = pipelineProjects.filter(p => p.status === statusDef.id);
               statusProjects = sortProjects(statusProjects, sortMode);

               return (
                <StatusZone key={statusDef.id} status={statusDef.id}>
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
                          isHighlighted={highlightedProjectId === project.id}
                          appSettings={appSettings}
                          onJumpToDate={scheduledDate ? (date) => onJumpToProject(project.id, date) : undefined}
                          onEdit={() => onEditProject(project)}
                          onToggleArchive={() => onToggleArchive(project)}
                          onOpenChecklist={() => onOpenChecklist(project.id)}
                          onContextMenu={onContextMenu}
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
          </div>
        )}

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
                        isHighlighted={highlightedProjectId === project.id}
                        appSettings={appSettings}
                        onJumpToDate={scheduledDate ? (date) => onJumpToProject(project.id, date) : undefined}
                        onEdit={() => onEditProject(project)}
                        onToggleArchive={() => onToggleArchive(project)}
                        onOpenChecklist={() => onOpenChecklist(project.id)}
                        onContextMenu={onContextMenu}
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

      {/* Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-950 flex items-center gap-2 transition-colors">
         {/* New Project Button moved here */}
         <button 
            onClick={onOpenCreateModal}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
          >
            <Plus size={14} /> {t('newProject', lang)}
          </button>

         <button 
           onClick={onOpenSettings}
           className="flex items-center justify-center gap-2 px-3 py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
           title={t('settings', lang)}
         >
           <Settings size={16} />
         </button>
         <button 
           onClick={onOpenHelp}
           className="flex items-center justify-center gap-2 px-3 py-2 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
           title="Help Guide"
         >
           <CircleHelp size={16} />
         </button>
      </div>
    </aside>
  );
});
