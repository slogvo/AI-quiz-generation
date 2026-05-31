import React, { useState } from 'react';
import { Quiz, Question } from '../types';
import { X, CheckCircle, AlertTriangle, Info, Smile } from 'lucide-react';

interface PreviewModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export default function PreviewModal({ quiz, onClose }: PreviewModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [selectedResponseOptions, setSelectedResponseOptions] = useState<Record<string, number[]>>({});
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

  const handleResponseOptionToggle = (qId: string, idx: number) => {
    if (isSubmitted) return;
    setSelectedResponseOptions(prev => {
      const current = prev[qId] || [];
      const updated = current.includes(idx)
        ? current.filter(i => i !== idx)
        : [...current, idx];
      return {
        ...prev,
        [qId]: updated
      };
    });
  };

  const handleTextChange = (qId: string, val: string) => {
    if (isSubmitted) return;
    setTypedAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const isQuestionCorrect = (q: Question) => {
    if (q.type === 'multiple-choice' || q.type === 'true-false') {
      return selectedOptions[q.id] === q.correctOptionIndex;
    }
    if (q.type === 'multiple-response') {
      const userChoices = selectedResponseOptions[q.id] || [];
      const correctChoices = q.correctOptionIndices || [];
      return userChoices.length === correctChoices.length &&
             userChoices.every(c => correctChoices.includes(c)) &&
             correctChoices.every(c => userChoices.includes(c));
    }
    if (q.type === 'fill-in-the-blank') {
      const userTxt = (typedAnswers[q.id] || "").trim().toLowerCase();
      const correctTxt = (q.correctAnswer || "").trim().toLowerCase();
      return !!userTxt && userTxt === correctTxt;
    }
    // Essay/Short Answer
    const userText = typedAnswers[q.id];
    return userText && userText.trim().length > (q.type === 'short-answer' ? 1 : 5);
  };

  const calculateGrade = () => {
    let finalScore = 0;
    quiz.questions.forEach(q => {
      if (isQuestionCorrect(q)) {
        finalScore += q.points;
      }
    });
    setScore(finalScore);
    setIsSubmitted(true);
  };

  const resetQuiz = () => {
    setSelectedOptions({});
    setSelectedResponseOptions({});
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
              const selectedResponses = selectedResponseOptions[question.id] || [];
              const typedText = typedAnswers[question.id];
              const displayCorrect = question.correctOptionIndex;
              const questionCorrect = isQuestionCorrect(question);

              return (
                <div 
                  key={question.id}
                  className={`p-5 rounded-lg border bg-white text-left ${
                    isSubmitted 
                      ? questionCorrect
                        ? 'border-green-300 bg-green-50/10'
                        : 'border-red-200 bg-red-50/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {question.type === 'multiple-choice' && 'Trắc nghiệm (Một lựa chọn)'}
                      {question.type === 'true-false' && 'Đúng / Sai'}
                      {question.type === 'multiple-response' && 'Chọn nhiều (Nhiều lựa chọn)'}
                      {question.type === 'fill-in-the-blank' && 'Điền vào chỗ trống'}
                      {question.type === 'short-answer' && 'Trả lời ngắn'}
                      {question.type === 'essay' && 'Tự luận'}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-400">{question.points}đ</span>
                  </div>

                  <label className="block text-sm font-bold text-gray-950 mb-3">
                    {idx + 1}. {question.text} {question.required && <span className="text-red-500">*</span>}
                  </label>

                  {/* Render option lists for SINGLE Choice (multiple-choice or true-false) */}
                  {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options ? (
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
                            <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center shrink-0 bg-white">
                              {isChosen && (
                                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                              )}
                            </div>
                            <span className={isChosen ? 'font-bold text-gray-900' : 'text-gray-700'}>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : question.type === 'multiple-response' && question.options ? (
                    /* Render option checklists for MULTIPLE Response (multiple-response) */
                    <div className="space-y-2">
                      {question.options.map((opt, oIdx) => {
                        const isChosen = selectedResponses.includes(oIdx);
                        const isCorrect = (question.correctOptionIndices || []).includes(oIdx);

                        return (
                          <div 
                            key={oIdx}
                            onClick={() => handleResponseOptionToggle(question.id, oIdx)}
                            className={`flex items-center gap-3 p-2.5 rounded-md text-sm cursor-pointer transition-all ${
                              isChosen 
                                ? isSubmitted 
                                  ? isCorrect ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-200'
                                  : 'bg-indigo-50 border border-indigo-500'
                                : isSubmitted && isCorrect 
                                  ? 'bg-green-50 border border-dashed border-green-300' 
                                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            <div className="w-5 h-5 rounded border border-gray-400 flex items-center justify-center shrink-0 bg-white">
                              {isChosen && (
                                <div className="w-3.5 h-3.5 bg-indigo-600 rounded-sm flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <span className={isChosen ? 'font-bold text-gray-900' : 'text-gray-700'}>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : question.type === 'fill-in-the-blank' ? (
                    /* Render text input field for fill-in-the-blank */
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={typedText || ''}
                        disabled={isSubmitted}
                        onChange={(e) => handleTextChange(question.id, e.target.value)}
                        placeholder="Nhập câu trả lời chính xác của bạn vào đây..."
                        className={`w-full text-sm font-bold p-3 rounded-lg border outline-none transition-all ${
                          isSubmitted 
                            ? questionCorrect
                              ? 'bg-green-50 border-green-400 text-green-950'
                              : 'bg-red-50 border-red-300 text-red-950'
                            : 'bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 border-gray-300'
                        }`}
                      />
                      {isSubmitted && !questionCorrect && (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800">
                          <strong>Đáp án chính xác:</strong> <span className="font-mono bg-white px-2 py-0.5 rounded border border-green-300 ml-1">{question.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Essay / Short Answer */
                    <div className="space-y-2">
                      <textarea
                        value={typedText || ''}
                        disabled={isSubmitted}
                        onChange={(e) => handleTextChange(question.id, e.target.value)}
                        placeholder={question.type === 'short-answer' ? "Nhập câu trả lời ngắn của bạn ở đây..." : "Hãy viết câu trả lời phân tích chuyên sâu của bạn tại đây..."}
                        rows={question.type === 'short-answer' ? 2 : 4}
                        className="w-full text-sm text-gray-900 border border-gray-200 p-3 rounded bg-[#f4f5f6] focus:bg-white focus:ring-1 focus:ring-black outline-none font-medium"
                      />
                      {isSubmitted && question.correctAnswer && (
                        <div className="mt-2 bg-green-50 border border-green-100 rounded-md p-3 text-xs text-green-800">
                          <strong className="block text-[10px] uppercase font-mono tracking-wider mb-1 font-bold">Tiêu chí đánh giá & Gợi ý đáp án:</strong>
                          <p className="italic">{question.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Incorrect details notification for single selects */}
                  {isSubmitted && (question.type === 'multiple-choice' || question.type === 'true-false') && !questionCorrect && (
                    <div className="mt-2 text-xs text-red-700 flex items-center gap-1 font-semibold pl-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span>Chưa đúng. Đáp án chính xác là: <strong>{question.options?.[question.correctOptionIndex || 0]}</strong></span>
                    </div>
                  )}

                  {/* Incorrect details for multiple responses */}
                  {isSubmitted && question.type === 'multiple-response' && !questionCorrect && (
                    <div className="mt-2 text-xs text-red-700 flex flex-col gap-1 font-semibold pl-1">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        <span>Chưa đúng. Các đáp án đúng là:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-4 mt-0.5">
                        {(question.correctOptionIndices || []).map(index => (
                          <span key={index} className="px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 font-bold">
                            {question.options?.[index]}
                          </span>
                        ))}
                      </div>
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
