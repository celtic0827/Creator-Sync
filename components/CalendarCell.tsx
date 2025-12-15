
import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday, isWeekend, differenceInCalendarDays } from 'date-fns';
import { ScheduleItem, Project, CategoryConfig, CalendarViewMode, AppSettings, Priority } from '../types';
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
  onEditProject?: (project: Project) => void;
  onContextMenu?: (e: React.MouseEvent, projectId: string) => void;
  viewMode?: CalendarViewMode;
  appSettings?: AppSettings;
}

export const CalendarCell: React.FC<CalendarCellProps> = React.memo(({ 
  date, 
  items, 
  projects, 
  categoryConfig, 
  highlightedProjectId, 
  onItemClick, 
  onRemoveItem,
  onEditProject,
  onContextMenu,
  viewMode = 'COMPACT',
  appSettings
}) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const { setNodeRef, isOver } = useDroppable({
    id: `date-${dateStr}`,
    data: { date: dateStr },
  });

  const getProject = (id: string) => projects.find((p) => p.id === id);

  // Helper for priority weight
  const getPriorityWeight = (priority?: Priority): number => {
    if (priority === 'HIGH') return 3;
    if (priority === 'LOW') return 1;
    return 2; // Medium or undefined
  };

  // Sort items: Priority > Category Order > Name
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
        const pA = getProject(a.projectId);
        const pB = getProject(b.projectId);
        if (!pA || !pB) return 0;
        
        // 1. Priority (High to Low)
        const weightA = getPriorityWeight(pA.priority);
        const weightB = getPriorityWeight(pB.priority);
        if (weightA !== weightB) return weightB - weightA;

        // 2. Category Order
        if (appSettings?.categoryOrder) {
            const indexA = appSettings.categoryOrder.indexOf(pA.type);
            const indexB = appSettings.categoryOrder.indexOf(pB.type);
            
            // If type not found in order (e.g. legacy/error), put at end
            const safeIndexA = indexA === -1 ? 999 : indexA;
            const safeIndexB = indexB === -1 ? 999 : indexB;
            
            if (safeIndexA !== safeIndexB) return safeIndexA - safeIndexB;
        }
        
        // 3. Name (A-Z)
        return pA.name.localeCompare(pB.name);
    });
  }, [items, projects, appSettings?.categoryOrder]);

  const isCurrentDay = isToday(date);
  const isWknd = isWeekend(date);

  // --- Visual Focus Logic ---
  const today = new Date();
  // Normalize time to ensure accurate day difference
  today.setHours(0, 0, 0, 0);
  const cellDate = new Date(date);
  cellDate.setHours(0, 0, 0, 0);
  
  const dayDiff = differenceInCalendarDays(cellDate, today);
  
  let focusOpacity = 0;
  
  if (dayDiff < 0) {
      // Past: Static 50% dim
      focusOpacity = 0.5;
  } else if (dayDiff >= 0 && dayDiff <= 2) {
      // Immediate Future (Today, Tmrw, Next Day): 0% dim (Full Focus)
      focusOpacity = 0;
  } else {
      // Future Gradient (Day 3+): Increases by 5% per day, capped at 50%
      // Day 3 = 0.05, Day 4 = 0.10 ... Day 12+ = 0.50
      const daysIntoFuture = dayDiff - 2;
      focusOpacity = Math.min(daysIntoFuture * 0.05, 0.5);
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        group relative min-h-[85px] flex flex-col p-1.5 transition-all duration-200
        ${isOver 
            ? 'bg-indigo-50 dark:bg-indigo-500/20 z-10' // Drag over state
            : isCurrentDay
                ? 'bg-indigo-50/60 dark:bg-indigo-500/10 pattern-today ring-1 ring-indigo-500/10 dark:ring-indigo-400/20 inset-ring inset-ring-indigo-500/5' // Today
                : isWknd 
                    ? 'bg-zinc-100 dark:bg-[#0c0c0e]/50 hover:bg-zinc-50 dark:hover:bg-[#0c0c0e]/80' // Weekend
                    : 'bg-white dark:bg-[#09090b] hover:bg-zinc-50 dark:hover:bg-zinc-900/50' // Default
        }
      `}
    >
      {/* Drop Target Indicator (Dashed Border) */}
      {isOver && (
        <div className="absolute inset-0.5 border-2 border-dashed border-indigo-400 dark:border-indigo-500/60 rounded-[4px] pointer-events-none z-10" />
      )}

      {/* 
        Visual Focus Mask 
        - Uses bg-zinc-950 (app background) to create a "fade out" effect in dark mode.
        - Uses bg-zinc-50 for light mode for similar effect.
        - z-index ensures it covers content but not the drop indicator or interactions if handled carefully.
        - pointer-events-none ensures you can still click/drag items underneath.
      */}
      {viewMode === 'BLOCK' && focusOpacity > 0 && !isOver && (
         <div 
           className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950 pointer-events-none z-10 transition-opacity duration-500 ease-in-out"
           style={{ opacity: focusOpacity }}
         />
      )}

      {/* Date Header (Top Row) */}
      <div className="flex justify-between items-start mb-1 min-h-[20px] relative z-20">
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
          flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold transition-opacity duration-200
          ${isCurrentDay 
            ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/30' 
            : 'text-zinc-400 dark:text-zinc-500 opacity-60 group-hover:opacity-100'
          }
        `}>
          {format(date, 'd')}
        </span>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] no-scrollbar relative z-0">
        {sortedItems.map((item) => {
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
              onEdit={() => onEditProject && onEditProject(project)}
              onContextMenu={onContextMenu}
              viewMode={viewMode}
              appSettings={appSettings}
            />
          );
        })}
      </div>
    </div>
  );
});
