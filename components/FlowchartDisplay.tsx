import React, { useState, useRef } from 'react';
import { FlowchartNode, FlowchartNodeType } from '../types';
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ZoomInIcon, ZoomOutIcon, RotateCwIcon } from './Icon';

const getNodeClasses = (type: FlowchartNodeType) => {
    let shapeClasses = '';
    let colorClasses = '';
    switch (type) {
        case FlowchartNodeType.Start:
            shapeClasses = 'rounded-full px-8 py-4';
            colorClasses = 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/50 dark:border-green-600 dark:text-green-200';
            break;
        case FlowchartNodeType.End:
            shapeClasses = 'rounded-full px-8 py-4';
            colorClasses = 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-200';
            break;
        case FlowchartNodeType.Process:
            shapeClasses = 'rounded-xl px-6 py-4';
            colorClasses = 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/50 dark:border-blue-600 dark:text-blue-200';
            break;
        case FlowchartNodeType.InputOutput:
            shapeClasses = 'transform -skew-x-12 px-8 py-4 rounded-lg';
            colorClasses = 'bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/50 dark:border-purple-600 dark:text-purple-200';
            break;
        case FlowchartNodeType.Decision:
            shapeClasses = 'transform rotate-45 w-40 h-40 flex items-center justify-center';
            colorClasses = 'bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/50 dark:border-amber-600 dark:text-amber-200';
            break;
        default:
            shapeClasses = 'rounded-xl px-6 py-4';
            colorClasses = 'bg-slate-100 border-slate-400 text-slate-800 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-200';
    }
    return { shapeClasses, colorClasses };
};

const FlowchartNodeComponent: React.FC<{ node: FlowchartNode }> = ({ node }) => {
    const { shapeClasses, colorClasses } = getNodeClasses(node.type);
    const baseClasses = "border-2 shadow-lg text-center text-sm font-semibold min-h-[60px] flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:scale-105 transform-gpu";
    
    const content = <div className={node.type === FlowchartNodeType.Decision ? 'transform -rotate-45' : ''}>{node.content}</div>;

    if (node.type === FlowchartNodeType.InputOutput) {
         return (
            <div className={`${baseClasses} ${colorClasses} ${shapeClasses}`}>
                <div className="transform skew-x-12">{content}</div>
            </div>
         );
    }
    
    return <div className={`${baseClasses} ${colorClasses} ${shapeClasses}`}>{content}</div>;
};


const FlowchartBranch: React.FC<{
    nodes: Map<string, FlowchartNode>;
    startNodeId: string;
    renderedNodeIds: Set<string>;
}> = ({ nodes, startNodeId, renderedNodeIds }) => {
    
    if (renderedNodeIds.has(startNodeId)) {
        return (
            <div className="flex flex-col items-center">
                 <div className="h-12 w-1 my-2 mx-auto relative">
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">
                        <ArrowUpIcon className="w-5 h-5 text-slate-400"/>
                    </div>
                </div>
                <div className="p-2 border-2 border-dashed border-slate-400 rounded-md text-xs text-slate-500 bg-white dark:bg-slate-800">
                    Connects to "{nodes.get(startNodeId)?.content}"
                </div>
            </div>
        );
    }
    
    const pathNodes: FlowchartNode[] = [];
    let currentNode = nodes.get(startNodeId);

    while (currentNode && !renderedNodeIds.has(currentNode.id)) {
        pathNodes.push(currentNode);
        renderedNodeIds.add(currentNode.id);
        if (currentNode.connections.length === 1) {
            const nextNodeId = currentNode.connections[0].targetId;
            if(renderedNodeIds.has(nextNodeId)) {
                currentNode = undefined;
            } else {
                currentNode = nodes.get(nextNodeId);
            }
        } else {
            currentNode = undefined;
        }
    }

    const lastNodeInPath = pathNodes[pathNodes.length - 1];

    return (
        <div className="flex flex-col items-center animate-fade-in-slide-up">
            {pathNodes.map((node) => (
                <React.Fragment key={node.id}>
                    <FlowchartNodeComponent node={node} />
                    {node.connections.length > 0 && node.type !== FlowchartNodeType.Decision && (
                         <div className="h-12 w-1 my-2 mx-auto flow-connector"></div>
                    )}
                </React.Fragment>
            ))}

            {lastNodeInPath && lastNodeInPath.type === FlowchartNodeType.Decision && (
                <>
                    <div className="h-12 w-1 my-2 mx-auto flow-connector"></div>
                    <div className="flex w-full justify-center">
                        <div className="w-1/2 h-1 flow-connector-horizontal"></div>
                        <div className="w-1/2 h-1 flow-connector-horizontal"></div>
                    </div>
                    <div className="flex w-full">
                        {lastNodeInPath.connections.map(conn => (
                            <div key={conn.targetId} className="w-1/2 flex flex-col items-center px-4">
                                <div className="h-6 w-1 flow-connector"></div>
                                <div className="text-xs font-bold text-slate-600 bg-slate-50 dark:bg-slate-800 px-2 -my-3 z-10">{conn.label}</div>
                                <FlowchartBranch
                                    nodes={nodes}
                                    startNodeId={conn.targetId}
                                    renderedNodeIds={renderedNodeIds}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
             {lastNodeInPath && lastNodeInPath.connections.length === 1 && nodes.has(lastNodeInPath.connections[0].targetId) && (
                 <FlowchartBranch
                    nodes={nodes}
                    startNodeId={lastNodeInPath.connections[0].targetId}
                    renderedNodeIds={renderedNodeIds}
                />
            )}
        </div>
    );
};

const FlowchartDisplay: React.FC<{ flowchartData: FlowchartNode[] }> = ({ flowchartData }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
    const viewportRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        setIsDragging(true);
        setStartDrag({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({ x: e.clientX - startDrag.x, y: e.clientY - startDrag.y });
    };

    const handleMouseUpOrLeave = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
        setScale(Math.max(0.2, Math.min(newScale, 3)));
    };

    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 3));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.2));
    const handlePan = (dx: number, dy: number) => setPosition(p => ({ x: p.x + dx, y: p.y + dy }));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    if (!flowchartData || flowchartData.length === 0) {
        return null;
    }

    const nodesMap = new Map<string, FlowchartNode>(flowchartData.map(node => [node.id, node]));
    const startNode = flowchartData.find(node => node.type === FlowchartNodeType.Start);

    if (!startNode) {
        return <p className="text-red-500">Error: No 'start' node found in flowchart data.</p>;
    }
    
    const renderedNodeIds = new Set<string>();

    return (
        <div
            ref={viewportRef}
            className={`relative w-full h-full overflow-hidden flowchart-bg rounded-lg ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onWheel={handleWheel}
        >
            <div
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
            >
                <div className="inline-block min-w-full p-8">
                    <FlowchartBranch nodes={nodesMap} startNodeId={startNode.id} renderedNodeIds={renderedNodeIds} />
                </div>
            </div>
            
            <div className="absolute bottom-4 right-4 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl rounded-lg p-1.5 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col">
                    <button title="Pan Up" onClick={() => handlePan(0, 50)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><ArrowUpIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
                    <button title="Pan Down" onClick={() => handlePan(0, -50)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><ArrowDownIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
                </div>
                 <div className="flex flex-col">
                    <button title="Pan Left" onClick={() => handlePan(50, 0)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><ArrowLeftIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
                    <button title="Pan Right" onClick={() => handlePan(-50, 0)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><ArrowRightIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <div className="flex flex-col">
                    <button title="Zoom In" onClick={handleZoomIn} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><ZoomInIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
                    <button title="Zoom Out" onClick={handleZoomOut} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><ZoomOutIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button title="Reset View" onClick={handleReset} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><RotateCwIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/></button>
            </div>
        </div>
    );
};
export default FlowchartDisplay;
