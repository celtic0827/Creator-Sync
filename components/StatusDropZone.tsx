import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ProjectStatus } from '../types';

interface StatusDropZoneProps {
  status: ProjectStatus;
  children: React.ReactNode;
}

export const StatusDropZone: React.FC<StatusDropZoneProps> = ({ status, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status}`,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        relative rounded-xl transition-all duration-200 border-2
        ${isOver ? 'bg-indigo-500/10 border-indigo-500/50' : 'border-transparent'}
      `}
    >
      {children}
    </div>
  );
};