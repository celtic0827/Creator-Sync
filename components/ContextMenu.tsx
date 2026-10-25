
import React, { useEffect, useRef } from 'react';
import { Copy, Edit2, Trash2, Archive, RotateCcw } from 'lucide-react';
import { Language } from '../types';
import { t } from '../translations';

export interface ContextMenuAction {
  id: string;
  labelKey?: string;
  label?: string;
  icon: React.ElementType;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  dividerAbove?: boolean;
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
  const menuWidth = 270;
  const menuHeight = 240;
  const style: React.CSSProperties = {
    top: y,
    left: x,
  };
  
  if (typeof window !== 'undefined') {
     if (x + menuWidth > window.innerWidth) style.left = Math.max(10, window.innerWidth - menuWidth - 12);
     if (y + menuHeight > window.innerHeight) style.top = Math.max(10, window.innerHeight - menuHeight - 12);
  }

  return (
    <div 
      ref={menuRef}
      style={style}
      className="fixed z-[100] min-w-[250px] max-w-[320px] bg-white dark:bg-zinc-800 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-700 py-1.5 animate-in fade-in zoom-in-95 duration-75 flex flex-col"
    >
      {actions.map((action) => (
        <React.Fragment key={action.id}>
          {action.dividerAbove && (
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-700/60" />
          )}
          <button
            disabled={action.disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (action.disabled) return;
              action.onClick();
              onClose();
            }}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors
              ${action.disabled
                ? 'text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-50 select-none'
                : action.danger 
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer' 
                  : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer'
              }
            `}
          >
            <action.icon 
              size={14} 
              className={`shrink-0 ${
                action.disabled 
                  ? 'text-zinc-300 dark:text-zinc-600' 
                  : action.danger 
                    ? 'text-red-500' 
                    : 'text-zinc-500 dark:text-zinc-400'
              }`} 
            />
            <span className="truncate flex-1">
              {action.label || (action.labelKey ? t(action.labelKey, lang) : '')}
            </span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
