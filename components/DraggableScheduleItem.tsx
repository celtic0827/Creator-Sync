
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X } from 'lucide-react';
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
  // Fixed: Use ring-inset and inset shadows to prevent clipping in scrollable containers
  let alertClasses = '';
  if (alertState === 'CRITICAL') {
      alertClasses = 'ring-2 ring-inset ring-red-500 dark:ring-red-500 shadow-[inset_0_0_8px_rgba(239,68,68,0.6)] z-10';
  } else if (alertState === 'WARNING') {
      alertClasses = 'ring-2 ring-inset ring-amber-500 dark:ring-amber-500 shadow-[inset_0_0_8px_rgba(245,158,11,0.6)] z-10';
  }

  // Base classes used for both modes
  // Added justify-center and text-center for Block mode to fix centering alignment
  const baseClasses = `
    group relative flex items-center gap-2 p-1.5 rounded-md border transition-all select-none
    ${isOverlay 
        ? 'bg-white dark:bg-zinc-800 shadow-xl scale-105 rotate-1 z-50 border-indigo-500 cursor-grabbing w-[200px] text-left' 
        : isDragging 
            ? 'opacity-30 text-left' 
            : isBlock 
                ? `${config.color} border-transparent hover:brightness-110 cursor-grab justify-center text-center` 
                : 'bg-zinc-50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-grab text-left'
    }
    ${isHighlighted ? 'ring-2 ring-inset ring-indigo-500 z-20' : alertClasses}
  `;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={baseClasses}
    >
      {/* Color Indicator (Only for Compact Mode) */}
      {!isBlock && (
        <div className={`w-1.5 self-stretch rounded-full ${config.color} shrink-0`} />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-[11px] font-medium truncate leading-tight ${isBlock ? 'text-white drop-shadow-sm' : 'text-zinc-700 dark:text-zinc-200'}`}>
           {project.name}
        </h4>
        {project.tags && project.tags.length > 0 && (
           <div className={`flex flex-wrap gap-1 mt-0.5 ${isBlock ? 'justify-center' : ''}`}>
              {project.tags.slice(0, 2).map((tag, i) => (
                  <span 
                    key={i} 
                    className={`
                      text-[9px] font-normal truncate
                      ${isBlock 
                         ? 'text-white/80' 
                         : 'text-zinc-400 dark:text-zinc-500'
                      }
                    `}
                  >
                    {tag}
                  </span>
              ))}
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
