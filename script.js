// 检查是否是管理员模式
const urlParams = new URLSearchParams(window.location.search);
const isAdminMode = urlParams.get('mode') === 'admin';

// 如果不是管理员模式，隐藏登录按钮
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    if (!isAdminMode) {
        loginBtn.style.display = 'none';
        // 禁止选择文本
        document.body.style.userSelect = 'none';
        // 允许内容文本选择
        document.addEventListener('mousedown', function(e) {
            const target = e.target;
            if (target.classList.contains('content-text')) {
                e.target.style.userSelect = 'text';
            }
        });
    }
});

// 管理员密码 (实际应用中应该使用更安全的认证方式)
const ADMIN_PASSWORD = '123456';
let isAdmin = false;

// 从localStorage加载内容，如果没有则使用空数组
const content = {
    clothes: JSON.parse(localStorage.getItem('clothes')) || [],
    cosmetics: JSON.parse(localStorage.getItem('cosmetics')) || [],
    food: JSON.parse(localStorage.getItem('food')) || []
};

// 显示登录表单
function showLoginForm() {
    document.getElementById('loginForm').classList.toggle('hidden');
}

// 登录功能
function login() {
    if (!isAdminMode) {
        alert('无访问权限！');
        return;
    }
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        alert('登录成功！');
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('shareLinks').classList.remove('hidden');
        addEditButtons();
        generateLinks();
    } else {
        alert('密码错误！');
    }
}

// 为每个部分添加编辑按钮
function addEditButtons() {
    if (!isAdmin) return;
    
    ['clothes', 'cosmetics', 'food'].forEach(section => {
        const container = document.getElementById(`${section}Content`);
        // 检查是否已经添加了编辑按钮
        if (!container.parentElement.querySelector('.editBtn')) {
            const editBtn = document.createElement('button');
            editBtn.textContent = '编辑内容';
            editBtn.className = 'editBtn';
            editBtn.onclick = () => editContent(section);
            container.parentElement.insertBefore(editBtn, container);
        }
    });
}

// 编辑内容
function editContent(section) {
    const editDialog = document.createElement('div');
    editDialog.className = 'edit-dialog';
    editDialog.innerHTML = `
        <div class="edit-content">
            <h3>${section === 'clothes' ? '衣服' : section === 'cosmetics' ? '化妆品' : '美食'}编辑</h3>
            <div class="edit-info">
                <p>📝 普通文本：直接输入描述文字</p>
                <p>🔗 可复制链接：以 http:// 或 https:// 开头</p>
            </div>
            <div class="edit-area">
                ${content[section].map((item, index) => `
                    <div class="edit-item">
                        <input type="text" value="${item.text || item}" class="content-input" 
                               placeholder="输入内容或链接">
                        <label class="copy-label ${/^https?:\/\//i.test(item.text || item) ? '' : 'disabled'}">
                            <input type="checkbox" ${(item.copyable !== false) ? 'checked' : ''} 
                                   class="copyable-check" 
                                   ${/^https?:\/\//i.test(item.text || item) ? '' : 'disabled'}>
                            允许复制
                        </label>
                    </div>
                `).join('')}
                <div class="edit-item">
                    <input type="text" placeholder="添加新内容" class="content-input">
                    <label class="copy-label disabled">
                        <input type="checkbox" class="copyable-check" disabled>
                        允许复制
                    </label>
                </div>
            </div>
            <div class="edit-buttons">
                <button onclick="saveContent('${section}', this.parentElement.parentElement)">保存</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()">取消</button>
            </div>
        </div>
    `;
    
    // 添加输入监听器
    editDialog.addEventListener('input', function(e) {
        if (e.target.classList.contains('content-input')) {
            const input = e.target;
            const label = input.parentElement.querySelector('.copy-label');
            const checkbox = label.querySelector('.copyable-check');
            const isLink = /^https?:\/\//i.test(input.value);
            
            label.classList.toggle('disabled', !isLink);
            checkbox.disabled = !isLink;
            if (isLink) {
                checkbox.checked = true;
            }
        }
    });
    
    document.body.appendChild(editDialog);
}

// 添加保存内容的函数
function saveContent(section, dialog) {
    const items = dialog.querySelectorAll('.edit-item');
    const newContent = Array.from(items)
        .map(item => {
            const text = item.querySelector('.content-input').value.trim();
            const copyable = item.querySelector('.copyable-check').checked;
            return text ? { text, copyable } : null;
        })
        .filter(item => item !== null);
    
    content[section] = newContent;
    localStorage.setItem(section, JSON.stringify(newContent));
    updateDisplay(section);
    dialog.parentElement.remove();
}

// 更新显示
function updateDisplay(section) {
    const container = document.getElementById(`${section}Content`);
    if (content[section].length === 0) {
        container.innerHTML = '<p class="empty-message">暂无内容</p>';
        return;
    }
    
    container.innerHTML = content[section].map(item => {
        const text = item.text || item;
        // 检查是否以 http 开头（包括 https）
        const isLink = /^https?:\/\//i.test(text);
        // 只有链接可以复制
        const copyable = isLink && (item.copyable !== false);
        
        return `
            <div class="item">
                <p class="content-text ${copyable ? 'copyable' : 'no-copy'}">
                    ${isLink ? `<span class="link-icon">🔗</span>` : ''}${text}
                </p>
                ${copyable ? `<button onclick="copyText('${text.replace(/'/g, "&#39;")}')" class="copyBtn">复制链接</button>` : ''}
            </div>
        `;
    }).join('');
}

// 复制文本功能
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        // 使用更温和的提示方式
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = '复制成功！';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }).catch(err => {
        console.error('复制失败：', err);
        alert('复制失败，请手动复制。');
    });
}

// 初始化显示
['clothes', 'cosmetics', 'food'].forEach(section => {
    updateDisplay(section);
});

// 生成链接
function generateLinks() {
    // 使用实际部署的 GitHub Pages 链接
    const baseUrl = 'https://你的用户名.github.io/xiaoxishare';
    const visitorLink = baseUrl;
    const adminLink = baseUrl + '?mode=admin';
    
    document.getElementById('visitorLink').textContent = visitorLink;
    document.getElementById('adminLink').textContent = adminLink;
}

// 复制链接
function copyLink(type) {
    const currentUrl = window.location.href.split('?')[0];
    const link = type === 'admin' ? currentUrl + '?mode=admin' : currentUrl;
    
    navigator.clipboard.writeText(link).then(() => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = '链接已复制！';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }).catch(err => {
        console.error('复制失败：', err);
        alert('复制失败，请手动复制。');
    });
} 