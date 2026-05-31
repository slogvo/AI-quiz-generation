import React, { useState } from 'react';
import { Quiz, Question } from '../types';
import { X, CheckCircle, AlertTriangle, Info, Smile } from 'lucide-react';

interface PreviewModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export default function PreviewModal({ quiz, onClose }: PreviewModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [typedAnswers, setTypedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const handleOptionSelect = (qId: string, idx: number) => {
    if (isSubmitted) return;
    setSelectedOptions(prev => ({
      ...prev,
      [qId]: idx
    }));
  };

  const handleTextChange = (qId: string, val: string) => {
    if (isSubmitted) return;
    setTypedAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const calculateGrade = () => {
    let finalScore = 0;
    quiz.questions.forEach(q => {
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        const userChoice = selectedOptions[q.id];
        if (userChoice !== undefined && userChoice === q.correctOptionIndex) {
          finalScore += q.points;
        }
      } else {
        // Essay types get auto full score if some text is written for simplicity in mock preview
        const userText = typedAnswers[q.id];
        if (userText && userText.trim().length > 5) {
          finalScore += q.points;
        }
      }
    });
    setScore(finalScore);
    setIsSubmitted(true);
  };

  const resetQuiz = () => {
    setSelectedOptions({});
    setTypedAnswers({});
    setIsSubmitted(false);
    setScore(0);
  };

  const possiblePoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="quiz-preview-viewport">
      <div 
        className="w-full max-w-[700px] h-full max-h-[85vh] bg-white border border-black rounded shadow-2xl flex flex-col relative animate-[fadeIn_0.25s_ease-out]"
        id="preview-panel-box"
      >
        {/* Close cross banner */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors p-1.5 rounded cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-black text-white px-2 py-0.5 rounded font-mono font-bold">PREVIEW MODE</span>
            <span className="text-xs text-gray-500 font-mono font-bold">Time Limit: {quiz.settings?.timeLimit || 15} mins</span>
          </div>
          <h2 className="text-2xl font-black text-gray-950">{quiz.title}</h2>
          <p className="text-xs text-gray-600 mt-1 font-medium">{quiz.description}</p>
        </div>

        {/* Quiz Flow Body Sheets */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fbfdfc]" id="test-sheet">
          {isSubmitted && (
            <div className="bg-green-50 border border-green-200 text-green-900 rounded-lg p-5 flex items-center gap-4 animate-[fadeIn_0.3s]">
              <CheckCircle className="w-10 h-10 text-[#0ac75f] shrink-0" />
              <div>
                <h4 className="font-bold text-lg">Quiz Graded!</h4>
                <p className="text-sm">You scored <strong className="font-mono text-base">{score}</strong> out of <strong className="font-mono text-base">{possiblePoints}</strong> possible points ({(score / possiblePoints * 100).toFixed(0)}%).</p>
              </div>
              <button 
                onClick={resetQuiz}
                className="ml-auto text-xs font-bold border border-green-300 hover:border-black rounded px-3 py-1 bg-white cursor-pointer"
              >
                Retry Test
              </button>
            </div>
          )}

          <div className="space-y-6">
            {quiz.questions.map((question, idx) => {
              const selectedOption = selectedOptions[question.id];
              const typedText = typedAnswers[question.id];
              const displayCorrect = question.correctOptionIndex;

              return (
                <div 
                  key={question.id}
                  className={`p-5 rounded-lg border bg-white ${
                    isSubmitted 
                      ? (question.type === 'essay' && typedText) || (question.type !== 'essay' && selectedOption === displayCorrect)
                        ? 'border-green-300 bg-green-50/10'
                        : 'border-red-200 bg-red-50/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <label className="block text-sm font-bold text-gray-950 mb-3">
                    {idx + 1}. {question.text} {question.required && <span className="text-red-500">*</span>}
                  </label>

                  {/* Render option lists */}
                  {question.type !== 'essay' && question.options ? (
                    <div className="space-y-2">
                      {question.options.map((opt, oIdx) => {
                        const isChosen = selectedOption === oIdx;
                        const isCorrect = oIdx === question.correctOptionIndex;

                        return (
                          <div 
                            key={oIdx}
                            onClick={() => handleOptionSelect(question.id, oIdx)}
                            className={`flex items-center gap-3 p-2.5 rounded-md text-sm cursor-pointer transition-all ${
                              isChosen 
                                ? isSubmitted 
                                  ? isCorrect ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-200'
                                  : 'bg-green-50 border border-[#0ac75f]'
                                : isSubmitted && isCorrect 
                                  ? 'bg-green-100 border border-green-300' 
                                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center shrink-0">
                              {isChosen && (
                                <div className="w-3 h-3 bg-[#0ac75f] rounded-full"></div>
                              )}
                            </div>
                            <span className={isChosen ? 'font-bold' : ''}>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Text input replies */
                    <div className="space-y-2">
                      <textarea
                        value={typedText || ''}
                        disabled={isSubmitted}
                        onChange={(e) => handleTextChange(question.id, e.target.value)}
                        placeholder="Type comparative analytical answer details here..."
                        rows={3}
                        className="w-full text-sm text-gray-900 border border-gray-200 p-3 rounded bg-[#f4f5f6] focus:bg-white focus:ring-1 focus:ring-black outline-none font-medium"
                      />
                      {isSubmitted && question.correctAnswer && (
                        <div className="mt-2 bg-green-50 border border-green-100 rounded-md p-3 text-xs text-green-800">
                          <strong className="block text-[10px] uppercase font-mono tracking-wider mb-1 font-bold">Grading Standard comparative:</strong>
                          <p className="italic">{question.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit state answer checking details */}
                  {isSubmitted && question.type !== 'essay' && selectedOption !== displayCorrect && (
                    <div className="mt-2 text-xs text-red-700 flex items-center gap-1 font-semibold pl-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span>Incorrect Choice. The correct answer was: <strong>{question.options?.[question.correctOptionIndex || 0]}</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Submit Footer Action Sheets */}
        <div className="p-6 border-t border-gray-100 shrink-0 flex justify-between bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold font-mono border border-gray-200 hover:border-black rounded-md transition-colors cursor-pointer"
          >
            Quit Preview
          </button>
          {!isSubmitted ? (
            <button 
              onClick={calculateGrade}
              className="px-5 py-2 bg-black hover:bg-gray-900 text-[#0ac75f] text-xs font-bold rounded-md shadow-sm transition-colors cursor-pointer border border-black"
            >
              Submit Quiz
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="px-5 py-2 bg-[#0ac75f] hover:bg-[#00e668] text-black text-xs font-bold rounded-md shadow-sm transition-colors cursor-pointer border border-[#0ac75f]"
            >
              Finish Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
