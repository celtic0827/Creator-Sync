
import React, { useState } from 'react';
import { ListTodo, Archive, List, ArrowDownAZ, Shapes, CalendarClock, Inbox, Plus, Settings, CircleHelp } from 'lucide-react';
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
  onOpenChecklist
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
      switch (mode) {
        case 'ALPHA': return a.name.localeCompare(b.name);
        case 'CATEGORY': 
          // 1. Sort by Category Order
          if (appSettings.categoryOrder) {
             const indexA = appSettings.categoryOrder.indexOf(a.type);
             const indexB = appSettings.categoryOrder.indexOf(b.type);
             const safeIndexA = indexA === -1 ? 999 : indexA;
             const safeIndexB = indexB === -1 ? 999 : indexB;
             
             if (safeIndexA !== safeIndexB) return safeIndexA - safeIndexB;
             
             // 2. Same Category -> Sort by Priority (High to Low)
             const weightA = getPriorityWeight(a.priority);
             const weightB = getPriorityWeight(b.priority);
             if (weightA !== weightB) return weightB - weightA;

             // 3. Fallback to name
             return a.name.localeCompare(b.name);
          }
          // Legacy Fallback
          const catA = categoryConfig[a.type]?.label || '';
          const catB = categoryConfig[b.type]?.label || '';
          return catA.localeCompare(catB);
        case 'DATE':
          const dateA = getProjectScheduledDate(a.id);
          const dateB = getProjectScheduledDate(b.id);
          if (dateA && dateB) return dateA.localeCompare(dateB);
          if (dateA) return -1;
          if (dateB) return 1;
          return 0;
        default: return 0;
      }
    });
  };

  return (
    <aside className="w-[340px] shrink-0 border-r border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 flex flex-col z-10 transition-colors duration-200">
      {/* Header & Tabs */}
      <div className="p-4 border-b border-zinc-200 dark:border-white/5 pt-6 flex flex-col gap-3">
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

        {/* Sorting Toolbar */}
        {sidebarTab === 'pipeline' && (
          <div className="flex gap-1">
            {[
              { mode: 'DEFAULT', icon: List, label: 'sort_default' },
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
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
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
                          appSettings={appSettings}
                          onJumpToDate={scheduledDate ? (date) => onJumpToProject(project.id, date) : undefined}
                          onEdit={() => onEditProject(project)}
                          onToggleArchive={() => onToggleArchive(project)}
                          onOpenChecklist={() => onOpenChecklist(project.id)}
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
              onClick={onOpenCreateModal}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 dark:border-zinc-800 py-3 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mt-2"
            >
              <Plus size={14} /> {t('newProject', lang)}
            </button>
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
                        appSettings={appSettings}
                        onJumpToDate={scheduledDate ? (date) => onJumpToProject(project.id, date) : undefined}
                        onEdit={() => onEditProject(project)}
                        onToggleArchive={() => onToggleArchive(project)}
                        onOpenChecklist={() => onOpenChecklist(project.id)}
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
         <button 
           onClick={onOpenSettings}
           className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
           title="App Settings & Configuration"
         >
           <Settings size={14} /> {t('settings', lang)}
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
