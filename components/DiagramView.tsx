import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

interface DiagramViewProps {
  diagramCode: string;
  theme: string;
}

export const DiagramView: React.FC<DiagramViewProps> = ({ diagramCode, theme }) => {
    const [svg, setSvg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        mermaid.initialize({
            startOnLoad: false,
            theme: isDark ? 'dark' : 'default',
            fontFamily: 'Inter, sans-serif',
            securityLevel: 'loose',
        });
        
        const renderDiagram = async () => {
            try {
                // Ensure unique ID for each render
                const id = `mermaid-diagram-${Date.now()}`;
                const { svg } = await mermaid.render(id, diagramCode);
                setSvg(svg);
                setError('');
            } catch (e: any) {
                console.error("Mermaid rendering error:", e);
                setError(e.message || "Failed to render diagram.");
                setSvg('');
            }
        };

        if (diagramCode) {
            renderDiagram();
        }
    }, [diagramCode, theme]);
    
    if (error) {
        return <div className="p-4 text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg">{error}</div>;
    }

    return (
        <div 
            className="w-full flex justify-center items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg" 
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
    );
};