
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday, isWeekend } from 'date-fns';
import { ScheduleItem, Project, CategoryConfig } from '../types';
import { DraggableScheduleItem } from './DraggableScheduleItem';
import { Layers } from 'lucide-react';

interface CalendarCellProps {
  date: Date;
  items: ScheduleItem[];
  projects: Project[];
  categoryConfig: CategoryConfig;
  highlightedProjectId?: string | null;
  onItemClick?: (projectId: string) => void;
  onRemoveItem?: (scheduleId: string) => void;
}

export const CalendarCell: React.FC<CalendarCellProps> = ({ date, items, projects, categoryConfig, highlightedProjectId, onItemClick, onRemoveItem }) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const { setNodeRef, isOver } = useDroppable({
    id: `date-${dateStr}`,
    data: { date: dateStr },
  });

  const getProject = (id: string) => projects.find((p) => p.id === id);

  const isCurrentDay = isToday(date);
  const isWknd = isWeekend(date);

  return (
    <div
      ref={setNodeRef}
      className={`
        relative min-h-[85px] flex flex-col p-1.5 transition-all duration-200
        ${isOver 
            ? 'bg-indigo-100 dark:bg-indigo-500/20' // Drag over state (stronger)
            : isCurrentDay
                ? 'bg-indigo-50/60 dark:bg-indigo-500/10 pattern-today ring-1 ring-indigo-500/10 dark:ring-indigo-400/20 inset-ring inset-ring-indigo-500/5' // Today state (Pattern + Subtle tint)
                : isWknd 
                    ? 'bg-zinc-100 dark:bg-[#0c0c0e]/50' // Weekend
                    : 'bg-white dark:bg-[#09090b]' // Default
        }
      `}
    >
      {/* Drop Target Indicator */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-indigo-500/50 pointer-events-none z-10" />
      )}

      {/* Date Header (Top Row) */}
      <div className="flex justify-between items-start mb-1 min-h-[20px]">
        {/* Left: Overload Indicator (Only if > 2 items) */}
        {items.length > 2 ? (
          <div 
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400"
            title={`${items.length} items`}
          >
            <Layers size={10} />
            <span className="text-[9px] font-bold leading-none">{items.length}</span>
          </div>
        ) : (
          <div></div> // Spacer
        )}

        {/* Right: Date Number */}
        <span className={`
          flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold
          ${isCurrentDay 
            ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/30' 
            : 'text-zinc-400 dark:text-zinc-500'
          }
        `}>
          {format(date, 'd')}
        </span>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] no-scrollbar">
        {items.map((item) => {
          const project = getProject(item.projectId);
          if (!project) return null;
          return (
            <DraggableScheduleItem 
              key={item.id} 
              item={item} 
              project={project} 
              categoryConfig={categoryConfig}
              isHighlighted={highlightedProjectId === project.id}
              onClick={() => onItemClick && onItemClick(project.id)}
              onRemove={() => onRemoveItem && onRemoveItem(item.id)}
            />
          );
        })}
      </div>
    </div>
  );
};
