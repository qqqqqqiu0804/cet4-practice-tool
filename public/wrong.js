// 错题本页面的JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadWrongQuestions();
    setupEventListeners();
});

const TYPE_NAMES = {
    wordFilling: '选词填空',
    paragraphMatching: '段落匹配',
    readingComprehension: '仔细阅读'
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

let currentFilter = 'all';

// 加载错题列表
function loadWrongQuestions() {
    const wrongs = JSON.parse(localStorage.getItem('cet4_wrong_questions') || '[]');
    const filtered = currentFilter === 'all'
        ? wrongs
        : wrongs.filter(w => w.type === currentFilter);

    const container = document.getElementById('wrongList');
    const countEl = document.getElementById('wrongCount');

    countEl.textContent = filtered.length;

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>🎉 没有错题，继续保持！</p></div>';
        return;
    }

    // 按题型分组
    const grouped = {};
    filtered.forEach(w => {
        if (!grouped[w.type]) grouped[w.type] = [];
        grouped[w.type].push(w);
    });

    let html = '';
    Object.entries(grouped).forEach(([type, items]) => {
        html += '<div class="wrong-group">';
        html += '<h3>' + (TYPE_NAMES[type] || type) + ' (' + items.length + '题)</h3>';

        items.forEach((item, i) => {
            const userAns = formatAnswer(type, item.userAnswer);
            const correctAns = formatAnswer(type, item.correctAnswer);
            const time = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '';

            html += '<div class="wrong-item" data-index="' + i + '" data-type="' + type + '">';
            html += '<div class="wrong-item-header">';
            html += '<span class="wrong-type-badge">' + (TYPE_NAMES[type] || type) + '</span>';
            html += '<span class="wrong-time">' + time + '</span>';
            html += '<button class="wrong-delete-btn" data-type="' + type + '" data-index="' + i + '" title="标记为已掌握">✕</button>';
            html += '</div>';
            html += '<div class="wrong-item-body">';
            html += '<div class="wrong-answer-row">';
            html += '<span class="wrong-label">你的答案:</span>';
            html += '<span class="wrong-user-ans">' + userAns + '</span>';
            html += '</div>';
            html += '<div class="wrong-answer-row">';
            html += '<span class="wrong-label">正确答案:</span>';
            html += '<span class="wrong-correct-ans">' + correctAns + '</span>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });

        html += '</div>';
    });

    container.innerHTML = html;
}

// 格式化答案显示
function formatAnswer(type, answer) {
    if (answer === null || answer === undefined || answer === '') return '未作答';
    if (type === 'readingComprehension' && typeof answer === 'number') {
        return OPTION_LABELS[answer] || answer;
    }
    return answer;
}

// 设置事件监听器
function setupEventListeners() {
    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.type;
            loadWrongQuestions();
        });
    });

    // 删除单条错题
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('wrong-delete-btn')) {
            const type = e.target.dataset.type;
            const index = parseInt(e.target.dataset.index);
            deleteWrongQuestion(type, index);
        }
    });

    // 清空全部
    const clearBtn = document.getElementById('clearAll');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (confirm('确定要清空全部错题吗？此操作不可撤销。')) {
                localStorage.removeItem('cet4_wrong_questions');
                loadWrongQuestions();
            }
        });
    }

    // 返回首页
    const homeBtn = document.getElementById('goHome');
    if (homeBtn) {
        homeBtn.addEventListener('click', function() {
            window.location.href = '/';
        });
    }
}

// 删除单条错题
function deleteWrongQuestion(type, index) {
    const wrongs = JSON.parse(localStorage.getItem('cet4_wrong_questions') || '[]');
    const filtered = currentFilter === 'all'
        ? wrongs
        : wrongs.filter(w => w.type === currentFilter);

    if (index >= 0 && index < filtered.length) {
        const target = filtered[index];
        const realIndex = wrongs.findIndex(w =>
            w.type === target.type &&
            w.index === target.index &&
            w.examId === target.examId
        );
        if (realIndex !== -1) {
            wrongs.splice(realIndex, 1);
            localStorage.setItem('cet4_wrong_questions', JSON.stringify(wrongs));
            loadWrongQuestions();
        }
    }
}
