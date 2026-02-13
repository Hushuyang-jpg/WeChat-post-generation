import React from 'react';
import { STYLE_PROMPTS } from '../constants';
import { StyleKey } from '../types';
import { Play, Loader2 } from 'lucide-react';

interface ConfigPanelProps {
  topic: string;
  setTopic: (v: string) => void;
  styleKey: StyleKey;
  setStyleKey: (v: StyleKey) => void;
  wordCount: number;
  setWordCount: (v: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  statusMessage?: string;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  topic,
  setTopic,
  styleKey,
  setStyleKey,
  wordCount,
  setWordCount,
  onGenerate,
  isGenerating,
  statusMessage
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">🏛️</span> Editor's Desk
      </h2>

      <div className="space-y-6 flex-grow">
        {/* Topic Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Article Topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g. How to eat meat in winter without gaining weight?"
            className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-gray-700"
          />
        </div>

        {/* Style Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Persona & Style
          </label>
          <select
            value={styleKey}
            onChange={(e) => setStyleKey(e.target.value as StyleKey)}
            disabled={isGenerating}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
          >
            {Object.keys(STYLE_PROMPTS).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 italic">
            {STYLE_PROMPTS[styleKey]}
          </p>
        </div>

        {/* Word Count Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">Target Length</label>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {wordCount} chars
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="3000"
            step="100"
            value={wordCount}
            onChange={(e) => setWordCount(parseInt(e.target.value))}
            disabled={isGenerating}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Action Area */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        {isGenerating ? (
          <div className="w-full py-4 bg-blue-50 rounded-lg flex items-center justify-center gap-3 text-blue-700 border border-blue-100">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium animate-pulse">{statusMessage || "Processing..."}</span>
          </div>
        ) : (
          <button
            onClick={onGenerate}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold shadow-lg transform transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Generate Article
          </button>
        )}
        
        {!isGenerating && (
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 justify-center">
             <span>✨ Powered by Gemini Pro & Imagen 3</span>
          </div>
        )}
      </div>
    </div>
  );
};
