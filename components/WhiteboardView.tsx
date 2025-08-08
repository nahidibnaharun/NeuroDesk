import React, { useRef, useEffect, useState } from 'react';

const colors = ['#1e293b', '#ef4444', '#3b82f6', '#22c55e', '#ffffff']; // slate-800, red, blue, green, white

export const WhiteboardView: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState(colors[0]);
    const [brushSize, setBrushSize] = useState(5);

    const getContext = () => canvasRef.current?.getContext('2d');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const setCanvasDimensions = () => {
            const parent = canvas.parentElement;
            const ctx = getContext();
            if (parent && ctx) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                // Reset background and drawing properties
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        };

        setCanvasDimensions();

        const parentEl = canvas.parentElement;
        if (!parentEl) return;

        const resizeObserver = new ResizeObserver(setCanvasDimensions);
        resizeObserver.observe(parentEl);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);


    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ctx = getContext();
        if (!ctx) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const ctx = getContext();
        if (!ctx) return;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = getContext();
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
    };
    
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = getContext();
        if (!ctx) return;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 md:p-8">
            <header className="mb-4">
                 <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white">Whiteboard</h1>
                 <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-1">Jot down notes, draw diagrams, or let your creativity flow.</p>
            </header>
             <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Color:</span>
                    <div className="flex items-center gap-2">
                    {colors.map(c => (
                        <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-cyan-500' : ''}`} style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #ccc' : 'none' }} />
                    ))}
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Size:</span>
                    <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-24 cursor-pointer" />
                </div>
                 <button onClick={clearCanvas} className="ml-auto px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 text-sm transition-colors">
                    Clear All
                 </button>
            </div>
            <div className="flex-grow bg-white rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700 overflow-hidden">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="cursor-crosshair"
                />
            </div>
        </div>
    );
};