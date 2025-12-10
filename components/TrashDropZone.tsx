
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { Language } from '../types';
import { t } from '../translations';

interface TrashDropZoneProps {
  activeDragId: string | null;
  lang: Language;
}

export const TrashDropZone: React.FC<TrashDropZoneProps> = React.memo(({ activeDragId, lang }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'trash-zone',
  });

  const isActive = !!activeDragId;

  return (
    <div 
      ref={setNodeRef}
      id="trash-zone" 
      className={`
        flex items-center gap-2 px-6 py-1.5 rounded-md transition-all duration-200 border z-50 select-none whitespace-nowrap
        ${isActive 
          ? 'opacity-100 border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 shadow-sm' 
          : 'opacity-40 border-transparent text-zinc-500 dark:text-zinc-600'
        }
        ${isOver 
          ? 'bg-red-50 dark:bg-red-500/20 border-red-500 text-red-600 dark:text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105 opacity-100' 
          : ''
        }
     `}
    >
       <Trash2 size={16} />
       <span className="text-xs font-semibold">{t('dropToDelete', lang)}</span>
    </div>
  );
});
