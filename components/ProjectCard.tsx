

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Project, ProjectStatus, DragData, CategoryConfig, AppSettings } from '../types';
import { GripVertical, CalendarCheck2, Edit2, Archive, RotateCcw, AlertTriangle, AlertCircle, ListTodo } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import zhTW from 'date-fns/locale/zh-TW';
import { DynamicIcon } from './IconUtils';
import { t } from '../translations';

interface ProjectCardProps {
  project: Project;
  categoryConfig: CategoryConfig;
  isOverlay?: boolean;
  scheduledDate?: string;
  appSettings?: AppSettings;
  onJumpToDate?: (date: string) => void;
  onEdit?: () => void;
  onToggleArchive?: () => void;
  onOpenChecklist?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  categoryConfig, 
  isOverlay = false, 
  scheduledDate, 
  appSettings,
  onJumpToDate, 
  onEdit,
  onToggleArchive,
  onOpenChecklist
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
  
  // Determine if completed based on mode
  const isCompleted = appSettings?.statusMode === 'CUSTOM'
     ? appSettings.customStatuses.find(s => s.id === project.status)?.isCompleted
     : project.status === ProjectStatus.COMPLETED;

  const config = categoryConfig[project.type] || { color: 'bg-zinc-800', iconKey: 'Layers' };
  const lang = appSettings?.language || 'en';
  const dateLocale = lang === 'zh-TW' ? zhTW : enUS;

  // Checklist Stats
  const checklist = project.checklist || [];
  const totalChecks = checklist.length;
  const completedChecks = checklist.filter(c => c.isCompleted).length;
  const hasChecklist = totalChecks > 0;
  const progressPercent = hasChecklist ? (completedChecks / totalChecks) * 100 : 0;

  // Alert Logic
  let alertState: 'NONE' | 'WARNING' | 'CRITICAL' = 'NONE';
  if (isScheduled && !isCompleted && !isArchived && appSettings && !isOverlay) {
      const today = new Date();
      // Use setHours to normalize today to start of day, avoiding time zone drifts in calculation
      today.setHours(0, 0, 0, 0); 
      
      const targetDate = new Date(scheduledDate + 'T00:00:00');
      const diff = differenceInCalendarDays(targetDate, today);

      if (diff <= appSettings.criticalDays) {
          alertState = 'CRITICAL';
      } else if (diff <= appSettings.warningDays) {
          alertState = 'WARNING';
      }
  }

  // Visual Styles based on Alert State (Adaptive for Light/Dark)
  let alertClasses = '';
  let borderClasses = 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700';
  let bgClasses = 'bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm';

  if (alertState === 'CRITICAL') {
      borderClasses = 'border-red-300 dark:border-red-500/50 hover:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      bgClasses = 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30';
  } else if (alertState === 'WARNING') {
      borderClasses = 'border-amber-300 dark:border-amber-500/50 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
      bgClasses = 'bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30';
  }

  // Professional Design Classes
  const baseClasses = `
    group relative flex items-stretch rounded-md border transition-all duration-200 overflow-hidden
    ${isOverlay 
      ? 'cursor-grabbing scale-105 shadow-2xl rotate-1 z-50 bg-white dark:bg-zinc-800 border-indigo-500 ring-1 ring-indigo-500/50' 
      : `cursor-grab ${bgClasses} ${borderClasses}`
    }
    ${isDragging ? 'opacity-30' : 'opacity-100'}
    ${isScheduled && !isOverlay ? 'ml-4' : ''} 
    ${isArchived && !isOverlay ? 'opacity-75' : ''}
  `;

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scheduledDate && onJumpToDate) {
      onJumpToDate(scheduledDate);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={baseClasses}
      id={`project-card-${project.id}`}
    >
      {/* Left Color Bar & Icon */}
      <div className={`
        w-10 flex flex-col items-center justify-center shrink-0 relative
        ${config.color} 
        ${(isScheduled || isArchived) && !isOverlay ? 'opacity-80' : 'opacity-100'}
      `}>
         <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <DynamicIcon iconKey={config.iconKey} className="text-white/90 w-5 h-5 drop-shadow-md" />
            
            {/* Mini Progress Indicator */}
            {hasChecklist && !isOverlay && (
              <div className="flex flex-col items-center w-full px-1.5">
                <span className="text-[8px] font-bold text-white/90 leading-none mb-0.5">
                   {completedChecks}/{totalChecks}
                </span>
                <div className="w-full h-[2px] bg-black/20 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-white/90 transition-all duration-300"
                     style={{ width: `${progressPercent}%` }}
                   />
                </div>
              </div>
            )}
         </div>
      </div>

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 px-3 gap-1.5">
        
        {/* Row 1: Header (Title + Actions) */}
        <div className="flex items-start justify-between gap-2">
           <h4 className={`text-sm font-medium leading-tight break-words line-clamp-2 ${isScheduled || isArchived ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
             {project.name}
           </h4>
           
           {/* Action Buttons Container (Top Right) */}
           <div className="flex items-center gap-1 shrink-0">
              {/* Fade in on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isOverlay && onOpenChecklist && (
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onOpenChecklist(); }}
                      className={`
                        p-1 rounded transition-all flex items-center gap-1
                        ${hasChecklist && completedChecks < totalChecks ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'text-zinc-400 hover:text-indigo-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}
                      `}
                      title={t('checklist_title', lang)}
                    >
                      <ListTodo size={12} />
                    </button>
                  )}

                  {!isOverlay && onToggleArchive && (
                    <button 
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}
                      className={`
                        p-1 rounded transition-all 
                        ${isArchived 
                          ? 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-200 dark:hover:bg-zinc-700' 
                          : 'text-zinc-400 hover:text-indigo-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }
                      `}
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

              {/* Grip - Only show if not scheduled (visual indicator for dragging) */}
              {!isScheduled && !isOverlay && (
                <div className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors cursor-grab ml-1">
                   <GripVertical size={14} />
                </div>
              )}
           </div>
        </div>
        
        {/* Row 2: Description */}
        {project.description && (
          <p className="text-[11px] text-zinc-500 truncate w-full">{project.description}</p>
        )}

        {/* Row 3: Tags + Inline Info (Right aligned) */}
        {( (project.tags && project.tags.length > 0) || isScheduled || alertState !== 'NONE' ) && (
          <div className="flex items-center justify-between gap-2 mt-0.5">
            
            {/* Tags Container */}
            <div className="flex flex-wrap gap-1">
              {project.tags && project.tags.map((tag, i) => (
                <span 
                  key={i} 
                  className={`
                    text-[9px] px-1.5 py-0.5 rounded-[3px] font-normal tracking-wide leading-none
                    ${isScheduled || isArchived
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-800' 
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 group-hover:border-zinc-300 dark:group-hover:border-zinc-600'
                    }
                  `}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Right Side: Date & Alerts (Inline) */}
            {(isScheduled || alertState !== 'NONE') && !isOverlay && (
               <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  
                  {/* Alerts (Icon Only) */}
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

                  {/* Date Button - Clean Text Only Design */}
                  {isScheduled && (
                     <button 
                      onPointerDown={(e) => e.stopPropagation()} 
                      onClick={handleDateClick}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-all cursor-pointer text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                      title={t('jumpToDate', lang)}
                     >
                       <CalendarCheck2 size={11} />
                       <span className="text-[10px] font-medium leading-none">
                         {format(new Date(scheduledDate + 'T00:00:00'), 'MMM d', { locale: dateLocale })}
                       </span>
                     </button>
                  )}
               </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
