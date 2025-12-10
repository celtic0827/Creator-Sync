
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface StatusZoneProps {
  status: string;
  children: React.ReactNode;
}

export const StatusZone: React.FC<StatusZoneProps> = React.memo(({ status, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status}`,
    data: { status }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-lg transition-all duration-200 ${
        isOver ? 'bg-zinc-200 dark:bg-zinc-800/80 ring-2 ring-indigo-500/50 shadow-inner p-2 -mx-2' : ''
      }`}
    >
      {children}
    </div>
  );
});
