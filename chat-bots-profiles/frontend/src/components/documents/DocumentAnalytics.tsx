import React, { useState } from 'react';
import { DocumentAnalysis } from '../../pages/DocumentsPage';

interface DocumentAnalyticsProps {
  analysis: DocumentAnalysis;
}

const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({ analysis }) => {
  const [showFullSummary, setShowFullSummary] = useState(false);
  
  // Calculate reading difficulty based on word count and sentence structure
  const getReadingLevel = () => {
    const wordCount = analysis.word_count;
    if (wordCount < 200) return { level: 'Basic', color: 'green' };
    if (wordCount < 500) return { level: 'Intermediate', color: 'blue' };
    if (wordCount < 1000) return { level: 'Advanced', color: 'purple' };
    return { level: 'Expert', color: 'red' };
  };
  
  const readingLevel = getReadingLevel();
  
  // Format the time to be more readable
  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
  };
  
  // Truncate summary for initial display
  const truncateSummary = (text: string, maxLength: number = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  
  // Random color for key phrases (deterministic based on the phrase)
  const getPhraseColor = (phrase: string) => {
    const colors = [
      'blue-500', 'green-500', 'purple-500', 'yellow-500', 'pink-500', 
      'indigo-500', 'red-500', 'cyan-500', 'lime-500', 'orange-500'
    ];
    
    // Simple hash function to get consistent color for a phrase
    let hash = 0;
    for (let i = 0; i < phrase.length; i++) {
      hash = phrase.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  return (
    <div className="bg-zinc-900 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Document Analysis</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${readingLevel.color}-900 bg-opacity-30 text-${readingLevel.color}-500`}>
          {readingLevel.level} Reading Level
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-800 p-4 rounded-xl">
          <div className="text-sm text-zinc-400 mb-1">Word Count</div>
          <div className="flex items-end">
            <div className="text-2xl font-bold">{analysis.word_count.toLocaleString()}</div>
            <div className="text-zinc-500 text-xs ml-2 mb-1">words</div>
          </div>
          <div className="mt-2 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(100, (analysis.word_count / 1000) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-zinc-800 p-4 rounded-xl">
          <div className="text-sm text-zinc-400 mb-1">Reading Time</div>
          <div className="flex items-end">
            <div className="text-2xl font-bold">{analysis.reading_time}</div>
            <div className="text-zinc-500 text-xs ml-2 mb-1">min</div>
          </div>
          <div className="text-xs text-zinc-500 mt-1">{formatReadingTime(analysis.reading_time)}</div>
          <div className="mt-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(100, (analysis.reading_time / 30) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-zinc-800 p-4 rounded-xl">
          <div className="text-sm text-zinc-400 mb-1">Key Phrases</div>
          <div className="flex items-end">
            <div className="text-2xl font-bold">{analysis.key_phrases.length}</div>
            <div className="text-zinc-500 text-xs ml-2 mb-1">found</div>
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {analysis.key_phrases.length === 0 
              ? 'No key phrases detected' 
              : `Top ${Math.min(5, analysis.key_phrases.length)} of ${analysis.key_phrases.length} phrases`
            }
          </div>
        </div>
      </div>
      
      {analysis.summary && (
        <div className="mb-6 bg-zinc-800 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-medium">Summary</h4>
            {analysis.summary.length > 150 && (
              <button 
                onClick={() => setShowFullSummary(!showFullSummary)}
                className="text-blue-500 text-sm hover:text-blue-400"
              >
                {showFullSummary ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
          <div className="text-zinc-300">
            {showFullSummary ? analysis.summary : truncateSummary(analysis.summary)}
          </div>
        </div>
      )}
      
      {analysis.key_phrases.length > 0 && (
        <div>
          <h4 className="text-lg font-medium mb-3">Key Phrases</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.key_phrases.map((phrase, index) => {
              const color = getPhraseColor(phrase);
              return (
                <span 
                  key={index}
                  className={`px-3 py-1.5 bg-${color} bg-opacity-20 text-${color} rounded-lg text-sm border border-${color} border-opacity-30 transition-colors duration-150 hover:bg-opacity-30 cursor-default`}
                >
                  {phrase}
                </span>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
        <div className="flex justify-between">
          <span>Analysis generated automatically</span>
          <button className="text-blue-500 hover:text-blue-400">Refresh Analysis</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalytics; 