import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

interface TrashDropZoneProps {
  isActive: boolean;
}

export const TrashDropZone: React.FC<TrashDropZoneProps> = ({ isActive }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'trash-zone',
  });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={`
        fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center
        transition-all duration-300 shadow-xl border-2
        ${isOver 
          ? 'bg-red-500/20 border-red-500 text-red-500 scale-110' 
          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-red-400 hover:text-red-400'}
      `}
    >
      <Trash2 size={24} />
    </div>
  );
};