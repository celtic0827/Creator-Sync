
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Project, ProjectStatus, DragData, CategoryConfig, AppSettings } from '../types';
import { GripVertical, CalendarCheck2, Edit2, Archive, RotateCcw, AlertTriangle, AlertCircle } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { enUS, zhTW } from 'date-fns/locale';
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
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  categoryConfig, 
  isOverlay = false, 
  scheduledDate, 
  appSettings,
  onJumpToDate, 
  onEdit,
  onToggleArchive
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
  const isCompleted = project.status === ProjectStatus.COMPLETED;
  const config = categoryConfig[project.type] || { color: 'bg-zinc-800', iconKey: 'Layers' };
  const lang = appSettings?.language || 'en';
  const dateLocale = lang === 'zh-TW' ? zhTW : enUS;

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

  // Visual Styles based on Alert State
  let alertClasses = '';
  let borderClasses = 'border-zinc-800 hover:border-zinc-700';
  let bgClasses = 'bg-zinc-900/40 hover:bg-zinc-800';

  if (alertState === 'CRITICAL') {
      borderClasses = 'border-red-500/50 hover:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      bgClasses = 'bg-red-950/20 hover:bg-red-950/30';
  } else if (alertState === 'WARNING') {
      borderClasses = 'border-amber-500/50 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
      bgClasses = 'bg-amber-950/20 hover:bg-amber-950/30';
  }

  // Professional Design Classes
  const baseClasses = `
    group relative flex items-stretch rounded-md border transition-all duration-200 overflow-hidden
    ${isOverlay 
      ? 'cursor-grabbing scale-105 shadow-2xl rotate-1 z-50 bg-zinc-800 border-indigo-500 ring-1 ring-indigo-500/50' 
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
      {/* Widen Color Bar & Icon Area */}
      <div className={`
        w-12 flex items-center justify-center shrink-0
        ${config.color} 
        ${(isScheduled || isArchived) && !isOverlay ? 'opacity-80' : 'opacity-100'}
      `}>
         <DynamicIcon iconKey={config.iconKey} className="text-white/90 w-5 h-5 drop-shadow-md" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 pl-3 pr-2 gap-1">
        <div className="flex items-center justify-between">
           <h4 className={`text-sm font-medium leading-tight truncate ${isScheduled || isArchived ? 'text-zinc-400' : 'text-zinc-200 group-hover:text-white'}`}>
             {project.name}
           </h4>
           
           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Toggle Archive Button */}
              {!isOverlay && onToggleArchive && (
                 <button 
                   onPointerDown={(e) => e.stopPropagation()}
                   onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}
                   className={`
                     p-1 rounded transition-all 
                     ${isArchived 
                       ? 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-700' 
                       : 'text-zinc-500 hover:text-indigo-400 hover:bg-zinc-700'
                     }
                   `}
                   title={isArchived ? t('restore', lang) : t('archive', lang)}
                 >
                   {isArchived ? <RotateCcw size={12} /> : <Archive size={12} />}
                 </button>
              )}

              {/* Edit Button */}
              {!isOverlay && onEdit && (
                  <button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-1 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-700 rounded transition-all"
                    title={t('edit', lang)}
                  >
                    <Edit2 size={12} />
                  </button>
              )}
           </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-zinc-500 truncate max-w-[140px]">{project.description}</p>
        </div>

        {/* Tags Row */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {project.tags.map((tag, i) => (
              <span 
                key={i} 
                className={`
                  text-[9px] px-1.5 py-0.5 rounded-[3px] font-medium tracking-wide
                  ${isScheduled || isArchived
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-800' 
                    : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 group-hover:border-zinc-600'
                  }
                `}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pr-3 py-3">
        {/* Alert Indicator */}
        {!isOverlay && alertState === 'CRITICAL' && (
           <div title="Approaching Deadline: Critical!" className="animate-pulse text-red-500">
              <AlertCircle size={16} />
           </div>
        )}
        {!isOverlay && alertState === 'WARNING' && (
           <div title="Approaching Deadline: Warning" className="text-amber-500">
              <AlertTriangle size={16} />
           </div>
        )}

        {isScheduled ? (
           <button 
             onPointerDown={(e) => e.stopPropagation()} 
             onClick={handleDateClick}
             className="group/btn flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer"
             title={t('jumpToDate', lang)}
           >
             <CalendarCheck2 size={12} />
             <span className="text-[10px] font-semibold">
               {/* Append time to ensure local date parsing */}
               {format(new Date(scheduledDate + 'T00:00:00'), 'MMM d', { locale: dateLocale })}
             </span>
           </button>
        ) : (
          <div className="text-zinc-700 group-hover:text-zinc-400 transition-colors">
            <GripVertical size={16} />
          </div>
        )}
      </div>
    </div>
  );
};
