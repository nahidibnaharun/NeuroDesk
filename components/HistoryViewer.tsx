import React, { useState, useMemo, useRef } from 'react';
import { HistoryItem, QuizHistoryItem, SummaryItem, DiagramItem, QuestionType, OpenEnded, Question, LabReportItem, CodeExplanationItem, RoadmapItem, CodeFlowchartItem, ChatHistoryItem, ChatMessage, RoadmapNode, NodeStatus, FlowchartNode, FlowchartNodeType, AudioSummaryItem } from '../types';
import { CheckCircleIcon, XCircleIcon, FileTextIcon, NeuronIcon, LightbulbIcon, BookOpenIcon, FlaskConicalIcon, CodeIcon, RouteIcon, SitemapIcon, HistoryIcon, AiTeacherIcon, SparklesIcon, TrashIcon, CheckSquareIcon, DownloadIcon, UploadIcon, Volume2Icon } from './Icon';
import { CONFIDENCE_LEVELS } from '../constants';
import { simpleMarkdownToHtml } from '../utils/formatters';
import FlowchartDisplay from './FlowchartDisplay';

interface HistoryViewerProps {
  history: HistoryItem[];
  clearHistory: () => void;
  deleteItems: (ids: string[]) => void;
  onContinueChat: (item: ChatHistoryItem) => void;
  onContinueRoadmap: (item: RoadmapItem) => void;
  onDownloadHistory: () => void;
  onUploadHistory: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SourceContent: React.FC<{content: string}> = ({ content }) => (
    <details className="mt-3">
        <summary className="cursor-pointer text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center">
            <BookOpenIcon className="w-4 h-4 mr-2"/>
            View Source Material
        </summary>
        <div className="mt-2 p-3 bg-slate-100 rounded-md text-xs text-slate-600 max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans">{content}</pre>
        </div>
    </details>
);

const SourceCode: React.FC<{code: string}> = ({ code }) => (
    <details className="mt-3">
        <summary className="cursor-pointer text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center">
            <CodeIcon className="w-4 h-4 mr-2"/>
            View Source Code
        </summary>
        <div className="mt-2 p-3 bg-slate-900 text-slate-100 font-mono rounded-md text-xs max-h-48 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{code || 'No code provided.'}</pre>
        </div>
    </details>
);

interface CardProps {
    isSelectionMode: boolean;
    isSelected: boolean;
    isDeleting: boolean;
    onToggleSelect: (id: string) => void;
}

const HistoryCardWrapper: React.FC<React.PropsWithChildren<{item: HistoryItem} & CardProps>> = ({
    item, isSelectionMode, isSelected, isDeleting, onToggleSelect, children
}) => {
    const handleClick = () => {
        if (isSelectionMode) {
            onToggleSelect(item.id);
        }
    };
    
    const wrapperClass = `
        bg-white rounded-lg border transition-all duration-300 relative
        ${isDeleting ? 'animate-fade-out-shrink' : 'animate-fade-in-slide-up'}
        ${isSelectionMode ? 'cursor-pointer' : 'history-card-hover'}
        ${isSelected ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200'}
    `;

    return (
        <div className={wrapperClass} onClick={handleClick}>
             {isSelectionMode && (
                <div className="absolute top-3 right-3 z-10 p-1 bg-white/70 rounded-full">
                    {isSelected ? (
                        <CheckSquareIcon className="w-5 h-5 text-indigo-600" />
                    ) : (
                        <div className="w-5 h-5 border-2 border-slate-400 rounded-md"></div>
                    )}
                </div>
            )}
            <div className={`p-4 ${isSelectionMode ? 'opacity-80' : ''}`}>
                {children}
            </div>
        </div>
    );
};


const ChatHistoryCard = React.memo< { item: ChatHistoryItem; onContinueChat: (item: ChatHistoryItem) => void } & CardProps>(({ item, onContinueChat, ...props }) => (
  <HistoryCardWrapper item={item} {...props}>
    <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <AiTeacherIcon mood="neutral" className="w-8 h-8 mr-3 flex-shrink-0"/>
          <div>
            <h3 className="font-bold text-lg text-slate-700">{item.modeTitle ? `Chat: ${item.modeTitle}` : 'AI Teacher Chat'}</h3>
            <span className="text-sm text-slate-500">{item.timestamp}</span>
          </div>
        </div>
        {!props.isSelectionMode &&
            <button
              onClick={(e) => { e.stopPropagation(); onContinueChat(item); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full hover:bg-indigo-200 transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              Continue
            </button>
        }
    </div>
    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto p-2 border-t border-slate-200">
      {item.messages.slice(0, 4).map((message, index) => (
        <div key={index} className={`flex items-start gap-2 text-sm ${message.role === 'user' ? 'justify-end' : ''}`}>
          {message.role === 'model' && <AiTeacherIcon mood="neutral" className="w-5 h-5 flex-shrink-0" />}
          <div className={`rounded-lg px-3 py-1 ${message.role === 'model' ? 'bg-slate-100 text-slate-800' : 'bg-indigo-500 text-white'}`}>
            <p className="truncate max-w-md">{message.content}</p>
          </div>
        </div>
      ))}
      {item.messages.length > 4 && <p className="text-center text-xs text-slate-400">...</p>}
    </div>
  </HistoryCardWrapper>
));


const QuizHistoryCard = React.memo<{ item: QuizHistoryItem } & CardProps>(({ item, ...props }) => {
  return (
    <HistoryCardWrapper item={item} {...props}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-slate-700">Quiz: {item.result.mode} Mode</h3>
        <span className="text-sm text-slate-500">{item.timestamp}</span>
      </div>
      <div className="text-center bg-indigo-50 p-3 rounded-md mb-4">
        <span className="text-2xl font-bold text-indigo-700">{item.result.score}</span>
        <span className="text-slate-600"> / {item.result.total} Correct</span>
      </div>
      <details onClick={e => props.isSelectionMode && e.preventDefault()}>
        <summary className="cursor-pointer text-indigo-600 font-medium">Review Answers</summary>
        <div className="mt-3 space-y-3">
          {item.result.questions.map((q, i) => {
            const userAnswer = item.result.userAnswers[i];
            const confidence = item.result.confidenceLevels?.[i];
            const feedback = item.result.feedback?.[i];
            const isCorrect = feedback ? feedback.isCorrect : (q.type !== QuestionType.OpenEnded && userAnswer === (q as Exclude<Question, OpenEnded>).answer);
            
            return (
              <div key={i} className={`p-3 rounded border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className="font-semibold text-slate-800">{i+1}. {q.question}</p>
                <div className="text-sm mt-2">
                  <div className="flex justify-between items-start">
                    <div className={`flex items-start ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {isCorrect ? <CheckCircleIcon className="inline w-4 h-4 mr-2 mt-0.5 flex-shrink-0"/> : <XCircleIcon className="inline w-4 h-4 mr-2 mt-0.5 flex-shrink-0"/>}
                      <div>Your answer: <pre className="font-sans inline-block font-bold whitespace-pre-wrap">{String(userAnswer)}</pre></div>
                    </div>
                    {confidence && (
                      <div className="text-xs font-medium text-slate-500 bg-white/60 px-2 py-1 rounded-full">
                        Confidence: {CONFIDENCE_LEVELS[confidence]}
                      </div>
                    )}
                  </div>
                  {!isCorrect && q.type !== QuestionType.OpenEnded && (
                    <div className="text-slate-600 mt-1 ml-6">Correct answer: <span className="font-bold">{String((q as Exclude<Question, OpenEnded>).answer)}</span></div>
                  )}
                  {feedback && q.explanation && (
                     <div className="mt-2 pt-2 border-t border-current/20 text-slate-600">
                        <p className="flex items-start"><LightbulbIcon className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" /> <span>{q.explanation}</span></p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </details>
      <SourceContent content={item.sourceContent} />
    </HistoryCardWrapper>
  );
});

const SummaryHistoryCard = React.memo<{ item: SummaryItem } & CardProps>(({ item, ...props }) => (
  <HistoryCardWrapper item={item} {...props}>
    <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-slate-700 flex items-center"><FileTextIcon className="w-5 h-5 mr-2"/>Summary</h3>
        <span className="text-sm text-slate-500">{item.timestamp}</span>
    </div>
    <details onClick={e => props.isSelectionMode && e.preventDefault()}>
        <summary className="cursor-pointer text-indigo-600 font-medium">View Summary</summary>
        <div className="mt-3 prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(item.content) }} />
    </details>
    <SourceContent content={item.sourceContent} />
  </HistoryCardWrapper>
));

const DiagramHistoryCard = React.memo<{ item: DiagramItem } & CardProps>(({ item, ...props }) => (
  <HistoryCardWrapper item={item} {...props}>
    <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-slate-700 flex items-center"><NeuronIcon className="w-5 h-5 mr-2"/>Diagram</h3>
        <span className="text-sm text-slate-500">{item.timestamp}</span>
    </div>
    <details onClick={e => props.isSelectionMode && e.preventDefault()}>
        <summary className="cursor-pointer text-indigo-600 font-medium">View Diagram</summary>
        <p className="text-sm text-slate-500 mt-2">Prompt: "{item.prompt}"</p>
        <img src={item.imageUrl} alt={item.prompt} className="mt-2 rounded-md border border-slate-200 bg-white"/>
    </details>
  </HistoryCardWrapper>
));

const LabReportHistoryCard = React.memo<{ item: LabReportItem } & CardProps>(({ item, ...props }) => (
  <HistoryCardWrapper item={item} {...props}>
    <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-slate-700 flex items-center"><FlaskConicalIcon className="w-5 h-5 mr-2"/>Lab Report</h3>
        <span className="text-sm text-slate-500">{item.timestamp}</span>
    </div>
    <details onClick={e => props.isSelectionMode && e.preventDefault()}>
        <summary className="cursor-pointer text-indigo-600 font-medium">View Report</summary>
        <div className="mt-3 prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(item.content) }} />
    </details>
     <details className="mt-3" onClick={e => props.isSelectionMode && e.preventDefault()}>
        <summary className="cursor-pointer text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center">
            <CodeIcon className="w-4 h-4 mr-2"/>
            View Source Code & Results
        </summary>
        <div className="mt-2 p-3 bg-slate-100 rounded-md text-xs text-slate-600 max-h-48 overflow-y-auto space-y-4">
            <div>
                <h4 className="font-bold mb-1 text-slate-800">Source Code</h4>
                <pre className="whitespace-pre-wrap font-mono bg-slate-900 text-slate-100 p-2 rounded-md">{item.sourceCode || 'No code provided.'}</pre>
            </div>
            <div>
                <h4 className="font-bold mb-1 text-slate-800">Source Results</h4>
                <pre className="whitespace-pre-wrap font-sans">{item.sourceResults || 'No results provided.'}</pre>
            </div>
        </div>
    </details>
  </HistoryCardWrapper>
));

const CodeExplanationHistoryCard = React.memo<{ item: CodeExplanationItem } & CardProps>(({ item, ...props }) => (
  <HistoryCardWrapper item={item} {...props}>
    <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-slate-700 flex items-center"><CodeIcon className="w-5 h-5 mr-2"/>Code Explanation</h3>
        <span className="text-sm text-slate-500">{item.timestamp}</span>
    </div>
    <details onClick={e => props.isSelectionMode && e.preventDefault()}>
        <summary className="cursor-pointer text-indigo-600 font-medium">View Explanation</summary>
        <div className="mt-3 prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(item.content) }} />
    </details>
    <SourceCode code={item.sourceCode} />
  </HistoryCardWrapper>
));

const calculateProgress = (nodes: RoadmapNode[]): { completed: number, total: number } => {
    let completed = 0;
    let total = 0;
    
    const traverse = (node: RoadmapNode) => {
        total++;
        if (node.status === NodeStatus.Completed) {
            completed++;
        }
        if (node.subNodes && node.subNodes.length > 0) {
            node.subNodes.forEach(traverse);
        }
    };

    nodes.forEach(traverse);
    return { completed, total };
};


const RoadmapHistoryCard = React.memo<{ item: RoadmapItem, onContinueRoadmap: (item: RoadmapItem) => void } & CardProps>(({ item, onContinueRoadmap, ...props }) => {
    const { completed, total } = useMemo(() => calculateProgress(item.nodes), [item.nodes]);
    const progressPercent = total > 0 ? (completed / total) * 100 : 0;

    const getRoadmapTitle = () => {
        if (item.sourceContent) {
            const firstLine = item.sourceContent.split('\n')[0];
            return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
        }
        return item.nodes[0]?.title || 'Untitled Roadmap';
    }

    return (
        <HistoryCardWrapper item={item} {...props}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                    <RouteIcon className="w-6 h-6 mr-3 flex-shrink-0 text-indigo-500" />
                    <div>
                        <h3 className="font-bold text-lg text-slate-700">Roadmap: {getRoadmapTitle()}</h3>
                        <span className="text-sm text-slate-500">{item.timestamp}</span>
                    </div>
                </div>
                {!props.isSelectionMode &&
                    <button
                        onClick={(e) => { e.stopPropagation(); onContinueRoadmap(item); }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full hover:bg-indigo-200 transition-colors"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        Continue
                    </button>
                }
            </div>
             <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-600">Progress</span>
                    <span className="text-sm font-bold text-indigo-600">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${progressPercent}%`, transition: 'width 0.5s ease-in-out' }}></div>
                </div>
                <p className="text-xs text-slate-500 text-right mt-1">{completed} of {total} tasks completed</p>
            </div>
            <SourceContent content={item.sourceContent} />
        </HistoryCardWrapper>
    );
});


const CodeFlowchartHistoryCard = React.memo<{ item: CodeFlowchartItem } & CardProps>(({ item, ...props }) => (
    <HistoryCardWrapper item={item} {...props}>
      <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg text-slate-700 flex items-center"><SitemapIcon className="w-5 h-5 mr-2"/>Code Flowchart</h3>
          <span className="text-sm text-slate-500">{item.timestamp}</span>
      </div>
      <details onClick={e => props.isSelectionMode && e.preventDefault()}>
          <summary className="cursor-pointer text-indigo-600 font-medium">View Flowchart</summary>
          <div className="mt-2 rounded-md border border-slate-200 bg-white dark:bg-slate-900 min-h-[400px]">
            <FlowchartDisplay flowchartData={item.flowchartData} />
          </div>
      </details>
      <SourceCode code={item.sourceCode} />
    </HistoryCardWrapper>
));

const AudioSummaryHistoryCard = React.memo<{ item: AudioSummaryItem } & CardProps>(({ item, ...props }) => (
  <HistoryCardWrapper item={item} {...props}>
    <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-slate-700 flex items-center"><Volume2Icon className="w-5 h-5 mr-2"/>Audio Summary</h3>
        <span className="text-sm text-slate-500">{item.timestamp}</span>
    </div>
    <details onClick={e => props.isSelectionMode && e.preventDefault()}>
        <summary className="cursor-pointer text-indigo-600 font-medium">View Summary Text</summary>
        <div className="mt-3 prose prose-sm max-w-none text-slate-700">
            <p>{item.content}</p>
        </div>
    </details>
    <SourceContent content={item.sourceContent} />
  </HistoryCardWrapper>
));


const HistoryViewer: React.FC<HistoryViewerProps> = ({ history, clearHistory, deleteItems, onContinueChat, onContinueRoadmap, onDownloadHistory, onUploadHistory }) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  
  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };
  
  const handleToggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      setSelectedItems(new Set()); // Reset selection on mode toggle
  };

  const handleDeleteSelected = () => {
      if (selectedItems.size === 0) return;
      if (window.confirm(`Are you sure you want to delete ${selectedItems.size} item(s)? This cannot be undone.`)) {
          setDeletingItems(new Set(selectedItems));
          setTimeout(() => {
              deleteItems(Array.from(selectedItems));
              setIsSelectionMode(false);
              setSelectedItems(new Set());
              setDeletingItems(new Set());
          }, 400); // match animation duration
      }
  };

  if (history.length === 0) {
    return (
      <div className="text-center p-8 mt-16 animate-fade-in-slide-up">
        <HistoryIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Your History is Empty</h2>
        <p className="text-slate-500 mt-2">Create quizzes, summaries, and other content. They'll show up here for you to review later.</p>
        <div className="mt-6">
            <label htmlFor="history-upload" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors cursor-pointer">
                <UploadIcon className="w-4 h-4"/> Upload History
            </label>
            <input id="history-upload" type="file" className="hidden" accept=".json" onChange={onUploadHistory} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Your Study History</h1>
        <div className="flex items-center gap-2 flex-wrap">
            {isSelectionMode ? (
                <>
                    <button onClick={handleDeleteSelected} disabled={selectedItems.size === 0} className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                        <TrashIcon className="w-4 h-4"/> Delete ({selectedItems.size})
                    </button>
                    <button onClick={handleToggleSelectionMode} className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-full">
                        Cancel
                    </button>
                </>
            ) : (
                <>
                    <button onClick={handleToggleSelectionMode} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 px-3 py-1.5 rounded-full">
                        Select Items
                    </button>
                    <button onClick={onDownloadHistory} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-full">
                        <DownloadIcon className="w-4 h-4"/> Download
                    </button>
                    <label htmlFor="history-upload" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-full cursor-pointer">
                        <UploadIcon className="w-4 h-4"/> Upload
                    </label>
                    <input id="history-upload" type="file" className="hidden" accept=".json" onChange={onUploadHistory} />
                    <button onClick={clearHistory} className="text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-full">
                        Clear All
                    </button>
                </>
            )}
        </div>
      </div>
      <div className="space-y-4 flex flex-col-reverse">
        {history.map(item => {
          const commonCardProps = {
              isSelectionMode,
              isSelected: selectedItems.has(item.id),
              isDeleting: deletingItems.has(item.id),
              onToggleSelect: toggleSelectItem
          };
          switch (item.type) {
            case 'quiz':
              return <QuizHistoryCard key={item.id} item={item} {...commonCardProps} />;
            case 'summary':
              return <SummaryHistoryCard key={item.id} item={item} {...commonCardProps} />;
            case 'diagram':
              return <DiagramHistoryCard key={item.id} item={item} {...commonCardProps} />;
            case 'labReport':
              return <LabReportHistoryCard key={item.id} item={item} {...commonCardProps} />;
            case 'codeExplanation':
                return <CodeExplanationHistoryCard key={item.id} item={item} {...commonCardProps} />;
            case 'roadmap':
                return <RoadmapHistoryCard key={item.id} item={item} onContinueRoadmap={onContinueRoadmap} {...commonCardProps} />;
            case 'codeFlowchart':
                return <CodeFlowchartHistoryCard key={item.id} item={item} {...commonCardProps} />;
            case 'chat':
                return <ChatHistoryCard key={item.id} item={item} onContinueChat={onContinueChat} {...commonCardProps} />;
            case 'audioSummary':
                return <AudioSummaryHistoryCard key={item.id} item={item} {...commonCardProps} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

export default React.memo(HistoryViewer);