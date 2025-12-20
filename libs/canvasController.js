class CanvasController {
    constructor(id) {
        if (!window.canvasControllers) window.canvasControllers = [];
        const existing = window.canvasControllers.find(obj => obj.id === id);
        if (existing) return existing;

        this.id = id;
        this.canvas = null;
        this.ctx = null;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        // 创建界面
        this.createWindow();
        this.findCanvas();

        window.canvasControllers.push(this);
    }

    // 创建控制窗口
    createWindow() {
        this.window = document.createElement('div');
        this.window.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: white;
            border: 2px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.15);
            z-index: 9999;
            display: none;
            width: 300px;
            font-family: Arial, sans-serif;
        `;

        // 标题栏（可拖动）
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            padding: 12px 16px;
            border-bottom: 1px solid #e0e0e0;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(to right, #4a6fa5, #6790bf);
            color: white;
        `;

        // 标题和关闭按钮
        const titleContainer = document.createElement('div');
        titleContainer.style = 'display: flex; align-items: center;';
        const title = document.createElement('h3');
        title.textContent = '画布控制器';
        title.style = 'margin: 0; font-size: 16px; font-weight: 500;';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style = `
            margin-left: 12px;
            font-size: 16px;
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s;
        `;
        closeBtn.onclick = () => this.toggleWindow();
        closeBtn.onmouseover = () => { closeBtn.style.opacity = '1'; };
        closeBtn.onmouseout = () => { closeBtn.style.opacity = '0.8'; };

        titleContainer.appendChild(title);
        titleContainer.appendChild(closeBtn);
        titleBar.appendChild(titleContainer);

        // 控制按钮区域
        const controls = document.createElement('div');
        controls.style.cssText = `
            padding: 15px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 8px;
        `;
        const buttons = `
            <button class="control-btn" data-action="drawTree">画树</button>
            <button class="control-btn" data-action="drawWoman">画女人</button>
            <button class="control-btn" data-action="clearCanvas">清除画布</button>
            <button class="control-btn" data-action="refreshCanvas">刷新画布</button>
        `;
        controls.innerHTML = buttons;

        // 状态栏
        this.statusBar = document.createElement('div');
        this.statusBar.style.cssText = `
            padding: 8px 15px;
            background: #f5f5f5;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: right;
        `;
        this.updateStatusBar();

        // 按钮样式
        const style = document.createElement('style');
        style.textContent = `
            .control-btn {
                padding: 8px 12px;
                background: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .control-btn:hover {
                background: #e8e8e8;
            }
        `;
        document.head.appendChild(style);

        // 组装元素
        this.window.appendChild(titleBar);
        this.window.appendChild(controls);
        this.window.appendChild(this.statusBar);
        document.body.appendChild(this.window);

        // 绑定事件
        titleBar.addEventListener('mousedown', this.startDrag.bind(this));
        titleBar.addEventListener('touchstart', this.startDrag.bind(this));
        controls.addEventListener('click', this.handleControlClick.bind(this));
    }

    // 查找指定ID的画布
    findCanvas() {
        this.canvas = document.getElementById(this.id);
        if (this.canvas && this.canvas.getContext) {
            this.ctx = this.canvas.getContext('2d');
        }
    }

    // 窗口拖拽逻辑
    startDrag(e) {
        const event = e.touches ? e.touches[0] : e;
        this.isDragging = true;
        this.dragStartX = event.clientX - this.window.offsetLeft;
        this.dragStartY = event.clientY - this.window.offsetTop;

        const doDrag = (e) => {
            const event = e.touches ? e.touches[0] : e;
            if (!this.isDragging) return;
            this.window.style.left = `${event.clientX - this.dragStartX}px`;
            this.window.style.top = `${event.clientY - this.dragStartY}px`;
        };

        const stopDrag = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('touchmove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }

    // 处理控制按钮点击
    handleControlClick(e) {
        const action = e.target.dataset.action;
        if (!action) return;

        switch (action) {
            case 'drawTree':
                this.drawTree();
                break;
            case 'drawWoman':
                this.drawWoman();
                break;
            case 'clearCanvas':
                this.clearCanvas();
                break;
            case 'refreshCanvas':
                this.refreshCanvas();
                break;
        }
    }

    // 在画布上画树的功能
    drawTree() {
        if (!this.ctx) return;

        const { canvas } = this;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const groundY = height - 50;

        // 画树干
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 15, groundY);
        this.ctx.lineTo(centerX - 10, groundY - 100);
        this.ctx.lineTo(centerX + 10, groundY - 100);
        this.ctx.lineTo(centerX + 15, groundY);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();

        // 画树冠
        this.ctx.beginPath();
        this.ctx.arc(centerX, groundY - 120, 60, 0, Math.PI * 2);
        this.ctx.fillStyle = '#006400';
        this.ctx.fill();

        // 画叶子
        this.ctx.beginPath();
        this.ctx.arc(centerX - 40, groundY - 120, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#228B22';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(centerX + 40, groundY - 120, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#228B22';
        this.ctx.fill();

        // 更新状态栏
        this.updateStatusBar();
    }

    // 在画布上画女人的功能
    drawWoman() {
        if (!this.ctx) return;

        const { canvas } = this;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;

        // 画身体
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, height - 150);
        this.ctx.lineTo(centerX - 20, height - 200);
        this.ctx.lineTo(centerX + 20, height - 200);
        this.ctx.lineTo(centerX, height - 150);
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.fill();

        // 画头部
        this.ctx.beginPath();
        this.ctx.arc(centerX, height - 230, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#F5DEB3';
        this.ctx.fill();

        // 画头发
        this.ctx.beginPath();
        this.ctx.arc(centerX, height - 220, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();

        // 画手臂
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 20, height - 200);
        this.ctx.lineTo(centerX - 40, height - 180);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = '#F5DEB3';
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(centerX + 20, height - 200);
        this.ctx.lineTo(centerX + 40, height - 180);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = '#F5DEB3';
        this.ctx.stroke();

        this.updateStatusBar();
    }

    // 清除画布
    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.updateStatusBar();
        }
    }

    // 刷新画布
    refreshCanvas() {
        this.findCanvas();
        this.clearCanvas();
        this.updateStatusBar();
    }

    // 更新状态栏
    updateStatusBar() {
        if (!this.canvas) {
            this.statusBar.textContent = "画布未找到 | 当前时间: " + new Date().toLocaleTimeString();
            return;
        }

        const sizeInfo = `画布尺寸: ${this.canvas.width}x${this.canvas.height}`;
        const lastDrawn = this.lastAction ? `最后操作: ${this.lastAction}` : "未操作";
        const currentTime = `当前时间: ${new Date().toLocaleTimeString()}`;
        
        this.statusBar.textContent = `${sizeInfo} | ${lastDrawn} | ${currentTime}`;
        setTimeout(() => this.updateStatusBar(), 1000);
    }

    // 控制方法示例：
    toggleWindow() {
        this.window.style.display = this.window.style.display === 'none' ? 'block' : 'none';
    }

    static getInstance(id) {
        return window.canvasControllers?.find(obj => obj.id === id) || new this(id);
    }
}

// 初始化实例
const controller = CanvasController.getInstance('id_4_canvas');
controller.toggleWindow();