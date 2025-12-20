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
        this.window = null;
        this.statusBar = null;
        this.lastAction = '';

        // 新增：图形管理相关
        this.shapes = []; // 存储所有绘制的图形 { type: 'tree/woman', x, y, isDragging: false }
        this.activeShape = null; // 当前被拖拽的图形
        this.shapeDragOffsetX = 0; // 拖拽图形时的偏移量
        this.shapeDragOffsetY = 0;

        // 创建界面
        this.createWindow();
        this.findCanvas();
        // 绑定画布拖拽事件
        this.bindCanvasEvents();

        window.canvasControllers.push(this);
    }

    // 创建控制窗口（原有逻辑不变）
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

    // 查找指定ID的画布（原有逻辑不变）
    findCanvas() {
        this.canvas = document.getElementById(this.id);
        if (this.canvas && this.canvas.getContext) {
            this.ctx = this.canvas.getContext('2d');
        }
    }

    // 窗口拖拽逻辑（原有逻辑不变）
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

    // 处理控制按钮点击（升级：添加随机位置）
    handleControlClick(e) {
        const action = e.target.dataset.action;
        if (!action) return;

        switch (action) {
            case 'drawTree':
                this.drawTree(this.getRandomPosition());
                this.lastAction = '画树';
                break;
            case 'drawWoman':
                this.drawWoman(this.getRandomPosition());
                this.lastAction = '画女人';
                break;
            case 'clearCanvas':
                this.clearCanvas();
                this.lastAction = '清除画布';
                break;
            case 'refreshCanvas':
                this.refreshCanvas();
                this.lastAction = '刷新画布';
                break;
        }
        this.updateStatusBar();
    }

    // 新增：获取画布内随机位置
    getRandomPosition() {
        if (!this.canvas) return { x: 0, y: 0 };
        // 预留边界（避免图形超出画布）
        const padding = 100;
        const x = padding + Math.random() * (this.canvas.width - 2 * padding);
        const y = padding + Math.random() * (this.canvas.height - 2 * padding);
        return { x, y };
    }

    // 新增：绑定画布拖拽事件（用于移动图形）
    bindCanvasEvents() {
        if (!this.canvas) return;

        // 开始拖拽图形
        this.canvas.addEventListener('mousedown', this.startShapeDrag.bind(this));
        this.canvas.addEventListener('touchstart', this.startShapeDrag.bind(this));

        // 拖拽图形过程
        const doShapeDrag = (e) => {
            if (!this.activeShape) return;
            const event = e.touches ? e.touches[0] : e;
            // 转换为画布相对坐标
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // 更新图形位置
            this.activeShape.x = x - this.shapeDragOffsetX;
            this.activeShape.y = y - this.shapeDragOffsetY;
            // 重绘画布
            this.redrawAllShapes();
        };

        // 停止拖拽图形
        const stopShapeDrag = () => {
            this.activeShape = null;
            document.removeEventListener('mousemove', doShapeDrag);
            document.removeEventListener('touchmove', doShapeDrag);
            document.removeEventListener('mouseup', stopShapeDrag);
            document.removeEventListener('touchend', stopShapeDrag);
        };

        document.addEventListener('mousemove', doShapeDrag);
        document.addEventListener('touchmove', doShapeDrag);
        document.addEventListener('mouseup', stopShapeDrag);
        document.addEventListener('touchend', stopShapeDrag);
    }

    // 新增：开始拖拽图形
    startShapeDrag(e) {
        if (!this.ctx || this.shapes.length === 0) return;
        const event = e.touches ? e.touches[0] : e;
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // 从后往前找（优先选中上层图形）
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            // 判断是否点击到图形范围内（简单碰撞检测）
            if (this.isPointInShape(clickX, clickY, shape)) {
                this.activeShape = shape;
                // 计算点击位置与图形中心的偏移量
                this.shapeDragOffsetX = clickX - shape.x;
                this.shapeDragOffsetY = clickY - shape.y;
                break;
            }
        }
    }

    // 新增：判断点是否在图形范围内（碰撞检测）
    isPointInShape(x, y, shape) {
        const radius = shape.type === 'tree' ? 60 : 30; // 图形碰撞检测半径
        return Math.hypot(x - shape.x, y - shape.y) <= radius;
    }

    // 新增：重绘所有图形
    redrawAllShapes() {
        this.clearCanvas(false); // 清除画布但不清空图形列表
        this.shapes.forEach(shape => {
            if (shape.type === 'tree') {
                this.drawTree({ x: shape.x, y: shape.y }, false);
            } else if (shape.type === 'woman') {
                this.drawWoman({ x: shape.x, y: shape.y }, false);
            }
        });
    }

    // 画树（升级：支持指定位置 + 不重复添加到列表）
    drawTree(position = { x: 0, y: 0 }, addToList = true) {
        if (!this.ctx) return;
        const { x, y } = position;

        // 画树干
        this.ctx.beginPath();
        this.ctx.moveTo(x - 15, y + 50);
        this.ctx.lineTo(x - 10, y - 50);
        this.ctx.lineTo(x + 10, y - 50);
        this.ctx.lineTo(x + 15, y + 50);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();

        // 画树冠
        this.ctx.beginPath();
        this.ctx.arc(x, y - 70, 60, 0, Math.PI * 2);
        this.ctx.fillStyle = '#006400';
        this.ctx.fill();

        // 画叶子
        this.ctx.beginPath();
        this.ctx.arc(x - 40, y - 70, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#228B22';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x + 40, y - 70, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#228B22';
        this.ctx.fill();

        // 添加到图形列表（仅在主动绘制时添加）
        if (addToList) {
            this.shapes.push({ type: 'tree', x, y });
        }
    }

    // 画女人（升级：支持指定位置 + 不重复添加到列表）
    drawWoman(position = { x: 0, y: 0 }, addToList = true) {
        if (!this.ctx) return;
        const { x, y } = position;

        // 画身体
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 50);
        this.ctx.lineTo(x - 20, y);
        this.ctx.lineTo(x + 20, y);
        this.ctx.lineTo(x, y + 50);
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.fill();

        // 画头部
        this.ctx.beginPath();
        this.ctx.arc(x, y - 30, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#F5DEB3';
        this.ctx.fill();

        // 画头发
        this.ctx.beginPath();
        this.ctx.arc(x, y - 20, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();

        // 画手臂
        this.ctx.beginPath();
        this.ctx.moveTo(x - 20, y);
        this.ctx.lineTo(x - 40, y + 20);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = '#F5DEB3';
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x + 20, y);
        this.ctx.lineTo(x + 40, y + 20);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = '#F5DEB3';
        this.ctx.stroke();

        // 重置线宽
        this.ctx.lineWidth = 1;

        // 添加到图形列表（仅在主动绘制时添加）
        if (addToList) {
            this.shapes.push({ type: 'woman', x, y });
        }
    }

    // 清除画布（升级：支持是否清空图形列表）
    clearCanvas(clearList = true) {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (clearList) {
                this.shapes = [];
            }
        }
    }

    // 刷新画布（原有逻辑不变）
    refreshCanvas() {
        this.findCanvas();
        this.clearCanvas();
        this.updateStatusBar();
    }

    // 更新状态栏（升级：显示图形数量）
    updateStatusBar() {
        if (!this.canvas) {
            this.statusBar.textContent = "画布未找到 | 当前时间: " + new Date().toLocaleTimeString();
            return;
        }

        const sizeInfo = `画布尺寸: ${this.canvas.width}x${this.canvas.height}`;
        const shapeCount = `图形数量: ${this.shapes.length}`;
        const lastDrawn = this.lastAction ? `最后操作: ${this.lastAction}` : "未操作";
        const currentTime = `当前时间: ${new Date().toLocaleTimeString()}`;
        
        this.statusBar.textContent = `${sizeInfo} | ${shapeCount} | ${lastDrawn} | ${currentTime}`;
        // 清除原有定时器，避免重复
        if (this.statusTimer) clearTimeout(this.statusTimer);
        this.statusTimer = setTimeout(() => this.updateStatusBar(), 1000);
    }

    // 控制方法示例：
    toggleWindow() {
        this.window.style.display = this.window.style.display === 'none' ? 'block' : 'none';
    }

    static getInstance(id) {
        return window.canvasControllers?.find(obj => obj.id === id) || new this(id);
    }
}

// 初始化实例（需确保页面中有 id 为 id_4_canvas 的 canvas 元素）
const controller = CanvasController.getInstance('id_4_canvas');
controller.toggleWindow();