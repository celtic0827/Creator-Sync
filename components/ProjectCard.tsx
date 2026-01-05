
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Project, ProjectStatus, DragData, CategoryConfig, AppSettings } from '../types';
import { GripVertical, CalendarCheck2, Edit2, Archive, RotateCcw, AlertCircle, AlertTriangle, ListTodo, CheckSquare, Square, ArrowUp } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import zhTW from 'date-fns/locale/zh-TW';
import { DynamicIcon } from './IconUtils';
import { t } from '../translations';

interface ProjectCardProps {
  project: Project;
  categoryConfig: CategoryConfig;
  isOverlay?: boolean;
  isHighlighted?: boolean;
  scheduledDate?: string;
  appSettings?: AppSettings;
  onJumpToDate?: (date: string) => void;
  onEdit?: () => void;
  onToggleArchive?: () => void;
  onOpenChecklist?: () => void;
  onContextMenu?: (e: React.MouseEvent, projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = React.memo(({ 
  project, 
  categoryConfig, 
  isOverlay = false, 
  isHighlighted = false,
  scheduledDate, 
  appSettings,
  onJumpToDate, 
  onEdit,
  onToggleArchive,
  onOpenChecklist,
  onContextMenu
}) => {
  const dragData: DragData = {
    type: 'PROJECT_SOURCE',
    projectId: project.id,
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `project-source-${project.id}`,
    data: dragData,
    disabled: isOverlay
  });

  const isScheduled = !!scheduledDate;
  const isArchived = project.status === ProjectStatus.ARCHIVED;
  const isHighPriority = project.priority === 'HIGH';
  
  const isCompleted = appSettings?.statusMode === 'CUSTOM'
     ? appSettings.customStatuses.find(s => s.id === project.status)?.isCompleted
     : project.status === ProjectStatus.COMPLETED;

  const config = categoryConfig[project.type] || { color: 'bg-zinc-800', iconKey: 'Layers' };
  const lang = appSettings?.language || 'en';
  const dateLocale = lang === 'zh-TW' ? zhTW : enUS;

  const checklist = project.checklist || [];
  const totalChecks = checklist.length;
  const completedChecks = checklist.filter(c => c.isCompleted).length;
  const hasChecklist = totalChecks > 0;
  const progressPercent = hasChecklist ? (completedChecks / totalChecks) * 100 : 0;
  const isChecklistActive = hasChecklist && completedChecks < totalChecks;

  let alertState: 'NONE' | 'WARNING' | 'CRITICAL' = 'NONE';
  if (isScheduled && !isCompleted && !isArchived && appSettings && !isOverlay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const targetDate = new Date(scheduledDate + 'T00:00:00');
      const diff = differenceInCalendarDays(targetDate, today);

      if (diff <= appSettings.criticalDays) {
          alertState = 'CRITICAL';
      } else if (diff <= appSettings.warningDays) {
          alertState = 'WARNING';
      }
  }

  let borderClasses = 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700';
  let bgClasses = 'bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm';

  if (alertState === 'CRITICAL') {
      borderClasses = 'border-red-300 dark:border-red-500/50 hover:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      bgClasses = 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30';
  } else if (alertState === 'WARNING') {
      borderClasses = 'border-amber-300 dark:border-amber-500/50 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
      bgClasses = 'bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30';
  } else if (isChecklistActive && !isScheduled) {
      borderClasses = 'border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.08)]';
  }

  const baseClasses = [
    'group relative flex items-stretch rounded-md border transition-all duration-300 overflow-visible',
    isOverlay 
      ? 'cursor-grabbing scale-105 shadow-2xl rotate-1 z-50 bg-white dark:bg-zinc-800 border-indigo-500 ring-1 ring-indigo-500/50 pointer-events-none' 
      : `cursor-pointer ${bgClasses} ${borderClasses}`,
    isDragging ? 'opacity-30' : 'opacity-100',
    isScheduled && !isOverlay ? 'ml-4' : '',
    isArchived && !isOverlay ? 'opacity-75' : '',
    isHighlighted ? 'ring-4 ring-indigo-500/50 border-indigo-500 z-20 scale-[1.02] shadow-lg' : ''
  ].filter(Boolean).join(' ');

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (isScheduled && onJumpToDate && !isOverlay) {
        onJumpToDate(scheduledDate!);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isOverlay && onEdit) {
      e.stopPropagation();
      onEdit();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isOverlay && onContextMenu) {
      e.preventDefault();
      onContextMenu(e, project.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={baseClasses}
      id={`project-card-${project.id}`}
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      title={isOverlay ? '' : (isScheduled ? `${t('jumpToDate', lang)} (${t('edit', lang)}: Double Click)` : `${t('edit', lang)}: Double Click`)}
    >
      <div className={`w-10 flex flex-col items-center justify-center shrink-0 relative rounded-l-md overflow-visible ${config.color} ${(isScheduled || isArchived) && !isOverlay ? 'opacity-80' : 'opacity-100'}`}>
         <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <DynamicIcon iconKey={config.iconKey} className="text-white/90 w-5 h-5 drop-shadow-md" />
            {isHighPriority && !isOverlay && (
                <div title="High Priority" className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full p-0.5 border border-white dark:border-zinc-900 shadow-sm z-10">
                    <ArrowUp size={8} strokeWidth={4} />
                </div>
            )}
            {hasChecklist && !isOverlay && (
              <div className="relative flex flex-col items-center w-full px-1.5 gap-0.5">
                <span className={`text-[8px] font-bold leading-none px-1 rounded-sm shadow-sm ${isChecklistActive ? 'bg-amber-400 text-amber-950' : 'bg-black/20 text-white/95'}`}>
                   {completedChecks}/{totalChecks}
                </span>
                <div className="w-full h-[4px] bg-black/30 rounded-full overflow-hidden shadow-inner">
                   <div 
                     className={`h-full transition-all duration-300 ${progressPercent === 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                     style={{ width: `${progressPercent}%` }}
                   />
                </div>
              </div>
            )}
         </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 gap-1.5">
        <div className="flex items-start justify-between gap-2">
           <h4 className={`text-sm font-medium leading-tight break-words line-clamp-2 ${isScheduled || isArchived ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
             {project.name}
           </h4>
           <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isOverlay && onOpenChecklist && (
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onOpenChecklist(); }}
                      className={`p-1 rounded transition-all flex items-center gap-1 ${isChecklistActive ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-500/20' : 'text-zinc-400 hover:text-indigo-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                      title={t('checklist_title', lang)}
                    >
                      <ListTodo size={12} />
                    </button>
                  )}
                  {!isOverlay && onToggleArchive && (
                    <button 
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}
                      className={`p-1 rounded transition-all ${isArchived ? 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-200 dark:hover:bg-zinc-700' : 'text-zinc-400 hover:text-indigo-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                      title={isArchived ? t('restore', lang) : t('archive', lang)}
                    >
                      {isArchived ? <RotateCcw size={12} /> : <Archive size={12} />}
                    </button>
                  )}
                  {!isOverlay && onEdit && (
                      <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1 text-zinc-400 hover:text-indigo-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-all"
                        title={t('edit', lang)}
                      >
                        <Edit2 size={12} />
                      </button>
                  )}
              </div>
              {!isScheduled && !isOverlay && (
                <div className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors cursor-grab ml-1">
                   <GripVertical size={14} />
                </div>
              )}
           </div>
        </div>
        {project.description && (
          <p className="text-[11px] text-zinc-500 truncate w-full">{project.description}</p>
        )}
        {((project.tags && project.tags.length > 0) || isScheduled || alertState !== 'NONE' || hasChecklist) && (
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex flex-wrap gap-1">
              {project.tags && project.tags.map((tag, i) => (
                <span 
                  key={i} 
                  className={`text-[9px] px-1.5 py-0.5 rounded-[3px] font-normal tracking-wide leading-none ${isScheduled || isArchived ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-800' : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 group-hover:border-zinc-300 dark:group-hover:border-zinc-600'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                {alertState === 'CRITICAL' && (
                  <div title={t('settings_critical', lang)} className="text-red-500 animate-pulse">
                      <AlertCircle size={14} />
                  </div>
                )}
                {alertState === 'WARNING' && (
                  <div title={t('settings_warning', lang)} className="text-amber-500">
                      <AlertTriangle size={14} />
                  </div>
                )}
                {isScheduled && !isOverlay && (
                   <div className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-all text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30" title={t('jumpToDate', lang)}>
                     <CalendarCheck2 size={11} />
                     <span className="text-[10px] font-medium leading-none">
                       {format(new Date(scheduledDate + 'T00:00:00'), 'MMM d', { locale: dateLocale })}
                     </span>
                   </div>
                )}
            </div>
          </div>
        )}
      </div>

      {hasChecklist && !isOverlay && !isDragging && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-60 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-[11px] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-amber-200 dark:border-amber-900/40 p-3.5 invisible group-hover:visible group-hover:opacity-100 opacity-0 transition-all duration-300 delay-500 z-[100] pointer-events-none origin-left">
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white dark:bg-zinc-900 border-l border-b border-amber-200 dark:border-amber-900/40 rotate-45"></div>
            <div className="relative font-bold mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center z-10">
               <div className="flex items-center gap-2">
                  <ListTodo size={14} className="text-amber-500" />
                  <span className="tracking-wide uppercase text-[10px]">{t('checklist_title', lang)}</span>
               </div>
               <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded font-bold">{completedChecks}/{totalChecks}</span>
            </div>
            <div className="space-y-2 relative z-10 max-h-[220px] overflow-y-auto no-scrollbar pt-1">
               {checklist.map(item => (
                  <div key={item.id} className="flex items-start gap-2.5 leading-snug">
                     <div className={`mt-0.5 shrink-0 ${item.isCompleted ? 'text-emerald-500' : 'text-amber-400'}`}>
                        {item.isCompleted ? <CheckSquare size={14} /> : <Square size={14} />}
                     </div>
                     <span className={item.isCompleted ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'text-zinc-700 dark:text-zinc-200 font-medium'}>
                        {item.text}
                     </span>
                  </div>
               ))}
            </div>
            {progressPercent < 100 && (
               <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500 font-semibold uppercase tracking-tighter">Production Progress</span>
                  <span className="text-amber-500 font-black">{Math.round(progressPercent)}%</span>
               </div>
            )}
        </div>
      )}
    </div>
  );
});
