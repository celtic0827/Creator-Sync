
import React, { useEffect, useRef } from 'react';
import { Copy, Edit2, Trash2, Archive, RotateCcw } from 'lucide-react';
import { Language } from '../types';
import { t } from '../translations';

export interface ContextMenuAction {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  actions: ContextMenuAction[];
  lang: Language;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, actions, lang }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Close on scroll as well to prevent floating menu in wrong place
    const handleScroll = () => onClose();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Adjust position if close to edge of screen
  const style: React.CSSProperties = {
    top: y,
    left: x,
  };
  
  // Simple check to prevent overflow (simplistic)
  if (typeof window !== 'undefined') {
     if (x + 200 > window.innerWidth) style.left = x - 200;
     if (y + 200 > window.innerHeight) style.top = y - 200;
  }

  return (
    <div 
      ref={menuRef}
      style={style}
      className="fixed z-[100] w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1.5 animate-in fade-in zoom-in-95 duration-75 flex flex-col"
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
            onClose();
          }}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors
            ${action.danger 
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
              : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }
          `}
        >
          <action.icon size={14} className={action.danger ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'} />
          {t(action.labelKey, lang)}
        </button>
      ))}
    </div>
  );
};
