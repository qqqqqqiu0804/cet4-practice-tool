// 主页面的JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const startExamBtn = document.getElementById('startExam');
    const wrongBookBtn = document.getElementById('wrongBook');
    const historyBtn = document.getElementById('historyBtn');

    if (startExamBtn) {
        startExamBtn.addEventListener('click', function() {
            startExamBtn.innerHTML = '<span class="loading"></span> 正在生成题目...';
            startExamBtn.disabled = true;
            setTimeout(() => {
                window.location.href = '/exam';
            }, 1000);
        });
    }

    if (wrongBookBtn) {
        wrongBookBtn.addEventListener('click', function() {
            window.location.href = '/wrong.html';
        });
    }

    if (historyBtn) {
        historyBtn.addEventListener('click', function() {
            window.location.href = '/history.html';
        });
    }

    // 添加一些动画效果
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });
});