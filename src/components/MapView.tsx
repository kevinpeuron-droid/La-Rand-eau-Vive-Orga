import React, { useState } from 'react';

export default function MapView() {
  const [mapUrl, setMapUrl] = useState(() => localStorage.getItem('mymap_url') || '');

  const saveUrl = () => {
    localStorage.setItem('mymap_url', mapUrl);
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          🗺️ Carte (MyMaps)
        </h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <label className="block text-sm font-semibold text-slate-300 mb-2">Lien d'intégration vers MyMaps (ou URL de la carte)</label>
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={mapUrl}
            onChange={e => setMapUrl(e.target.value)}
            placeholder="https://www.google.com/maps/d/u/0/embed?mid=..." 
            className="flex-1 p-3 border border-white/10 rounded-xl bg-black/20 text-white focus:border-indigo-500 outline-none transition-colors"
          />
          <button onClick={saveUrl} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            Enregistrer
          </button>
        </div>
        
        {mapUrl ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/50 shadow-inner">
            {mapUrl.includes('google.com/maps/d/') || mapUrl.includes('embed') ? (
               <iframe 
                 src={mapUrl.replace('/viewer?', '/embed?').replace('/edit?', '/embed?')} 
                 width="100%" 
                 height="100%" 
                 className="border-0"
               ></iframe>
            ) : (
               <div className="flex items-center justify-center w-full h-full text-slate-400 flex-col gap-4">
                  <p>Lien vers la carte :</p>
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline">{mapUrl}</a>
               </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-[21/9] rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-black/20">
            <span className="text-4xl mb-4">🗺️</span>
            <p className="max-w-md">Saisissez le lien d'intégration de votre carte Google MyMaps ci-dessus pour l'afficher ici.</p>
          </div>
        )}
      </div>
    </div>
  );
}
