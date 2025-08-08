import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import * as pdfjs from 'pdfjs-dist';

// Set worker source for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;


interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, content: string) => void;
}

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;

    if (!title) {
        // Use filename as title if title is empty
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
            const pdf = await pdfjs.getDocument(typedArray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
            }
            setContent(fullText);
        };
        reader.readAsArrayBuffer(file);
    } else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
            setContent(e.target?.result as string);
        };
        reader.readAsText(file);
    } else {
        alert('Unsupported file type. Please upload a PDF or TXT file.');
    }
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [handleFile]);

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
          setIsDragging(true);
      } else if (e.type === "dragleave") {
          setIsDragging(false);
      }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onAdd(title.trim(), content.trim());
      setTitle('');
      setContent('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Study Material">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="material-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Title
          </label>
          <input
            type="text"
            id="material-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 5: Photosynthesis"
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition text-slate-900 dark:text-slate-100"
            required
          />
        </div>
        
        <div 
            onDrop={handleDrop}
            onDragEnter={handleDragEvents}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragEvents}
            className={`relative p-4 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-slate-300 dark:border-slate-600'}`}
        >
             <input type="file" id="file-upload" className="sr-only" onChange={handleFileChange} accept=".pdf,.txt" />
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">Upload a file</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">PDF or TXT</p>
            </label>
        </div>

        <div>
          <label htmlFor="material-content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Content
          </label>
          <textarea
            id="material-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your notes or upload a file..."
            className="w-full h-48 p-3 border rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-y border-slate-300 dark:border-slate-600"
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !content.trim()}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 disabled:bg-cyan-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Add Material
          </button>
        </div>
      </form>
    </Modal>
  );
};