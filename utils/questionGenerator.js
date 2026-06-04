const questions = require('../data/questions');

// 打乱数组顺序的函数
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 打乱选择题选项并更新答案
function shuffleOptions(question) {
  const originalOptions = [...question.options];
  const originalAnswer = question.answer;
  
  // 创建选项和答案的配对
  const optionPairs = originalOptions.map((option, index) => ({
    option,
    isCorrect: index === originalAnswer
  }));
  
  // 打乱选项
  const shuffledPairs = shuffleArray(optionPairs);
  
  // 更新问题和答案
  question.options = shuffledPairs.map(pair => pair.option);
  question.answer = shuffledPairs.findIndex(pair => pair.isCorrect);
  
  return question;
}

// 随机选择一套题目
function selectRandomSet() {
  const setNumbers = ['set1', 'set2', 'set3', 'set4', 'set5'];
  const randomIndex = Math.floor(Math.random() * setNumbers.length);
  return setNumbers[randomIndex];
}

// 生成完整的考试题目
function generateExam() {
  const exam = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    sections: {}
  };

  // 随机选择5套题目，每套选择不同的模块
  const selectedSets = [];
  const modules = ['wordFilling', 'paragraphMatching', 'readingComprehension', 'translation', 'writing'];
  
  // 确保每个模块都被选择，且来自不同的套题
  const usedSets = new Set();
  
  modules.forEach(module => {
    let selectedSet;
    do {
      selectedSet = selectRandomSet();
    } while (usedSets.has(selectedSet));
    
    usedSets.add(selectedSet);
    selectedSets.push({ set: selectedSet, module });
  });

  // 构建考试内容
  selectedSets.forEach(({ set, module }) => {
    const questionSet = questions[set];

    if (module === 'wordFilling') {
      const wf = questionSet.wordFilling;
      if (wf) {
        exam.sections[module] = {
          id: wf.id,
          type: wf.type,
          passage: wf.passage,
          options: wf.options || wf.wordBank,
          blanks: wf.blanks,
          sourceSet: set,
          correctAnswers: wf.blanks.map(blank => {
            const answerIndex = blank.answer.charCodeAt(0) - 'A'.charCodeAt(0);
            const opts = wf.options || wf.wordBank;
            if (answerIndex >= 0 && answerIndex < opts.length) {
              return opts[answerIndex];
            }
            return `答案${blank.answer}`;
          })
        };
      }
    } else if (module === 'paragraphMatching') {
      const pm = questionSet.paragraphMatching;
      if (pm) {
        // 解析段落
        let paragraphs = [];
        if (pm.passage) {
          const cleanPassage = pm.passage.replace(/\s+/g, ' ').trim();
          const paragraphMatches = cleanPassage.match(/[A-O]\.\s*(.*?)(?=[A-O]\.|$)/g);
          if (paragraphMatches) {
            paragraphMatches.forEach(match => {
              const contentMatch = match.match(/[A-O]\.\s*(.*)/);
              if (contentMatch && contentMatch[1]) {
                const content = contentMatch[1].trim();
                if (content.length > 0) {
                  paragraphs.push(content);
                }
              }
            });
          } else {
            const passageLines = pm.passage.split('\n').filter(line => line.trim());
            passageLines.forEach(line => {
              const trimmedLine = line.trim();
              const match = trimmedLine.match(/^[A-O]\.\s*(.*)$/);
              if (match && match[1].trim().length > 0) {
                paragraphs.push(match[1].trim());
              }
            });
          }
        }

        // 解析问题
        let questionsArr = [];
        if (pm.sentences && Array.isArray(pm.sentences)) {
          questionsArr = pm.sentences.map(item => ({
            question: item.text || item.question || '',
            answer: item.answer || ''
          }));
        } else if (pm.questions && Array.isArray(pm.questions)) {
          questionsArr = pm.questions.map(item => ({
            question: item.text || item.question || '',
            answer: item.answer || ''
          }));
        }

        exam.sections[module] = {
          paragraphs,
          questions: questionsArr,
          sourceSet: set
        };
      }
    } else if (module === 'readingComprehension') {
      const rc = questionSet.readingComprehension;
      if (rc) {
        const reading = Array.isArray(rc) ? rc[Math.floor(Math.random() * rc.length)] : rc;
        exam.sections[module] = {
          passage: reading.article || reading.passage,
          questions: reading.questions || [],
          sourceSet: set
        };
      }
    } else if (module === 'translation') {
      const tr = questionSet.translation;
      if (tr) {
        exam.sections[module] = {
          chinese: tr.chinese,
          reference: tr.reference,
          sourceSet: set
        };
      }
    } else if (module === 'writing') {
      const wr = questionSet.writing;
      if (wr) {
        exam.sections[module] = {
          topic: wr.topic,
          tips: wr.tips,
          sourceSet: set
        };
      }
    }
  });

  // 打乱选择题选项
  Object.keys(exam.sections).forEach(sectionKey => {
    const section = exam.sections[sectionKey];
    
    if (sectionKey === 'readingComprehension' && section.questions) {
      section.questions.forEach(question => {
        if (question.options) {
          shuffleOptions(question);
        }
      });
    }
  });

  return exam;
}

// 验证答案
function validateAnswers(examId, userAnswers) {
  // 这里可以实现答案验证逻辑
  // 暂时返回模拟结果
  return {
    examId,
    score: Math.floor(Math.random() * 40) + 60, // 模拟60-100分
    feedback: "Good job! Keep practicing to improve your skills.",
    detailedResults: {}
  };
}

module.exports = {
  generateExam,
  validateAnswers,
  shuffleArray,
  shuffleOptions
}; 