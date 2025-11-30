
import React, { useState, useEffect } from 'react';
import { Settings, Database, Upload, Download, Check, Edit2 } from 'lucide-react';
import { ProjectType, CategoryConfig, CategoryDefinition } from '../../types';
import { DynamicIcon, COLOR_PALETTE, ICON_MAP } from '../IconUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryConfig: CategoryConfig;
  onUpdateCategory: (config: CategoryConfig) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  categoryConfig, 
  onUpdateCategory, 
  onExportData, 
  onImportData 
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('VIDEO');
  const [editCategoryForm, setEditCategoryForm] = useState<CategoryDefinition>({ label: '', color: '', iconKey: '' });

  // Reset/Sync form when tab or config changes
  useEffect(() => {
    if (activeSettingsTab && activeSettingsTab !== 'DATA' && isOpen) {
       setEditCategoryForm(categoryConfig[activeSettingsTab as ProjectType]);
    }
  }, [activeSettingsTab, categoryConfig, isOpen]);

  // Handle setting default tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveSettingsTab('VIDEO');
    }
  }, [isOpen]);

  const handleSaveCategory = () => {
    if (activeSettingsTab && activeSettingsTab !== 'DATA') {
      const newConfig = {
        ...categoryConfig,
        [activeSettingsTab]: editCategoryForm
      };
      onUpdateCategory(newConfig);
    }
  };
  
  // Safe accessor to avoid 'unknown' type errors if inference fails
  const safeEditCategoryForm = editCategoryForm as CategoryDefinition;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-3xl h-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Left: Navigation Sidebar */}
          <div className="w-56 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings size={16} /> Settings
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[350px]">
                
                {/* System Section */}
                <div className="px-2 py-2">
                  <div className="text-[10px] font-bold text-zinc-500 px-2 mb-1 uppercase tracking-wider">System</div>
                  <button 
                    onClick={() => setActiveSettingsTab('DATA')}
                    className={`w-full flex items-center gap-3 p-2 rounded-md transition-all ${
                      activeSettingsTab === 'DATA' 
                        ? 'bg-zinc-800 border border-zinc-700 shadow-sm text-white' 
                        : 'hover:bg-zinc-900 border border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                      <Database size={14} />
                      <div className="text-xs font-semibold">Data Backup</div>
                  </button>
                </div>

                {/* Catalogue Section */}
                <div className="px-2 pb-2">
                  <div className="text-[10px] font-bold text-zinc-500 px-2 mb-1 mt-2 uppercase tracking-wider">Catalogue</div>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setActiveSettingsTab(key)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md transition-all ${
                          activeSettingsTab === key 
                            ? 'bg-zinc-800 border border-zinc-700 shadow-sm' 
                            : 'hover:bg-zinc-900 border border-transparent'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${config.color}`}>
                            <DynamicIcon iconKey={config.iconKey} className="text-white w-3 h-3" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <div className="text-xs font-semibold text-zinc-200 truncate">{config.label}</div>
                        </div>
                      </button>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-zinc-800">
                <button onClick={onClose} className="w-full py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded hover:bg-zinc-800">
                    Close
                </button>
              </div>
          </div>

          {/* Right: Content Area */}
          <div className="flex-1 bg-zinc-950 flex flex-col p-5">
              {activeSettingsTab === 'DATA' ? (
                // Data Management View
                <div className="flex flex-col h-full">
                    <div className="pb-4 border-b border-zinc-800 mb-6">
                      <h2 className="text-sm font-bold text-white uppercase tracking-wide">Data Management</h2>
                      <p className="text-xs text-zinc-500 mt-1">Export your data for backup or transfer to another device.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Export Card */}
                      <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors flex flex-col gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            {/* Upload Icon for Export (Sending Out) */}
                            <Upload size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-zinc-200">Export JSON</h4>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                              Download a complete backup of projects, schedule, and settings.
                            </p>
                          </div>
                          <button 
                            onClick={onExportData}
                            className="mt-auto w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded border border-zinc-700"
                          >
                            Download Backup
                          </button>
                      </div>

                      {/* Import Card */}
                      <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors flex flex-col gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                              {/* Download Icon for Import (Bringing In) */}
                            <Download size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-zinc-200">Import JSON</h4>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                              Restore from a backup file. <span className="text-red-400">Warning: Overwrites current data.</span>
                            </p>
                          </div>
                          <label className="mt-auto w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded border border-zinc-700 text-center cursor-pointer">
                            <input type="file" accept=".json" onChange={onImportData} className="hidden" />
                            Select File to Restore
                          </label>
                      </div>
                    </div>
                </div>
              ) : activeSettingsTab ? (
                // Catalogue Editor View
                <div className="flex flex-col h-full gap-4">
                    
                    {/* Header: Title & Save */}
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div>
                          <h2 className="text-sm font-bold text-white uppercase tracking-wide">{activeSettingsTab} Config</h2>
                      </div>
                      <button 
                        onClick={handleSaveCategory}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                      >
                        <Check size={14} /> Save
                      </button>
                    </div>
                    
                    {/* Row 1: Name Input & Preview */}
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Label Name</label>
                          <input 
                            type="text" 
                            value={safeEditCategoryForm.label}
                            onChange={(e) => setEditCategoryForm(prev => ({...prev, label: e.target.value}))}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Preview</label>
                          <div className="flex items-center gap-2 px-3 py-1.5 h-[38px] rounded border border-zinc-800 bg-zinc-900/50">
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${safeEditCategoryForm.color}`}>
                              <DynamicIcon iconKey={safeEditCategoryForm.iconKey} className="text-white w-3 h-3" />
                            </div>
                            <span className="text-xs font-medium text-white max-w-[100px] truncate">{safeEditCategoryForm.label}</span>
                          </div>
                      </div>
                    </div>

                    {/* Row 2: Color Palette */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Color Theme (Bright / Dark)</label>
                      <div className="grid grid-cols-12 gap-1.5">
                          {COLOR_PALETTE.map(color => (
                            <button
                              key={color}
                              onClick={() => setEditCategoryForm(prev => ({...prev, color}))}
                              className={`w-6 h-6 rounded-full transition-transform ${color} ${
                                safeEditCategoryForm.color === color ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                              }`}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Row 3: Icon Grid */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Icon Symbol</label>
                      <div className="grid grid-cols-9 gap-x-1.5 gap-y-3">
                          {Object.keys(ICON_MAP).map(iconKey => (
                            <button
                              key={iconKey}
                              onClick={() => setEditCategoryForm(prev => ({...prev, iconKey}))}
                              className={`aspect-square w-9 rounded flex items-center justify-center transition-all ${
                                safeEditCategoryForm.iconKey === iconKey 
                                  ? 'bg-zinc-800 text-white ring-1 ring-indigo-500' 
                                  : 'bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
                              }`}
                              title={iconKey}
                            >
                                <DynamicIcon iconKey={iconKey} className="w-4 h-4" />
                            </button>
                          ))}
                      </div>
                    </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                    <Edit2 size={32} className="mb-2 opacity-20" />
                    <p className="text-xs">Select a category to edit</p>
                </div>
              )}
          </div>
        </div>
    </div>
  );
};
