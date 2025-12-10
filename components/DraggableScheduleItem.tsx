


import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { ScheduleItem, Project, CategoryConfig, DragData, CalendarViewMode } from '../types';

interface DraggableScheduleItemProps {
  item: ScheduleItem;
  project: Project;
  categoryConfig: CategoryConfig;
  isHighlighted?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  isOverlay?: boolean;
  viewMode?: CalendarViewMode;
}

export const DraggableScheduleItem: React.FC<DraggableScheduleItemProps> = ({
  item,
  project,
  categoryConfig,
  isHighlighted,
  onClick,
  onRemove,
  isOverlay,
  viewMode = 'COMPACT'
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
  
  // Logic for Block Mode (New)
  const isBlock = viewMode === 'BLOCK';

  // Base classes used for both modes
  const baseClasses = `
    group relative flex items-center gap-2 p-1.5 rounded-md border text-left transition-all select-none
    ${isOverlay 
        ? 'bg-white dark:bg-zinc-800 shadow-xl scale-105 rotate-1 z-50 border-indigo-500 cursor-grabbing w-[200px]' 
        : isDragging 
            ? 'opacity-30' 
            : isBlock 
                ? `${config.color} border-transparent hover:brightness-110 cursor-grab` // Block Style
                : 'bg-zinc-50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-grab' // Compact Style
    }
    ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-zinc-900' : ''}
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
           <div className="flex flex-wrap gap-1 mt-0.5">
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
};
