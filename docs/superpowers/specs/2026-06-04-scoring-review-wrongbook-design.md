# 四级刷题工具 — 评分+解析+错题本 设计文档

## 概述

为四级刷题工具添加真实评分系统、答案解析展示和错题本功能，形成"做题→评分→看解析→错题复习"的完整学习闭环。

## 技术方案

全前端实现，不修改后端API路由。后端仅在考试数据中附带正确答案，评分和错题管理全部由前端完成。

## 数据流

```
开始考试 → 后端返回题目+正确答案 → 用户答题
    → 点击提交 → 前端比对答案 → 计算各题型分数
    → 跳转结果页（总分+每题对错+正确答案）
    → 同时原考试页内联标记对错
    → 错题存入 localStorage["cet4_wrong_questions"]
```

## 后端改动

文件：`utils/questionGenerator.js`

在 generateExam() 返回的考试数据中，为每个题型附带正确答案：

### 选词填空（wordFilling）
已有 `correctWords` 字段，无需改动。

### 段落匹配（paragraphMatching）
新增 `correctAnswers` 数组，每个元素为 `{ index: 题号, answer: "正确段落字母" }`。

数据来源：`questions.js` 中 `paragraphMatching.sentences[].answer`

### 仔细阅读（readingComprehension）
为每个 question 新增 `answer` 字段（正确选项的索引，0-3）。

数据来源：`questions.js` 中 `readingComprehension.questions[].answer`

### 翻译（translation）
已有 `reference` 字段，无需改动。

### 写作（writing）
已有 `tips` 字段，无需改动。

## 前端改动

### exam.js

#### submitExam() 改造
- 移除对 `/api/submit-exam` 的 fetch 调用
- 改为调用本地 `gradeExam()` 函数进行评分
- 评分完成后：
  1. 跳转到 `/result.html` 并传递评分数据（通过 localStorage）
  2. 在当前页面内联标记每题对错

#### 新增 gradeExam() 函数
```javascript
function gradeExam() {
  const answers = collectAnswers();
  const sections = currentExam.sections;
  const results = {
    examId: currentExam.id,
    sections: {},
    totalScore: 0,
    maxScore: 100
  };

  // 选词填空评分（每空1分，共10分）
  if (sections.wordFilling && sections.wordFilling.correctWords) {
    const wf = sections.wordFilling;
    let correct = 0;
    answers.wordFilling.forEach((ans, i) => {
      if (ans === wf.correctWords[i]) correct++;
    });
    results.sections.wordFilling = {
      score: correct,
      total: wf.correctWords.length,
      details: answers.wordFilling.map((ans, i) => ({
        userAnswer: ans,
        correctAnswer: wf.correctWords[i],
        isCorrect: ans === wf.correctWords[i]
      }))
    };
  }

  // 段落匹配评分（每题1分，共10分）
  if (sections.paragraphMatching && sections.paragraphMatching.correctAnswers) {
    const pm = sections.paragraphMatching;
    let correct = 0;
    answers.paragraphMatching.forEach((ans, i) => {
      if (ans === pm.correctAnswers[i]) correct++;
    });
    results.sections.paragraphMatching = {
      score: correct,
      total: pm.correctAnswers.length,
      details: answers.paragraphMatching.map((ans, i) => ({
        userAnswer: ans,
        correctAnswer: pm.correctAnswers[i],
        isCorrect: ans === pm.correctAnswers[i]
      }))
    };
  }

  // 仔细阅读评分（每题2分，共10分）
  if (sections.readingComprehension && sections.readingComprehension.questions) {
    const rc = sections.readingComprehension;
    let correct = 0;
    answers.readingComprehension.forEach((ans, i) => {
      if (rc.questions[i] && ans === rc.questions[i].answer) correct++;
    });
    results.sections.readingComprehension = {
      score: correct * 2,
      total: rc.questions.length * 2,
      details: answers.readingComprehension.map((ans, i) => ({
        userAnswer: ans,
        correctAnswer: rc.questions[i] ? rc.questions[i].answer : null,
        isCorrect: rc.questions[i] ? ans === rc.questions[i].answer : false
      }))
    };
  }

  // 翻译和写作给默认分（暂不自动评分）
  results.sections.translation = { score: 12, total: 15, manual: true };
  results.sections.writing = { score: 12, total: 15, manual: true };

  // 计算总分（60分制换算100分制）
  const autoScore = Object.values(results.sections)
    .reduce((sum, s) => sum + s.score, 0);
  const autoMax = Object.values(results.sections)
    .reduce((sum, s) => sum + s.total, 0);
  results.totalScore = Math.round((autoScore / autoMax) * 100);

  return results;
}
```

#### 新增内联标记函数
提交后在考试页面标记每题对错：
- 正确：绿色背景 + ✓
- 错误：红色背景 + ✗ + 显示正确答案

#### 新增 saveWrongQuestions() 函数
将错题存入 localStorage：
```javascript
function saveWrongQuestions(results) {
  const existing = JSON.parse(localStorage.getItem('cet4_wrong_questions') || '[]');
  const newWrongs = [];

  Object.entries(results.sections).forEach(([type, section]) => {
    if (section.details) {
      section.details.forEach((detail, i) => {
        if (!detail.isCorrect) {
          newWrongs.push({
            type,
            index: i,
            userAnswer: detail.userAnswer,
            correctAnswer: detail.correctAnswer,
            examId: results.examId,
            timestamp: Date.now()
          });
        }
      });
    }
  });

  // 去重（同一考试同一题只存一次）
  const merged = [...existing];
  newWrongs.forEach(w => {
    const key = `${w.examId}_${w.type}_${w.index}`;
    if (!merged.find(m => `${m.examId}_${m.type}_${m.index}` === key)) {
      merged.push(w);
    }
  });

  localStorage.setItem('cet4_wrong_questions', JSON.stringify(merged));
}
```

### result.js

重写结果页面，展示详细评分报告：
- 总分（大字显示）
- 各题型得分条形图
- 每题详情：用户答案、正确答案、对错标记
- 翻译和写作显示参考答案
- "查看错题本"按钮

### 新增 wrong.html + wrong.js（错题本页面）

- 从 localStorage 读取 `cet4_wrong_questions`
- 按题型分组展示
- 支持筛选（全部/选词填空/段落匹配/仔细阅读）
- 每题显示：题目、用户答案、正确答案
- 支持单条删除（标记为已掌握）
- 支持清空全部错题
- 从 index.html 添加"错题本"入口按钮

## 评分规则

| 题型 | 满分 | 评分方式 |
|------|------|---------|
| 选词填空 | 10分 | 每空1分，单词完全匹配 |
| 段落匹配 | 10分 | 每题1分，段落字母匹配 |
| 仔细阅读 | 10分 | 每题2分，选项索引匹配 |
| 翻译 | 15分 | 默认12分（暂不自动评分） |
| 写作 | 15分 | 默认12分（暂不自动评分） |
| **总计** | **60分** | 换算成100分制显示 |

## localStorage 数据结构

```javascript
// 键名：cet4_wrong_questions
// 值：JSON 数组
[
  {
    "type": "wordFilling",        // 题型
    "index": 0,                   // 题目索引
    "userAnswer": "approximately", // 用户答案
    "correctAnswer": "signals",    // 正确答案
    "examId": "1780544577551",     // 考试ID
    "timestamp": 1717500000000     // 时间戳
  }
]
```

## 改动文件清单

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `utils/questionGenerator.js` | 修改 | 为段落匹配和仔细阅读附带正确答案 |
| `public/exam.js` | 修改 | 评分逻辑、内联标记、错题保存 |
| `public/result.js` | 重写 | 展示详细评分报告 |
| `public/result.html` | 修改 | 调整页面结构适配新结果展示 |
| `public/wrong.html` | 新增 | 错题本页面 |
| `public/wrong.js` | 新增 | 错题本逻辑 |
| `public/index.html` | 修改 | 添加"错题本"入口按钮 |
