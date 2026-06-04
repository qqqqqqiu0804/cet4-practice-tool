// 结果页面的JavaScript
document.addEventListener('DOMContentLoaded', function() {
    displayResult();
    setupEventListeners();
});

// 显示考试结果
function displayResult() {
    const result = JSON.parse(localStorage.getItem('examResult') || '{}');

    if (!result.examId) {
        alert('没有找到考试结果，请重新参加考试');
        window.location.href = '/';
        return;
    }

    // 显示总分
    const totalScore = result.score || 0;
    document.getElementById('totalScore').textContent = totalScore;
    document.getElementById('scoreLabel').textContent = getScoreLabel(totalScore);

    // 显示考试信息
    document.getElementById('examIdResult').textContent = result.examId;
    document.getElementById('completionTime').textContent = result.submitTime
        ? new Date(result.submitTime).toLocaleString()
        : new Date().toLocaleString();

    // 显示各部分得分
    if (result.sections) {
        displaySectionScores(result.sections);
        displayDetailResults(result.sections);
    }

    // 显示学习建议
    displayFeedback(totalScore);
}

// 获取分数等级
function getScoreLabel(score) {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '需要努力';
}

// 显示各部分得分
function displaySectionScores(sections) {
    const names = {
        wordFilling: '选词填空',
        paragraphMatching: '段落匹配',
        readingComprehension: '仔细阅读',
        translation: '翻译',
        writing: '写作'
    };

    Object.entries(names).forEach(([key, label]) => {
        const el = document.getElementById(key === 'wordFilling' ? 'wfScore' :
            key === 'paragraphMatching' ? 'pmScore' :
            key === 'readingComprehension' ? 'rcScore' :
            key === 'translation' ? 'trScore' : 'wrScore');
        if (el && sections[key]) {
            el.textContent = sections[key].score + '/' + sections[key].total;
        }
    });
}

// 显示答题详情
function displayDetailResults(sections) {
    const container = document.getElementById('detailContent');
    if (!container) return;

    let html = '';

    // 选词填空详情
    if (sections.wordFilling && sections.wordFilling.details) {
        html += '<div class="detail-section">';
        html += '<h4>选词填空 (' + sections.wordFilling.score + '/' + sections.wordFilling.total + ')</h4>';
        html += '<div class="detail-list">';
        sections.wordFilling.details.forEach((d, i) => {
            const cls = d.isCorrect ? 'detail-correct' : 'detail-incorrect';
            html += '<div class="detail-item ' + cls + '">';
            html += '<span class="detail-num">' + (i + 1) + '.</span>';
            html += '<span class="detail-user">你的答案: ' + (d.userAnswer || '未作答') + '</span>';
            if (!d.isCorrect) {
                html += '<span class="detail-ans">正确答案: ' + d.correctAnswer + '</span>';
            }
            html += '<span class="detail-icon">' + (d.isCorrect ? '✓' : '✗') + '</span>';
            html += '</div>';
        });
        html += '</div></div>';
    }

    // 段落匹配详情
    if (sections.paragraphMatching && sections.paragraphMatching.details) {
        html += '<div class="detail-section">';
        html += '<h4>段落匹配 (' + sections.paragraphMatching.score + '/' + sections.paragraphMatching.total + ')</h4>';
        html += '<div class="detail-list">';
        sections.paragraphMatching.details.forEach((d, i) => {
            const cls = d.isCorrect ? 'detail-correct' : 'detail-incorrect';
            html += '<div class="detail-item ' + cls + '">';
            html += '<span class="detail-num">' + (i + 1) + '.</span>';
            html += '<span class="detail-user">你的答案: ' + (d.userAnswer || '未作答') + '</span>';
            if (!d.isCorrect) {
                html += '<span class="detail-ans">正确答案: ' + d.correctAnswer + '</span>';
            }
            html += '<span class="detail-icon">' + (d.isCorrect ? '✓' : '✗') + '</span>';
            html += '</div>';
        });
        html += '</div></div>';
    }

    // 仔细阅读详情
    if (sections.readingComprehension && sections.readingComprehension.details) {
        const optionLabels = ['A', 'B', 'C', 'D'];
        html += '<div class="detail-section">';
        html += '<h4>仔细阅读 (' + sections.readingComprehension.score + '/' + sections.readingComprehension.total + ')</h4>';
        html += '<div class="detail-list">';
        sections.readingComprehension.details.forEach((d, i) => {
            const cls = d.isCorrect ? 'detail-correct' : 'detail-incorrect';
            const userLabel = d.userAnswer !== null ? optionLabels[d.userAnswer] : '未作答';
            const correctLabel = d.correctAnswer !== null ? optionLabels[d.correctAnswer] : '-';
            html += '<div class="detail-item ' + cls + '">';
            html += '<span class="detail-num">' + (i + 1) + '.</span>';
            html += '<span class="detail-user">你的答案: ' + userLabel + '</span>';
            if (!d.isCorrect) {
                html += '<span class="detail-ans">正确答案: ' + correctLabel + '</span>';
            }
            html += '<span class="detail-icon">' + (d.isCorrect ? '✓' : '✗') + '</span>';
            html += '</div>';
        });
        html += '</div></div>';
    }

    // 翻译和写作提示
    if (sections.translation && sections.translation.manual) {
        html += '<div class="detail-section"><h4>翻译 (默认' + sections.translation.score + '/' + sections.translation.total + ')</h4>';
        html += '<p class="detail-note">翻译题需人工评分，暂给默认分</p></div>';
    }
    if (sections.writing && sections.writing.manual) {
        html += '<div class="detail-section"><h4>写作 (默认' + sections.writing.score + '/' + sections.writing.total + ')</h4>';
        html += '<p class="detail-note">写作题需人工评分，暂给默认分</p></div>';
    }

    container.innerHTML = html;
}

// 显示学习建议
function displayFeedback(score) {
    const feedbackContent = document.getElementById('feedbackContent');
    if (!feedbackContent) return;

    let feedback = '';
    if (score >= 90) {
        feedback = '<div class="feedback-item"><h4>🎉 优秀表现！</h4><p>你的英语水平非常出色，继续保持。可以尝试更高难度的练习，多阅读英文原著和新闻。</p></div>';
    } else if (score >= 80) {
        feedback = '<div class="feedback-item"><h4>👍 良好表现！</h4><p>英语基础扎实，建议重点复习错题，增加词汇量，多练习阅读理解和写作。</p></div>';
    } else if (score >= 70) {
        feedback = '<div class="feedback-item"><h4>📚 继续努力！</h4><p>英语水平中等，建议系统复习语法，扩大词汇量，多做阅读练习。</p></div>';
    } else if (score >= 60) {
        feedback = '<div class="feedback-item"><h4>💪 需要加强！</h4><p>英语基础需要加强，建议从基础语法开始系统学习，每天背诵单词。</p></div>';
    } else {
        feedback = '<div class="feedback-item"><h4>🚀 重新开始！</h4><p>不要气馁，建议制定详细学习计划，从最基础的英语知识开始。</p></div>';
    }

    feedbackContent.innerHTML = feedback;
}

// 设置事件监听器
function setupEventListeners() {
    const newExamBtn = document.getElementById('newExam');
    const reviewAnswersBtn = document.getElementById('reviewAnswers');
    const wrongBookBtn = document.getElementById('wrongBook');
    const goHomeBtn = document.getElementById('goHome');

    if (newExamBtn) {
        newExamBtn.addEventListener('click', function() {
            localStorage.removeItem('examResult');
            localStorage.removeItem('examAnswers');
            localStorage.removeItem('examData');
            window.location.href = '/exam';
        });
    }

    if (reviewAnswersBtn) {
        reviewAnswersBtn.addEventListener('click', function() {
            window.location.href = '/answers.html';
        });
    }

    if (wrongBookBtn) {
        wrongBookBtn.addEventListener('click', function() {
            window.location.href = '/wrong.html';
        });
    }

    if (goHomeBtn) {
        goHomeBtn.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', function() {
            window.location.href = '/history.html';
        });
    }
}
