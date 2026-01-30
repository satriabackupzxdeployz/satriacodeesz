function getUserIP() {
    const fingerprint = navigator.userAgent + 
                       navigator.language + 
                       (navigator.platform || '') + 
                       (screen.width || '') + 
                       (screen.height || '') + 
                       (new Date().getTimezoneOffset() || '');
    
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return 'user_' + Math.abs(hash).toString(16).substring(0, 8);
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Baru saja';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' menit yang lalu';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' jam yang lalu';
    if (seconds < 2592000) return Math.floor(seconds / 86400) + ' hari yang lalu';
    if (seconds < 31536000) return Math.floor(seconds / 2592000) + ' bulan yang lalu';
    return Math.floor(seconds / 31536000) + ' tahun yang lalu';
}

function getFileExtension(language) {
    const extensions = {
        javascript: 'js',
        python: 'py',
        java: 'java',
        php: 'php',
        html: 'html',
        cpp: 'cpp',
        csharp: 'cs',
        other: 'txt'
    };
    return extensions[language] || 'txt';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type) {
    const alertElement = document.getElementById('alertMessage');
    if (!alertElement) return;
    
    alertElement.textContent = message;
    alertElement.className = 'alert show';
    
    if (type === 'success') {
        alertElement.classList.add('alert-success');
        alertElement.classList.remove('alert-error');
    } else if (type === 'error') {
        alertElement.classList.add('alert-error');
        alertElement.classList.remove('alert-success');
    }
    
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 3000);
}

function showLikeNotification(liked) {
    const notification = document.getElementById('likeNotification');
    
    if (liked) {
        notification.innerHTML = '<i class="fas fa-heart"></i> Postingan disukai!';
        notification.classList.remove('unlike');
    } else {
        notification.innerHTML = '<i class="fas fa-heart-broken"></i> Like dibatalkan';
        notification.classList.add('unlike');
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById('modalCopyBtn');
        copyBtn.innerHTML = '<i class="fas fa-check"></i> TERSALIN!';
        copyBtn.style.background = 'var(--success)';
        
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> SALIN KODE';
            copyBtn.style.background = '';
        }, 1000);
        
        showAlert('Kode berhasil disalin ke clipboard!', 'success');
    });
}