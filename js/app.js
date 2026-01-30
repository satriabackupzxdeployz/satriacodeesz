let isAdminLoggedIn = false;
let userIP = '';
let postsCache = [];
let currentPostId = null;

document.addEventListener('DOMContentLoaded', function() {
    userIP = getUserIP();
    console.log('User ID:', userIP);
    
    setupNavigation();
    setupAdminLogin();
    setupPostForm();
    setupModal();
    setupAdminPostsList();
    
    loadPosts();
});

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(section + 'Section').classList.add('active');
        });
    });
}

function setupAdminLogin() {
    const adminAccessBtn = document.getElementById('adminAccessBtn');
    const adminKeyInput = document.getElementById('adminKeyInput');
    const logoutBtn = document.getElementById('logoutBtn');
    
    adminAccessBtn.addEventListener('click', function() {
        const password = adminKeyInput.value.trim();
        
        if (password === 'Satriadevs') {
            isAdminLoggedIn = true;
            document.getElementById('adminAccessDiv').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            adminKeyInput.value = '';
            showAlert('Berhasil login sebagai admin!', 'success');
            loadAdminPostsList();
        } else {
            showAlert('Password salah!', 'error');
            adminKeyInput.value = '';
        }
    });
    
    logoutBtn.addEventListener('click', function() {
        isAdminLoggedIn = false;
        document.getElementById('adminAccessDiv').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        showAlert('Logout berhasil!', 'success');
    });
    
    adminKeyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            adminAccessBtn.click();
        }
    });
}

function setupPostForm() {
    const publishPostBtn = document.getElementById('publishPostBtn');
    const previewPostBtn = document.getElementById('previewPostBtn');
    
    publishPostBtn.addEventListener('click', publishPost);
    previewPostBtn.addEventListener('click', previewPost);
}

function publishPost() {
    if (!isAdminLoggedIn) {
        showAlert('Anda harus login sebagai admin terlebih dahulu!', 'error');
        return;
    }
    
    const title = document.getElementById('postTitle').value.trim();
    const description = document.getElementById('postDescription').value.trim();
    const author = document.getElementById('postAuthor').value.trim();
    const language = document.getElementById('postLanguage').value;
    const tags = document.getElementById('postTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const code = document.getElementById('postCode').value.trim();
    
    if (!title || !code || !author) {
        showAlert('Judul, kode, dan nama penulis harus diisi!', 'error');
        return;
    }
    
    const now = new Date().toISOString();
    const newPost = {
        title: title,
        description: description || "Tidak ada deskripsi.",
        author: author,
        language: language,
        code: code,
        tags: tags.length > 0 ? tags : ["code"],
        views: 0,
        likes: 0,
        downloads: 0,
        likedBy: [],
        viewedBy: [],
        commentsCount: 0,
        createdAt: now,
        updatedAt: now
    };
    
    db.ref('posts').push(newPost).then(() => {
        document.getElementById('postTitle').value = '';
        document.getElementById('postDescription').value = '';
        document.getElementById('postCode').value = '';
        document.getElementById('postTags').value = '';
        document.getElementById('postAuthor').value = 'Admin';
        
        showAlert('Postingan berhasil dipublish!', 'success');
        document.querySelector('[data-section="browse"]').click();
        loadAdminPostsList();
    }).catch(error => {
        showAlert('Error: ' + error.message, 'error');
    });
}

function previewPost() {
    const title = document.getElementById('postTitle').value.trim();
    const description = document.getElementById('postDescription').value.trim();
    const author = document.getElementById('postAuthor').value.trim();
    const language = document.getElementById('postLanguage').value;
    const tags = document.getElementById('postTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const code = document.getElementById('postCode').value.trim();
    
    if (!title || !code) {
        showAlert('Judul dan kode harus diisi untuk preview!', 'error');
        return;
    }
    
    document.getElementById('modalPostTitle').textContent = title;
    document.getElementById('modalPostLanguage').textContent = language.toUpperCase();
    document.getElementById('modalPostDescription').textContent = description || "Tidak ada deskripsi.";
    document.getElementById('modalPostAuthor').textContent = author || "Admin";
    document.getElementById('modalPostTime').textContent = "Preview";
    document.getElementById('modalPostCode').textContent = code;
    document.getElementById('modalViews').textContent = "0";
    document.getElementById('modalLikes').textContent = "0";
    document.getElementById('modalDownloads').textContent = "0";
    document.getElementById('modalCommentsCount').textContent = "0";
    document.getElementById('commentsCount').textContent = "0";
    
    const tagsContainer = document.getElementById('modalPostTags');
    tagsContainer.innerHTML = '';
    const tagList = tags.length > 0 ? tags : ["code"];
    tagList.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.style.cssText = `
            display: inline-block;
            padding: 4px 10px;
            background: var(--cyan);
            border: 2px solid var(--border-color);
            margin-right: 6px;
            margin-bottom: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        `;
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
    });
    
    document.getElementById('commentsList').innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Ini hanya preview. Komentar tidak tersedia.</p>';
    
    document.getElementById('modalLikeBtn').onclick = () => showAlert('Ini hanya preview!', 'error');
    document.getElementById('modalDownloadBtn').onclick = () => showAlert('Ini hanya preview!', 'error');
    document.getElementById('modalCopyBtn').onclick = () => copyToClipboard(code);
    
    document.getElementById('commentsSection').style.display = 'none';
    document.getElementById('postModal').classList.add('active');
}

function loadPosts() {
    const postsTimeline = document.getElementById('postsTimeline');
    const emptyState = document.getElementById('emptyState');
    
    db.ref('posts').on('value', (snapshot) => {
        postsCache = [];
        const data = snapshot.val();
        
        if (!data) {
            postsTimeline.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        Object.keys(data).forEach(key => {
            const post = data[key];
            post.firebaseId = key;
            postsCache.push(post);
        });
        
        postsCache.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (postsCache.length === 0) {
            postsTimeline.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        postsTimeline.innerHTML = '';
        
        postsCache.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            postCard.dataset.id = post.firebaseId;
            
            const timeAgo = getTimeAgo(post.createdAt);
            const avatarLetter = post.author.charAt(0).toUpperCase();
            const codeLines = post.code.split('\n');
            const codePreview = codeLines.slice(0, 10).join('\n');
            
            postCard.innerHTML = `
                <div class="post-header">
                    <div class="post-author">
                        <div class="author-avatar">${avatarLetter}</div>
                        <div class="author-info">
                            <h4>${escapeHtml(post.author)}</h4>
                            <div class="post-time">${timeAgo}</div>
                        </div>
                    </div>
                    <span class="post-language">${post.language.toUpperCase()}</span>
                </div>
                
                <div class="post-content">
                    <h3 class="post-title">${escapeHtml(post.title)}</h3>
                    <p class="post-description">${escapeHtml(post.description)}</p>
                    
                    <div class="post-tags">
                        ${(post.tags || []).map(tag => `<span class="post-tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                    
                    <div class="code-preview">
                        <pre>${escapeHtml(codePreview)}${codeLines.length > 10 ? '\n...' : ''}</pre>
                    </div>
                </div>
                
                <div class="post-footer">
                    <div class="post-stats">
                        <div class="stat-item">
                            <i class="fas fa-eye"></i> ${post.views || 0} views
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-heart"></i> ${post.likes || 0} likes
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-comment"></i> ${(post.commentsCount || 0)} comments
                        </div>
                    </div>
                    
                    <div class="post-actions">
                        <button class="btn btn-small btn-primary view-post-btn">
                            <i class="fas fa-expand"></i> SELENGKAPNYA
                        </button>
                        <button class="btn btn-small btn-like like-post-btn" data-id="${post.firebaseId}">
                            <i class="fas fa-heart"></i> LIKE
                        </button>
                    </div>
                </div>
            `;
            
            postsTimeline.appendChild(postCard);
        });
        
        document.querySelectorAll('.view-post-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.closest('.post-card').dataset.id;
                openPostModal(postId);
            });
        });
        
        document.querySelectorAll('.like-post-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.dataset.id;
                toggleLike(postId);
            });
        });
    });
}

function openPostModal(postId) {
    const post = postsCache.find(p => p.firebaseId === postId);
    if (!post) return;
    
    currentPostId = postId;
    
    const viewedBy = post.viewedBy || [];
    if (!viewedBy.includes(userIP)) {
        post.views = (post.views || 0) + 1;
        viewedBy.push(userIP);
        db.ref('posts/' + postId).update({ views: post.views, viewedBy: viewedBy });
    }
    
    document.getElementById('modalPostTitle').textContent = post.title;
    document.getElementById('modalPostLanguage').textContent = post.language.toUpperCase();
    document.getElementById('modalPostDescription').textContent = post.description;
    document.getElementById('modalPostCode').textContent = post.code;
    document.getElementById('modalPostAuthor').textContent = post.author;
    document.getElementById('modalPostTime').textContent = getTimeAgo(post.createdAt);
    document.getElementById('modalViews').textContent = post.views || 0;
    document.getElementById('modalLikes').textContent = post.likes || 0;
    document.getElementById('modalDownloads').textContent = post.downloads || 0;
    
    const tagsContainer = document.getElementById('modalPostTags');
    tagsContainer.innerHTML = '';
    (post.tags || []).forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.style.cssText = `
            display: inline-block;
            padding: 4px 10px;
            background: var(--cyan);
            border: 2px solid var(--border-color);
            margin-right: 6px;
            margin-bottom: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        `;
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
    });
    
    loadComments(postId);
    document.getElementById('commentsSection').style.display = 'block';
    
    const hasLiked = (post.likedBy || []).includes(userIP);
    const likeBtn = document.getElementById('modalLikeBtn');
    if (hasLiked) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = '<i class="fas fa-heart"></i> UNLIKE';
    } else {
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = '<i class="fas fa-heart"></i> LIKE';
    }
    
    document.getElementById('modalLikeBtn').onclick = () => toggleLike(postId);
    document.getElementById('modalDownloadBtn').onclick = () => downloadPost(postId);
    document.getElementById('modalCopyBtn').onclick = () => copyToClipboard(post.code);
    document.getElementById('submitCommentBtn').onclick = () => submitComment(postId);
    
    document.getElementById('postModal').classList.add('active');
}

function toggleLike(postId) {
    const post = postsCache.find(p => p.firebaseId === postId);
    if (!post) return;
    
    let likedBy = post.likedBy || [];
    const userIndex = likedBy.indexOf(userIP);
    const isCurrentlyLiked = userIndex !== -1;
    
    if (!isCurrentlyLiked) {
        post.likes = (post.likes || 0) + 1;
        likedBy.push(userIP);
        showLikeNotification(true);
    } else {
        post.likes = Math.max(0, (post.likes || 0) - 1);
        likedBy.splice(userIndex, 1);
        showLikeNotification(false);
    }
    
    db.ref('posts/' + postId).update({ 
        likes: post.likes,
        likedBy: likedBy
    }).then(() => {
        const likeBtn = document.getElementById('modalLikeBtn');
        if (!isCurrentlyLiked) {
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = '<i class="fas fa-heart"></i> UNLIKE';
        } else {
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = '<i class="fas fa-heart"></i> LIKE';
        }
        document.getElementById('modalLikes').textContent = post.likes;
        loadPosts();
    });
}

function downloadPost(postId) {
    const post = postsCache.find(p => p.firebaseId === postId);
    if (!post) return;
    
    post.downloads = (post.downloads || 0) + 1;
    db.ref('posts/' + postId).update({ downloads: post.downloads });
    
    const blob = new Blob([post.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = post.title.replace(/\s+/g, '_') + '.' + getFileExtension(post.language);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    document.getElementById('modalDownloads').textContent = post.downloads;
    showAlert('Kode berhasil didownload!', 'success');
}

function loadComments(postId) {
    const commentsList = document.getElementById('commentsList');
    
    db.ref('comments/' + postId).on('value', (snapshot) => {
        commentsList.innerHTML = '';
        
        const data = snapshot.val();
        if (!data) {
            commentsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada komentar. Jadilah yang pertama!</p>';
            return;
        }
        
        const commentsArray = [];
        Object.keys(data).forEach(key => {
            const comment = data[key];
            comment.firebaseId = key;
            commentsArray.push(comment);
        });
        
        commentsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        commentsArray.forEach(comment => {
            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';
            
            commentItem.innerHTML = `
                <div class="comment-header">
                    <div class="comment-author">${escapeHtml(comment.author)}</div>
                    <div class="comment-time">${getTimeAgo(comment.createdAt)}</div>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
            `;
            
            commentsList.appendChild(commentItem);
        });
        
        const commentsCount = commentsArray.length;
        document.getElementById('modalCommentsCount').textContent = commentsCount;
        document.getElementById('commentsCount').textContent = commentsCount;
        
        commentsList.scrollTop = commentsList.scrollHeight;
    });
}

function submitComment(postId) {
    const authorInput = document.getElementById('commentAuthor');
    const textInput = document.getElementById('commentText');
    
    const author = authorInput.value.trim();
    const text = textInput.value.trim();
    
    if (!author || !text) {
        showAlert('Nama dan komentar harus diisi!', 'error');
        return;
    }
    
    const now = new Date().toISOString();
    const newComment = {
        author: author,
        text: text,
        createdAt: now,
        ip: userIP
    };
    
    db.ref('comments/' + postId).push(newComment).then(() => {
        textInput.value = '';
        
        const post = postsCache.find(p => p.firebaseId === postId);
        if (post) {
            post.commentsCount = (post.commentsCount || 0) + 1;
            db.ref('posts/' + postId).update({ commentsCount: post.commentsCount });
        }
        
        showAlert('Komentar berhasil dikirim!', 'success');
    }).catch(error => {
        showAlert('Error: ' + error.message, 'error');
    });
}

function loadAdminPostsList() {
    if (!isAdminLoggedIn) return;
    
    const postsList = document.getElementById('adminPostsList');
    
    db.ref('posts').on('value', (snapshot) => {
        postsList.innerHTML = '';
        
        const data = snapshot.val();
        if (!data) {
            postsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada postingan</p>';
            return;
        }
        
        const postsArray = [];
        Object.keys(data).forEach(key => {
            const post = data[key];
            post.firebaseId = key;
            postsArray.push(post);
        });
        
        postsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        postsArray.forEach(post => {
            const postItem = document.createElement('div');
            postItem.style.cssText = `
                padding: 12px;
                border: 2px solid var(--border-color);
                margin-bottom: 8px;
                background: var(--bg-primary);
                transition: all 0.3s;
            `;
            
            postItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0; color: var(--accent); font-size: 1rem;">${escapeHtml(post.title)}</h4>
                        <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">
                            ${post.language.toUpperCase()} • ${escapeHtml(post.author)} • ${getTimeAgo(post.createdAt)}
                        </p>
                        <div style="margin-top: 5px; font-size: 0.8rem; display: flex; gap: 15px;">
                            <span><i class="fas fa-eye"></i> ${post.views || 0} views</span>
                            <span><i class="fas fa-heart"></i> ${post.likes || 0} likes</span>
                            <span><i class="fas fa-download"></i> ${post.downloads || 0} downloads</span>
                            <span><i class="fas fa-comment"></i> ${post.commentsCount || 0} comments</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-small btn-danger delete-btn" data-id="${post.firebaseId}">
                            <i class="fas fa-trash"></i> HAPUS
                        </button>
                    </div>
                </div>
            `;
            
            postsList.appendChild(postItem);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.dataset.id;
                if (confirm('Apakah Anda yakin ingin menghapus postingan ini?')) {
                    db.ref('posts/' + postId).remove();
                    db.ref('comments/' + postId).remove();
                    showAlert('Postingan berhasil dihapus!', 'success');
                }
            });
        });
    });
}

function setupModal() {
    const modal = document.getElementById('postModal');
    const modalClose = document.getElementById('modalClose');
    
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

function setupAdminPostsList() {
    document.getElementById('clearAllPostsBtn').addEventListener('click', function() {
        if (confirm('Apakah Anda yakin ingin menghapus SEMUA postingan?')) {
            db.ref('posts').remove();
            db.ref('comments').remove();
            showAlert('Semua postingan berhasil dihapus!', 'success');
        }
    });
    
    document.getElementById('exportPostsBtn').addEventListener('click', function() {
        const exportData = {
            posts: postsCache,
            exportedAt: new Date().toISOString(),
            totalPosts: postsCache.length
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `satriacodeshare-export-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert('Data berhasil diexport!', 'success');
    });
    
    document.getElementById('refreshAdminBtn').addEventListener('click', function() {
        loadAdminPostsList();
        showAlert('Data diperbarui!', 'success');
    });
}