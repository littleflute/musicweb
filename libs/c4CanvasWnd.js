class C4CanvasWnd {
    constructor() {
        const id4Canvas = "id_4_canvas";
        this.isVisible = false;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // 从本地存储中恢复窗口状态
        this.windowState = this.loadWindowState();
        
        // 创建浮动窗口
        this.wnd = document.createElement('div');
        this.wnd.style.cssText = `
            position: fixed;
            border: 2px solid #666;
            background: white;
            box-shadow: 5px 5px 15px rgba(0,0,0,0.3);
            display: none;
            touch-action: none;
            z-index: 1000;
        `;
        
        // 创建标题栏
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #666;
            color: white;
            padding: 5px;
            cursor: move;
            user-select: none;
        `;
        
        // 标题文字
        const titleText = document.createElement('div');
        titleText.textContent = 'Canvas Window V0.11: id = ' + id4Canvas;
        
        // 关闭按钮
        this.closeBtn = document.createElement('div');
        this.closeBtn.innerHTML = '&times;';
        this.closeBtn.style.cssText = `
            cursor: pointer;
            padding: 0 8px;
            font-size: 20px;
            line-height: 1;
            &:hover { background: #999 }
        `;
        
        // 组装标题栏
        titleBar.appendChild(titleText);
        titleBar.appendChild(this.closeBtn);
        
        // 创建画布
        this.canvas = document.createElement('canvas');
        this.canvas.id = id4Canvas;
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'calc(100% - 60px)'; // 减去标题栏和状态栏高度
        
        // 创建状态栏
        this.statusBar = document.createElement('div');
        this.statusBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: #eee;
            padding: 5px;
            border-top: 1px solid #ccc;
            font-size: 12px;
            height: 20px;
            display: flex;
            align-items: center;
        `;
        
        // 组装窗口
        this.wnd.appendChild(titleBar);
        this.wnd.appendChild(this.canvas);
        this.wnd.appendChild(this.statusBar);
        document.body.appendChild(this.wnd);
        
        // 应用保存的窗口位置和大小
        this.applyWindowState();
        
        // 事件监听
        this.canvas.addEventListener('mousedown', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('touchstart', this.handleCanvasClick.bind(this), { passive: false });
        this.canvas.addEventListener('mousemove', this.handleCanvasMove.bind(this));
        this.canvas.addEventListener('touchmove', this.handleCanvasMove.bind(this), { passive: false });
        this.canvas.addEventListener('mouseup', this.handleCanvasUp.bind(this));
        this.canvas.addEventListener('touchend', this.handleCanvasUp.bind(this));
        titleBar.addEventListener('mousedown', this.startDrag.bind(this));
        titleBar.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
        this.closeBtn.addEventListener('click', () => this.toggleUI());
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        window.addEventListener('beforeunload', () => this.saveWindowState());
        
        this.resizeCanvas();
        
        // 恢复可见状态
        if (this.windowState.isVisible) {
            this.showWindow();
        }
    }

    // 从本地存储加载窗口状态
    loadWindowState() {
        const defaultState = {
            left: '10%',
            top: '15%',
            width: '80%',
            height: '70%',
            isVisible: false
        };
        
        try {
            const saved = localStorage.getItem('C4CanvasWnd_state');
            if (saved) {
                return { ...defaultState, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load window state:', e);
        }
        
        return defaultState;
    }

    // 保存窗口状态到本地存储
    saveWindowState() {
        try {
            const state = {
                left: this.wnd.style.left,
                top: this.wnd.style.top,
                width: this.wnd.style.width,
                height: this.wnd.style.height,
                isVisible: this.isVisible
            };
            localStorage.setItem('C4CanvasWnd_state', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save window state:', e);
        }
    }

    // 应用保存的窗口状态
    applyWindowState() {
        this.wnd.style.left = this.windowState.left;
        this.wnd.style.top = this.windowState.top;
        this.wnd.style.width = this.windowState.width;
        this.wnd.style.height = this.windowState.height;
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        this.statusBar.textContent = `Clicked at: X:${x.toFixed(0)}, Y:${y.toFixed(0)}`;
    }

    handleCanvasMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        this.statusBar.textContent = `Moving at: X:${x.toFixed(0)}, Y:${y.toFixed(0)}`;
        e.preventDefault();
    }

    handleCanvasUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.changedTouches[0].clientX) - rect.left;
        const y = (e.clientY || e.changedTouches[0].clientY) - rect.top;
        this.statusBar.textContent = `Released at: X:${x.toFixed(0)}, Y:${y.toFixed(0)}`;
    }

    startDrag(e) {
        this.isDragging = true;
        this.dragStartX = e.clientX || e.touches[0].clientX;
        this.dragStartY = e.clientY || e.touches[0].clientY;
        this.offsetX = this.wnd.offsetLeft;
        this.offsetY = this.wnd.offsetTop;
        
        // 使用事件委托来确保在文档级别监听移动事件
        const onDragMove = this.onDrag.bind(this);
        const onDragEnd = this.stopDrag.bind(this);
        
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchend', onDragEnd);
        
        // 存储事件监听器引用以便移除
        this.currentDragMove = onDragMove;
        this.currentDragEnd = onDragEnd;
    }

    onDrag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX === undefined || clientY === undefined) return;
        
        const x = clientX - this.dragStartX;
        const y = clientY - this.dragStartY;
        
        this.wnd.style.left = `${this.offsetX + x}px`;
        this.wnd.style.top = `${this.offsetY + y}px`;
    }

    stopDrag() {
        if (this.isDragging) {
            this.isDragging = false;
            
            // 移除事件监听器
            if (this.currentDragMove) {
                document.removeEventListener('mousemove', this.currentDragMove);
                document.removeEventListener('touchmove', this.currentDragMove);
            }
            if (this.currentDragEnd) {
                document.removeEventListener('mouseup', this.currentDragEnd);
                document.removeEventListener('touchend', this.currentDragEnd);
            }
            
            // 保存当前位置
            this.saveWindowState();
        }
    }

    showWindow() {
        this.isVisible = true;
        this.wnd.style.display = 'block';
        
        // 确保窗口在可视区域内
        this.ensureWindowInViewport();
        
        this.resizeCanvas();
        this.saveWindowState();
    }

    hideWindow() {
        this.isVisible = false;
        this.wnd.style.display = 'none';
        this.saveWindowState();
    }

    toggleUI() {
        if (this.isVisible) {
            this.hideWindow();
        } else {
            this.showWindow();
        }
    }

    // 确保窗口不会移出可视区域
    ensureWindowInViewport() {
        const rect = this.wnd.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = parseInt(this.wnd.style.left) || 0;
        let top = parseInt(this.wnd.style.top) || 0;
        
        // 如果窗口在可视区域外，调整到可视区域内
        if (left < 0) left = 0;
        if (top < 0) top = 0;
        if (left + rect.width > viewportWidth) {
            left = viewportWidth - rect.width;
        }
        if (top + rect.height > viewportHeight) {
            top = viewportHeight - rect.height;
        }
        
        this.wnd.style.left = `${left}px`;
        this.wnd.style.top = `${top}px`;
    }
}

if (!xdApp.c1) xdApp.c1 = new C4CanvasWnd();
xdApp.c1.toggleUI();


