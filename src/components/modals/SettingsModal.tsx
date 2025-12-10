
import React, { useState, useEffect } from 'react';
import { Settings, Database, Upload, Download, Check, Edit2, Sliders, Globe, Kanban, Plus, Trash2, GripVertical, CheckCircle, Circle, Sun, Moon } from 'lucide-react';
import { ProjectType, CategoryConfig, CategoryDefinition, AppSettings, Language, StatusDefinition, ProjectStatus } from '../../types';
import { DynamicIcon, COLOR_PALETTE, ICON_MAP } from '../IconUtils';
import { t } from '../../translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryConfig: CategoryConfig;
  onUpdateCategory: (config: CategoryConfig) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  appSettings: AppSettings;
  onUpdateAppSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  categoryConfig, 
  onUpdateCategory, 
  onExportData, 
  onImportData,
  appSettings,
  onUpdateAppSettings
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('VIDEO');
  const [editCategoryForm, setEditCategoryForm] = useState<CategoryDefinition>({ label: '', color: '', iconKey: '' });
  const [prefForm, setPrefForm] = useState<AppSettings>(appSettings);

  // Reset/Sync form when tab or config changes
  useEffect(() => {
    if (activeSettingsTab && !['DATA', 'PREFERENCES', 'PIPELINE'].includes(activeSettingsTab) && isOpen) {
       setEditCategoryForm(categoryConfig[activeSettingsTab as ProjectType]);
    }
  }, [activeSettingsTab, categoryConfig, isOpen]);

  useEffect(() => {
    if (appSettings) {
      setPrefForm(appSettings);
    }
  }, [appSettings]);

  // Handle setting default tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveSettingsTab('VIDEO');
    }
  }, [isOpen]);

  const handleSaveCategory = () => {
    if (activeSettingsTab && !['DATA', 'PREFERENCES', 'PIPELINE'].includes(activeSettingsTab)) {
      const newConfig = {
        ...categoryConfig,
        [activeSettingsTab]: editCategoryForm
      };
      onUpdateCategory(newConfig);
    }
  };

  const handleSaveAppSettings = () => {
    onUpdateAppSettings(prefForm);
    onClose();
  };

  const handlePipelineAdd = () => {
    if (prefForm.customStatuses.length >= 8) return;
    const newStatus: StatusDefinition = {
      id: `custom-${Date.now()}`,
      label: 'New Status',
      isCompleted: false
    };
    setPrefForm(prev => ({
      ...prev,
      customStatuses: [...prev.customStatuses, newStatus]
    }));
  };

  const handlePipelineRemove = (index: number) => {
    if (prefForm.customStatuses.length <= 2) return;
    setPrefForm(prev => {
      const newList = [...prev.customStatuses];
      // If removing the completed one, make the last one completed
      if (newList[index].isCompleted) {
         if (index > 0) newList[index-1].isCompleted = true;
         else if (index < newList.length - 1) newList[index+1].isCompleted = true;
      }
      newList.splice(index, 1);
      return { ...prev, customStatuses: newList };
    });
  };

  const handlePipelineRename = (index: number, newLabel: string) => {
    setPrefForm(prev => {
      const newList = [...prev.customStatuses];
      newList[index] = { ...newList[index], label: newLabel };
      return { ...prev, customStatuses: newList };
    });
  };

  const handleSetCompleted = (index: number) => {
    setPrefForm(prev => ({
        ...prev,
        customStatuses: prev.customStatuses.map((s, i) => ({
            ...s,
            isCompleted: i === index
        }))
    }));
  };
  
  // Safe accessor to avoid 'unknown' type errors if inference fails
  const safeEditCategoryForm = editCategoryForm as CategoryDefinition;
  const lang = prefForm.language;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-3xl h-[550px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Left: Navigation Sidebar */}
          <div className="w-56 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                  <Settings size={16} /> {t('settings', lang)}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                
                {/* System Section */}
                <div className="px-2 py-2">
                  <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 px-2 mb-1 uppercase tracking-wider">{t('settings_system', lang)}</div>
                  <button 
                    onClick={() => setActiveSettingsTab('PREFERENCES')}
                    className={`w-full flex items-center gap-3 p-2 rounded-md transition-all ${
                      activeSettingsTab === 'PREFERENCES' 
                        ? 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-900 dark:text-white' 
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                      <Sliders size={14} />
                      <div className="text-xs font-medium">{t('settings_pref', lang)}</div>
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('PIPELINE')}
                    className={`w-full flex items-center gap-3 p-2 rounded-md transition-all ${
                      activeSettingsTab === 'PIPELINE' 
                        ? 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-900 dark:text-white' 
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                      <Kanban size={14} />
                      <div className="text-xs font-medium">{t('settings_pipeline', lang)}</div>
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('DATA')}
                    className={`w-full flex items-center gap-3 p-2 rounded-md transition-all ${
                      activeSettingsTab === 'DATA' 
                        ? 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-900 dark:text-white' 
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                      <Database size={14} />
                      <div className="text-xs font-medium">{t('settings_data', lang)}</div>
                  </button>
                </div>

                {/* Catalogue Section */}
                <div className="px-2 pb-2">
                  <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 px-2 mb-1 mt-2 uppercase tracking-wider">{t('settings_catalogue', lang)}</div>
                  {(Object.entries(categoryConfig) as [string, CategoryDefinition][]).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setActiveSettingsTab(key)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md transition-all ${
                          activeSettingsTab === key 
                            ? 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm' 
                            : 'hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-transparent'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${config.color}`}>
                            <DynamicIcon iconKey={config.iconKey} className="text-white w-3 h-3" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <div className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{config.label}</div>
                        </div>
                      </button>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                <button onClick={onClose} className="w-full py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800">
                    {t('settings_close', lang)}
                </button>
              </div>
          </div>

          {/* Right: Content Area */}
          <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col p-5 overflow-hidden transition-colors">
              {activeSettingsTab === 'DATA' ? (
                // Data Management View
                <div className="flex flex-col h-full">
                    <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wide">{t('settings_data', lang)}</h2>
                      <p className="text-xs text-zinc-500 mt-1">Export your data for backup or transfer to another device.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Export Card */}
                      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                            <Upload size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t('settings_export', lang)}</h4>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                              {t('settings_export_desc', lang)}
                            </p>
                          </div>
                          <button 
                            onClick={onExportData}
                            className="mt-auto w-full py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-700"
                          >
                            Download
                          </button>
                      </div>

                      {/* Import Card */}
                      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                            <Download size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t('settings_import', lang)}</h4>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                              {t('settings_import_desc', lang)}
                            </p>
                          </div>
                          <label className="mt-auto w-full py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-700 text-center cursor-pointer">
                            <input 
                              type="file" 
                              accept=".json" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onImportData(file);
                              }} 
                              className="hidden" 
                            />
                            Select File
                          </label>
                      </div>
                    </div>
                </div>
              ) : activeSettingsTab === 'PIPELINE' ? (
                 // Pipeline Settings View
                 <div className="flex flex-col h-full gap-4">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wide">{t('settings_pipeline', lang)}</h2>
                      <button 
                        onClick={handleSaveAppSettings}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                      >
                        <Check size={14} /> {t('settings_save', lang)}
                      </button>
                    </div>

                    <div className="space-y-4 pt-2 overflow-y-auto custom-scrollbar">
                       {/* Mode Toggles */}
                       <div className="flex gap-4">
                          <button
                            onClick={() => setPrefForm(prev => ({...prev, statusMode: 'DEFAULT'}))}
                            className={`flex-1 p-4 rounded-lg border flex flex-col gap-2 items-start transition-all ${
                              prefForm.statusMode === 'DEFAULT' 
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' 
                                : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 opacity-60 hover:opacity-100'
                            }`}
                          >
                             <div className="flex items-center gap-2 w-full">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${prefForm.statusMode === 'DEFAULT' ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-400 dark:border-zinc-600'}`}>
                                   {prefForm.statusMode === 'DEFAULT' && <Check size={10} className="text-white" />}
                                </div>
                                <span className={`text-xs font-bold ${prefForm.statusMode === 'DEFAULT' ? 'text-indigo-600 dark:text-indigo-200' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                  {t('pipeline_mode_default', lang)}
                                </span>
                             </div>
                             <div className="pl-6 text-[10px] text-zinc-500 text-left">
                               Standard fixed statuses: Planning, In Progress, Completed, Paused.
                             </div>
                          </button>

                          <button
                            onClick={() => setPrefForm(prev => ({...prev, statusMode: 'CUSTOM'}))}
                            className={`flex-1 p-4 rounded-lg border flex flex-col gap-2 items-start transition-all ${
                              prefForm.statusMode === 'CUSTOM' 
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' 
                                : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 opacity-60 hover:opacity-100'
                            }`}
                          >
                             <div className="flex items-center gap-2 w-full">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${prefForm.statusMode === 'CUSTOM' ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-400 dark:border-zinc-600'}`}>
                                   {prefForm.statusMode === 'CUSTOM' && <Check size={10} className="text-white" />}
                                </div>
                                <span className={`text-xs font-bold ${prefForm.statusMode === 'CUSTOM' ? 'text-indigo-600 dark:text-indigo-200' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                  {t('pipeline_mode_custom', lang)}
                                </span>
                             </div>
                             <div className="pl-6 text-[10px] text-zinc-500 text-left">
                               Define your own workflow stages (2-8 items).
                             </div>
                          </button>
                       </div>

                       {/* List Editor (Only for Custom) */}
                       {prefForm.statusMode === 'CUSTOM' && (
                         <div className="space-y-2 mt-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase flex justify-between">
                              <span>Custom Statuses ({prefForm.customStatuses.length}/8)</span>
                              {prefForm.customStatuses.length >= 8 && <span className="text-amber-500">{t('pipeline_max_limit', lang)}</span>}
                            </label>
                            
                            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-lg p-3 space-y-2">
                               <p className="text-[10px] text-zinc-400 mb-2">{t('pipeline_set_completed', lang)}</p>
                               {prefForm.customStatuses.map((status, idx) => (
                                 <div key={status.id} className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-200">
                                    <div className="w-6 flex justify-center text-zinc-400 dark:text-zinc-600 cursor-default">
                                       <span className="text-[10px] font-mono">{idx + 1}</span>
                                    </div>
                                    <input 
                                      type="text" 
                                      value={status.label}
                                      onChange={(e) => handlePipelineRename(idx, e.target.value)}
                                      placeholder={t('pipeline_placeholder', lang)}
                                      className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-xs text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    
                                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                                    
                                    <button
                                      onClick={() => handleSetCompleted(idx)}
                                      className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${status.isCompleted ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-600 hover:text-emerald-600 dark:hover:text-emerald-200'}`}
                                      title="Mark as 'Completed' status (stops deadline alerts)"
                                    >
                                       {status.isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
                                    </button>

                                    <button 
                                      onClick={() => handlePipelineRemove(idx)}
                                      disabled={prefForm.customStatuses.length <= 2}
                                      className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30 disabled:hover:text-zinc-500 disabled:hover:bg-transparent"
                                      title="Remove status"
                                    >
                                       <Trash2 size={14} />
                                    </button>
                                 </div>
                               ))}
                            </div>

                            <button
                              onClick={handlePipelineAdd}
                              disabled={prefForm.customStatuses.length >= 8}
                              className="w-full py-2 mt-2 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-500 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                               <Plus size={14} /> {t('pipeline_add', lang)}
                            </button>
                         </div>
                       )}
                    </div>
                 </div>
              ) : activeSettingsTab === 'PREFERENCES' ? (
                // Preferences View
                 <div className="flex flex-col h-full gap-4">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                      <div>
                          <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wide">{t('settings_pref', lang)}</h2>
                      </div>
                      <button 
                        onClick={handleSaveAppSettings}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                      >
                        <Check size={14} /> {t('settings_save', lang)}
                      </button>
                    </div>

                    <div className="space-y-6 pt-2">
                       {/* Appearance Settings */}
                       <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                             <Sun size={14} /> {t('settings_appearance', lang)}
                          </h4>
                          <div className="flex gap-2">
                             <button
                               onClick={() => setPrefForm(prev => ({...prev, theme: 'light'}))}
                               className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border transition-all ${
                                 prefForm.theme === 'light' 
                                   ? 'bg-white text-indigo-600 border-indigo-500 shadow-sm' 
                                   : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                               }`}
                             >
                               <Sun size={14} /> {t('settings_theme_light', lang)}
                             </button>
                             <button
                               onClick={() => setPrefForm(prev => ({...prev, theme: 'dark'}))}
                               className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border transition-all ${
                                 prefForm.theme === 'dark' 
                                   ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm' 
                                   : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                               }`}
                             >
                               <Moon size={14} /> {t('settings_theme_dark', lang)}
                             </button>
                          </div>
                       </div>

                       <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full" />

                       {/* Language Settings */}
                       <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                            <Globe size={14} /> {t('settings_lang', lang)}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPrefForm(prev => ({...prev, language: 'en'}))}
                              className={`px-4 py-2 text-xs font-medium rounded-md border transition-all ${
                                prefForm.language === 'en' 
                                  ? 'bg-indigo-600 text-white border-indigo-500' 
                                  : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              English
                            </button>
                            <button
                              onClick={() => setPrefForm(prev => ({...prev, language: 'zh-TW'}))}
                              className={`px-4 py-2 text-xs font-medium rounded-md border transition-all ${
                                prefForm.language === 'zh-TW' 
                                  ? 'bg-indigo-600 text-white border-indigo-500' 
                                  : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              繁體中文
                            </button>
                          </div>
                       </div>

                       <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full" />

                       {/* Alert Thresholds */}
                       <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t('settings_alerts', lang)}</h4>
                          
                          <div className="grid grid-cols-2 gap-6 mt-3">
                             <div className="space-y-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                                <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase">{t('settings_warning', lang)}</label>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={prefForm.warningDays}
                                    onChange={e => setPrefForm(prev => ({...prev, warningDays: parseInt(e.target.value) || 0}))}
                                    className="w-16 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 outline-none"
                                  />
                                </div>
                             </div>

                             <div className="space-y-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                                <label className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase">{t('settings_critical', lang)}</label>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={prefForm.criticalDays}
                                    onChange={e => setPrefForm(prev => ({...prev, criticalDays: parseInt(e.target.value) || 0}))}
                                    className="w-16 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-red-500 outline-none"
                                  />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              ) : activeSettingsTab ? (
                // Catalogue Editor View
                <div className="flex flex-col h-full gap-4">
                    
                    {/* Header: Title & Save */}
                    <div className="flex items-center justify-end pb-2 border-b border-zinc-200 dark:border-zinc-800">
                      {/* Title Removed as requested */}
                      <button 
                        onClick={handleSaveCategory}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                      >
                        <Check size={14} /> {t('settings_save', lang)}
                      </button>
                    </div>
                    
                    {/* Row 1: Name Input & Preview */}
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('cat_label', lang)}</label>
                          <input 
                            type="text" 
                            value={safeEditCategoryForm.label}
                            onChange={(e) => setEditCategoryForm(prev => ({...prev, label: e.target.value}))}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('cat_preview', lang)}</label>
                          <div className="flex items-center gap-2 px-3 py-1.5 h-[38px] rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${safeEditCategoryForm.color}`}>
                              <DynamicIcon iconKey={safeEditCategoryForm.iconKey} className="text-white w-3 h-3" />
                            </div>
                            <span className="text-xs font-medium text-zinc-900 dark:text-white max-w-[100px] truncate">{safeEditCategoryForm.label}</span>
                          </div>
                      </div>
                    </div>

                    {/* Row 2: Color Palette */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('cat_color', lang)}</label>
                      <div className="grid grid-cols-12 gap-1.5">
                          {COLOR_PALETTE.map(color => (
                            <button
                              key={color}
                              onClick={() => setEditCategoryForm(prev => ({...prev, color}))}
                              className={`w-6 h-6 rounded-full transition-transform ${color} ${
                                safeEditCategoryForm.color === color ? 'ring-2 ring-zinc-900 dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-zinc-950 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                              }`}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Row 3: Icon Grid */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">{t('cat_icon', lang)}</label>
                      <div className="grid grid-cols-9 gap-x-1.5 gap-y-3">
                          {Object.keys(ICON_MAP).map(iconKey => (
                            <button
                              key={iconKey}
                              onClick={() => setEditCategoryForm(prev => ({...prev, iconKey}))}
                              className={`aspect-square w-9 rounded flex items-center justify-center transition-all ${
                                safeEditCategoryForm.iconKey === iconKey 
                                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white ring-1 ring-indigo-500' 
                                  : 'bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
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
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
                    <Edit2 size={32} className="mb-2 opacity-20" />
                    <p className="text-xs">Select a category to edit</p>
                </div>
              )}
          </div>
        </div>
    </div>
  );
};
