
import React from 'react';
import { X, BookOpen, Layers, Calendar, ListTodo, Archive, Trash2, ShieldCheck, AlertTriangle, Undo2, Edit2, Settings, Clock, Globe, Shapes, CheckSquare } from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../translations';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  const isZh = lang === 'zh-TW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl max-h-[85vh] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 dark:text-indigo-400">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">{isZh ? 'Creator Sync 使用指南' : 'Creator Sync Guide'}</h2>
                    <p className="text-xs text-zinc-500">{isZh ? '掌握您的生產管線' : 'Mastering your production pipeline'}</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                
                {/* Section 1: Concept */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Layers size={14} className="text-indigo-600 dark:text-indigo-500" /> {isZh ? '核心流程' : 'Core Workflow'}
                    </h3>
                    <div className="prose prose-sm prose-zinc dark:prose-invert text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed space-y-2">
                      <p>
                        {isZh 
                          ? 'Creator Sync 連結您的 **專案管線**（側邊欄）與 **發布排程**（日曆）。' 
                          : 'Creator Sync connects your **Project Pipeline** (Sidebar) with your **Release Schedule** (Calendar).'
                        }
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '左側邊欄:' : 'Left Sidebar:'}</strong> {isZh ? '您的待辦事項。在此建立專案，專案會經歷 規劃中 → 進行中 → 已完成。' : 'Your backlog. Create projects here. They move through Planning → In Progress → Completed.'}
                          </li>
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '日曆:' : 'Calendar:'}</strong> {isZh ? '發布日期。將專案從側邊欄拖曳到日期上即可排程。' : 'Your release dates. Drag projects from the sidebar onto a date to schedule them.'}
                          </li>
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '拖放操作:' : 'Drag & Drop:'}</strong> {isZh ? '所有項目皆可移動。拖曳側邊欄項目以更改狀態，拖曳日曆項目以重新排程。' : 'Everything is movable. Drag sidebar items to change status. Drag calendar items to reschedule.'}
                          </li>
                      </ul>
                    </div>
                </section>

                {/* Section 2: Scheduling */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-600 dark:text-emerald-500" /> {isZh ? '排程與導航' : 'Scheduling & Navigation'}
                    </h3>
                    <div className="prose prose-sm prose-zinc dark:prose-invert text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed space-y-2">
                      <p>
                          {isZh ? '一旦專案被放到日曆上，即視為「已排程」。' : 'Once a project is on the calendar, it is considered "Scheduled".'}
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <span className="text-zinc-700 dark:text-zinc-300">{isZh ? '跳轉至日期:' : 'Jump to Date:'}</span> {isZh ? '點擊側邊欄卡片上的小日期按鈕，可跳轉至該月份。' : 'Click the small date button on a sidebar card to jump to its month in the calendar.'}
                          </li>
                          <li>
                            <span className="text-zinc-700 dark:text-zinc-300">{isZh ? '定位專案:' : 'Locate Project:'}</span> {isZh ? '點擊日曆上的任何項目，側邊欄會自動捲動並標示出原始專案卡片。' : 'Click any item on the calendar grid to auto-scroll the sidebar to the original project card.'}
                          </li>
                          <li>
                            <span className="text-zinc-700 dark:text-zinc-300">{isZh ? '移除排程:' : 'Remove Schedule:'}</span> {isZh ? '將滑鼠停在日曆項目上並點擊 X，或將其拖曳至上方的垃圾桶。這只會移除日期，不會刪除專案。' : 'Hover over a calendar item and click the X button, or drag it to the Trash at the top. This removes the date but keeps the project.'}
                          </li>
                      </ul>
                    </div>
                </section>

                {/* Section 3: Statuses */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <ListTodo size={14} className="text-amber-600 dark:text-amber-500" /> {isZh ? '專案狀態' : 'Project Statuses'}
                      </h3>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-medium">
                         {isZh ? '可客製化' : 'Customizable'}
                      </span>
                    </div>
                    
                    <p className="text-xs text-zinc-500 italic">
                        {isZh 
                           ? '這些是預設狀態。您可以在 設定 > 管線設定 中自由更名、新增或刪除。' 
                           : 'These are the default stages. You can customize them in Settings > Pipeline Config.'
                        }
                    </p>

                    <div className="space-y-3 pt-1">
                      <div className="flex gap-3">
                          <div className="w-16 shrink-0 text-[10px] font-bold text-zinc-600 dark:text-zinc-500 text-right mt-0.5">{t('status_PLANNING', lang)}</div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{isZh ? '想法、概念與草稿。尚未進入正式製作。' : 'Ideas, concepts, and drafts. Not yet in full production.'}</p>
                      </div>
                      <div className="flex gap-3">
                          <div className="w-16 shrink-0 text-[10px] font-bold text-zinc-800 dark:text-zinc-300 text-right mt-0.5">{t('status_IN_PROGRESS', lang)}</div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{isZh ? '進行中。這是您主要的工作區域。' : 'Active work. Most of your daily focus should be here.'}</p>
                      </div>
                      <div className="flex gap-3">
                          <div className="w-16 shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 text-right mt-0.5">{t('status_COMPLETED', lang)}</div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{isZh ? '製作完成，準備發布。等待排程。' : 'Production finished, ready for release. Waiting to be scheduled.'}</p>
                      </div>
                      <div className="flex gap-3">
                          <div className="w-16 shrink-0 text-[10px] font-bold text-zinc-500 dark:text-zinc-600 text-right mt-0.5">{t('status_PAUSED', lang)}</div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{isZh ? '無限期擱置。' : 'On hold indefinitely.'}</p>
                      </div>
                    </div>
                </section>

                {/* Section 4: Project Categories */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Shapes size={14} className="text-pink-600 dark:text-pink-500" /> {isZh ? '專案分類' : 'Project Categories'}
                    </h3>
                    <div className="prose prose-sm prose-zinc dark:prose-invert text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed space-y-2">
                      <p>
                          {isZh 
                            ? '系統採用 **8 個固定分類槽** 來保持介面整潔。' 
                            : 'The system uses **8 fixed category slots** to keep the interface clean.'}
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '預設類別:' : 'Defaults:'}</strong> {isZh ? '影片、繪圖、寫作、音頻、3D、直播、社群、其他。' : 'Video, Art, Writing, Audio, 3D, Live, Social, Other.'}
                          </li>
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '客製化:' : 'Customization:'}</strong> {isZh ? '在 設定 > 類別目錄 中可更改名稱與外觀。' : 'Rename and recolor them in Settings > Catalogue.'}
                          </li>
                      </ul>
                    </div>
                </section>

                {/* Section 5: Checklists & Tasks (NEW) */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <CheckSquare size={14} className="text-sky-500 dark:text-sky-400" /> {isZh ? '待辦清單與任務' : 'Checklists & Tasks'}
                    </h3>
                    <div className="prose prose-sm prose-zinc dark:prose-invert text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed space-y-2">
                      <p>
                          {isZh 
                            ? '將大型專案拆解為更小的執行步驟。' 
                            : 'Break down large projects into smaller actionable steps.'}
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '開啟清單:' : 'Open Checklist:'}</strong> {isZh ? '點擊專案卡片右上角的' : 'Click the'} <ListTodo size={10} className="inline text-zinc-500" /> {isZh ? '圖示。' : 'icon on any project card.'}
                          </li>
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '追蹤進度:' : 'Track Progress:'}</strong> {isZh ? '完成度會以迷你進度條顯示於卡片左側色條上（例如 2/5）。' : 'Completion status is shown as a mini progress bar on the left colored edge of the card (e.g., 2/5).'}
                          </li>
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '編輯:' : 'Edit:'}</strong> {isZh ? '點擊任何現有的任務文字即可直接修改。' : 'Click on any existing task text to edit it inline.'}
                          </li>
                      </ul>
                    </div>
                </section>

                {/* Section 6: Alerts & Settings */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} className="text-red-500 dark:text-red-400" /> {isZh ? '截止日與警示' : 'Deadlines & Alerts'}
                    </h3>
                    <div className="prose prose-sm prose-zinc dark:prose-invert text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed space-y-2">
                      <p>
                          {isZh ? '當專案已排程但**尚未完成**時，系統會監控日期：' : 'If a project is scheduled but **Not Completed**, the system monitors the date:'}
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong className="text-amber-600 dark:text-amber-500">{isZh ? '黃色邊框 (警示):' : 'Yellow Border (Warning):'}</strong> {isZh ? '接近發布日（預設 7 天內）。' : 'Approaching release date (Default: 7 days).'}
                          </li>
                          <li>
                            <strong className="text-red-600 dark:text-red-500">{isZh ? '紅色邊框 (緊急):' : 'Red Border (Critical):'}</strong> {isZh ? '非常接近發布日（預設 3 天內）或已過期。' : 'Very close to release date (Default: 3 days) or overdue.'}
                          </li>
                          <li>
                            <span className="text-zinc-700 dark:text-zinc-300">{isZh ? '消除警示:' : 'To Resolve:'}</span> {isZh ? '將專案拖曳至「已完成」狀態，或更改日曆日期。' : 'Move the project to "Completed" status, or reschedule it.'}
                          </li>
                          <li>
                            <span className="text-zinc-700 dark:text-zinc-300">{isZh ? '設定:' : 'Settings:'}</span> {isZh ? '在設定 > 偏好設定中，您可以自訂天數閾值與切換語言 (中文/英文)。' : 'Customize alert thresholds and toggle Language (Chinese/English) in Settings > Preferences.'}
                          </li>
                      </ul>
                    </div>
                </section>

                {/* Section 7: Archiving */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Archive size={14} className="text-violet-600 dark:text-violet-500" /> {isZh ? '已發布與封存' : 'Published vs. Archive'}
                    </h3>
                    <div className="prose prose-sm prose-zinc dark:prose-invert text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed space-y-2">
                      <p>
                          {isZh ? '為了保持管線整潔，請使用側邊欄上方的分頁。' : 'To keep your Pipeline clean, use the tabs at the top of the sidebar.'}
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '專案管線:' : 'Pipeline Tab:'}</strong> {isZh ? '顯示進行中與即將到來的工作。' : 'Shows active and upcoming work.'}
                          </li>
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '已發布:' : 'Published Tab:'}</strong> {isZh ? '自動收納排程日期已過的專案。' : 'Automatically holds projects that were scheduled in the past.'}
                          </li>
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '封存按鈕' : 'Archive Button'} <Archive size={10} className="inline text-zinc-500" />:</strong> {isZh ? '在任何卡片上點擊封存圖示，可強制將專案移至已發布分頁。' : 'On any card, click the archive box icon to manually force a project into the Published tab.'}
                          </li>
                      </ul>
                    </div>
                </section>

                {/* Section 8: Deletion */}
                <section className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-2">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Trash2 size={14} className="text-red-500 dark:text-red-500" /> {isZh ? '垃圾桶與刪除' : 'Trash & Deletion'}
                    </h3>
                    <div className="flex items-start gap-4 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/20 p-4 rounded-lg">
                      <AlertTriangle size={20} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                          <p><strong className="text-red-600 dark:text-red-300">{isZh ? '拖曳至垃圾桶:' : 'Dragging to Trash:'}</strong> {isZh ? '拖曳「日曆項目」至上方垃圾桶會移除日期。拖曳「側邊欄專案」至垃圾桶會永久刪除該專案。' : 'Dragging a Calendar Item to the top trash bin removes the date. Dragging a Sidebar Project to the trash bin deletes the project entirely.'}</p>
                          <p>{isZh ? '您也可以透過' : 'You can also delete projects via the'} <Edit2 size={10} className="inline" /> {isZh ? '編輯選單刪除專案。' : 'Edit menu.'}</p>
                      </div>
                    </div>
                </section>

                {/* Section 9: Data & Safety */}
                <section className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-2">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} className="text-blue-500" /> {isZh ? '資料安全' : 'Data & Safety'}
                    </h3>
                    <div className="prose prose-sm prose-zinc dark:prose-invert text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed space-y-2">
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '復原動作' : 'Undo Action'} <Undo2 size={10} className="inline"/>:</strong> {isZh ? '操作錯誤？按下 Ctrl+Z 或工具列上的復原按鈕。' : 'Made a mistake? Press Ctrl+Z or click the Undo arrow in the top toolbar to revert your last action (Drag, Delete, Edit).'}
                          </li>
                          <li>
                            <strong className="text-zinc-700 dark:text-zinc-300">{isZh ? '備份與還原:' : 'Backup & Restore:'}</strong> {isZh ? '前往 設定 > 資料管理 匯出您的工作區。' : 'Go to Settings → Data Backup to export your entire workspace to a JSON file. Use this to move data between devices.'}
                          </li>
                      </ul>
                    </div>
                </section>
              </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-100 dark:hover:bg-white text-zinc-900 text-xs font-bold rounded-md transition-colors"
              >
                {t('settings_close', lang)}
              </button>
          </div>
        </div>
    </div>
  );
};
