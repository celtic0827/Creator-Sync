import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Project, ProjectStatus } from '../types';
import { COLOR_PALETTE, ICON_OPTIONS, getIconComponent } from './IconUtils';
import { v4 as uuidv4 } from 'uuid';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  editingProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, editingProject }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Video');
  const [selectedColor, setSelectedColor] = useState('bg-indigo-600');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (editingProject) {
      setTitle(editingProject.title);
      setDescription(editingProject.description);
      setSelectedIcon(editingProject.icon);
      setSelectedColor(editingProject.color);
      setTags(editingProject.tags.join(', '));
    } else {
      resetForm();
    }
  }, [editingProject, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedIcon('Video');
    setSelectedColor('bg-indigo-600');
    setTags('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const project: Project = {
      id: editingProject?.id || uuidv4(),
      title,
      description,
      status: editingProject?.status || ProjectStatus.PLANNING,
      icon: selectedIcon,
      color: selectedColor,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      createdAt: editingProject?.createdAt || Date.now(),
    };
    onSave(project);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 w-full max-w-2xl rounded-xl shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">
            {editingProject ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Project Title"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Short description"
                />
               </div>
               <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="vlog, tech, review"
                />
               </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 my-4"></div>

          {/* Catalogue Editor: Colors */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">Color Badge</label>
            <div className="grid grid-cols-12 gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-8 h-8 rounded-md ${color} transition-transform
                    ${selectedColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}
                  `}
                />
              ))}
            </div>
          </div>

          {/* Catalogue Editor: Icons */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">Iconography</label>
            <div className="grid grid-cols-9 gap-2 gap-y-3">
              {ICON_OPTIONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={`
                    flex items-center justify-center p-2 rounded-lg border transition-all
                    ${selectedIcon === iconName 
                      ? `bg-zinc-800 border-indigo-500 text-indigo-400` 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}
                  `}
                >
                  {getIconComponent(iconName, "w-5 h-5")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {editingProject ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};