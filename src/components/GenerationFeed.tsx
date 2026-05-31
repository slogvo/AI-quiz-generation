import React, { useEffect, useState } from 'react';
import { Square, ArrowRight, Play, CheckCircle } from 'lucide-react';

interface GenerationFeedProps {
  topic: string;
  onFinish: () => void;
  onHalt: () => void;
}

export default function GenerationFeed({ topic, onFinish, onHalt }: GenerationFeedProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('Initializing extraction pipeline...');

  // Step names to make simulation look incredibly real and premium!
  const stages = [
    { limit: 15, text: 'Parsing syllabus and core document indexes...' },
    { limit: 35, text: 'Identifying major macroeconomic modules and supply curves...' },
    { limit: 55, text: 'Extracting key definitions (Fiscal vs. Monetary, Equilibrium Price)...' },
    { limit: 75, text: 'Drafting structured lessons and comparative multiple-choice items...' },
    { limit: 90, text: 'Re-aligning difficulty distractors and saving schemas...' },
    { limit: 100, text: 'Assembling complete interactive educational curriculum!' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(oldProgress => {
        const nextProgress = Math.min(oldProgress + Math.floor(Math.random() * 8) + 2, 100);
        
        // Match active description to progress levels
        const stage = stages.find(s => nextProgress <= s.limit);
        if (stage) {
          setCurrentStep(stage.text);
        }

        if (nextProgress === 100) {
          clearInterval(interval);
          setTimeout(() => {
            onFinish();
          }, 1200);
        }
        return nextProgress;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="min-h-screen w-full bg-white text-[#0f1115] flex flex-col items-center" id="generation-feed-screen">
      {/* Sticky Progress Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-black/10 py-5 px-6 flex justify-center shadow-xs" id="progress-header">
        <div className="w-full max-w-[800px] flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <h1 className="text-[#0f1115] text-lg font-bold tracking-tight animate-pulse">
              Extracting concepts from {topic}...
            </h1>
            <span className="text-[#8a8f98] text-sm font-bold font-mono">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-[#f4f5f6] rounded-full overflow-hidden border border-black/5">
            <div 
              className="h-full bg-[#0ac75f] rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-[#0ac75f] font-mono mt-0.5 flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ac75f] animate-ping"></span>
            {currentStep}
          </div>
        </div>
      </header>

      {/* Main Cascading Feed Container */}
      <main className="w-full max-w-[800px] flex-1 px-4 py-8 flex flex-col gap-6 pb-32">
        {/* Generated Card 1: Multiple Choice (Always visible) */}
        <div className="bg-white border border-[#0ac75f] rounded p-6 shadow-sm relative overflow-hidden group transition-all duration-300 transform scale-100 translate-y-0" id="feed-card-mc">
          <div className="absolute top-6 left-6 w-2.5 h-2.5 rounded-full bg-[#0ac75f] animate-pulse"></div>
          <div className="pl-6">
            <h2 className="text-[#0f1115] text-xl font-bold mb-4 tracking-tight">
              What is the primary function of a central bank in a modern economy?
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0"></div>
                <div className="h-4 bg-[#f4f5f6] rounded w-3/4"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0"></div>
                <div className="h-4 bg-[#f4f5f6] rounded w-full"></div>
              </div>
              
              {/* Correct answer highlighted */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[#0ac75f] flex items-center justify-center shrink-0 bg-green-50">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0ac75f]"></div>
                </div>
                <div className="h-4 bg-[#f4f5f6] rounded w-5/6 border-l-2 border-[#0ac75f] pl-2 font-semibold text-gray-800">
                  Controlling the money supply & interest rates (Monetary Policy)
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0"></div>
                <div className="h-4 bg-[#f4f5f6] rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Card 2: Short Answer Essay (Visible when progress > 30%) */}
        {progress >= 30 ? (
          <div className="bg-white border border-[#0ac75f] rounded p-6 shadow-sm relative overflow-hidden group transition-all duration-500 animate-[fadeIn_0.4s_ease-out]" id="feed-card-sa">
            <div className="absolute top-6 left-6 w-2.5 h-2.5 rounded-full bg-[#0ac75f] animate-pulse"></div>
            <div className="pl-6">
              <h2 className="text-[#0f1115] text-xl font-bold mb-4 tracking-tight">
                Explain the difference between fiscal and monetary policy.
              </h2>
              <div className="flex flex-col gap-3">
                <div className="h-20 bg-[#f4f5f6] rounded border border-gray-100 w-full p-3 text-xs text-gray-500 font-mono italic">
                  [Extracting ideal explanation guidelines: Taxation & Spending (Exec/Legis) vs. reserve rates & interest margins (Central Bank)...]
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Locked skeleton draft */
          <div className="bg-white border border-gray-200/50 rounded p-6 shadow-xs relative overflow-hidden opacity-40">
            <div className="pl-6 space-y-3">
              <div className="h-5 bg-gray-100 rounded w-1/2"></div>
              <div className="h-12 bg-gray-100 rounded w-full"></div>
            </div>
          </div>
        )}

        {/* Generated Card 3: True / False Draft (Visible when progress > 65%) */}
        {progress >= 65 ? (
          <div className="bg-white border border-[#0ac75f] rounded p-6 shadow-sm relative overflow-hidden group transition-all duration-500 animate-[fadeIn_0.4s_ease-out]" id="feed-card-tf">
            <div className="absolute top-6 left-6 w-2.5 h-2.5 rounded-full bg-[#0ac75f] animate-pulse"></div>
            <div className="pl-6">
              <h2 className="text-[#0f1115] text-xl font-bold mb-4 tracking-tight">
                True or False: Real Gross Domestic Product accounts for inflation adjustments over time.
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#0ac75f] flex items-center justify-center shrink-0 bg-green-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0ac75f]"></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">True</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0"></div>
                  <span className="text-sm text-gray-500">False</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active generating skeleton placeholder corresponding to mockup Card 3 */
          <div className="bg-white border border-black/10 rounded p-6 shadow-sm relative overflow-hidden animate-pulse" id="feed-loading-skeleton">
            <div className="absolute top-6 left-6 w-2 h-2 rounded-full bg-gray-400"></div>
            <div className="pl-6">
              <div className="h-6 bg-[#f4f5f6] rounded w-3/4 mb-4"></div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-black/10"></div>
                  <div className="h-4 bg-[#f4f5f6] rounded w-1/3"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-black/10"></div>
                  <div className="h-4 bg-[#f4f5f6] rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Halt Button at the bottom-right of viewport */}
      <div className="fixed bottom-8 right-8 z-50" id="halt-button-container">
        <button 
          onClick={onHalt}
          className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-6 py-3 rounded font-bold border border-black transition-colors shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Square className="w-4 h-4 fill-white text-white" />
          Halt Generation
        </button>
      </div>
    </div>
  );
}
