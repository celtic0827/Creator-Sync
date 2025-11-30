import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Project, ScheduleItem, DragData, CategoryConfig } from '../types';
import { DynamicIcon } from './IconUtils';
import { X } from 'lucide-react';

interface DraggableScheduleItemProps {
  item: ScheduleItem;
  project: Project;
  categoryConfig: CategoryConfig;
  isOverlay?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export const DraggableScheduleItem: React.FC<DraggableScheduleItemProps> = ({ item, project, categoryConfig, isOverlay, isHighlighted, onClick, onRemove }) => {
  const dragData: DragData = {
    type: 'SCHEDULE_ITEM',
    projectId: project.id,
    scheduleId: item.id,
    originDate: item.date
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `schedule-item-${item.id}`,
    data: dragData,
  });

  const config = categoryConfig[project.type] || { color: 'bg-zinc-800', iconKey: 'Layers' };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        group relative flex flex-col items-start gap-1 p-2 rounded-[4px] shadow-sm text-xs font-medium cursor-grab active:cursor-grabbing transition-all duration-300
        ${isOverlay ? 'shadow-xl scale-105 z-50 w-48 bg-zinc-800 ring-1 ring-white/10' : 'hover:brightness-110'}
        ${isDragging ? 'opacity-0' : 'opacity-100'}
        ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900 z-20 brightness-110' : ''}
        bg-zinc-800 border border-white/5
      `}
      title={item.note || project.name}
    >
      {/* Remove Button (Visible on Hover) */}
      {!isOverlay && onRemove && (
         <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
               e.stopPropagation();
               onRemove();
            }}
            className="absolute -top-1.5 -right-1.5 bg-zinc-900 rounded-full p-0.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-md"
            title="Remove from calendar"
         >
            <X size={10} />
         </button>
      )}

      <div className="flex items-center gap-2 w-full">
         {/* Type Icon Box */}
         <div className={`w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 ${config.color}`}>
            <DynamicIcon iconKey={config.iconKey} className="w-2.5 h-2.5 text-white/90" />
         </div>
         
         <span className="truncate flex-1 text-zinc-200 text-[11px] leading-tight">
           {project.name}
         </span>
      </div>

      {project.tags && project.tags.length > 0 && (
         <div className="flex flex-wrap gap-1 px-0.5">
            {project.tags.slice(0, 2).map((tag, i) => (
               <span key={i} className="text-[9px] px-1 py-0 rounded-[2px] bg-zinc-700/50 text-zinc-400 leading-none">
                  {tag}
               </span>
            ))}
            {project.tags.length > 2 && <span className="text-[8px] text-zinc-500">+{project.tags.length - 2}</span>}
         </div>
      )}
    </div>
  );
};