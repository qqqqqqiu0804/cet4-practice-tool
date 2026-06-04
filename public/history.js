// 历史成绩页面的JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadHistory();
    setupEventListeners();
});

// 加载历史成绩
function loadHistory() {
    const results = JSON.parse(localStorage.getItem('cet4_exam_history') || '[]');

    if (results.length === 0) {
        document.getElementById('historyList').innerHTML = '<div class="empty-state"><p>还没有考试记录，快去做一套题吧！</p></div>';
        return;
    }

    // 按时间倒序
    results.sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime));

    // 统计数据
    const scores = results.map(r => r.score);
    document.getElementById('totalExams').textContent = results.length;
    document.getElementById('avgScore').textContent = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    document.getElementById('bestScore').textContent = Math.max(...scores);
    document.getElementById('worstScore').textContent = Math.min(...scores);

    // 绘制图表
    drawChart(results.reverse());

    // 渲染列表
    renderList(results.reverse());
}

// 绘制成绩趋势图（纯 Canvas）
function drawChart(results) {
    const canvas = document.getElementById('scoreChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 高清屏适配
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // 清空
    ctx.clearRect(0, 0, width, height);

    if (results.length === 0) return;

    const scores = results.map(r => r.score);
    const maxScore = 100;
    const minScore = 0;

    // 背景网格
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Y轴标签
        ctx.fillStyle = '#a0aec0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxScore - (maxScore / 5) * i), padding.left - 10, y + 4);
    }

    // 数据点
    const points = scores.map((score, i) => ({
        x: padding.left + (results.length === 1 ? chartW / 2 : (chartW / (results.length - 1)) * i),
        y: padding.top + chartH - (score / maxScore) * chartH
    }));

    // 填充区域
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // 折线
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 数据点圆圈
    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#667eea';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 分数标签
        ctx.fillStyle = '#2d3748';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(scores[i], p.x, p.y - 12);
    });

    // X轴标签
    ctx.fillStyle = '#a0aec0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    results.forEach((r, i) => {
        if (results.length <= 10 || i % Math.ceil(results.length / 10) === 0) {
            const date = new Date(r.submitTime);
            const label = (date.getMonth() + 1) + '/' + date.getDate();
            ctx.fillText(label, points[i].x, height - padding.bottom + 20);
        }
    });
}

// 渲染考试记录列表
function renderList(results) {
    const container = document.getElementById('historyList');
    let html = '';

    results.forEach((r, i) => {
        const date = new Date(r.submitTime);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const scoreClass = r.score >= 80 ? 'score-high' : r.score >= 60 ? 'score-mid' : 'score-low';

        html += '<div class="history-item">';
        html += '<div class="history-item-left">';
        html += '<span class="history-rank">#' + (results.length - i) + '</span>';
        html += '<span class="history-date">' + dateStr + '</span>';
        html += '</div>';
        html += '<div class="history-item-right">';
        html += '<span class="history-score ' + scoreClass + '">' + r.score + '分</span>';
        html += '</div>';
        html += '</div>';
    });

    container.innerHTML = html;
}

// 设置事件监听器
function setupEventListeners() {
    const clearBtn = document.getElementById('clearHistory');
    const homeBtn = document.getElementById('goHome');

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (confirm('确定要清空所有历史成绩吗？')) {
                localStorage.removeItem('cet4_exam_history');
                loadHistory();
            }
        });
    }

    if (homeBtn) {
        homeBtn.addEventListener('click', function() {
            window.location.href = '/';
        });
    }
}
