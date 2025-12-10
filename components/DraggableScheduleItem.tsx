
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';
import { ScheduleItem, Project, CategoryConfig, DragData, CalendarViewMode, AppSettings, ProjectStatus } from '../types';

interface DraggableScheduleItemProps {
  item: ScheduleItem;
  project: Project;
  categoryConfig: CategoryConfig;
  isHighlighted?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  isOverlay?: boolean;
  viewMode?: CalendarViewMode;
  appSettings?: AppSettings;
}

export const DraggableScheduleItem: React.FC<DraggableScheduleItemProps> = React.memo(({
  item,
  project,
  categoryConfig,
  isHighlighted,
  onClick,
  onRemove,
  isOverlay,
  viewMode = 'COMPACT',
  appSettings
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `schedule-${item.id}`,
    data: {
      type: 'SCHEDULE_ITEM',
      projectId: project.id,
      scheduleId: item.id,
      originDate: item.date
    } as DragData,
    disabled: isOverlay
  });

  const config = categoryConfig[project.type] || { color: 'bg-zinc-500', iconKey: 'Layers' };
  
  // Logic for Block Mode
  const isBlock = viewMode === 'BLOCK';

  // Alert Logic
  const isCompleted = appSettings?.statusMode === 'CUSTOM'
     ? appSettings.customStatuses.find(s => s.id === project.status)?.isCompleted
     : project.status === ProjectStatus.COMPLETED;
  
  const isArchived = project.status === ProjectStatus.ARCHIVED;

  let alertState: 'NONE' | 'WARNING' | 'CRITICAL' = 'NONE';
  
  // Only calculate alerts if settings exist, not dragging, and project is active
  if (!isCompleted && !isArchived && appSettings && !isOverlay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      
      const targetDate = new Date(item.date + 'T00:00:00');
      const diff = differenceInCalendarDays(targetDate, today);

      if (diff <= appSettings.criticalDays) {
          alertState = 'CRITICAL';
      } else if (diff <= appSettings.warningDays) {
          alertState = 'WARNING';
      }
  }

  // Visual Styles based on Alert State
  let alertClasses = '';
  
  // In COMPACT mode, we use ring/borders. 
  // In BLOCK mode, we use the Floating Badge (rendered below) instead of rings to avoid contrast issues.
  if (!isBlock) {
    if (alertState === 'CRITICAL') {
        alertClasses = 'ring-1 ring-inset ring-red-500 dark:ring-red-500 bg-red-50 dark:bg-red-900/10';
    } else if (alertState === 'WARNING') {
        alertClasses = 'ring-1 ring-inset ring-amber-500 dark:ring-amber-500 bg-amber-50 dark:bg-amber-900/10';
    }
  }

  // Base classes used for both modes
  const baseClasses = `
    group relative flex items-center gap-2 p-1.5 rounded-md border transition-all select-none
    ${isOverlay 
        ? 'bg-white dark:bg-zinc-800 shadow-xl scale-105 rotate-1 z-50 border-indigo-500 cursor-grabbing w-[200px] text-left' 
        : isDragging 
            ? 'opacity-30 text-left' 
            : isBlock 
                ? `${config.color} border-transparent hover:brightness-110 cursor-grab justify-center text-center shadow-sm` 
                : `cursor-grab text-left border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 ${alertClasses ? alertClasses : 'bg-zinc-50 dark:bg-zinc-900/40'}`
    }
    ${isHighlighted ? 'ring-2 ring-inset ring-indigo-500 z-20' : ''}
  `;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={baseClasses}
    >
      {/* 
          BLOCK MODE ALERT BADGE 
          Solves contrast issues by providing a white background for the alert icon
      */}
      {isBlock && alertState !== 'NONE' && !isOverlay && (
        <div className={`
            absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-md ring-1 ring-black/5
            ${alertState === 'CRITICAL' ? 'animate-bounce-slow' : ''}
        `}>
            {alertState === 'CRITICAL' ? (
                <AlertCircle size={12} className="text-red-600 dark:text-red-500 fill-red-100 dark:fill-red-900/30" />
            ) : (
                <AlertTriangle size={10} className="text-amber-500 fill-amber-100 dark:fill-amber-900/30" />
            )}
        </div>
      )}

      {/* Color Indicator (Only for Compact Mode) */}
      {!isBlock && (
        <div className={`w-1.5 self-stretch rounded-full ${config.color} shrink-0`} />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-[11px] font-medium truncate leading-tight ${isBlock ? 'text-white drop-shadow-md' : 'text-zinc-700 dark:text-zinc-200'}`}>
           {project.name}
        </h4>
        
        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
           <div className={`flex flex-wrap gap-1 mt-0.5 ${isBlock ? 'justify-center' : ''}`}>
              {project.tags.slice(0, 2).map((tag, i) => (
                  <span 
                    key={i} 
                    className={`
                      text-[9px] font-normal truncate
                      ${isBlock 
                         ? 'text-white/90' 
                         : 'text-zinc-400 dark:text-zinc-500'
                      }
                    `}
                  >
                    {tag}
                  </span>
              ))}
           </div>
        )}

        {/* Compact Mode Alert Icon (Inline) */}
        {!isBlock && alertState !== 'NONE' && (
            <div className="flex items-center gap-1 mt-1">
                 {alertState === 'CRITICAL' ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-red-600 dark:text-red-400">
                        <AlertCircle size={10} /> Due soon
                    </span>
                 ) : (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-500">
                        <AlertTriangle size={10} /> Upcoming
                    </span>
                 )}
            </div>
        )}
      </div>

       {/* Remove Button (Visible on Hover) */}
      {!isOverlay && onRemove && (
         <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
               e.stopPropagation();
               onRemove();
            }}
            className={`
              absolute top-0.5 right-0.5 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-sm
              ${isBlock 
                 ? 'bg-black/20 text-white hover:bg-black/40 border-transparent'
                 : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'
              }
            `}
            title="Remove from calendar"
         >
            <X size={10} />
         </button>
      )}
    </div>
  );
});
