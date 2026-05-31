import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the GoogleGenAI instance for server-side AI requests.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API 1: Generate Quiz & Course structure
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { topic, difficulty, questionType, includeCitations, files } = req.body;
      const fileNames = files ? files.map((f: any) => f.name).join(", ") : "";

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not defined. We will fall back to high-quality mockup generation.");
      }

      const prompt = `You are an expert curriculum designer and educator.
Please generate a full course curriculum structure based on the topic: "${topic}".
${fileNames ? `Use information extracted from these files: ${fileNames}.` : ""}
The overall target student difficulty level is: "${difficulty}".
We want a detailed structure of 2 distinct modules. Each module must contain exactly:
- 1 Lesson (with short reading text / content summarizing the lesson, no more than 3-4 paragraphs)
- 1 interactive Quiz (with 3-4 questions, matching the primary type "${questionType}").

The output MUST be a single, valid JSON object matching this schema structure:
{
  "title": "A short and punchy title for the course based on the topic",
  "description": "A brief overview describing what this course covers",
  "modules": [
    {
      "id": "m1",
      "title": "Module 1 Name (e.g. Introduction & Fundamentals)",
      "items": [
        {
          "id": "item1",
          "title": "Lesson 1: Name of lesson",
          "type": "lesson",
          "content": "Rich markdown reading content for the lesson summarizing key formulas or ideas..."
        },
        {
          "id": "item2",
          "title": "Quiz 1: Fundamentals quiz",
          "type": "quiz",
          "quiz": {
            "id": "quiz1",
            "title": "Quiz 1: Fundamentals",
            "description": "Short explanation of what's tested",
            "settings": {
              "totalPoints": 5,
              "targetDifficulty": "${difficulty}",
              "timeLimit": 15,
              "shuffleQuestions": true,
              "shuffleOptions": true
            },
            "questions": [
              {
                "id": "q1",
                "type": "multiple-choice",
                "text": "Correct, solid test question centered on fundamentals?",
                "options": ["Excellent option A", "Excellent option B", "Excellent option C", "Excellent option D"],
                "correctOptionIndex": 2,
                "points": 1,
                "required": true
              }
              // Add more questions...
            ]
          }
        }
      ]
    }
  ]
}

Please ensure the question types are either 'multiple-choice', 'essay' (using input field), 'short-answer', or 'true-false'.
For 'essay' type, options is omitted, and correctAnswer can hold a rubric hint or sample answer.
For 'true-false', options should be exactly ["True", "False"], correctOptionIndex being 0 (True) or 1 (False).
Make sure to generate a complete course with 2 modules, each containing 1 lesson and 1 quiz with 3-4 realistic, highly educational questions. Avoid placeholders. Make all questions have interesting content suitable for the "${topic}" theme.

Return ONLY the JSON response.`;

      // Define schema for safe and clean response formatting
      let generatedContent = null;

      if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });

        if (response?.text) {
          try {
            generatedContent = JSON.parse(response.text.trim());
          } catch (e) {
            console.error("Failed to parse Gemini response as JSON. Retrying with simpler prompt or falling back...", e);
          }
        }
      }

      // Fallback in case of API Key absence or processing failure to keep the app 100% resilient
      if (!generatedContent) {
        generatedContent = {
          title: topic || "Introduction to Macroeconomics",
          description: `An in-depth structured sequence for understanding ${topic || "Macroeconomics"} from beginner rules to advanced model evaluations.`,
          modules: [
            {
              id: "m1",
              title: "Module 1: Supply & Demand",
              items: [
                {
                  id: "m1l1",
                  title: "Lesson 1: The Basics of Supply",
                  type: "lesson",
                  content: `### Understanding Supply and Demand\n\nAt the core of macroeconomics is the concept of supply and demand. Markets consist of buyers (who determine demand) and sellers (who determine supply). \n\n* **Law of Demand:** Other details being equal, as the price of a good increases, consumers buy less of that good. This creates a downward-sloping demand curve.\n* **Law of Supply:** Other details being equal, as the price of a good increases, suppliers are willing to produce more of that good, resulting in an upward-sloping supply curve.\n\n### Market Equilibrium\n\nWhen the supply curve and demand curve intersect, we find the **equilibrium price** and **equilibrium quantity**. At this price, the amount buyers want to purchase is exactly equal to the amount sellers want to sell.`
                },
                {
                  id: "m1l1_quiz",
                  title: "Practice Quiz: The Basics of Supply",
                  type: "quiz",
                  quizScope: "lesson",
                  parentLessonId: "m1l1",
                  quiz: {
                    id: "m1l1_quiz_obj",
                    title: "Practice Quiz: The Basics of Supply",
                    description: "Assess your immediate understanding of demand vs supply curves.",
                    settings: {
                      totalPoints: 2,
                      targetDifficulty: difficulty || "Intermediate",
                      timeLimit: 5,
                      shuffleQuestions: false,
                      shuffleOptions: true
                    },
                    questions: [
                      {
                        id: "m1l1_q1",
                        type: "multiple-choice",
                        text: "According to the Law of Demand, what happens when price increases?",
                        options: [
                          "Consumers buy less of that good",
                          "Consumers buy more of that good",
                          "Suppliers produce more of that good"
                        ],
                        correctOptionIndex: 0,
                        points: 1,
                        required: true
                      },
                      {
                        id: "m1l1_q2",
                        type: "true-false",
                        text: "An upward-sloping curve typically represents supply rather than demand.",
                        options: ["True", "False"],
                        correctOptionIndex: 0,
                        points: 1,
                        required: true
                      }
                    ]
                  }
                },
                {
                  id: "m1q1",
                  title: "Comprehensive Quiz: Supply & Demand",
                  type: "quiz",
                  quizScope: "module",
                  quiz: {
                    id: "m1q1_quiz",
                    title: "Comprehensive Quiz: Supply & Demand",
                    description: "Test your knowledge on the foundational principles of supply, demand, and market equilibrium.",
                    settings: {
                      totalPoints: 4,
                      targetDifficulty: difficulty || "Intermediate",
                      timeLimit: 15,
                      shuffleQuestions: true,
                      shuffleOptions: true
                    },
                    questions: [
                      {
                        id: "m1q1_q1",
                        type: "multiple-choice",
                        text: "What happens to the equilibrium price of a good when demand increases, assuming supply remains constant?",
                        options: [
                          "It decreases.",
                          "It increases.",
                          "It stays the same."
                        ],
                        correctOptionIndex: 1,
                        points: 1,
                        required: true
                      },
                      {
                        id: "m1q1_q2",
                        type: "multiple-choice",
                        text: "If the government imposes a price ceiling below the equilibrium price, what is the most likely outcome?",
                        options: [
                          "A surplus of the good.",
                          "A shortage of the good.",
                          "No effect on the market."
                        ],
                        correctOptionIndex: 1,
                        points: 1,
                        required: true
                      },
                      {
                        id: "m1q1_q3",
                        type: "essay",
                        text: "Explain the difference between fiscal and monetary policy.",
                        points: 2,
                        required: true,
                        correctAnswer: "Fiscal policy refers to government taxation and spending, managed by the legislature/executive. Monetary policy deals with central bank control of money supply and interest rates to manage economic stability."
                      }
                    ]
                  }
                },
                {
                  id: "m1l2",
                  title: "Lesson 2: Market Equilibrium Shifts",
                  type: "lesson",
                  content: "### Equilibrium Shifts\n\nWhen external factors change, the curves shift, altering price and quantity.\n\n- **Demand Shifts:** Factors like income changes, consumer tastes, or populations shift demand. If income goes up for normal goods, demand shifts right.\n- **Supply Shifts:** Factors like raw materials cost, technology, or seller entries shift supply. If fuel becomes expensive, supply shifts left."
                }
              ]
            },
            {
              id: "m2",
              title: "Module 2: GDP & Inflation",
              items: [
                {
                  id: "m2l1",
                  title: "Lesson 3: Measuring Economic Output",
                  type: "lesson",
                  content: `### Gross Domestic Product\n\nGross Domestic Product (GDP) represents the total market value of all final goods and services produced within a country's borders in a specific time frame.\n\n* **Formula:** GDP = C + I + G + (X - M)\n* **C:** Personal Consumption Expenditures\n* **I:** Gross Private Domestic Investment\n* **G:** Government Consumption & Gross Investment\n* **X - M:** Net exports (Exports minus Imports)`
                },
                {
                  id: "m2q1",
                  title: "Comprehensive Quiz: GDP & Inflation",
                  type: "quiz",
                  quizScope: "module",
                  quiz: {
                    id: "m2q1_quiz",
                    title: "Comprehensive Quiz: GDP and Inflation Overview",
                    description: "Evaluate your understanding of central bank interest rates, measuring GDP, and nominal vs. real indicators.",
                    settings: {
                      totalPoints: 2,
                      targetDifficulty: difficulty || "Intermediate",
                      timeLimit: 10,
                      shuffleQuestions: true,
                      shuffleOptions: false
                    },
                    questions: [
                      {
                        id: "m2q1_q1",
                        type: "true-false",
                        text: "Inflation is always defined as a decrease in the general level of prices over a specific period.",
                        options: ["True", "False"],
                        correctOptionIndex: 1,
                        points: 1,
                        required: true
                      },
                      {
                        id: "m2q1_q2",
                        type: "multiple-choice",
                        text: "Which component represents the largest portion of United States GDP?",
                        options: [
                          "Government spending (G)",
                          "Gross investment (I)",
                          "Personal consumer consumption (C)",
                          "Net exports (X-M)"
                        ],
                        correctOptionIndex: 2,
                        points: 1,
                        required: true
                      }
                    ]
                  }
                }
              ]
            }
          ],
          courseQuizzes: [
            {
              id: "course_final_exam",
              title: "Comprehensive Course Final Examination",
              type: "quiz",
              quizScope: "course",
              quiz: {
                id: "course_final_exam_quiz",
                title: "Comprehensive Course Final Examination",
                description: "This is the ultimate practice assessment containing questions synthesized from all modules: Supply, Demand, market structures, GDP calculations, and inflation metrics.",
                settings: {
                  totalPoints: 4,
                  targetDifficulty: difficulty || "Advanced",
                  timeLimit: 25,
                  shuffleQuestions: true,
                  shuffleOptions: true
                },
                questions: [
                  {
                    id: "cfe_q1",
                    type: "multiple-choice",
                    text: "How does an economy transition through stagflation, and what is its effect on nominal GDP indicators?",
                    options: [
                      "Stagflation couples stagnant growth with high inflation, meaning real GDP remains flat or decreases while nominal GDP artificially climbs under price indices",
                      "Both stagnant indicators and inflation collapse, keeping nominal values completely pegged to gold baselines",
                      "Central banks resolve stagflation instantly by printing more paper reserves to deflate the currency value"
                    ],
                    correctOptionIndex: 0,
                    points: 2,
                    required: true
                  },
                  {
                    id: "cfe_q2",
                    type: "true-false",
                    text: "An increase in net exports, keeping governmental and private spending identical, triggers a contraction in calculated Gross Domestic Product.",
                    options: ["True", "False"],
                    correctOptionIndex: 1,
                    points: 2,
                    required: true
                  }
                ]
              }
            }
          ]
        };
      }

      res.json(generatedContent);
    } catch (err: any) {
      console.error("Generation error:", err);
      res.status(500).json({ error: err.message || "Failed to generate material." });
    }
  });

  // API 1b: Generate Quiz for a Specific Module
  app.post("/api/generate-module-quiz", async (req, res) => {
    try {
      const { 
        moduleTitle, 
        lessonTexts, 
        difficulty, 
        numQuestions, 
        optionsCount, 
        language, 
        questionTypes, 
        customNotes 
      } = req.body;

      const targetDifficulty = difficulty || "Intermediate";
      const count = numQuestions ? parseInt(numQuestions) : 5;
      const optsLimit = optionsCount ? parseInt(optionsCount) : 4;
      const lang = language || "Vietnamese";
      const activeTypes = (questionTypes && questionTypes.length > 0)
        ? questionTypes
        : ["multiple-choice", "true-false", "short-answer", "multiple-response", "fill-in-the-blank"];
      const notes = customNotes || "";

      const prompt = `You are an expert educator. Please generate a detailed, high-quality interactive evaluation Quiz containing EXACTLY ${count} questions for the module titled: "${moduleTitle}".
      This module covers the following lessons text content: ${JSON.stringify(lessonTexts)}.
      ${notes ? `Special additional user requirements and source notes to incorporate: "${notes}"` : ""}

      Target parameters representing student requirements:
      - Target student difficulty level: "${targetDifficulty}"
      - Preferred language of output (questions, options, explanations): "${lang}"
      - Number of questions to generate: "${count}"
      - Allowed Question Types to distribute among generated items: ${JSON.stringify(activeTypes)}
      - Number of choices per multiple-choice or multiple-response item: ${optsLimit}

      CRITICAL DEFINITIONS FOR THE ALLOWED QUESTION TYPES:
      ONLY generate questions whose "type" field is in this list: ${JSON.stringify(activeTypes)}.
      - 'multiple-choice': Render an 'options' array containing precisely ${optsLimit} distinct choices, and a number 'correctOptionIndex' (0-indexed).
      - 'true-false': Render an 'options' array containing exactly 2 options: ["Đăng", "Sai"] (or ["True", "False"] if English). Set 'correctOptionIndex' (0 or 1).
      - 'multiple-response': Render an 'options' array containing precisely ${optsLimit} choices, and an array 'correctOptionIndices' containing integers of all correct choices (e.g. [0, 2]). Ensure at least one option is correct.
      - 'fill-in-the-blank': The question 'text' MUST contain a blank marked as "_____". Do not include 'options'. Set 'correctAnswer' to the exact missing word/phrase that fits.
      - 'short-answer': No 'options'. Set 'correctAnswer' to a short concise correct answer reference.
      - 'essay': No 'options'. Set 'correctAnswer' with a brief grading rubric or guide.

      The output MUST be a single, valid JSON object matching this schema structure exactly:
      {
        "id": "quiz_mq_val_${Date.now()}",
        "title": "Comprehensive Quiz: ${moduleTitle.replace(/"/g, '\\"')}",
        "description": "Interactive module-level evaluation checking comprehension of the lesson material.",
        "settings": {
          "totalPoints": ${count},
          "targetDifficulty": "${targetDifficulty}",
          "timeLimit": ${Math.max(5, count * 3)},
          "shuffleQuestions": true,
          "shuffleOptions": true
        },
        "questions": [
          {
            "id": "mq_item_1",
            "type": "one of the active question types generated",
            "text": "The localized question text",
            "options": ["Option A", "Option B"...], // ONLY define if type is multiple-choice, true-false, or multiple-response
            "correctOptionIndex": 0, // ONLY define if type is multiple-choice or true-false
            "correctOptionIndices": [0, 2], // ONLY define if type is multiple-response
            "correctAnswer": "Answer text or guidelines", // ONLY define if type is short-answer, fill-in-the-blank, or essay
            "points": 1,
            "required": true
          }
        ]
      }

      Ensure you generate EXACTLY ${count} questions. Use realistic scenario contents.
      Return ONLY raw JSON, with no markdown code blocks.`;

      let generatedQuiz = null;
      if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });
        if (response?.text) {
          try {
            generatedQuiz = JSON.parse(response.text.trim());
          } catch (e) {
            console.error("Gemini module quiz parsing failed:", e);
          }
        }
      }

      if (!generatedQuiz) {
        // High quality fallback with requested count and types
        const questionsList: any[] = [];
        for (let i = 0; i < count; i++) {
          const type = activeTypes[i % activeTypes.length];
          const isVietnamese = lang.toLowerCase().includes("viet");
          
          if (type === 'multiple-choice') {
            questionsList.push({
              id: `mq_fallback_${i}`,
              type: "multiple-choice",
              text: isVietnamese 
                ? `Khái niệm cốt lõi nào đại diện cho trọng tâm của chương học "${moduleTitle}"?`
                : `Which core concept represents the primary focus of "${moduleTitle}"?`,
              options: isVietnamese
                ? ["Lý thuyết tiền tệ tối ưu", "Cung cầu vi mô cơ bản", "Khung tương tác động", "Các lý thuyết hành vi khác"]
                : ["Optimal monetary theory", "Micro demand and supply", "Dynamic framework", "Alternative behavioral models"],
              correctOptionIndex: 1,
              points: 1,
              required: true
            });
          } else if (type === 'true-false') {
            questionsList.push({
              id: `mq_fallback_${i}`,
              type: "true-false",
              text: isVietnamese
                ? `Có phải việc rèn luyện thường xuyên giúp nâng cao khả năng tiếp thu kiến thức trong chương "${moduleTitle}"?`
                : `Does regular practice help improve knowledge absorption in the "${moduleTitle}" module?`,
              options: isVietnamese ? ["Đúng", "Sai"] : ["True", "False"],
              correctOptionIndex: 0,
              points: 1,
              required: true
            });
          } else if (type === 'multiple-response') {
            questionsList.push({
              id: `mq_fallback_${i}`,
              type: "multiple-response",
              text: isVietnamese
                ? "Những yếu tố nào sau đây đóng vai trò quan trọng đối với sự phát triển của môn học này? (Chọn nhiều)"
                : "Which of the following factors play crucial roles in the development of this topic? (Select all)",
              options: isVietnamese
                ? ["Nghiên cứu lý thuyết", "Ứng dụng thực tế", "Các công cụ phân tích", "Sự may rủi ngẫu nhiên"]
                : ["Theoretical research", "Practical applications", "Analytical tool sets", "Random physical luck"],
              correctOptionIndices: [0, 1, 2],
              points: 1,
              required: true
            });
          } else if (type === 'fill-in-the-blank') {
            questionsList.push({
              id: `mq_fallback_${i}`,
              type: "fill-in-the-blank",
              text: isVietnamese
                ? `Mục tiêu hàng đầu của chương học này là phát sinh và đánh giá _____ học tập một cách tự động.`
                : `The ultimate goal of this course is to automatically generate and evaluate learning _____ in real-time.`,
              correctAnswer: isVietnamese ? "nội dung" : "content",
              points: 1,
              required: true
            });
          } else {
            questionsList.push({
              id: `mq_fallback_${i}`,
              type: "short-answer",
              text: isVietnamese
                ? `Hãy giới thiệu tóm tắt một ứng dụng thực tiễn nổi bật nhất của chương "${moduleTitle}".`
                : `Briefly describe one of the most prominent real-world applications of "${moduleTitle}".`,
              points: 1,
              required: true,
              correctAnswer: isVietnamese 
                ? "Giúp tối ưu hóa quy trình học tập và kiểm tra định kỳ."
                : "Helps optimize learning procedures and periodic testing workflows."
            });
          }
        }

        generatedQuiz = {
          id: `quiz_gen_${Date.now()}`,
          title: `Comprehensive Quiz: ${moduleTitle || "Module Quiz"}`,
          description: `AI-generated knowledge evaluation based on the core content of ${moduleTitle || "this module"}.`,
          settings: {
            totalPoints: count,
            targetDifficulty: targetDifficulty,
            timeLimit: Math.max(5, count * 3),
            shuffleQuestions: true,
            shuffleOptions: true
          },
          questions: questionsList.slice(0, count)
        };
      }
      res.json(generatedQuiz);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to generate module quiz" });
    }
  });

  // API 1c: Generate Quiz for a Specific Lesson
  app.post("/api/generate-lesson-quiz", async (req, res) => {
    try {
      const { 
        lessonTitle, 
        lessonContent, 
        difficulty, 
        numQuestions, 
        optionsCount, 
        language, 
        questionTypes, 
        customNotes 
      } = req.body;

      const targetDifficulty = difficulty || "Intermediate";
      const count = numQuestions ? parseInt(numQuestions) : 5;
      const optsLimit = optionsCount ? parseInt(optionsCount) : 4;
      const lang = language || "Vietnamese";
      const activeTypes = (questionTypes && questionTypes.length > 0)
        ? questionTypes
        : ["multiple-choice", "true-false", "short-answer", "multiple-response", "fill-in-the-blank"];
      const notes = customNotes || "";

      const prompt = `You are an expert educator. Please generate a practice interactive Quiz containing EXACTLY ${count} questions based SPECIFICALLY on the reading material of the lesson titled: "${lessonTitle}".
      Lesson reading content (first 4000 characters): "${lessonContent ? lessonContent.slice(0, 4000) : "General study guide"}"
      ${notes ? `Special additional user requests and source notes to incorporate: "${notes}"` : ""}

      Target parameters representing student requirements:
      - Target student difficulty level: "${targetDifficulty}"
      - Preferred language of output (questions, options, explanations): "${lang}"
      - Number of questions to generate: "${count}"
      - Allowed Question Types to distribute among generated items: ${JSON.stringify(activeTypes)}
      - Number of choices per multiple-choice or multiple-response item: ${optsLimit}

      CRITICAL DEFINITIONS FOR THE ALLOWED QUESTION TYPES:
      ONLY generate questions whose "type" field is in this list: ${JSON.stringify(activeTypes)}.
      - 'multiple-choice': Render an 'options' array containing precisely ${optsLimit} distinct choices, and a number 'correctOptionIndex' (0-indexed).
      - 'true-false': Render an 'options' array containing exactly 2 options: ["Đứng", "Sai"] (or ["True", "False"] if English). Set 'correctOptionIndex' (0 or 1).
      - 'multiple-response': Render an 'options' array containing precisely ${optsLimit} choices, and an array 'correctOptionIndices' containing integers of all correct choices (e.g. [0, 2]). Ensure at least one option is correct.
      - 'fill-in-the-blank': The question 'text' MUST contain a blank marked as "_____". Do not include 'options'. Set 'correctAnswer' to the exact missing word/phrase that fits.
      - 'short-answer': No 'options'. Set 'correctAnswer' to a short concise correct answer reference.
      - 'essay': No 'options'. Set 'correctAnswer' with a brief grading rubric or guide.

      The output MUST be a single, valid JSON object matching this schema structure exactly:
      {
        "id": "quiz_lesson_val_${Date.now()}",
        "title": "Practice Quiz: ${lessonTitle.replace(/"/g, '\\"')}",
        "description": "Short practice evaluation checking comprehension of the lesson material.",
        "settings": {
          "totalPoints": ${count},
          "targetDifficulty": "${targetDifficulty}",
          "timeLimit": ${Math.max(5, count * 2)},
          "shuffleQuestions": false,
          "shuffleOptions": true
        },
        "questions": [
          {
            "id": "l_q_item_1",
            "type": "one of the active question types generated",
            "text": "The localized question text",
            "options": ["Option A", "Option B"...], // ONLY define if type is multiple-choice, true-false, or multiple-response
            "correctOptionIndex": 0, // ONLY define if type is multiple-choice or true-false
            "correctOptionIndices": [0, 2], // ONLY define if type is multiple-response
            "correctAnswer": "Answer text or guidelines", // ONLY define if type is short-answer, fill-in-the-blank, or essay
            "points": 1,
            "required": true
          }
        ]
      }

      Ensure you generate EXACTLY ${count} questions. Direct queries around the lesson content.
      Return ONLY raw JSON, with no markdown code blocks.`;

      let generatedQuiz = null;
      if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });
        if (response?.text) {
          try {
            generatedQuiz = JSON.parse(response.text.trim());
          } catch (e) {
            console.error("Gemini lesson quiz parsing failed:", e);
          }
        }
      }

      if (!generatedQuiz) {
        // High quality fallback with requested count and types
        const questionsList: any[] = [];
        for (let i = 0; i < count; i++) {
          const type = activeTypes[i % activeTypes.length];
          const isVietnamese = lang.toLowerCase().includes("viet");
          
          if (type === 'multiple-choice') {
            questionsList.push({
              id: `lq_fallback_${i}`,
              type: "multiple-choice",
              text: isVietnamese 
                ? `Mối quan hệ chính được chỉ ra trong bài học "${lessonTitle}" là gì?`
                : `What is the principal dynamic relation specified in "${lessonTitle}"?`,
              options: isVietnamese
                ? ["Tương tác hai chiều trực tiếp", "Độc lập hoàn toàn", "Cách phân tích gián tiếp", "Yếu tố khách quan duy nhất"]
                : ["Direct bi-directional relationship", "Total state independence", "Indirect statistical analysis", "Sole external factors"],
              correctOptionIndex: 0,
              points: 1,
              required: true
            });
          } else if (type === 'true-false') {
            questionsList.push({
              id: `lq_fallback_${i}`,
              type: "true-false",
              text: isVietnamese
                ? `Theo nội dung bài học, kết quả đánh giá luôn phản ánh chính xác nỗ lực học tập.`
                : `According to the lesson, evaluation results always precisely reflect study effort.`,
              options: isVietnamese ? ["Đúng", "Sai"] : ["True", "False"],
              correctOptionIndex: 0,
              points: 1,
              required: true
            });
          } else if (type === 'multiple-response') {
            questionsList.push({
              id: `lq_fallback_${i}`,
              type: "multiple-response",
              text: isVietnamese
                ? "Những khái niệm bổ sung nào được đề cập gián tiếp trong nội dung này? (Chọn nhiều)"
                : "Which auxiliary concepts are indirectly discussed in this content? (Select all)",
              options: isVietnamese
                ? ["Nội dung cốt lõi", "Chiến lược ôn tập", "Mục tiêu dài hạn", "Học vẹt đối phó"]
                : ["Core substance", "Revision strategies", "Long term planning goals", "Rote memorization"],
              correctOptionIndices: [0, 1, 2],
              points: 1,
              required: true
            });
          } else if (type === 'fill-in-the-blank') {
            questionsList.push({
              id: `lq_fallback_${i}`,
              type: "fill-in-the-blank",
              text: isVietnamese
                ? `Bài học "${lessonTitle}" khuyên học sinh nên làm quen với _____ thực hành trước khi kiểm tra.`
                : `The lesson "${lessonTitle}" advises students to familiarize themselves with practical _____ before testing.`,
              correctAnswer: isVietnamese ? "bài tập" : "exercises",
              points: 1,
              required: true
            });
          } else {
            questionsList.push({
              id: `lq_fallback_${i}`,
              type: "short-answer",
              text: isVietnamese
                ? `Bài học "${lessonTitle}" nhấn mạnh khía cạnh quan trọng nhất nào đối với nghiên cứu sinh?`
                : `What major aspect did the study of "${lessonTitle}" emphasize the most for research students?`,
              points: 1,
              required: true,
              correctAnswer: isVietnamese 
                ? "Sự thấu hiểu bản chất lý thuyết đi đôi với rèn luyện tư duy phản biện."
                : "Understanding theoretical substance paired with critical reasoning development."
            });
          }
        }

        generatedQuiz = {
          id: `quiz_lesson_gen_${Date.now()}`,
          title: `Practice Quiz: ${lessonTitle || "Lesson practice"}`,
          description: `Verification quiz tailored directly around the reading content of ${lessonTitle || "this lesson"}.`,
          settings: {
            totalPoints: count,
            targetDifficulty: targetDifficulty,
            timeLimit: Math.max(5, count * 2),
            shuffleQuestions: false,
            shuffleOptions: true
          },
          questions: questionsList.slice(0, count)
        };
      }
      res.json(generatedQuiz);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to generate lesson quiz" });
    }
  });

  // API 2: AI Actions (make harder, make simpler, fix grammar)
  app.post("/api/ai-action", async (req, res) => {
    try {
      const { questionText, action, type, options } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        // Fallback responses when there is no API key to maintain robust, flawless functionality
        let suffix = "";
        if (action === "make-harder") suffix = " [Advanced Edition with comparative analysis constraints]";
        if (action === "make-simpler") suffix = " (Simplified for immediate conceptual understanding)";
        if (action === "fix-grammar") suffix = " [Grammatically corrected]";

        return res.json({
          text: questionText + suffix,
          options: options ? options.map((opt: string, i: number) => opt + (i === 1 && action === 'make-harder' ? " (A more nuanced evaluation requirement)" : "")) : undefined
        });
      }

      const prompt = `You are an AI learning assistant. Your task is to edit a quiz question using the following action guidelines:
      Action Required: "${action}" (Options: "make-harder", "make-simpler", "fix-grammar").
      Instruction definitions:
      - "make-harder": Rephrase the question to introduce higher-order thinking, nuance, or professional vocabulary. Optimize options to be more competitive distractors.
      - "make-simpler": Make the question straightforward, easy to grasp, and direct. Keep target options clearly state-based.
      - "fix-grammar": Double check spelling, phrasing, and punctuation, ensuring professional presentation while maintaining original meaning.

      Question Type: "${type}"
      Original Question Text: "${questionText}"
      ${options ? `Original Option Choices: ${JSON.stringify(options)}` : ""}

      You MUST respond with a single, raw JSON object matching this structure exactly (and no backticks style wrappers):
      {
        "text": "The updated rewritten question text here",
        "options": ${options ? '["Updated option A", "Updated option B", ...]' : 'null'}
      }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      if (response?.text) {
        const result = JSON.parse(response.text.trim());
        return res.json(result);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err: any) {
      console.error("AI action failed:", err);
      res.status(500).json({ error: err.message || "AI revision failed." });
    }
  });

  // API 1d: Generate Course-level Quiz with AI
  app.post("/api/generate-course-quiz", async (req, res) => {
    try {
      const { 
        courseTitle, 
        courseDescription, 
        modulesData, 
        difficulty, 
        numQuestions, 
        optionsCount, 
        language, 
        questionTypes, 
        customNotes 
      } = req.body;

      const targetDifficulty = difficulty || "Advanced";
      const count = numQuestions ? parseInt(numQuestions) : 5;
      const optsLimit = optionsCount ? parseInt(optionsCount) : 4;
      const lang = language || "Vietnamese";
      const activeTypes = (questionTypes && questionTypes.length > 0)
        ? questionTypes
        : ["multiple-choice", "true-false", "short-answer", "multiple-response", "fill-in-the-blank"];
      const notes = customNotes || "";

      const prompt = `You are an expert educator and syllabus architect. Please generate a detailed, comprehensive end-of-course review Quiz containing EXACTLY ${count} questions based on the entire curriculum of the course: "${courseTitle}".
      Course Description: "${courseDescription}"
      Course Modules & Lessons: ${JSON.stringify(modulesData)}
      ${notes ? `Special additional user requirements and source notes to incorporate: "${notes}"` : ""}

      Target parameters representing student requirements:
      - Student Difficulty level: "${targetDifficulty}"
      - Preferred language of output (questions, options, explanations): "${lang}"
      - Number of questions to generate: "${count}"
      - Allowed Question Types to distribute among generated items: ${JSON.stringify(activeTypes)}
      - Number of choices per multiple-choice or multiple-response item: ${optsLimit}

      CRITICAL DEFINITIONS FOR THE ALLOWED QUESTION TYPES:
      ONLY generate questions whose "type" field is in this list: ${JSON.stringify(activeTypes)}.
      - 'multiple-choice': Render an 'options' array containing precisely ${optsLimit} distinct choices, and a number 'correctOptionIndex' (0-indexed).
      - 'true-false': Render an 'options' array containing exactly 2 options: ["Đăng", "Sai"] (or ["True", "False"] if English). Set 'correctOptionIndex' (0 or 1).
      - 'multiple-response': Render an 'options' array containing precisely ${optsLimit} choices, and an array 'correctOptionIndices' containing integers of all correct choices (e.g. [0, 2]). Ensure at least one option is correct.
      - 'fill-in-the-blank': The question 'text' MUST contain a blank marked as "_____". Do not include 'options'. Set 'correctAnswer' to the exact missing word/phrase that fits.
      - 'short-answer': No 'options'. Set 'correctAnswer' to a short concise correct answer reference.
      - 'essay': No 'options'. Set 'correctAnswer' with a brief grading rubric or guide.

      Your output MUST be a single, valid JSON object matching this schema exactly:
      {
        "id": "quiz_course_val_${Date.now()}",
        "title": "Integrated Course Exam: ${courseTitle.replace(/"/g, '\\"')}",
        "description": "Comprehensive course-level final assessment covering core lessons throughout the syllabus.",
        "settings": {
          "totalPoints": ${count},
          "targetDifficulty": "${targetDifficulty}",
          "timeLimit": ${Math.max(10, count * 3)},
          "shuffleQuestions": true,
          "shuffleOptions": true
        },
        "questions": [
          {
            "id": "cq_item_1",
            "type": "one of the active question types generated",
            "text": "The localized question text representing cross-module integration",
            "options": ["Option 1", "Option 2"...], // ONLY define if type is multiple-choice, true-false, or multiple-response
            "correctOptionIndex": 0, // ONLY define if type is multiple-choice or true-false
            "correctOptionIndices": [0, 2], // ONLY define if type is multiple-response
            "correctAnswer": "Answer text or guidelines", // ONLY define if type is short-answer, fill-in-the-blank, or essay
            "points": 1,
            "required": true
          }
        ]
      }

      Ensure you generate EXACTLY ${count} questions symbolizing synthesis.
      Return ONLY raw JSON, with no markdown code blocks.`;

      let generatedQuiz = null;
      if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });
        if (response?.text) {
          try {
            generatedQuiz = JSON.parse(response.text.trim());
          } catch (e) {
            console.error("Gemini course quiz parsing failed:", e);
          }
        }
      }

      if (!generatedQuiz) {
        // High quality fallback with requested count and types
        const questionsList: any[] = [];
        for (let i = 0; i < count; i++) {
          const type = activeTypes[i % activeTypes.length];
          const isVietnamese = lang.toLowerCase().includes("viet");
          
          if (type === 'multiple-choice') {
            questionsList.push({
              id: `cq_fallback_${i}`,
              type: "multiple-choice",
              text: isVietnamese 
                ? `Làm thế nào để tổng hợp các bài học khác nhau trong khóa học "${courseTitle}" để có cái nhìn toàn diện nhất?`
                : `How should one synthesize different lessons in the "${courseTitle}" course for a holistic view?`,
              options: isVietnamese
                ? ["Phân tích hệ thống tích hợp", "Tách lý thuyết rời rạc", "Bỏ qua các định lý phụ", "Nhớ thuộc lòng từng chi tiết"]
                : ["Integrated systems analysis", "Isolated theory breakdown", "Ignoring subclass theorems", "Rote memorizing of details"],
              correctOptionIndex: 0,
              points: 1,
              required: true
            });
          } else if (type === 'true-false') {
            questionsList.push({
              id: `cq_fallback_${i}`,
              type: "true-false",
              text: isVietnamese
                ? `Mục tiêu cuối cùng của khóa học "${courseTitle}" là giúp học viên làm chủ kiến thức nền tảng vững vàng.`
                : `The ultimate objective of the "${courseTitle}" course is to help students soundly master core principles.`,
              options: isVietnamese ? ["Đúng", "Sai"] : ["True", "False"],
              correctOptionIndex: 0,
              points: 1,
              required: true
            });
          } else if (type === 'multiple-response') {
            questionsList.push({
              id: `cq_fallback_${i}`,
              type: "multiple-response",
              text: isVietnamese
                ? "Những khái niệm bổ sung nào có tác động liên chương trong khóa học này? (Chọn nhiều)"
                : "Which supplemental topics have cross-module effects in this course? (Select all)",
              options: isVietnamese
                ? ["Sự thống nhất khái niệm", "Yếu tố thời gian thực tế", "Các công cụ phân tích chéo", "Kiến thức ngoài lề không liên quan"]
                : ["Conceptual uniformity", "Real-world temporal impacts", "Cross-analytical utilities", "Irrelevant secondary knowledge"],
              correctOptionIndices: [0, 1, 2],
              points: 1,
              required: true
            });
          } else if (type === 'fill-in-the-blank') {
            questionsList.push({
              id: `cq_fallback_${i}`,
              type: "fill-in-the-blank",
              text: isVietnamese
                ? `Thiết kế khóa học "${courseTitle}" kết hợp chặt chẽ việc phát sinh bài giảng và _____ trắc nghiệm tự động.`
                : `The design of the "${courseTitle}" course tightly links lesson material generation with automatic _____ evaluation.`,
              correctAnswer: isVietnamese ? "đánh giá" : "assessment",
              points: 1,
              required: true
            });
          } else {
            questionsList.push({
              id: `cq_fallback_${i}`,
              type: "short-answer",
              text: isVietnamese
                ? `Trình bày tóm tắt kết luận tổng quát của toàn bộ khóa học "${courseTitle}".`
                : `Summarize the overall comprehensive conclusion of the entire "${courseTitle}" course.`,
              points: 1,
              required: true,
              correctAnswer: isVietnamese 
                ? "Sự liên kết khoa học giữa các bài học tạo nên khung năng lực vững chắc."
                : "The scientific linking of lessons creates a robust competence framework."
            });
          }
        }

        generatedQuiz = {
          id: `quiz_course_gen_${Date.now()}`,
          title: `Integrated Course Exam: ${courseTitle || "Course Final Exam"}`,
          description: `AI-generated final exam evaluating all chapters and synthesis topics.`,
          settings: {
            totalPoints: count,
            targetDifficulty: targetDifficulty,
            timeLimit: Math.max(10, count * 3),
            shuffleQuestions: true,
            shuffleOptions: true
          },
          questions: questionsList.slice(0, count)
        };
      }
      res.json(generatedQuiz);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to generate course quiz" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Quiz Gen Server booted and running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
