
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, CheckSquare, Square, ListTodo } from 'lucide-react';
import { Project, ChecklistItem, Language } from '../../types';
import { t } from '../../translations';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onUpdateProject: (updatedProject: Project) => void;
  lang: Language;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose, project, onUpdateProject, lang }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemText, setEditItemText] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingItemId && editInputRef.current) {
        editInputRef.current.focus();
    }
  }, [editingItemId]);

  if (!isOpen || !project) return null;

  const checklist = project.checklist || [];
  
  const completedCount = checklist.filter(i => i.isCompleted).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      isCompleted: false
    };

    const updatedChecklist = [...checklist, newItem];
    onUpdateProject({ ...project, checklist: updatedChecklist });
    setNewTaskText('');
  };

  const handleToggleTask = (itemId: string) => {
    const updatedChecklist = checklist.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    onUpdateProject({ ...project, checklist: updatedChecklist });
  };

  const handleDeleteTask = (itemId: string) => {
    const updatedChecklist = checklist.filter(item => item.id !== itemId);
    onUpdateProject({ ...project, checklist: updatedChecklist });
  };

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditItemText(item.text);
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;

    // If empty, revert to original or could delete (choosing to revert here for safety)
    if (!editItemText.trim()) {
        setEditingItemId(null);
        return;
    }

    const updatedChecklist = checklist.map(item => 
      item.id === editingItemId ? { ...item, text: editItemText.trim() } : item
    );
    onUpdateProject({ ...project, checklist: updatedChecklist });
    setEditingItemId(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemText('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission if inside form (though it's not)
        handleSaveEdit();
    } else if (e.key === 'Escape') {
        handleCancelEdit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
               <ListTodo size={20} />
             </div>
             <div>
               <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{project.name}</h3>
               <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('checklist_title', lang)}</p>
             </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pt-4 pb-2">
           <div className="flex justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
              <span>Progress</span>
              <span>{completedCount} / {totalCount}</span>
           </div>
           <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
           </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleAddTask} className="p-4 flex gap-2 border-b border-zinc-100 dark:border-zinc-800/50">
           <input
             ref={inputRef}
             type="text"
             value={newTaskText}
             onChange={(e) => setNewTaskText(e.target.value)}
             placeholder={t('checklist_placeholder', lang)}
             className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
           />
           <button 
             type="submit"
             disabled={!newTaskText.trim()}
             className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1"
           >
             <Plus size={14} /> {t('checklist_add', lang)}
           </button>
        </form>

        {/* List Area */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[200px] max-h-[400px]">
           {checklist.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-zinc-400 dark:text-zinc-600">
               <ListTodo size={32} className="mb-2 opacity-20" />
               <p className="text-xs">{t('checklist_empty', lang)}</p>
             </div>
           ) : (
             <div className="space-y-1">
               {checklist.map(item => (
                 <div 
                   key={item.id}
                   className={`
                     group flex items-center gap-3 p-2 rounded-md transition-all border border-transparent
                     ${item.isCompleted 
                        ? 'bg-zinc-50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-600' 
                        : 'bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-200 hover:border-zinc-200 dark:hover:border-zinc-800 shadow-sm'
                     }
                   `}
                 >
                    <button
                      onClick={() => handleToggleTask(item.id)}
                      className={`shrink-0 transition-colors ${item.isCompleted ? 'text-zinc-400 hover:text-indigo-500' : 'text-zinc-400 hover:text-indigo-500'}`}
                    >
                      {item.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                        {editingItemId === item.id ? (
                            <input
                                ref={editInputRef}
                                type="text"
                                value={editItemText}
                                onChange={(e) => setEditItemText(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleEditKeyDown}
                                className="w-full bg-white dark:bg-black border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
                            />
                        ) : (
                            <span 
                                onClick={() => handleStartEdit(item)}
                                className={`block text-xs break-all cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${item.isCompleted ? 'line-through decoration-zinc-400' : ''}`}
                                title="Click to edit"
                            >
                                {item.text}
                            </span>
                        )}
                    </div>

                    <button
                      onClick={() => handleDeleteTask(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
