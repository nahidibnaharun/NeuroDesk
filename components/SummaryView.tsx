import React from 'react';

interface SummaryViewProps {
  summary: string;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summary }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-1">
        <div className="prose prose-slate dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
          {summary.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => {
            if (paragraph.startsWith('###')) {
              return <h3 key={index} className="font-bold text-xl !mb-2 !mt-4">{paragraph.replace('###', '').trim()}</h3>
            }
            if (paragraph.startsWith('##')) {
              return <h2 key={index} className="font-bold text-2xl !mb-3 !mt-5">{paragraph.replace('##', '').trim()}</h2>
            }
             if (paragraph.startsWith('* ')) {
              return <li key={index} className="ml-4">{paragraph.replace('* ', '').trim()}</li>
            }
            return <p key={index}>{paragraph}</p>
          })}
        </div>
    </div>
  );
};