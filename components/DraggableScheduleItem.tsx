
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { ScheduleItem, Project, CategoryConfig, DragData } from '../types';

interface DraggableScheduleItemProps {
  item: ScheduleItem;
  project: Project;
  categoryConfig: CategoryConfig;
  isHighlighted?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  isOverlay?: boolean;
}

export const DraggableScheduleItem: React.FC<DraggableScheduleItemProps> = ({
  item,
  project,
  categoryConfig,
  isHighlighted,
  onClick,
  onRemove,
  isOverlay
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

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        group relative flex items-center gap-2 p-1.5 rounded-md border text-left transition-all select-none
        ${isOverlay 
            ? 'bg-white dark:bg-zinc-800 shadow-xl scale-105 rotate-1 z-50 border-indigo-500 cursor-grabbing w-[200px]' 
            : isDragging 
                ? 'opacity-30' 
                : 'bg-zinc-50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-grab'
        }
        ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-zinc-900' : ''}
      `}
    >
      {/* Color Indicator */}
      <div className={`w-1.5 self-stretch rounded-full ${config.color} shrink-0`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200 truncate leading-tight">
           {project.name}
        </h4>
        {project.tags && project.tags.length > 0 && (
           <div className="flex flex-wrap gap-1 mt-0.5">
              {project.tags.slice(0, 2).map((tag, i) => (
                  <span key={i} className="text-[9px] text-zinc-400 dark:text-zinc-500 font-normal truncate">
                    {tag}
                  </span>
              ))}
           </div>
        )}
      </div>

       {/* Remove Button (Visible on Hover) - Positioned inside to prevent clipping */}
      {!isOverlay && onRemove && (
         <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
               e.stopPropagation();
               onRemove();
            }}
            className="absolute top-0.5 right-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full p-1 text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-sm"
            title="Remove from calendar"
         >
            <X size={10} />
         </button>
      )}
    </div>
  );
};
