import React, { useState } from 'react';
import type { StudyMaterial } from '../types';
import { AddMaterialModal } from './AddMaterialModal';

interface StudyMaterialsViewProps {
  materials: StudyMaterial[];
  setMaterials: React.Dispatch<React.SetStateAction<StudyMaterial[]>>;
  activeMaterialId: string | null;
  setActiveMaterialId: (id: string | null) => void;
  onGenerate: (type: 'summary' | 'quiz' | 'tutor' | 'diagram') => void;
}

const MaterialCard: React.FC<{
    material: StudyMaterial;
    isActive: boolean;
    onSelect: () => void;
    onGenerate: (type: 'summary' | 'quiz' | 'tutor' | 'diagram') => void;
    onDelete: () => void;
}> = ({ material, isActive, onSelect, onGenerate, onDelete }) => {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 transition-all duration-300 ${isActive ? 'border-cyan-500 shadow-cyan-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{material.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Added on {new Date(material.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={onDelete} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full -mr-1 -mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-4 h-20 overflow-hidden text-ellipsis text-sm leading-relaxed">{material.content}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
                 <button onClick={onSelect} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isActive ? 'bg-cyan-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                    {isActive ? 'Active' : 'Set Active'}
                </button>
                {isActive && (
                    <div className="flex items-center gap-1 sm:gap-2">
                       <button onClick={() => onGenerate('summary')} className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" title="Summarize"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
                       <button onClick={() => onGenerate('quiz')} className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" title="Create Quiz"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M17 5H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><path d="M7 17v-2"/><path d="M17 17v-2"/></svg></button>
                       <button onClick={() => onGenerate('diagram')} className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" title="Generate Diagram"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></button>
                       <button onClick={() => onGenerate('tutor')} className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" title="Ask Tutor"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const StudyMaterialsView: React.FC<StudyMaterialsViewProps> = ({ materials, setMaterials, activeMaterialId, setActiveMaterialId, onGenerate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddMaterial = (title: string, content: string) => {
        const newMaterial: StudyMaterial = {
            id: Date.now().toString(),
            title,
            content,
            createdAt: new Date().toISOString()
        };
        const updatedMaterials = [newMaterial, ...materials];
        setMaterials(updatedMaterials);
        setActiveMaterialId(newMaterial.id); // auto-activate new material
    };
    
    const handleDeleteMaterial = (idToDelete: string) => {
      setMaterials(materials.filter(m => m.id !== idToDelete));
      if (activeMaterialId === idToDelete) {
        const newActive = materials.length > 1 ? materials.find(m => m.id !== idToDelete)?.id : null;
        setActiveMaterialId(newActive || null);
      }
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white">Study Materials</h1>
                    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-1">Manage your notes and documents here.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors shadow-md transform hover:-translate-y-0.5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Add New</span>
                </button>
            </header>
            
            {materials.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <h3 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">No Materials Yet</h3>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">Click "Add New" to upload your first document.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {materials.map(material => (
                        <MaterialCard 
                            key={material.id}
                            material={material}
                            isActive={material.id === activeMaterialId}
                            onSelect={() => setActiveMaterialId(material.id)}
                            onGenerate={onGenerate}
                            onDelete={() => handleDeleteMaterial(material.id)}
                        />
                    ))}
                </div>
            )}

            <AddMaterialModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddMaterial}
            />
        </div>
    );
};