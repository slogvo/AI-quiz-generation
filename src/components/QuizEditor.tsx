import React, { useState } from 'react';
import { Course, Module, CourseItem, Question, Quiz, QuizSettings } from '../types';
import { 
  ArrowLeft, 
  Cloud, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  Sparkles, 
  Copy, 
  Trash2, 
  X, 
  Check, 
  Plus, 
  Eye, 
  BookOpen,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  SpellCheck,
  AlertCircle,
  GraduationCap,
  Award
} from 'lucide-react';

interface QuizEditorProps {
  course: Course;
  onBack: () => void;
  onUpdateCourse: (updated: Course) => void;
  onPreviewQuiz: (quiz: Quiz) => void;
}

export default function QuizEditor({ course, onBack, onUpdateCourse, onPreviewQuiz }: QuizEditorProps) {
  // Navigation states
  const [isCourseOverviewActive, setIsCourseOverviewActive] = useState<boolean>(true); // Start at Course Dashboard for awesome onboarding!
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const [activeItemId, setActiveItemId] = useState<string>('');

  // Editor states
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');
  const [aiPopoverQuestionId, setAiPopoverQuestionId] = useState<string>('');
  const [aiLoadingQuestionId, setAiLoadingQuestionId] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');

  // AI Generation states for Course, Module & Lesson
  const [isGeneratingCourseQuiz, setIsGeneratingCourseQuiz] = useState<boolean>(false);
  const [courseGenerationError, setCourseGenerationError] = useState<string>('');
  const [isGeneratingModuleQuiz, setIsGeneratingModuleQuiz] = useState<boolean>(false);
  const [isGeneratingLessonQuiz, setIsGeneratingLessonQuiz] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string>('');

  // Course tree toggle states
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // Helper: Get active item & module
  const activeModule = course.modules.find(m => m.id === activeModuleId);
  const activeItem = isCourseOverviewActive 
    ? undefined 
    : (course.courseQuizzes?.find(q => q.id === activeItemId) || activeModule?.items.find(i => i.id === activeItemId));

  // Generate Course-level Comprehensive Quiz with AI
  const generateCourseQuizWithAi = async () => {
    setIsGeneratingCourseQuiz(true);
    setCourseGenerationError('');
    try {
      const modulesData = course.modules.map(mod => {
        const lessons = mod.items.filter(item => item.type === 'lesson');
        return {
          moduleTitle: mod.title,
          lessons: lessons.map(l => ({ title: l.title, content: l.content || "" }))
        };
      });

      const res = await fetch("/api/generate-course-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: course.title,
          courseDescription: course.description,
          modulesData: modulesData,
          difficulty: 'Advanced'
        })
      });

      if (!res.ok) throw new Error("Could not reach AI model server.");
      const generatedQuiz = await res.json();

      const newQuizItem: CourseItem = {
        id: `quiz_course_${Date.now()}`,
        title: generatedQuiz.title || `Integrated Course Exam: ${course.title}`,
        type: 'quiz',
        quizScope: 'course',
        quiz: generatedQuiz
      };

      const updatedCourseQuizzes = [...(course.courseQuizzes || []), newQuizItem];
      onUpdateCourse({ ...course, courseQuizzes: updatedCourseQuizzes });
      
      setIsCourseOverviewActive(false);
      setActiveModuleId('');
      setActiveItemId(newQuizItem.id);
    } catch (err: any) {
      console.error(err);
      setCourseGenerationError(err.message || "Failed to generate comprehensive course assessment.");
    } finally {
      setIsGeneratingCourseQuiz(false);
    }
  };

  // Generate Module-level Quiz with AI
  const generateModuleQuizWithAi = async () => {
    if (!activeModule) return;
    setIsGeneratingModuleQuiz(true);
    setGenerationError('');
    try {
      const lessons = activeModule.items.filter(item => item.type === 'lesson');
      const lessonTexts = lessons.map(l => ({ title: l.title, content: l.content || "" }));

      const res = await fetch("/api/generate-module-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleTitle: activeModule.title,
          lessonTexts: lessonTexts,
          difficulty: 'Intermediate'
        })
      });

      if (!res.ok) throw new Error("Could not reach AI model server.");
      const generatedQuiz = await res.json();

      const newQuizItem: CourseItem = {
        id: `quiz_module_${Date.now()}`,
        title: generatedQuiz.title || `Comprehensive Quiz: ${activeModule.title}`,
        type: 'quiz',
        quizScope: 'module',
        quiz: generatedQuiz
      };

      const updatedModules = course.modules.map(mod => {
        if (mod.id !== activeModule.id) return mod;
        return {
          ...mod,
          items: [...mod.items, newQuizItem]
        };
      });

      onUpdateCourse({ ...course, modules: updatedModules });
      setIsCourseOverviewActive(false);
      setActiveItemId(newQuizItem.id);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Something went wrong during generation.");
    } finally {
      setIsGeneratingModuleQuiz(false);
    }
  };

  // Generate Lesson-level practice Quiz with AI
  const generateLessonQuizWithAi = async (lessonId: string) => {
    const lesson = activeModule?.items.find(i => i.id === lessonId);
    if (!lesson || !activeModule) return;
    setIsGeneratingLessonQuiz(true);
    setGenerationError('');
    try {
      const res = await fetch("/api/generate-lesson-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          lessonContent: lesson.content || "",
          difficulty: 'Intermediate'
        })
      });

      if (!res.ok) throw new Error("Could not reach AI model server.");
      const generatedQuiz = await res.json();

      const lessonIdx = activeModule.items.findIndex(i => i.id === lessonId);
      const newQuizItem: CourseItem = {
        id: `quiz_lesson_${Date.now()}`,
        title: generatedQuiz.title || `Practice Quiz: ${lesson.title}`,
        type: 'quiz',
        quizScope: 'lesson',
        parentLessonId: lessonId,
        quiz: generatedQuiz
      };

      const newItems = [...activeModule.items];
      newItems.splice(lessonIdx + 1, 0, newQuizItem);

      const updatedModules = course.modules.map(mod => {
        if (mod.id !== activeModule.id) return mod;
        return {
          ...mod,
          items: newItems
        };
      });

      onUpdateCourse({ ...course, modules: updatedModules });
      setIsCourseOverviewActive(false);
      setActiveItemId(newQuizItem.id);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Failed to generate lesson-level assessment.");
    } finally {
      setIsGeneratingLessonQuiz(false);
    }
  };

  // Delete Course Item handler
  const deleteCourseItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if it is a course level quiz
    if (course.courseQuizzes?.some(q => q.id === itemId)) {
      if (window.confirm("Are you sure you want to delete this course assessment?")) {
        const updatedCourseQuizzes = (course.courseQuizzes || []).filter(q => q.id !== itemId);
        onUpdateCourse({ ...course, courseQuizzes: updatedCourseQuizzes });
        setIsCourseOverviewActive(true);
        setActiveItemId('');
      }
      return;
    }

    if (!activeModule) return;
    if (window.confirm("Are you sure you want to delete this study element?")) {
      const updatedModules = course.modules.map(mod => {
        if (mod.id !== activeModule.id) return mod;
        return {
          ...mod,
          items: mod.items.filter(item => item.id !== itemId)
        };
      });
      onUpdateCourse({ ...course, modules: updatedModules });
      setActiveItemId('');
    }
  };

  // Toggle module collapse
  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Helper helper to update course item safely
  const updateActiveQuiz = (updater: (quiz: Quiz) => Quiz) => {
    // Check if updating a course-level quiz
    if (course.courseQuizzes?.some(q => q.id === activeItemId)) {
      const updatedQuizzes = (course.courseQuizzes || []).map(item => {
        if (item.id !== activeItemId || item.type !== 'quiz' || !item.quiz) return item;
        return {
          ...item,
          quiz: updater(item.quiz)
        };
      });
      onUpdateCourse({ ...course, courseQuizzes: updatedQuizzes });
      return;
    }

    const updatedModules = course.modules.map(mod => {
      if (mod.id !== activeModuleId) return mod;
      return {
        ...mod,
        items: mod.items.map(item => {
          if (item.id !== activeItemId || item.type !== 'quiz' || !item.quiz) return item;
          return {
            ...item,
            quiz: updater(item.quiz)
          };
        })
      };
    });
    onUpdateCourse({ ...course, modules: updatedModules });
  };

  // 1. Quiz Settings modification handlers
  const handleSettingChange = <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => {
    updateActiveQuiz(quiz => ({
      ...quiz,
      settings: {
        ...quiz.settings,
        [key]: value
      }
    }));
  };

  // 2. Question inline modifications
  const handleQuestionTextChange = (qId: string, text: string) => {
    updateActiveQuiz(quiz => ({
      ...quiz,
      questions: quiz.questions.map(q => q.id === qId ? { ...q, text } : q)
    }));
  };

  const handleQuestionConfigChange = (qId: string, updates: Partial<Question>) => {
    updateActiveQuiz(quiz => ({
      ...quiz,
      questions: quiz.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
    }));
  };

  const handleOptionChange = (qId: string, optIndex: number, val: string) => {
    updateActiveQuiz(quiz => ({
      ...quiz,
      questions: quiz.questions.map(q => {
        if (q.id !== qId || !q.options) return q;
        const nextOpts = [...q.options];
        nextOpts[optIndex] = val;
        return { ...q, options: nextOpts };
      })
    }));
  };

  const addOption = (qId: string) => {
    updateActiveQuiz(quiz => ({
      ...quiz,
      questions: quiz.questions.map(q => {
        if (q.id !== qId) return q;
        const nextOpts = q.options ? [...q.options, `New Option ${q.options.length + 1}`] : ['Option 1'];
        return { ...q, options: nextOpts };
      })
    }));
  };

  const removeOption = (qId: string, optIndex: number) => {
    updateActiveQuiz(quiz => ({
      ...quiz,
      questions: quiz.questions.map(q => {
        if (q.id !== qId || !q.options) return q;
        // Make sure option selection adjustments are fine
        let nextCorrect = q.correctOptionIndex;
        if (q.correctOptionIndex === optIndex) {
          nextCorrect = 0;
        } else if (q.correctOptionIndex !== undefined && q.correctOptionIndex > optIndex) {
          nextCorrect = q.correctOptionIndex - 1;
        }
        return {
          ...q,
          options: q.options.filter((_, idx) => idx !== optIndex),
          correctOptionIndex: nextCorrect
        };
      })
    }));
  };

  // Question manipulation: duplicate
  const duplicateQuestion = (qId: string) => {
    updateActiveQuiz(quiz => {
      const idx = quiz.questions.findIndex(q => q.id === qId);
      if (idx === -1) return quiz;
      const target = quiz.questions[idx];
      const copy: Question = {
        ...target,
        id: `${target.id}_copy_${Date.now().toString().slice(-4)}`,
        text: `${target.text} (Copy)`
      };
      const nextQuestions = [...quiz.questions];
      nextQuestions.splice(idx + 1, 0, copy);
      return { ...quiz, questions: nextQuestions };
    });
  };

  // Question manipulation: delete
  const deleteQuestion = (qId: string) => {
    updateActiveQuiz(quiz => ({
      ...quiz,
      questions: quiz.questions.filter(q => q.id !== qId)
    }));
  };

  // Add clean blank question card
  const addBlankQuestion = () => {
    const defaultNew: Question = {
      id: `q_new_${Date.now()}`,
      type: 'multiple-choice',
      text: 'What other core concept should we assess in this module?',
      options: ['Analytical response option A', 'Nutritional distractor B', 'Baseline criteria option C'],
      correctOptionIndex: 0,
      points: 1,
      required: true
    };
    updateActiveQuiz(quiz => ({
      ...quiz,
      questions: [...quiz.questions, defaultNew]
    }));
    setActiveQuestionId(defaultNew.id);
  };

  // Trigger real backend Gemini rewrite (make harder, make simpler, fix grammar)
  const executeAiAction = async (qId: string, actionName: string) => {
    if (!activeModule || !activeItem || activeItem.type !== 'quiz' || !activeItem.quiz) return;
    const targetQ = activeItem.quiz.questions.find(q => q.id === qId);
    if (!targetQ) return;

    setAiPopoverQuestionId('');
    setAiLoadingQuestionId(qId);
    setAiError('');

    try {
      const res = await fetch("/api/ai-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: targetQ.text,
          action: actionName,
          type: targetQ.type,
          options: targetQ.options
        })
      });

      if (!res.ok) throw new Error("AI action request failed.");
      const data = await res.json();

      updateActiveQuiz(quiz => ({
        ...quiz,
        questions: quiz.questions.map(q => {
          if (q.id !== qId) return q;
          return {
            ...q,
            text: data.text || q.text,
            options: data.options || q.options
          };
        })
      }));
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || "Failed to revise question.");
    } finally {
      setAiLoadingQuestionId('');
    }
  };

  // Course outline: Create new module
  const addModuleNode = () => {
    const nextIdx = course.modules.length + 1;
    const newMod: Module = {
      id: `mod_${Date.now()}`,
      title: `Module ${nextIdx}: Macroeconomic Debates`,
      items: [
        {
          id: `lesson_${Date.now()}`,
          title: `Lesson ${2 * nextIdx - 1}: International Trade`,
          type: 'lesson',
          content: '### International Trade & Forex Curves\n\nCountries participate in international trade to maximize their absolute and comparative production advantages.'
        },
        {
          id: `quiz_${Date.now()}`,
          title: `Quiz ${nextIdx}: Balance of Payments`,
          type: 'quiz',
          quiz: {
            id: `q_sub_${Date.now()}`,
            title: `Quiz ${nextIdx}: fundamentals`,
            description: 'Evaluate imports, trade deficits, and foreign exchange.',
            settings: {
              totalPoints: 5,
              targetDifficulty: 'Intermediate',
              timeLimit: 10,
              shuffleQuestions: true,
              shuffleOptions: false
            },
            questions: [
              {
                id: `q_b_${Date.now()}`,
                type: 'multiple-choice',
                text: 'Which accounting entry logs a country transactions with the rest of the world?',
                options: ['Balance of Payments', 'Income deficit statement', 'Gross National Yield'],
                correctOptionIndex: 0,
                points: 1,
                required: true
              }
            ]
          }
        }
      ]
    };
    onUpdateCourse({
      ...course,
      modules: [...course.modules, newMod]
    });
    // Set active
    setActiveModuleId(newMod.id);
    setActiveItemId(newMod.items[1].id);
  };

  return (
    <div className="bg-[#f0f4f2] text-[#111827] h-screen flex flex-col overflow-hidden" id="quiz-editor-viewport">
      {/* Editorial Minimal Sticky Header */}
      <header className="bg-white border-b border-gray-200 h-14 shrink-0 flex items-center px-4 justify-between" id="editor-header">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="h-5 w-px bg-gray-300"></div>
          
          {/* Breadcrumbs matching screen 2 mockup */}
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            {isCourseOverviewActive ? (
              <>
                <span className="truncate max-w-[140px]">{course.title}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-gray-900 font-bold truncate">Bảng điều khiển Khóa học</span>
              </>
            ) : !activeModuleId ? (
              <>
                <span className="truncate max-w-[140px]">{course.title}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-blue-600 font-bold">Đề thi Toàn khóa</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-[#111827] font-extrabold truncate max-w-[180px]">{activeItem?.title}</span>
              </>
            ) : (
              <>
                <span className="truncate max-w-[120px]">{course.title}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="truncate max-w-[120px]">{activeModule?.title}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="text-[#111827] font-semibold truncate max-w-[160px]">{activeItem?.title || "Module Overview"}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Cloud className="w-4 h-4 text-[#0ac75f]" />
            Saved Changes
          </span>
          <button 
            onClick={() => {
              alert("Awesome! All updates have been finalized and published.");
            }}
            className="bg-[#0ac75f] hover:bg-[#00e066] text-black text-sm font-bold py-1.5 px-4 rounded-md transition-all shadow-sm cursor-pointer border border-black/10"
          >
            Publish Updates
          </button>
        </div>
      </header>

      {/* Main Panel Division */}
      <div className="flex flex-1 overflow-hidden" id="workspace-panels">
        {/* PANEL 1: Left Structure Sidebar Folder Tree */}
        <aside className="w-[290px] bg-white border-r border-gray-200 flex flex-col shrink-0" id="course-tree-sidebar">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-sm text-[#111827]">Sách mục khóa học</h3>
            <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">AI Quiz Core</span>
          </div>

          {/* Course-level Header Block & Course Quizzes */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/40 space-y-2">
            <div 
              onClick={() => {
                setIsCourseOverviewActive(true);
                setActiveModuleId('');
                setActiveItemId('');
              }}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-sm font-extrabold transition-all ${
                isCourseOverviewActive
                  ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-600 pl-2 shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>🎓 Tổng quan khóa học</span>
            </div>

            {/* Course level interactive exams list */}
            {course.courseQuizzes && course.courseQuizzes.length > 0 && (
              <div className="pl-3.5 space-y-1">
                <div className="text-[9px] text-[#00662d] font-black uppercase tracking-wider mb-1 opacity-70">
                  🏆 ĐỀ THI TỔNG HỢP TOÀN KHÓA
                </div>
                {course.courseQuizzes.map(cq => {
                  const isSelected = !isCourseOverviewActive && activeItemId === cq.id;
                  return (
                    <div
                      key={cq.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCourseOverviewActive(false);
                        setActiveModuleId('');
                        setActiveItemId(cq.id);
                      }}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-xs transition-all text-left relative ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-800 font-bold border-l-2 border-blue-600 pl-1.5'
                          : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{cq.title}</span>
                      </div>
                      
                      <button
                        onClick={(e) => deleteCourseItem(cq.id, e)}
                        className="p-0.5 text-gray-300 hover:text-red-500 rounded hidden group-hover:block transition-colors"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Collapsible nodes listing */}
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3" id="tree-nodes">
            {course.modules.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 font-bold">Chưa có module bài học nào.</div>
            ) : (
              course.modules.map(mod => {
                const isCollapsed = collapsedModules[mod.id];
                const lessons = mod.items.filter(item => item.type === 'lesson');
                const moduleQuizzes = mod.items.filter(item => item.type === 'quiz' && item.quizScope === 'module');

                return (
                  <div key={mod.id} className="space-y-1" id={`mod-node-${mod.id}`}>
                    {/* Module root header block */}
                    <div 
                      onClick={() => {
                        setIsCourseOverviewActive(false);
                        setActiveModuleId(mod.id);
                        setActiveItemId(''); // Empty string indicates Module Overview Panel!
                      }}
                      className={`flex items-center justify-between px-2 py-2 rounded-md hover:bg-gray-50 cursor-pointer text-sm font-extrabold transition-all group/mod ${
                        !isCourseOverviewActive && activeModuleId === mod.id && activeItemId === '' 
                          ? 'bg-emerald-50 text-emerald-900 border-l-4 border-[#0ac75f] pl-1.5 shadow-xs' 
                          : !isCourseOverviewActive && activeModuleId === mod.id
                            ? 'bg-gray-100/70 text-gray-900'
                            : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleModuleCollapse(mod.id);
                          }}
                          className="p-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer text-gray-500 shrink-0"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                        </button>
                        <Folder className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{mod.title}</span>
                      </div>

                      {/* Highly visible instant AI generation trigger right in sidebar */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setIsCourseOverviewActive(false);
                          setActiveModuleId(mod.id);
                          setActiveItemId('');
                          // Trigger AI Module Quiz synthesis immediately
                          await generateModuleQuizWithAi();
                        }}
                        title="Tạo trắc nghiệm AI đánh giá chương này"
                        className="p-1 text-gray-400 hover:text-[#0ac75f] hover:bg-green-100/60 rounded transition-colors shrink-0 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#0ac75f]" />
                      </button>
                    </div>

                    {/* Hierarchical Children Items */}
                    {!isCollapsed && (
                      <div className="pl-4 space-y-1.5 border-l border-gray-100 ml-4 pb-1">
                        
                        {/* LISTING LESSONS & DIRECTLY ATTACHED LESSON ASSESSMENT QUIZZES */}
                        {lessons.length > 0 && (
                          <div className="space-y-2">
                            {lessons.map(lesson => {
                              const isLessonActive = !isCourseOverviewActive && activeItemId === lesson.id;
                              // Find lesson level quizzes for this specific lesson
                              const targetLessonQuizzes = mod.items.filter(
                                i => i.type === 'quiz' && i.quizScope === 'lesson' && i.parentLessonId === lesson.id
                              );

                              return (
                                <div key={lesson.id} className="space-y-1">
                                  {/* Lesson item row */}
                                  <div
                                    onClick={() => {
                                      setIsCourseOverviewActive(false);
                                      setActiveModuleId(mod.id);
                                      setActiveItemId(lesson.id);
                                    }}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-all ${
                                      isLessonActive
                                        ? 'bg-green-50 text-green-800 font-bold border-l-2 border-[#0ac75f] pl-1.5'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span className="truncate">{lesson.title}</span>
                                  </div>

                                  {/* Directly attached quizzes indented hierarchy */}
                                  {targetLessonQuizzes.map(quizItem => {
                                    const isQuizActive = !isCourseOverviewActive && activeItemId === quizItem.id;
                                    return (
                                      <div
                                        key={quizItem.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsCourseOverviewActive(false);
                                          setActiveModuleId(mod.id);
                                          setActiveItemId(quizItem.id);
                                        }}
                                        className={`flex items-center gap-1 pl-4 pr-1.5 py-1 rounded cursor-pointer text-[11px] transition-all relative ${
                                          isQuizActive
                                            ? 'bg-emerald-50 text-emerald-900 border-l-2 border-emerald-500 pl-3.5 font-bold'
                                            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-800 font-medium'
                                        }`}
                                        title="Practice assessment linked directly to this lesson"
                                      >
                                        <span className="text-gray-300 font-mono scale-90 mr-0.5 select-none">↳</span>
                                        <span className="mr-1">❓</span>
                                        <span className="truncate flex-1">{quizItem.title}</span>
                                        <span className="text-[7.5px] font-black uppercase text-emerald-700 bg-emerald-50 px-1 rounded transform scale-90 border border-emerald-100 shrink-0">
                                          L-Quiz
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* LISTING GENERAL COMPREHENSIVE MODULE QUIZZES SUMMARY */}
                        {moduleQuizzes.length > 0 && (
                          <div className="pt-1.5 border-t border-dashed border-gray-100">
                            <div className="text-[8.5px] text-[#00662d] font-black uppercase tracking-wider mb-1 px-1 opacity-70">
                              🎯 TRẮC NGHIỆM CHƯƠNG
                            </div>
                            {moduleQuizzes.map(mq => {
                              const isQuizActive = !isCourseOverviewActive && activeItemId === mq.id;
                              return (
                                <div
                                  key={mq.id}
                                  onClick={() => {
                                    setIsCourseOverviewActive(false);
                                    setActiveModuleId(mod.id);
                                    setActiveItemId(mq.id);
                                  }}
                                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-xs transition-all ${
                                    isQuizActive
                                      ? 'bg-amber-50 text-amber-950 font-bold border-l-2 border-amber-500 pl-1.5'
                                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                                  }`}
                                  title="Comprehensive assessment testing the entire module lessons"
                                >
                                  <span>❓</span>
                                  <span className="truncate flex-1">{mq.title}</span>
                                  <span className="text-[7.5px] font-black uppercase text-amber-700 bg-amber-50 px-1 rounded transform scale-90 border border-amber-200 shrink-0">
                                    M-Quiz
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add Module Bottom Bar CTA */}
          <div className="p-3 border-t border-gray-200 bg-gray-50/50">
            <button 
              onClick={addModuleNode}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-bold text-gray-800 border border-gray-300 bg-white rounded-md hover:bg-gray-50 hover:border-black transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Module
            </button>
          </div>
        </aside>

        {/* PANEL 2: Center Canvas (Quiz form flow OR Lesson reader editor) */}
        <main className="flex-1 overflow-y-auto p-8" id="central-canvas">
          <div className="max-w-[760px] mx-auto space-y-6 pb-20">
            
            {isCourseOverviewActive ? (
              /* COURSE OVERVIEW DASHBOARD VIEW */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8" id="course-overview">
                {/* Course Header Title (Editable) */}
                <div className="border-b border-gray-200 pb-5 mb-6 text-left">
                  <div className="flex items-center gap-2 text-xs text-blue-600 uppercase tracking-wider font-extrabold mb-1">
                    📖 BẢNG ĐIỀU KHIỂN KHÓA HỌC (COURSE DASHBOARD)
                  </div>
                  <input 
                    type="text"
                    value={course.title || ''}
                    onChange={(e) => {
                      onUpdateCourse({ ...course, title: e.target.value });
                    }}
                    placeholder="Course Title"
                    className="text-3xl font-extrabold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none w-full bg-transparent px-0 py-1 transition-colors outline-none"
                  />
                  <textarea
                    value={course.description || ''}
                    onChange={(e) => {
                      onUpdateCourse({ ...course, description: e.target.value });
                    }}
                    placeholder="Short course description or syllabus guidelines..."
                    className="mt-3 text-sm text-gray-650 w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white rounded p-1.5 transition-all outline-none resize-none"
                    rows={2}
                  />
                </div>

                {/* AI GENERATION TRIGGER TRIGGER CARD - HEAVILY PROMINENT AT TOP */}
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/40 border-2 border-dashed border-blue-400 rounded-xl p-8 mb-8 text-center" id="ai-course-quiz-generator">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Sparkles className="w-7 h-7 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-extrabold text-blue-950 mb-2">⚡ Trình sinh Đề Kiểm Tra Toàn Khóa bằng AI</h4>
                  <p className="text-gray-600 text-sm max-w-xl mx-auto mb-5 leading-relaxed font-semibold">
                    Sử dụng AI để tự động phân tích sâu toàn bộ giáo trình, thông tin tất cả các chương học và bài học của khóa: <strong>{course.title}</strong>, từ đó sinh một đề kiểm tra tổng hợp chất lượng cao (Course-Level Exam) tích hợp kiến thức nhiều chương!
                  </p>

                  {isGeneratingCourseQuiz ? (
                    <div className="flex flex-col items-center justify-center py-2" id="ai-course-loader">
                      <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-xs font-bold text-blue-800 font-mono">Trí tuệ nhân tạo đang phân tích toàn bộ giáo trình và soạn đề thi...</span>
                    </div>
                  ) : (
                    <button
                      onClick={generateCourseQuizWithAi}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3 rounded-lg border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all text-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      ⚡ Sinh Đề Kiểm Tra Tổng Hợp Toàn Khóa học
                    </button>
                  )}

                  {courseGenerationError && (
                    <p className="text-red-600 text-xs mt-3 font-semibold font-mono bg-red-50 p-2 rounded border border-red-200 max-w-md mx-auto">
                      {courseGenerationError}
                    </p>
                  )}
                </div>

                {/* COURSE METRICS & INFRASTRUCTURE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-left">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">CƠ CẤU CHƯƠNG HỌC</div>
                    <div className="text-2xl font-black text-gray-800">{course.modules.length} Chương (Modules)</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-left">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">TỔNG SỐ BÀI HỌC</div>
                    <div className="text-2xl font-black text-gray-800">
                      {course.modules.reduce((acc, curr) => acc + curr.items.filter(i => i.type === 'lesson').length, 0)} Bài học (Lessons)
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-left">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">ĐỀ TỔNG HỢP HIỆN TẠI</div>
                    <div className="text-2xl font-black text-gray-800">{(course.courseQuizzes || []).length} Đề thi</div>
                  </div>
                </div>

                {/* MANAGE COURSE EXAMS SECTION */}
                <div className="text-left">
                  <h5 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
                    Danh Sách Đề Thi Toàn Khóa Đang Hoạt Động ({(course.courseQuizzes || []).length})
                  </h5>
                  {(course.courseQuizzes || []).length === 0 ? (
                    <div className="text-center py-10 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                      <Award className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-bounce" />
                      <p className="text-sm font-semibold text-gray-500">Chưa có đề trắc nghiệm toàn khóa nào.</p>
                      <p className="text-xs text-gray-400 mt-1">Hãy nhấn nút Sinh bằng AI ở trên để bắt đầu tạo ra bài kiểm tra toàn diện nhất.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(course.courseQuizzes || []).map(cq => (
                        <div 
                          key={cq.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-xs transition-all text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <h6 className="font-bold text-sm text-gray-900 truncate flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-blue-600 shrink-0" />
                              {cq.title}
                            </h6>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {cq.quiz?.description || "Final comprehensive assessment containing multi-concept scenario questions."}
                            </p>
                            {cq.quiz?.settings && (
                              <div className="flex gap-4 mt-2 text-[10px] font-bold text-[#8a8f98] font-mono">
                                <span>POINTS: {cq.quiz.settings.totalPoints}đ</span>
                                <span>DIFFICULTY: {cq.quiz.settings.targetDifficulty || "Advanced"}</span>
                                <span>TIME LIMIT: {cq.quiz.settings.timeLimit || 20} mins</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <button
                              onClick={() => {
                                setIsCourseOverviewActive(false);
                                setActiveModuleId('');
                                setActiveItemId(cq.id);
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-all cursor-pointer"
                            >
                              Biên soạn câu hỏi
                            </button>
                            <button
                              onClick={(e) => deleteCourseItem(cq.id, e)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0 cursor-pointer"
                              title="Xóa đề thi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (!isCourseOverviewActive && activeItemId === '') ? (
              /* MODULE OVERVIEW DASHBOARD VIEW */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8" id="module-overview">
                {/* Module Header Title (Editable) */}
                <div className="border-b border-gray-200 pb-5 mb-6">
                  <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-extrabold mb-1">
                    Workspace Module
                  </div>
                  <input 
                    type="text"
                    value={activeModule?.title || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      const updatedModules = course.modules.map(mod => {
                        if (mod.id !== activeModuleId) return mod;
                        return { ...mod, title: text };
                      });
                      onUpdateCourse({ ...course, modules: updatedModules });
                    }}
                    className="text-3xl font-extrabold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-[#0ac75f] focus:outline-none w-full bg-transparent px-0 py-1 transition-colors outline-none"
                  />
                </div>

                {/* AI GENERATION TRIGGER TRIGGER CARD - HEAVILY PROMINENT AT TOP */}
                <div className="bg-gradient-to-br from-[#f8fdfa] to-[#edf9f3] border-2 border-dashed border-[#0ac75f]/40 rounded-xl p-6 mb-8 text-center" id="ai-module-generator">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                    <Sparkles className="w-6 h-6 text-[#0ac75f]" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">⚡ Trình tạo câu hỏi trắc nghiệm AI (Module-Level)</h4>
                  <p className="text-gray-600 text-sm max-w-lg mx-auto mb-4 leading-normal font-medium">
                    Synthesize direct exam-style practice questions for <strong>{activeModule?.title}</strong>. Gemini analyzes all the lessons in this chapter and proposes a comprehensive question bank!
                  </p>

                  {isGeneratingModuleQuiz ? (
                    <div className="flex flex-col items-center justify-center py-2" id="ai-module-loader">
                      <div className="w-6 h-6 border-3 border-[#0ac75f] border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-xs font-bold text-[#00662d] font-mono">Đang soạn câu hỏi AI...</span>
                    </div>
                  ) : (
                    <button
                      onClick={generateModuleQuizWithAi}
                      className="bg-[#0ac75f] hover:bg-[#00e066] text-black font-extrabold px-5 py-2.5 rounded-lg border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all text-xs cursor-pointer inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-black" />
                      Sinh Ngân hàng câu hỏi AI cho Module này
                    </button>
                  )}

                  {generationError && (
                    <p className="text-red-600 text-xs mt-3 font-semibold font-mono bg-red-50 p-2 rounded border border-red-200 max-w-md mx-auto">
                      {generationError}
                    </p>
                  )}
                </div>

                {/* LESSONS AND QUIZZES IN THIS MODULE */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h5 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider">
                      Bài học & Trắc nghiệm trong Module ({activeModule?.items.length || 0})
                    </h5>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (!activeModule) return;
                          const newLesson: CourseItem = {
                            id: `lesson_${Date.now()}`,
                            title: `Lesson ${activeModule.items.filter(i => i.type === 'lesson').length + 1}: New Topic Study`,
                            type: 'lesson',
                            content: '### New Study Material\n\nPlease write your lesson coverage guidelines here. Use standard Markdown styles.'
                          };
                          const updatedModules = course.modules.map(mod => {
                            if (mod.id !== activeModule.id) return mod;
                            return { ...mod, items: [...mod.items, newLesson] };
                          });
                          onUpdateCourse({ ...course, modules: updatedModules });
                          setActiveItemId(newLesson.id);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-white text-gray-700 border border-gray-300 rounded hover:border-black transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Lesson
                      </button>
                      <button 
                        onClick={() => {
                          if (!activeModule) return;
                          const newQuiz: CourseItem = {
                            id: `quiz_manual_${Date.now()}`,
                            title: `Quiz ${activeModule.items.filter(i => i.type === 'quiz').length + 1}: Practice Assessment`,
                            type: 'quiz',
                            quiz: {
                              id: `quiz_man_obj_${Date.now()}`,
                              title: `Practice Quiz`,
                              description: 'Evaluate your learning outcomes.',
                              settings: {
                                totalPoints: 1,
                                targetDifficulty: 'Intermediate',
                                timeLimit: 10,
                                shuffleQuestions: true,
                                shuffleOptions: false
                              },
                              questions: [
                                {
                                  id: `q_man_${Date.now()}`,
                                  type: 'multiple-choice',
                                  text: 'Type your question here...',
                                  options: ['Option A', 'Option B', 'Option C'],
                                  correctOptionIndex: 0,
                                  points: 1,
                                  required: true
                                }
                              ]
                            }
                          };
                          const updatedModules = course.modules.map(mod => {
                            if (mod.id !== activeModule.id) return mod;
                            return { ...mod, items: [...mod.items, newQuiz] };
                          });
                          onUpdateCourse({ ...course, modules: updatedModules });
                          setActiveItemId(newQuiz.id);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-white text-gray-700 border border-gray-300 rounded hover:border-black transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Quiz
                      </button>
                    </div>
                  </div>

                  {activeModule?.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 font-semibold text-sm border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                      Chưa có mục nào được thêm vào Module này.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Section 1: LESSONS & ATTACHED PRACTICE QUIZZES */}
                      <div className="space-y-3">
                        <div className="text-xs font-extrabold text-[#00662d] uppercase tracking-wider mb-2 text-left">
                          📖 Bài Học & Bài Tập Đi Kèm
                        </div>
                        {activeModule?.items.filter(i => i.type === 'lesson').length === 0 ? (
                          <p className="text-xs text-gray-400 italic text-left">Chưa có bài học nào được sinh ra.</p>
                        ) : (
                          activeModule?.items.filter(i => i.type === 'lesson').map((lesson) => {
                            const lessonAttachedQuizzes = activeModule?.items.filter(
                              i => i.type === 'quiz' && i.quizScope === 'lesson' && i.parentLessonId === lesson.id
                            ) || [];

                            return (
                              <div key={lesson.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3 text-left">
                                <div className="flex items-center justify-between group">
                                  <div 
                                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                    onClick={() => setActiveItemId(lesson.id)}
                                  >
                                    <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                                    <h6 className="font-extrabold text-sm text-gray-900 group-hover:text-[#00662d] truncate">
                                      {lesson.title}
                                    </h6>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await generateLessonQuizWithAi(lesson.id);
                                      }}
                                      title="Sinh trắc nghiệm AI dựa vào nội dung bài học này"
                                      className="flex items-center gap-1 bg-[#edf9f3] text-[#00662d] hover:bg-green-150 px-2.5 py-1 rounded text-[11px] font-extrabold border border-green-200 cursor-pointer shadow-3xs"
                                    >
                                      <Sparkles className="w-3 h-3 text-[#0ac75f]" />
                                      Sinh trắc nghiệm AI
                                    </button>
                                    <button 
                                      onClick={(e) => deleteCourseItem(lesson.id, e)}
                                      className="p-1 text-gray-450 hover:text-red-500 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* INDENTED LESSON QUIZZES RENDERING */}
                                {lessonAttachedQuizzes.length > 0 ? (
                                  <div className="pl-6 border-l border-green-100 ml-2 space-y-2">
                                    {lessonAttachedQuizzes.map(quizItem => (
                                      <div
                                        key={quizItem.id}
                                        onClick={() => setActiveItemId(quizItem.id)}
                                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-green-50/30 border border-gray-200 hover:border-green-300 cursor-pointer transition-all text-xs"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <span>❓</span>
                                          <span className="font-bold text-gray-700 truncate">{quizItem.title}</span>
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/60 px-1.5 py-0.2 rounded shrink-0">
                                            Lesson Quiz
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                          <span className="text-[10px] text-gray-400 font-mono font-bold">
                                            {quizItem.quiz?.questions.length || 0} CH
                                          </span>
                                          <button 
                                            onClick={(e) => deleteCourseItem(quizItem.id, e)}
                                            className="p-1 text-gray-300 hover:text-red-500 rounded cursor-pointer"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-400 italic pl-6">Chưa có trắc nghiệm rèn luyện cho bài học này. Hãy nhấn Nút Sinh AI ở trên để tạo.</p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Section 2: COMPREHENSIVE MODULE EVALUATION QUIZZES */}
                      <div className="mt-6 space-y-3">
                        <div className="text-xs font-extrabold text-amber-800 uppercase tracking-wider mb-2 text-left">
                          🎯 Trắc Nghiệm Đánh Giá Chương (Module Quiz)
                        </div>
                        {activeModule?.items.filter(i => i.type === 'quiz' && i.quizScope === 'module').length === 0 ? (
                          <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                            <p className="text-xs text-gray-500 font-medium">Chưa có bài trắc nghiệm tổng hợp chương nào.</p>
                            <button
                              onClick={generateModuleQuizWithAi}
                              className="mt-2 text-xs font-bold text-[#00662d] hover:underline cursor-pointer inline-flex items-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Sinh bài kiểm tra chương bằng AI ngay
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {activeModule?.items.filter(i => i.type === 'quiz' && i.quizScope === 'module').map((mq) => (
                              <div
                                key={mq.id}
                                onClick={() => setActiveItemId(mq.id)}
                                className="flex items-center justify-between p-4 bg-white border border-gray-200 hover:border-amber-400 rounded-xl cursor-pointer transition-all group/mq text-left"
                              >
                                <div className="min-w-0 flex-1">
                                  <h6 className="font-extrabold text-sm text-gray-900 group-hover/mq:text-amber-900 truncate flex items-center gap-2">
                                    <span>🏆</span>
                                    {mq.title}
                                  </h6>
                                  <p className="text-[10px] text-gray-450 mt-1 uppercase font-bold tracking-wider font-mono">
                                    Tổng kiểm tra chương • {mq.quiz?.questions.length || 0} câu hỏi
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                  <button
                                    onClick={() => setActiveItemId(mq.id)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-amber-850 bg-amber-50 hover:bg-amber-100 rounded transition-all cursor-pointer"
                                  >
                                    Biên soạn
                                  </button>
                                  <button 
                                    onClick={(e) => deleteCourseItem(mq.id, e)}
                                    className="p-1 text-gray-400 hover:text-red-550 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeItem?.type === 'quiz' && activeItem.quiz ? (
              /* ACTIVE QUIZ FORM FLOW VIEW (Screen 2 Mockups style) */
              <>
                {/* AI Error dialog */}
                {aiError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4 flex gap-3 text-sm animate-pulse">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                    <div>
                      <h4 className="font-bold">AI Revision Interrupted</h4>
                      <p>{aiError}</p>
                    </div>
                  </div>
                )}

                {/* Quiz Title & Header block */}
                <div className="bg-white rounded-lg border-t-8 border-t-[#0ac75f] border-l border-r border-b border-gray-200 shadow-xs p-6">
                  <input 
                    type="text"
                    value={activeItem.quiz.title}
                    onChange={(e) => {
                      const text = e.target.value;
                      updateActiveQuiz(q => ({ ...q, title: text }));
                    }}
                    placeholder="Quiz Title"
                    className="w-full text-3xl font-extrabold border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-[#0ac75f] focus:ring-0 px-0 py-1 bg-transparent transition-colors outline-none"
                  />
                  <textarea 
                    value={activeItem.quiz.description}
                    onChange={(e) => {
                      const text = e.target.value;
                      updateActiveQuiz(q => ({ ...q, description: text }));
                    }}
                    placeholder="Quiz Description"
                    rows={2}
                    className="w-full mt-2 text-sm text-gray-600 border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-[#0ac75f] focus:ring-0 px-0 py-1 bg-transparent resize-none transition-colors outline-none font-medium"
                  />
                </div>

                {/* Questions card list */}
                <div className="space-y-4" id="cards-flow">
                  {activeItem.quiz.questions.map((question, qIdx) => {
                    const isActive = activeQuestionId === question.id;
                    const isAiLoading = aiLoadingQuestionId === question.id;

                    return (
                      <div 
                        key={question.id}
                        onClick={() => setActiveQuestionId(question.id)}
                        className={`bg-white rounded-lg border transition-all ${
                          isActive 
                            ? 'border-2 border-[#0ac75f] shadow-md relative' 
                            : 'border-gray-200 shadow-xs hover:shadow-sm cursor-pointer'
                        }`}
                      >
                        {/* Active vertical border bar */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0ac75f] rounded-l-lg"></div>
                        )}

                        {/* Floating Action toolbar on active state card */}
                        {isActive && (
                          <div className="absolute -right-13 top-0 flex flex-col gap-2 bg-white border border-gray-200 rounded-md shadow-sm p-1 z-20">
                            {/* Auto Awesome popup toggle button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setAiPopoverQuestionId(aiPopoverQuestionId === question.id ? '' : question.id);
                              }}
                              title="Improve with AI Help!"
                              className="p-1.5 text-gray-500 hover:text-[#0ac75f] hover:bg-green-50 rounded transition-all cursor-pointer relative"
                            >
                              <Sparkles className="w-5 h-5 text-[#0ac75f] fill-green-50 animate-pulse" />
                              
                              {/* AI Popover menu popup directly matching Screen 2 structure */}
                              {aiPopoverQuestionId === question.id && (
                                <div className="absolute top-0 right-10 mt-0 bg-white border border-gray-200 rounded-md shadow-lg w-48 z-40 p-1 flex flex-col animate-[fadeIn_0.15s_ease-out] text-left">
                                  <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">AI Actions</div>
                                  <button 
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      executeAiAction(question.id, 'make-harder');
                                    }}
                                    className="text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded text-gray-800 flex items-center gap-2 cursor-pointer font-bold"
                                  >
                                    <TrendingUp className="w-4 h-4 text-gray-400 stroke-[2.2]" />
                                    Make harder
                                  </button>
                                  <button 
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      executeAiAction(question.id, 'make-simpler');
                                    }}
                                    className="text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded text-gray-800 flex items-center gap-2 cursor-pointer font-bold"
                                  >
                                    <TrendingDown className="w-4 h-4 text-gray-400 stroke-[2.2]" />
                                    Make simpler
                                  </button>
                                  <button 
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      executeAiAction(question.id, 'fix-grammar');
                                    }}
                                    className="text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded text-gray-800 flex items-center gap-2 cursor-pointer font-bold"
                                  >
                                    <SpellCheck className="w-4 h-4 text-gray-400 stroke-[2.2]" />
                                    Fix grammar
                                  </button>
                                </div>
                              )}
                            </button>
                            <div className="h-px bg-gray-200 mx-1"></div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateQuestion(question.id);
                              }}
                              title="Duplicate question"
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                            >
                              <Copy className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuestion(question.id);
                              }}
                              title="Delete question"
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        )}

                        {/* Rendering loading overlay */}
                        {isAiLoading && (
                          <div className="absolute inset-0 bg-white/80 z-30 flex flex-col items-center justify-center rounded-lg">
                            <Sparkles className="w-8 h-8 text-[#0ac75f] animate-spin mb-2" />
                            <p className="text-xs font-bold text-gray-800 font-mono">Gemini refining question...</p>
                          </div>
                        )}

                        {/* Core Question Card Interior */}
                        <div className="p-6">
                          <div className="flex gap-4">
                            <div className="text-gray-700 font-extrabold mt-2 text-sm">{qIdx + 1}.</div>
                            <div className="flex-1">
                              {isActive ? (
                                /* In-Edit Question Textarea */
                                <textarea
                                  value={question.text}
                                  onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                                  placeholder="Type your question here..."
                                  rows={2}
                                  className="w-full text-base text-gray-900 border-0 bg-gray-50 hover:bg-gray-100/75 rounded-md p-3 focus:ring-1 focus:ring-[#0ac75f] focus:bg-white transition-colors outline-none resize-none font-semibold leading-normal"
                                />
                              ) : (
                                /* Read-only text display */
                                <p className="text-gray-900 font-bold mb-4 text-base leading-snug">{question.text}</p>
                              )}

                              {/* Question Options Block */}
                              <div className="mt-4 space-y-3" onClick={(e) => !isActive && e.stopPropagation()}>
                                {/* Render Multiple Choice / Boolean Choices */}
                                {question.type !== 'essay' && question.options ? (
                                  <>
                                    <div className="space-y-2">
                                      {question.options.map((option, idx) => {
                                        const isCorrect = question.correctOptionIndex === idx;
                                        return (
                                          <div key={idx} className="flex items-center gap-3 group/opt">
                                            <input 
                                              type="radio"
                                              checked={isCorrect}
                                              onChange={() => handleQuestionConfigChange(question.id, { correctOptionIndex: idx })}
                                              className="w-4 h-4 text-[#0ac75f] border-gray-300 focus:ring-[#0ac75f] cursor-pointer"
                                            />
                                            {isActive ? (
                                              /* Editable choice input */
                                              <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => handleOptionChange(question.id, idx, e.target.value)}
                                                className={`flex-1 text-sm border-0 border-b border-transparent hover:border-gray-300 focus:border-[#0ac75f] focus:ring-0 px-0 py-0.5 bg-transparent transition-colors outline-none ${
                                                  isCorrect ? 'font-bold text-gray-900' : 'text-gray-600'
                                                }`}
                                              />
                                            ) : (
                                              /* Read only label */
                                              <span className={`text-sm ${isCorrect ? 'font-bold text-[#00662d] bg-green-50 px-2 py-0.5 rounded' : 'text-gray-600'}`}>
                                                {option}
                                              </span>
                                            )}

                                            {/* Close option cross button */}
                                            {isActive && question.options && question.options.length > 2 && (
                                              <button 
                                                onClick={() => removeOption(question.id, idx)}
                                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-opacity p-0.5"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Add Option text CTA */}
                                    {isActive && (
                                      <div className="flex items-center gap-3 pt-2">
                                        <div className="w-4 h-4 rounded-full border border-gray-300 border-dashed flex items-center justify-center shrink-0"></div>
                                        <button 
                                          onClick={() => addOption(question.id)}
                                          className="text-xs text-gray-500 hover:text-gray-900 font-bold cursor-pointer"
                                        >
                                          Add Option
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  /* Essay free text reply display box in macro card */
                                  <div className="bg-gray-50 border border-gray-200 rounded p-4 text-xs">
                                    <div className="text-gray-400 font-bold uppercase mb-1 tracking-wider text-[10px]">Grading Rubric Hint / Best Answer:</div>
                                    {isActive ? (
                                      <input 
                                        type="text"
                                        value={question.correctAnswer || ''}
                                        onChange={(e) => handleQuestionConfigChange(question.id, { correctAnswer: e.target.value })}
                                        placeholder="Add comparative rubric requirements for full points..."
                                        className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded p-1.5 focus:border-[#0ac75f] focus:ring-0 outline-none mt-1 font-mono"
                                      />
                                    ) : (
                                      <p className="text-gray-600 italic font-medium">{question.correctAnswer || "Provide structured analysis of policy effects."}</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Question Card controls footer bar */}
                              <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                                    <input 
                                      type="checkbox"
                                      checked={question.required}
                                      onChange={(e) => handleQuestionConfigChange(question.id, { required: e.target.checked })}
                                      className="rounded text-[#0ac75f] focus:ring-[#0ac75f] border-gray-300 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    Required
                                  </label>
                                  <div className="w-px h-4 bg-gray-200"></div>
                                  <span className="flex items-center gap-1 font-bold">
                                    Pts:{' '}
                                    <input 
                                      type="number"
                                      value={question.points}
                                      onChange={(e) => handleQuestionConfigChange(question.id, { points: Math.max(0, parseInt(e.target.value) || 0) })}
                                      className="w-10 px-1 py-0.5 border border-gray-300 rounded text-center text-xs focus:ring-[#0ac75f] focus:border-[#0ac75f] outline-none bg-white"
                                    />
                                  </span>
                                </div>
                                <span className="text-[10px] uppercase tracking-wider font-bold bg-[#f4f5f6] text-gray-500 px-2 py-0.5 rounded">
                                  {question.type === 'multiple-choice' && 'Multiple Choice'}
                                  {question.type === 'true-false' && 'True / False'}
                                  {question.type === 'essay' && 'Short Essay'}
                                </span>
                              </div>

                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Question generation buttons at bottom center */}
                <div className="flex justify-center gap-3 py-4">
                  <button 
                    onClick={addBlankQuestion}
                    className="flex items-center gap-2 bg-white border border-gray-200 hover:border-black text-[#111827] text-sm font-bold py-2 px-5 rounded-md hover:shadow-xs transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Add Blank
                  </button>
                  <button 
                    onClick={() => {
                      // Call client quiz helper to append simulated topic questions
                      const added: Question = {
                        id: `q_ai_${Date.now()}`,
                        type: 'multiple-choice',
                        text: `Evaluate the primary impact of structural constraints on export values for local currencies.`,
                        options: ['Devalues national currency parity', 'Generates export surplus', 'Balances out capital indexes'],
                        correctOptionIndex: 0,
                        points: 1,
                        required: true
                      };
                      updateActiveQuiz(quiz => ({
                        ...quiz,
                        questions: [...quiz.questions, added]
                      }));
                      setActiveQuestionId(added.id);
                    }}
                    className="flex items-center gap-2 bg-green-50 border border-[#0ac75f]/30 hover:border-[#0ac75f] text-green-800 text-sm font-bold py-2 px-5 rounded-md hover:bg-green-100 transition-all cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-4 h-4 text-[#0ac75f]" />
                    Generate Question
                  </button>
                </div>
              </>
            ) : (
              /* LESSON CONTENT MODE */
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8" id="lesson-workspace">
                <article className="prose prose-slate max-w-none">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 px-3 py-1.5 rounded text-green-800 font-bold w-fit animate-pulse">
                      <BookOpen className="w-4 h-4 text-[#0ac75f]" />
                      <span>Structured Reading Lesson Material</span>
                    </div>

                    {/* Quick generation trigger inside active lesson view */}
                    {isGeneratingLessonQuiz ? (
                      <div className="flex items-center gap-2 text-xs font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
                        <div className="w-3.5 h-3.5 border-2 border-[#0ac75f] border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tạo ngân học câu hỏi AI...</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateLessonQuizWithAi(activeItem!.id)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-[#0ac75f]/40 hover:border-[#0ac75f] text-[#00662d] font-extrabold text-xs px-3 py-1.5 rounded-md hover:bg-green-100 transition-all cursor-pointer shadow-xs"
                        title="Sinh bài trắc nghiệm trắc nghiệm AI dựa trên nội dung bài viết dưới"
                      >
                        <Sparkles className="w-4 h-4 text-[#0ac75f]" />
                        ⚡ Sinh trắc nghiệm AI (cho Lesson)
                      </button>
                    )}
                  </div>
                  
                  <input 
                    type="text"
                    value={activeItem?.title || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      const updatedModules = course.modules.map(mod => {
                        if (mod.id !== activeModuleId) return mod;
                        return {
                          ...mod,
                          items: mod.items.map(item => item.id === activeItemId ? { ...item, title: text } : item)
                        };
                      });
                      onUpdateCourse({ ...course, modules: updatedModules });
                    }}
                    className="text-3xl font-extrabold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-[#0ac75f] focus:ring-0 w-full px-0 py-1 transition-colors outline-none bg-transparent mb-4"
                  />

                  <div className="text-sm text-gray-500 font-bold mb-4">Edit Reading Body:</div>
                  <textarea
                    value={activeItem?.content || ''}
                    rows={12}
                    onChange={(e) => {
                      const text = e.target.value;
                      const updatedModules = course.modules.map(mod => {
                        if (mod.id !== activeModuleId) return mod;
                        return {
                          ...mod,
                          items: mod.items.map(item => item.id === activeItemId ? { ...item, content: text } : item)
                        };
                      });
                      onUpdateCourse({ ...course, modules: updatedModules });
                    }}
                    className="w-full text-sm font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-4 focus:ring-1 focus:ring-[#0ac75f] focus:bg-white outline-none resize-y min-h-[300px]"
                  />
                </article>
              </div>
            )}
          </div>
        </main>

        {/* PANEL 3: Right Quiz Settings Panel Layout directly matching Screen 2 */}
        <aside className="w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0" id="quiz-settings-panel">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-bold text-sm text-[#111827]">Quiz Settings</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Quick calculations stats summary card */}
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200" id="quiz-stats-summary">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Total Points</div>
                  <div className="text-xl font-extrabold text-gray-900 font-mono">
                    {activeItem?.type === 'quiz' && activeItem.quiz
                      ? activeItem.quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0)
                      : 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Questions</div>
                  <div className="text-xl font-extrabold text-gray-900 font-mono">
                    {activeItem?.type === 'quiz' && activeItem.quiz ? activeItem.quiz.questions.length : 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick configurations list inputs */}
            {activeItem?.type === 'quiz' && activeItem.quiz ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Target Difficulty</label>
                  <select 
                    value={activeItem.quiz.settings.targetDifficulty}
                    onChange={(e) => handleSettingChange('targetDifficulty', e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md shadow-xs text-sm py-1.5 px-3 focus:ring-[#0ac75f] focus:border-[#0ac75f] bg-white text-gray-900 outline-none font-medium cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Time Limit (mins)</label>
                  <input 
                    type="number"
                    value={activeItem.quiz.settings.timeLimit}
                    onChange={(e) => handleSettingChange('timeLimit', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md shadow-xs text-sm py-1.5 px-3 focus:ring-[#0ac75f] focus:border-[#0ac75f] bg-white text-gray-900 outline-none font-mono"
                  />
                </div>

                {/* Custom toggle style check sliders */}
                <div className="pt-2">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-semibold text-gray-800">Shuffle Questions</span>
                    <div className="relative">
                      <input 
                        type="checkbox"
                        checked={activeItem.quiz.settings.shuffleQuestions}
                        onChange={(e) => handleSettingChange('shuffleQuestions', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ac75f]"></div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-semibold text-gray-800">Shuffle Options</span>
                    <div className="relative">
                      <input 
                        type="checkbox"
                        checked={activeItem.quiz.settings.shuffleOptions}
                        onChange={(e) => handleSettingChange('shuffleOptions', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ac75f]"></div>
                    </div>
                  </label>
                </div>

                {/* Floating Preview Quiz Primary Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button 
                    onClick={() => onPreviewQuiz(activeItem.quiz!)}
                    className="w-full flex justify-center items-center gap-2 py-2.5 bg-black hover:bg-gray-900 text-white text-sm font-bold rounded-md transition-colors shadow-sm cursor-pointer"
                  >
                    <Eye className="w-5 h-5 text-gray-300" />
                    Preview Quiz
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400 font-bold">
                No active quiz selected. Select a Quiz item from the tree on the left to edit its parameters.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
