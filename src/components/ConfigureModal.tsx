import React, { useState } from 'react';
import { X, FileText, Trash2, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { GenerationConfig } from '../types';

interface ConfigureModalProps {
  onClose: () => void;
  onGenerate: (config: GenerationConfig, customTopic: string) => void;
}

export default function ConfigureModal({ onClose, onGenerate }: ConfigureModalProps) {
  const [topic, setTopic] = useState<string>('Introduction to Macroeconomics');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [questionType, setQuestionType] = useState<'mixed' | 'mcq' | 'tf' | 'short'>('mixed');
  const [includeCitations, setIncludeCitations] = useState<boolean>(true);
  
  // State for files based directly on Screen 3 files list
  const [files, setFiles] = useState<{ name: string; size: string }[]>([
    { name: 'syllabus_macroeconomics.pdf', size: '1.2 MB' },
    { name: 'lecture_notes_week_1_to_4.pdf', size: '3.8 MB' }
  ]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addSimulatedFile = () => {
    const mockFiles = [
      { name: 'macro_economic_policy_deep_dive.pdf', size: '2.4 MB' },
      { name: 'monetary_supply_and_inflation_curves.csv', size: '840 KB' },
      { name: 'gdp_measurement_principles.pdf', size: '1.7 MB' }
    ];
    // Add one that is not yet added
    const nextFile = mockFiles.find(f => !files.some(existing => existing.name === f.name));
    if (nextFile) {
      setFiles(prev => [...prev, nextFile]);
    } else {
      // Create random
      const randNum = Math.floor(Math.random() * 100);
      setFiles(prev => [...prev, { name: `lecture_notes_extra_part_${randNum}.docx`, size: '1.1 MB' }]);
    }
  };

  const handleGenerateClick = () => {
    onGenerate(
      {
        files,
        difficultyLevel: difficulty,
        primaryQuestionType: questionType,
        includeCitations
      },
      topic
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px]" id="modal-overlay">
      {/* Modal Container */}
      <div className="w-full max-w-[600px] bg-white border border-black rounded shadow-2xl flex flex-col relative animate-[fadeIn_0.2s_ease-out]" id="modal-container">
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close modal" 
          className="absolute top-4 right-4 text-[#8a8f98] hover:text-[#0f1115] transition-colors p-1 rounded-sm cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Block */}
        <div className="px-8 pt-8 pb-6 border-b border-[#f4f5f6]" id="modal-header">
          <h2 className="text-3xl font-bold text-[#0f1115] leading-tight flex items-center gap-2">
            Configure Generation
          </h2>
          <p className="text-[#8a8f98] text-sm mt-1">Review your files and set AI parameters before generating.</p>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-8 py-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto" id="modal-body">
          {/* Custom Subject Topic Field */}
          <div>
            <label className="block text-sm font-bold text-[#0f1115] mb-2">
              Topic or Subject Matter
            </label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Introduction to Macroeconomics" 
              className="w-full h-10 px-3 bg-[#f4f5f6] border border-black/10 hover:border-black/30 focus:border-black text-sm rounded outline-none transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          {/* Uploaded Files Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-[#8a8f98] uppercase tracking-wider">Uploaded Files ({files.length})</h3>
              <button 
                onClick={addSimulatedFile}
                className="text-xs font-bold text-[#0ac75f] hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Add File
              </button>
            </div>

            {files.length === 0 ? (
              <div 
                onClick={addSimulatedFile}
                className="border border-dashed border-[#8a8f98]/40 hover:border-[#0ac75f] rounded-lg p-5 text-center cursor-pointer hover:bg-[#0ac75f]/5 text-sm text-gray-500 font-medium transition-all"
              >
                No files added. Click to attach structural notes, files, or syllabus summaries!
              </div>
            ) : (
              <div className="flex flex-col gap-2" id="uploaded-files-list">
                {files.map((file, i) => (
                  <div 
                    key={file.name + '-' + i}
                    className="flex items-center gap-4 bg-[#f4f5f6] px-4 py-3 min-h-14 justify-between border border-black/10 rounded group hover:border-black transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-[#0f1115] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-[#0f1115] text-sm font-semibold leading-normal flex-1 truncate">{file.name}</p>
                      <span className="text-[10px] font-mono text-[#8a8f98] bg-white px-2 py-0.5 rounded border border-black/10 font-bold whitespace-nowrap">
                        {file.size}
                      </span>
                    </div>
                    <button 
                      onClick={() => removeFile(i)}
                      aria-label={`Remove ${file.name}`} 
                      className="shrink-0 text-[#8a8f98] hover:text-red-500 transition-colors p-1 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Settings Section */}
          <div>
            <h3 className="text-xs font-bold text-[#8a8f98] uppercase tracking-wider mb-4">Generation Settings</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Difficulty Level Dropdown */}
              <label className="flex flex-col flex-1 gap-2">
                <span className="text-[#0f1115] text-sm font-bold">Difficulty Level</span>
                <div className="relative">
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full h-10 bg-[#f4f5f6] border border-transparent rounded text-[#0f1115] text-sm px-3 pr-8 focus:outline-none focus:border-black focus:ring-0 cursor-pointer appearance-none transition-colors hover:bg-gray-200 font-medium"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-black">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </label>

              {/* Question Types Dropdown */}
              <label className="flex flex-col flex-1 gap-2">
                <span className="text-[#0f1115] text-sm font-bold">Primary Question Type</span>
                <div className="relative">
                  <select 
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full h-10 bg-[#f4f5f6] border border-transparent rounded text-[#0f1115] text-sm px-3 pr-8 focus:outline-none focus:border-black focus:ring-0 cursor-pointer appearance-none transition-colors hover:bg-gray-200 font-medium"
                  >
                    <option value="mixed">Mixed Format</option>
                    <option value="mcq">Multiple Choice</option>
                    <option value="tf">True / False</option>
                    <option value="short">Short Answer</option>
                  </select>
                  <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-black">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </label>
            </div>

            {/* Citations Checkbox */}
            <label className="flex items-center gap-3 mt-5 cursor-pointer group w-fit">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={includeCitations}
                  onChange={(e) => setIncludeCitations(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-4.5 h-4.5 bg-[#f4f5f6] border-2 border-black rounded transition-colors flex items-center justify-center peer-checked:bg-[#0ac75f] peer-checked:border-[#0ac75f]">
                  <svg className="w-3.5 h-3.5 text-white stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-[#0f1115] select-none group-hover:text-black font-semibold transition-colors">
                Include source citations in answers
              </span>
            </label>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-8 pt-0 mt-2">
          <button 
            onClick={handleGenerateClick}
            disabled={!topic || files.length === 0}
            className="w-full h-12 bg-[#0ac75f] disabled:bg-[#f4f5f6] disabled:text-[#8a8f98] disabled:border-black/10 disabled:cursor-not-allowed text-black font-bold text-[15px] rounded border border-black flex items-center justify-center gap-2 hover:bg-[#00e668] active:translate-y-[1px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer overflow-hidden relative" 
            id="generateBtn"
          >
            <Sparkles className="w-5 h-5 text-black animate-pulse" />
            <span>Generate Knowledge Base</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
