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
        
        // 存储所有绘制对象
        this.objects = [];
        this.draggingObject = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
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
            width: 320px;
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
            <button class="control-btn" data-action="drawTree">随机画树</button>
            <button class="control-btn" data-action="drawWoman">随机画女人</button>
            <button class="control-btn" data-action="clearCanvas">清除画布</button>
            <button class="control-btn" data-action="refreshCanvas">刷新画布</button>
            <button class="control-btn" data-action="drawRandomObject">随机对象</button>
            <button class="control-btn" data-action="listObjects">显示对象</button>
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

        // 对象信息显示区域
        this.infoPanel = document.createElement('div');
        this.infoPanel.style.cssText = `
            padding: 10px 15px;
            background: #f9f9f9;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #333;
            max-height: 120px;
            overflow-y: auto;
        `;
        this.infoPanel.textContent = '对象信息: 无';

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
        this.window.appendChild(this.infoPanel);
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
            
            // 绑定画布事件
            this.bindCanvasEvents();
        }
    }
    
    // 绑定画布事件
    bindCanvasEvents() {
        if (!this.canvas) return;
        
        this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleCanvasMouseUp.bind(this));
        
        // 触摸事件支持
        this.canvas.addEventListener('touchstart', this.handleCanvasTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleCanvasTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleCanvasTouchEnd.bind(this));
    }
    
    // 鼠标按下事件处理
    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.startObjectDrag(x, y);
    }
    
    // 触摸开始事件处理
    handleCanvasTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.startObjectDrag(x, y);
    }
    
    // 开始对象拖动
    startObjectDrag(x, y) {
        // 从后向前检查，这样最后绘制的对象在最上面
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (this.isPointInObject(x, y, obj)) {
                this.draggingObject = obj;
                this.dragOffsetX = x - obj.x;
                this.dragOffsetY = y - obj.y;
                this.canvas.style.cursor = 'grabbing';
                break;
            }
        }
    }
    
    // 检查点是否在对象内
    isPointInObject(x, y, obj) {
        const type = obj.type;
        
        if (type === 'tree') {
            // 树对象：检查树干和树冠区域
            const trunkLeft = obj.x - 15;
            const trunkRight = obj.x + 15;
            const trunkTop = obj.y - 100;
            const trunkBottom = obj.y;
            
            const crownLeft = obj.x - 60;
            const crownRight = obj.x + 60;
            const crownTop = obj.y - 180;
            const crownBottom = obj.y - 60;
            
            return (x >= trunkLeft && x <= trunkRight && y >= trunkTop && y <= trunkBottom) ||
                   (x >= crownLeft && x <= crownRight && y >= crownTop && y <= crownBottom);
        } else if (type === 'woman') {
            // 女人对象：检查身体和头部区域
            const bodyLeft = obj.x - 20;
            const bodyRight = obj.x + 20;
            const bodyTop = obj.y - 50;
            const bodyBottom = obj.y;
            
            const headLeft = obj.x - 20;
            const headRight = obj.x + 20;
            const headTop = obj.y - 70;
            const headBottom = obj.y - 30;
            
            return (x >= bodyLeft && x <= bodyRight && y >= bodyTop && y <= bodyBottom) ||
                   (x >= headLeft && x <= headRight && y >= headTop && y <= headBottom);
        }
        return false;
    }
    
    // 鼠标移动事件处理
    handleCanvasMouseMove(e) {
        if (!this.draggingObject) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.moveDraggingObject(x, y);
    }
    
    // 触摸移动事件处理
    handleCanvasTouchMove(e) {
        if (!this.draggingObject) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.moveDraggingObject(x, y);
    }
    
    // 移动拖动中的对象
    moveDraggingObject(x, y) {
        this.draggingObject.x = x - this.dragOffsetX;
        this.draggingObject.y = y - this.dragOffsetY;
        
        // 确保对象不会移出画布边界
        const padding = 50;
        if (this.draggingObject.type === 'tree') {
            this.draggingObject.x = Math.max(padding, Math.min(this.canvas.width - padding, this.draggingObject.x));
            this.draggingObject.y = Math.max(100, Math.min(this.canvas.height - padding, this.draggingObject.y));
        } else {
            this.draggingObject.x = Math.max(30, Math.min(this.canvas.width - 30, this.draggingObject.x));
            this.draggingObject.y = Math.max(50, Math.min(this.canvas.height - 30, this.draggingObject.y));
        }
        
        this.redrawAllObjects();
    }
    
    // 鼠标释放事件处理
    handleCanvasMouseUp() {
        this.endObjectDrag();
    }
    
    // 触摸结束事件处理
    handleCanvasTouchEnd() {
        this.endObjectDrag();
    }
    
    // 结束对象拖动
    endObjectDrag() {
        if (this.draggingObject) {
            this.updateInfoPanel();
        }
        this.draggingObject = null;
        this.canvas.style.cursor = 'default';
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
                this.drawRandomTree();
                break;
            case 'drawWoman':
                this.drawRandomWoman();
                break;
            case 'clearCanvas':
                this.clearCanvas();
                break;
            case 'refreshCanvas':
                this.refreshCanvas();
                break;
            case 'drawRandomObject':
                this.drawRandomObject();
                break;
            case 'listObjects':
                this.listObjects();
                break;
        }
    }

    // 生成随机位置
    getRandomPosition(type) {
        if (!this.canvas) return { x: 100, y: 100 };
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        let minX, maxX, minY, maxY;
        
        if (type === 'tree') {
            // 树需要更多空间
            minX = 60;
            maxX = width - 60;
            minY = 100;
            maxY = height - 100;
        } else {
            // 女人对象
            minX = 40;
            maxX = width - 40;
            minY = 80;
            maxY = height - 50;
        }
        
        return {
            x: Math.floor(Math.random() * (maxX - minX)) + minX,
            y: Math.floor(Math.random() * (maxY - minY)) + minY
        };
    }

    // 在随机位置画树
    drawRandomTree() {
        if (!this.ctx) return;
        
        const pos = this.getRandomPosition('tree');
        this.drawTreeAt(pos.x, pos.y);
    }
    
    // 在随机位置画女人
    drawRandomWoman() {
        if (!this.ctx) return;
        
        const pos = this.getRandomPosition('woman');
        this.drawWomanAt(pos.x, pos.y);
    }
    
    // 在指定位置画树
    drawTreeAt(x, y) {
        if (!this.ctx) return;
        
        const groundY = y;
        const centerX = x;
        
        // 创建树对象
        const treeObj = {
            type: 'tree',
            x: centerX,
            y: groundY,
            width: 120,
            height: 180,
            color: '#006400',
            trunkColor: '#8B4513',
            leavesColor: '#228B22'
        };
        
        this.objects.push(treeObj);
        this.redrawAllObjects();
    }
    
    // 在指定位置画女人
    drawWomanAt(x, y) {
        if (!this.ctx) return;
        
        const centerX = x;
        
        // 创建女人对象
        const womanObj = {
            type: 'woman',
            x: centerX,
            y: y,
            width: 80,
            height: 130,
            bodyColor: '#FF69B4',
            skinColor: '#F5DEB3',
            hairColor: '#8B4513'
        };
        
        this.objects.push(womanObj);
        this.redrawAllObjects();
    }
    
    // 绘制随机对象
    drawRandomObject() {
        if (!this.ctx) return;
        
        const types = ['tree', 'woman'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        if (randomType === 'tree') {
            this.drawRandomTree();
        } else {
            this.drawRandomWoman();
        }
    }
    
    // 重绘所有对象
    redrawAllObjects() {
        if (!this.ctx) return;
        
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制所有对象
        this.objects.forEach(obj => {
            if (obj.type === 'tree') {
                this.renderTree(obj);
            } else if (obj.type === 'woman') {
                this.renderWoman(obj);
            }
        });
        
        this.updateStatusBar();
    }
    
    // 渲染树对象
    renderTree(obj) {
        const { x, y, trunkColor, color, leavesColor } = obj;
        
        // 画树干
        this.ctx.beginPath();
        this.ctx.moveTo(x - 15, y);
        this.ctx.lineTo(x - 10, y - 100);
        this.ctx.lineTo(x + 10, y - 100);
        this.ctx.lineTo(x + 15, y);
        this.ctx.fillStyle = trunkColor;
        this.ctx.fill();
        
        // 画树冠
        this.ctx.beginPath();
        this.ctx.arc(x, y - 120, 60, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // 画叶子
        this.ctx.beginPath();
        this.ctx.arc(x - 40, y - 120, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = leavesColor;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(x + 40, y - 120, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = leavesColor;
        this.ctx.fill();
    }
    
    // 渲染女人对象
    renderWoman(obj) {
        const { x, y, bodyColor, skinColor, hairColor } = obj;
        const height = this.canvas.height;
        
        // 画身体
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - 20, y - 50);
        this.ctx.lineTo(x + 20, y - 50);
        this.ctx.lineTo(x, y);
        this.ctx.fillStyle = bodyColor;
        this.ctx.fill();
        
        // 画头部
        this.ctx.beginPath();
        this.ctx.arc(x, y - 80, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = skinColor;
        this.ctx.fill();
        
        // 画头发
        this.ctx.beginPath();
        this.ctx.arc(x, y - 70, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = hairColor;
        this.ctx.fill();
        
        // 画手臂
        this.ctx.beginPath();
        this.ctx.moveTo(x - 20, y - 50);
        this.ctx.lineTo(x - 40, y - 30);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = skinColor;
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + 20, y - 50);
        this.ctx.lineTo(x + 40, y - 30);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = skinColor;
        this.ctx.stroke();
    }
    
    // 显示对象列表
    listObjects() {
        this.updateInfoPanel();
    }
    
    // 更新信息面板
    updateInfoPanel() {
        if (this.objects.length === 0) {
            this.infoPanel.textContent = '对象信息: 无对象';
            return;
        }
        
        let info = `对象数量: ${this.objects.length}\n`;
        this.objects.forEach((obj, index) => {
            info += `${index + 1}. ${obj.type} - 位置: (${Math.round(obj.x)}, ${Math.round(obj.y)})\n`;
        });
        this.infoPanel.textContent = info;
    }

    // 清除画布
    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.objects = [];
            this.updateStatusBar();
            this.updateInfoPanel();
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
        const objectsInfo = `对象数量: ${this.objects.length}`;
        const currentTime = `当前时间: ${new Date().toLocaleTimeString()}`;
        
        this.statusBar.textContent = `${sizeInfo} | ${objectsInfo} | ${currentTime}`;
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
