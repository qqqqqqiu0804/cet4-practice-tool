// 深色模式切换（所有页面共享）
(function() {
    // 初始化主题
    const savedTheme = localStorage.getItem('cet4_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 页面加载完成后添加切换按钮
    document.addEventListener('DOMContentLoaded', function() {
        const btn = document.createElement('button');
        btn.className = 'theme-toggle';
        btn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        btn.title = savedTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
        btn.addEventListener('click', function() {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('cet4_theme', next);
            btn.textContent = next === 'dark' ? '☀️' : '🌙';
            btn.title = next === 'dark' ? '切换到浅色模式' : '切换到深色模式';
        });
        document.body.appendChild(btn);
    });
})();
