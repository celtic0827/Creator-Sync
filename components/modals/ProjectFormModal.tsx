
import React, { useState, useEffect } from 'react';
import { X, Tag, Check, AlertTriangle, Trash2 } from 'lucide-react';
import { Project, ProjectStatus, ProjectType, CategoryConfig, CategoryDefinition, Language } from '../../types';
import { DynamicIcon } from '../IconUtils';
import { t, getStatusText } from '../../translations';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
  onDelete?: () => void;
  editingProject?: Project | null;
  categoryConfig: CategoryConfig;
  lang: Language;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  editingProject, 
  categoryConfig,
  lang
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tagsString: '',
    type: 'VIDEO' as ProjectType,
    status: ProjectStatus.PLANNING
  });
  
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        setFormData({
          name: editingProject.name,
          description: editingProject.description,
          tagsString: editingProject.tags.join(', '),
          type: editingProject.type,
          status: editingProject.status
        });
      } else {
        // Reset for new project
        setFormData({
          name: '',
          description: '',
          tagsString: '',
          type: 'VIDEO' as ProjectType,
          status: ProjectStatus.PLANNING
        });
      }
      setIsDeleteConfirming(false);
    }
  }, [isOpen, editingProject]);

  const handleSubmit = () => {
    if (!formData.name) return;
    
    // Process tags
    const tags = formData.tagsString
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onSave({
      name: formData.name,
      description: formData.description,
      tags,
      type: formData.type,
      status: formData.status
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h3 className="text-sm font-semibold text-white">
            {editingProject ? t('modal_editTitle', lang) : t('modal_createTitle', lang)}
          </h3>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">{t('modal_name', lang)}</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
              placeholder="e.g. New Content Pack"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">{t('modal_desc', lang)}</label>
            <input 
              type="text" 
              value={formData.description}
              onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
              placeholder="Short details..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-medium text-zinc-400">{t('modal_tags', lang)}</label>
              </div>
              <div className="relative">
                <Tag size={12} className="absolute left-3 top-2.5 text-zinc-600" />
                <input 
                  type="text" 
                  value={formData.tagsString}
                  onChange={e => setFormData(prev => ({...prev, tagsString: e.target.value}))}
                  placeholder="e.g. NSFW, Bonus, Draft"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">{t('modal_category', lang)}</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(categoryConfig) as [string, CategoryDefinition][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, type: key as ProjectType}))}
                  className={`
                    flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border text-xs transition-all
                    ${formData.type === key 
                      ? 'bg-zinc-800 border-indigo-500 text-white shadow-md' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }
                  `}
                >
                    <div className={`${config.color} p-1 rounded-full text-white/90`}>
                      <DynamicIcon iconKey={config.iconKey} className="w-4 h-4" />
                    </div>
                    <span className="scale-90 truncate w-full text-center">{config.label.split(' / ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">{t('modal_status', lang)}</label>
            <select 
                value={formData.status}
                onChange={e => setFormData(prev => ({...prev, status: e.target.value as ProjectStatus}))}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
            >
                {Object.values(ProjectStatus).map(s => (
                  <option key={s} value={s}>{getStatusText(s, lang)}</option>
                ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 p-4">
            {editingProject && onDelete ? (
              isDeleteConfirming ? (
                  <div className="flex items-center gap-2 mr-auto bg-red-950/30 px-2 py-1 rounded border border-red-900/50">
                      <AlertTriangle size={12} className="text-red-400" />
                      <span className="text-[10px] text-red-200 font-medium">{t('modal_reallyDelete', lang)}</span>
                      <div className="flex gap-1 ml-1">
                          <button 
                            onClick={onDelete}
                            className="text-white bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                              YES
                          </button>
                          <button 
                            onClick={() => setIsDeleteConfirming(false)}
                            className="text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-[10px]"
                          >
                              NO
                          </button>
                      </div>
                  </div>
              ) : (
                  <button 
                    type="button"
                    onClick={() => setIsDeleteConfirming(true)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/50 p-1.5 rounded transition-colors group"
                    title={t('modal_delete', lang)}
                  >
                      <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
              )
            ) : (
              <div></div> // Spacer
            )}

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white">{t('modal_cancel', lang)}</button>
            <button 
              onClick={handleSubmit}
              disabled={!formData.name}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} /> {t('modal_save', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
