import React from 'react';
import { useData } from '../contexts/DataContext';

export default function TodoListView() {
  const { events, updateEvent } = useData();

  const toggleTask = async (eventId: string, catIndex: number, taskId: string) => {
    const evt = events.find(e => e.id === eventId);
    if (!evt || !evt.categories) return;

    const newCats = [...evt.categories];
    const cat = newCats[catIndex];
    if (!cat.tasks) return;

    const taskIndex = cat.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    cat.tasks[taskIndex].completed = !cat.tasks[taskIndex].completed;
    await updateEvent(evt.id, { categories: newCats });
  };

  return (
    <div className="flex flex-col h-full gap-6 w-full">
      <header className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">✅ To-Do List (TdL)</h1>
          <p className="text-slate-400">Suivi des tâches par événement et par catégorie.</p>
        </div>
      </header>

      <div className="space-y-8">
        {events.length === 0 && (
          <p className="text-slate-500 italic text-center p-8 bg-white/5 rounded-2xl border border-white/10">
            Aucun événement pour le moment.
          </p>
        )}
        
        {events.map((evt) => {
          const hasTasks = evt.categories?.some(c => c.tasks && c.tasks.length > 0);
          if (!hasTasks) return null;

          return (
            <div key={evt.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
              <h2 className="text-2xl font-bold text-indigo-300 mb-6 flex items-center gap-2">
                {evt.priority && <span>⭐</span>}
                {evt.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(evt.categories || []).map((cat, ci) => {
                  if (!cat.tasks || cat.tasks.length === 0) return null;
                  
                  const completedCount = cat.tasks.filter(t => t.completed).length;
                  const progress = Math.round((completedCount / cat.tasks.length) * 100);

                  return (
                    <div key={ci} className="bg-black/20 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-center -mb-2">
                        <h3 className="text-lg font-bold text-slate-200">📁 {cat.name}</h3>
                        <span className={`text-xs font-mono px-2 py-1 rounded-md ${progress === 100 ? 'bg-teal-500/20 text-teal-300' : 'bg-white/10 text-slate-400'}`}>
                          {completedCount}/{cat.tasks.length} ({progress}%)
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-teal-500' : 'bg-indigo-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="space-y-2 mt-2">
                        {cat.tasks.map((task) => (
                          <div 
                            key={task.id}
                            className={`flex justify-between items-center bg-white/5 border p-3 rounded-xl transition-all cursor-pointer hover:bg-white/10 ${task.completed ? 'border-teal-500/30' : 'border-white/5'}`}
                            onClick={() => toggleTask(evt.id, ci, task.id)}
                          >
                            <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {task.title}
                            </span>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'border-slate-500'}`}>
                              {task.completed && <span>✓</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {events.every(evt => !evt.categories?.some(c => c.tasks && c.tasks.length > 0)) && events.length > 0 && (
          <p className="text-slate-500 italic text-center p-8 bg-white/5 rounded-2xl border border-white/10">
            Aucune tâche (TdL) n'a été ajoutée dans les catégories.
          </p>
        )}
      </div>
    </div>
  );
}
