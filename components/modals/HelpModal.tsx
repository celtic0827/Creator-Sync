
import React from 'react';
import { X, BookOpen, Layers, Calendar, ListTodo, Archive, Trash2, ShieldCheck, AlertTriangle, Undo2, Edit2, Settings } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl max-h-[85vh] rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-5 bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Creator Sync Guide</h2>
                    <p className="text-xs text-zinc-500">Mastering your production pipeline</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                
                {/* Section 1: Concept */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Layers size={14} className="text-indigo-500" /> Core Workflow
                    </h3>
                    <div className="prose prose-sm prose-invert text-zinc-400 text-xs leading-relaxed space-y-2">
                      <p>
                          Creator Sync connects your <strong>Project Pipeline</strong> (Sidebar) with your <strong>Release Schedule</strong> (Calendar).
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong className="text-zinc-300">Left Sidebar:</strong> Your backlog. Create projects here. They move through <em>Planning</em> → <em>In Progress</em> → <em>Completed</em>.
                          </li>
                          <li>
                            <strong className="text-zinc-300">Calendar:</strong> Your release dates. Drag projects from the sidebar onto a date to schedule them.
                          </li>
                          <li>
                            <strong className="text-zinc-300">Drag & Drop:</strong> Everything is movable. Drag sidebar items to change status. Drag calendar items to reschedule.
                          </li>
                      </ul>
                    </div>
                </section>

                {/* Section 2: Scheduling */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-500" /> Scheduling & Navigation
                    </h3>
                    <div className="prose prose-sm prose-invert text-zinc-400 text-xs leading-relaxed space-y-2">
                      <p>
                          Once a project is on the calendar, it is considered "Scheduled".
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <span className="text-zinc-300">Jump to Date:</span> Click the small date button on a sidebar card to jump to its month in the calendar.
                          </li>
                          <li>
                            <span className="text-zinc-300">Locate Project:</span> Click any item on the calendar grid to auto-scroll the sidebar to the original project card.
                          </li>
                          <li>
                            <span className="text-zinc-300">Remove Schedule:</span> Hover over a calendar item and click the <X size={10} className="inline" /> button, or drag it to the Trash at the top. This removes the date but keeps the project.
                          </li>
                      </ul>
                    </div>
                </section>

                {/* Section 3: Statuses */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <ListTodo size={14} className="text-amber-500" /> Project Statuses
                    </h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                          <div className="w-16 shrink-0 text-[10px] font-bold text-zinc-500 text-right mt-0.5">PLANNING</div>
                          <p className="text-xs text-zinc-400">Ideas, concepts, and drafts. Not yet in full production.</p>
                      </div>
                      <div className="flex gap-3">
                          <div className="w-16 shrink-0 text-[10px] font-bold text-zinc-300 text-right mt-0.5">IN PROGRESS</div>
                          <p className="text-xs text-zinc-400">Active work. Most of your daily focus should be here.</p>
                      </div>
                      <div className="flex gap-3">
                          <div className="w-16 shrink-0 text-[10px] font-bold text-emerald-500 text-right mt-0.5">COMPLETED</div>
                          <p className="text-xs text-zinc-400">Production finished, ready for release. Waiting to be scheduled.</p>
                      </div>
                      <div className="flex gap-3">
                          <div className="w-16 shrink-0 text-[10px] font-bold text-zinc-600 text-right mt-0.5">PAUSED</div>
                          <p className="text-xs text-zinc-400">On hold indefinitely.</p>
                      </div>
                    </div>
                </section>

                {/* Section 4: Archiving */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Archive size={14} className="text-violet-500" /> Published vs. Archive
                    </h3>
                    <div className="prose prose-sm prose-invert text-zinc-400 text-xs leading-relaxed space-y-2">
                      <p>
                          To keep your Pipeline clean, use the tabs at the top of the sidebar.
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong className="text-zinc-300">Pipeline Tab:</strong> Shows active and upcoming work.
                          </li>
                          <li>
                            <strong className="text-zinc-300">Published Tab:</strong> Automatically holds projects that were scheduled in the past.
                          </li>
                          <li>
                            <strong className="text-zinc-300">Archive Button <Archive size={10} className="inline text-zinc-500" />:</strong> On any card, click the archive box icon to manually force a project into the Published tab (e.g., if you cancelled it or finished it without scheduling).
                          </li>
                      </ul>
                    </div>
                </section>

                {/* Section 5: Deletion */}
                <section className="space-y-3 border-t border-zinc-800 pt-6 mt-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Trash2 size={14} className="text-red-500" /> Trash & Deletion
                    </h3>
                    <div className="flex items-start gap-4 bg-red-950/10 border border-red-900/20 p-4 rounded-lg">
                      <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-zinc-400 space-y-1">
                          <p><strong className="text-red-300">Dragging to Trash:</strong> Dragging a <em>Calendar Item</em> to the top trash bin removes the date. Dragging a <em>Sidebar Project</em> to the trash bin deletes the project entirely.</p>
                          <p>You can also delete projects via the <Edit2 size={10} className="inline" /> Edit menu.</p>
                      </div>
                    </div>
                </section>

                {/* Section 6: Data & Safety */}
                <section className="space-y-3 border-t border-zinc-800 pt-6 mt-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} className="text-blue-500" /> Data & Safety
                    </h3>
                    <div className="prose prose-sm prose-invert text-zinc-400 text-xs leading-relaxed space-y-2">
                      <ul className="list-disc pl-4 space-y-1">
                          <li>
                            <strong className="text-zinc-300">Undo Action <Undo2 size={10} className="inline"/>:</strong> Made a mistake? Press <code>Ctrl+Z</code> or click the Undo arrow in the top toolbar to revert your last action (Drag, Delete, Edit).
                          </li>
                          <li>
                            <strong className="text-zinc-300">Backup & Restore:</strong> Go to <em>Settings <Settings size={10} className="inline"/></em> → <em>Data Backup</em> to export your entire workspace to a JSON file. Use this to move data between devices.
                          </li>
                      </ul>
                    </div>
                </section>
              </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-bold rounded-md transition-colors"
              >
                Got it
              </button>
          </div>
        </div>
    </div>
  );
};
