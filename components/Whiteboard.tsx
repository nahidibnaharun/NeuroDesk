import React, { useRef, useEffect, useState } from 'react';
import { NotebookIcon, EraserIcon, SaveIcon, ImageIcon, XIcon } from './Icon';
import { HistoryItem, DiagramItem } from '../types';
import HistoryPickerModal from './HistoryPickerModal';

interface WhiteboardProps {
  onSave: (item: DiagramItem) => void;
  history: HistoryItem[];
}

const Whiteboard: React.FC<WhiteboardProps> = ({ onSave, history }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0f172a'); // slate-900 (black)
  const [lineWidth, setLineWidth] = useState(5);
  const [isSaved, setIsSaved] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx && canvas.width > 0 && canvas.height > 0) {
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempCtx.drawImage(canvas, 0, 0);
        }

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
            context.lineCap = 'round';
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            contextRef.current = context;
            
            if (tempCtx) {
                context.drawImage(tempCanvas, 0, 0);
            }
        }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);
  
  useEffect(() => {
    if (contextRef.current) {
        contextRef.current.strokeStyle = color;
    }
  }, [color]);

  useEffect(() => {
    if (contextRef.current) {
        contextRef.current.lineWidth = lineWidth;
    }
  }, [lineWidth]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
      setIsSaved(false); // Drawing modifies the canvas
    }
  };

  const finishDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
      setIsDrawing(false);
    }
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    if (contextRef.current) {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    }
  };

  const clearCanvas = () => {
    if(canvasRef.current && contextRef.current) {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setIsSaved(false);
    }
  };

  const handleSave = () => {
    if (isSaved || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const imageUrl = canvas.toDataURL('image/png');
    
    const newItem: DiagramItem = {
      id: new Date().toISOString(),
      type: 'diagram',
      prompt: 'Whiteboard Drawing',
      imageUrl: imageUrl,
      timestamp: new Date().toLocaleString(),
    };

    onSave(newItem);
    setIsSaved(true);
  };
  
  const loadImageOnCanvas = (url: string) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
        // Clear canvas before drawing new image to avoid overlap
        context.clearRect(0, 0, canvas.width, canvas.height);
        // Draw image centered and scaled to fit
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;
        let drawWidth, drawHeight, dx, dy;

        if (canvasAspect > imgAspect) { // Canvas is wider than image
            drawHeight = canvas.height;
            drawWidth = imgAspect * drawHeight;
        } else { // Canvas is taller than image
            drawWidth = canvas.width;
            drawHeight = drawWidth / imgAspect;
        }
        dx = (canvas.width - drawWidth) / 2;
        dy = (canvas.height - drawHeight) / 2;

        context.drawImage(img, dx, dy, drawWidth, drawHeight);
        setIsSaved(false); // New image loaded, unsaved state
    };
  };

  const handleLoadFromHistory = (selectedItems: HistoryItem[]) => {
    if (selectedItems.length > 0) {
      const itemToLoad = selectedItems[0];
      if (itemToLoad.type === 'diagram') {
        loadImageOnCanvas(itemToLoad.imageUrl);
      }
    }
  };


  const setEraser = () => {
    setColor('#ffffff');
  };

  const colors = ['#0f172a', '#ef4444', '#3b82f6', '#22c55e', '#f97316', '#8b5cf6'];

  return (
    <div ref={containerRef} className="bg-white rounded-xl shadow-lg h-full w-full relative overflow-hidden border-2 border-slate-200">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-xl rounded-full p-2 flex items-center gap-x-4 gap-y-2 flex-wrap justify-center border">
            <div className="flex items-center gap-2 px-2">
                {colors.map((c) => (
                    <button key={c} style={{ backgroundColor: c }} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-indigo-500 scale-125' : 'border-white hover:scale-110'}`}/>
                ))}
            </div>
            <div className="flex items-center gap-3 bg-slate-200/70 px-3 py-1 rounded-full">
                <button type="button" onClick={setEraser} aria-label="Use eraser" className="p-1 rounded-md hover:bg-slate-300">
                    <EraserIcon className="w-6 h-6 text-slate-600" />
                </button>
                <input type="range" min="2" max="50" value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} className="w-24 cursor-pointer"/>
                <span className="text-sm font-mono w-6 text-right text-slate-600">{lineWidth}</span>
            </div>
             <div className="flex items-center gap-x-2">
                <button onClick={() => setIsPickerOpen(true)} title="Load from History" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors">
                    <ImageIcon className="w-5 h-5"/> Load
                </button>
                <button onClick={handleSave} disabled={isSaved} title="Save to History" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <SaveIcon className="w-5 h-5"/> {isSaved ? 'Saved' : 'Save'}
                </button>
            </div>
            <button onClick={clearCanvas} className="text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-full mr-1">
                Clear
            </button>
        </div>
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onMouseLeave={finishDrawing}
            className="cursor-crosshair w-full h-full"
        />

        <HistoryPickerModal
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            onConfirmSelection={handleLoadFromHistory}
            history={history}
            selectionMode="single"
            filterByType="diagram"
            confirmButtonText="Load Image"
        />
    </div>
  );
};

export default Whiteboard;
