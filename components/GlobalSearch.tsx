
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Calendar, Layers, X, CheckSquare, ListTodo } from 'lucide-react';
import { Project, CategoryConfig, Language, ScheduleItem, AppSettings, ProjectStatus } from '../types';
import { DynamicIcon } from './IconUtils';
import { t, getStatusText } from '../translations';
import { format } from 'date-fns';
import zhTW from 'date-fns/locale/zh-TW';
import enUS from 'date-fns/locale/en-US';

interface GlobalSearchProps {
  projects: Project[];
  schedule: ScheduleItem[];
  categoryConfig: CategoryConfig;
  appSettings: AppSettings;
  lang: Language;
  onNavigate: (projectId: string, scheduledDate?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  projects,
  schedule,
  categoryConfig,
  appSettings,
  lang,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProjects = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    
    // Sort logic: Matches in name > Matches in tags > Scheduled > Unscheduled
    return projects
      .filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      )
      .slice(0, 10); // Limit to 10 results for performance
  }, [query, projects]);

  const handleSelect = (project: Project, date?: string) => {
    onNavigate(project.id, date);
    setIsOpen(false);
    setQuery('');
  };

  const getScheduledDate = (projectId: string) => {
    return schedule.find(s => s.projectId === projectId)?.date;
  };

  const dateLocale = lang === 'zh-TW' ? zhTW : enUS;

  return (
    <div ref={wrapperRef} className="relative w-64 max-w-[300px] z-50">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
          <Search size={14} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('search_placeholder', lang)}
          className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full py-1.5 pl-9 pr-8 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        {query && (
           <button 
             onClick={() => { setQuery(''); inputRef.current?.focus(); }}
             className="absolute inset-y-0 right-0 pr-2 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
           >
             <X size={12} />
           </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query && (
        <div className="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[320px]">
          {filteredProjects.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 mb-1">
                Results
              </div>
              <ul className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {filteredProjects.map(project => {
                  const scheduledDate = getScheduledDate(project.id);
                  const config = categoryConfig[project.type] || { color: 'bg-zinc-500', iconKey: 'Layers' };
                  const isCompleted = project.checklist && project.checklist.length > 0
                     ? project.checklist.every(c => c.isCompleted)
                     : false;
                  const checklistCount = project.checklist ? project.checklist.length : 0;
                  const checklistDone = project.checklist ? project.checklist.filter(c => c.isCompleted).length : 0;

                  // Get status label
                  const customStatus = appSettings.statusMode === 'CUSTOM' 
                    ? appSettings.customStatuses.find(s => s.id === project.status) 
                    : null;
                  const statusLabel = customStatus 
                    ? customStatus.label 
                    : getStatusText(project.status, lang);

                  return (
                    <li key={project.id}>
                      <button
                        onClick={() => handleSelect(project, scheduledDate)}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-start gap-3 group transition-colors"
                      >
                        {/* Icon Box */}
                        <div className={`shrink-0 w-8 h-8 rounded-md ${config.color} flex items-center justify-center text-white shadow-sm mt-0.5`}>
                          <DynamicIcon iconKey={config.iconKey} className="w-4 h-4" />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {project.name}
                            </h4>
                            {scheduledDate ? (
                                <span className="flex items-center gap-1 text-[9px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded ml-2 shrink-0">
                                   <Calendar size={10} />
                                   {format(new Date(scheduledDate + 'T00:00:00'), 'MMM d', { locale: dateLocale })}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[9px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded ml-2 shrink-0">
                                   <Layers size={10} />
                                   {t('search_unscheduled', lang)}
                                </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                             <span className={`px-1 rounded-sm border ${
                               project.status === ProjectStatus.COMPLETED || customStatus?.isCompleted
                                 ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' 
                                 : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'
                             }`}>
                               {statusLabel}
                             </span>
                             {checklistCount > 0 && (
                                <span className="flex items-center gap-0.5 text-zinc-400">
                                   <ListTodo size={10} /> {checklistDone}/{checklistCount}
                                </span>
                             )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-xs">
               <p>{t('search_no_results', lang)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
