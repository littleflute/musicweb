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
        
        // 新增属性：存储画布上的对象
        this.objects = [];
        this.selectedObject = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        // 控制窗口相关
        this.window = null;
        this.statusBar = null;
        
        // 创建界面
        this.createWindow();
        this.findCanvas();
        
        // 初始化事件监听
        this.initEventListeners();

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
            <button class="control-btn" data-action="drawTree">随机添加树</button>
            <button class="control-btn" data-action="drawWoman">随机添加女人</button>
            <button class="control-btn" data-action="drawRandom">随机添加对象</button>
            <button class="control-btn" data-action="clearCanvas">清除所有对象</button>
            <button class="control-btn" data-action="refreshCanvas">刷新画布</button>
            <button class="control-btn" data-action="toggleSelection">选择模式: 关闭</button>
        `;
        controls.innerHTML = buttons;

        // 对象列表区域
        this.objectsList = document.createElement('div');
        this.objectsList.style.cssText = `
            padding: 10px 15px;
            border-top: 1px solid #e0e0e0;
            max-height: 200px;
            overflow-y: auto;
            font-size: 13px;
        `;
        this.objectsList.innerHTML = '<div style="color: #666; margin-bottom: 8px;">对象列表 (点击选择):</div>';
        
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
            .control-btn.active {
                background: #4a6fa5;
                color: white;
                border-color: #3a5a8a;
            }
            .object-item {
                padding: 5px 8px;
                margin: 2px 0;
                border-radius: 3px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .object-item:hover {
                background: #f0f0f0;
            }
            .object-item.selected {
                background: #e0e8f5;
                border-left: 3px solid #4a6fa5;
            }
            .delete-btn {
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 2px 6px;
                font-size: 12px;
                cursor: pointer;
            }
            .delete-btn:hover {
                background: #ff5252;
            }
        `;
        document.head.appendChild(style);

        // 组装元素
        this.window.appendChild(titleBar);
        this.window.appendChild(controls);
        this.window.appendChild(this.objectsList);
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

    // 初始化事件监听
    initEventListeners() {
        if (!this.canvas) return;
        
        // 移除旧的监听器（防止重复添加）
        this.canvas.removeEventListener('mousedown', this.canvasMouseDownHandler);
        this.canvas.removeEventListener('mousemove', this.canvasMouseMoveHandler);
        this.canvas.removeEventListener('mouseup', this.canvasMouseUpHandler);
        
        // 绑定新的监听器
        this.canvasMouseDownHandler = this.handleCanvasMouseDown.bind(this);
        this.canvasMouseMoveHandler = this.handleCanvasMouseMove.bind(this);
        this.canvasMouseUpHandler = this.handleCanvasMouseUp.bind(this);
        
        this.canvas.addEventListener('mousedown', this.canvasMouseDownHandler);
        this.canvas.addEventListener('mousemove', this.canvasMouseMoveHandler);
        this.canvas.addEventListener('mouseup', this.canvasMouseUpHandler);
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
            case 'drawRandom':
                this.drawRandomObject();
                break;
            case 'clearCanvas':
                this.clearCanvas();
                break;
            case 'refreshCanvas':
                this.refreshCanvas();
                break;
            case 'toggleSelection':
                this.toggleSelectionMode(e.target);
                break;
        }
    }

    // 切换选择模式
    toggleSelectionMode(button) {
        // 切换按钮状态
        const isActive = button.classList.toggle('active');
        button.textContent = `选择模式: ${isActive ? '开启' : '关闭'}`;
        
        // 更新状态栏
        this.updateStatusBar();
    }

    // 在随机位置画树
    drawRandomTree() {
        if (!this.ctx) return;
        
        // 随机位置（考虑画布边界）
        const minX = 60;
        const minY = 120;
        const maxX = this.canvas.width - 60;
        const maxY = this.canvas.height - 60;
        
        const x = Math.floor(Math.random() * (maxX - minX)) + minX;
        const y = Math.floor(Math.random() * (maxY - minY)) + minY;
        
        // 创建树对象
        const tree = {
            type: 'tree',
            x: x,
            y: y,
            width: 120,
            height: 180,
            color: '#006400',
            trunkColor: '#8B4513',
            id: 'tree_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
        
        // 添加对象并重绘画布
        this.objects.push(tree);
        this.redrawCanvas();
        this.updateObjectsList();
        
        // 更新状态栏
        this.updateStatusBar();
    }

    // 在随机位置画女人
    drawRandomWoman() {
        if (!this.ctx) return;
        
        // 随机位置
        const minX = 60;
        const minY = 60;
        const maxX = this.canvas.width - 60;
        const maxY = this.canvas.height - 60;
        
        const x = Math.floor(Math.random() * (maxX - minX)) + minX;
        const y = Math.floor(Math.random() * (maxY - minY)) + minY;
        
        // 创建女人对象
        const woman = {
            type: 'woman',
            x: x,
            y: y,
            width: 80,
            height: 130,
            dressColor: '#FF69B4',
            skinColor: '#F5DEB3',
            hairColor: '#8B4513',
            id: 'woman_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
        
        // 添加对象并重绘画布
        this.objects.push(woman);
        this.redrawCanvas();
        this.updateObjectsList();
        
        // 更新状态栏
        this.updateStatusBar();
    }

    // 随机添加对象
    drawRandomObject() {
        const types = ['tree', 'woman'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        if (randomType === 'tree') {
            this.drawRandomTree();
        } else {
            this.drawRandomWoman();
        }
    }

    // 重绘整个画布
    redrawCanvas() {
        if (!this.ctx) return;
        
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制所有对象
        this.objects.forEach(obj => {
            if (obj.type === 'tree') {
                this.drawTreeObject(obj);
            } else if (obj.type === 'woman') {
                this.drawWomanObject(obj);
            }
        });
        
        // 如果选中对象，绘制选择框
        if (this.selectedObject) {
            this.drawSelectionBox(this.selectedObject);
        }
    }

    // 绘制树对象
    drawTreeObject(tree) {
        const centerX = tree.x;
        const groundY = tree.y + tree.height / 2;
        
        // 画树干
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 15, groundY);
        this.ctx.lineTo(centerX - 10, groundY - 100);
        this.ctx.lineTo(centerX + 10, groundY - 100);
        this.ctx.lineTo(centerX + 15, groundY);
        this.ctx.fillStyle = tree.trunkColor;
        this.ctx.fill();

        // 画树冠
        this.ctx.beginPath();
        this.ctx.arc(centerX, groundY - 120, 60, 0, Math.PI * 2);
        this.ctx.fillStyle = tree.color;
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
    }

    // 绘制女人对象
    drawWomanObject(woman) {
        const centerX = woman.x;
        const baseY = woman.y + woman.height / 2;
        
        // 画身体
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, baseY);
        this.ctx.lineTo(centerX - 20, baseY - 50);
        this.ctx.lineTo(centerX + 20, baseY - 50);
        this.ctx.lineTo(centerX, baseY);
        this.ctx.fillStyle = woman.dressColor;
        this.ctx.fill();

        // 画头部
        this.ctx.beginPath();
        this.ctx.arc(centerX, baseY - 80, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = woman.skinColor;
        this.ctx.fill();

        // 画头发
        this.ctx.beginPath();
        this.ctx.arc(centerX, baseY - 70, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = woman.hairColor;
        this.ctx.fill();

        // 画手臂
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 20, baseY - 50);
        this.ctx.lineTo(centerX - 40, baseY - 30);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = woman.skinColor;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(centerX + 20, baseY - 50);
        this.ctx.lineTo(centerX + 40, baseY - 30);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = woman.skinColor;
        this.ctx.stroke();
    }

    // 绘制选择框
    drawSelectionBox(obj) {
        const padding = 5;
        const x = obj.x - obj.width/2 - padding;
        const y = obj.y - obj.height/2 - padding;
        const width = obj.width + padding*2;
        const height = obj.height + padding*2;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#4a6fa5';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.rect(x, y, width, height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    // 处理画布鼠标按下事件
    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否点击了某个对象
        const clickedObject = this.getObjectAtPosition(x, y);
        
        if (clickedObject) {
            // 选择对象
            this.selectedObject = clickedObject;
            this.dragOffsetX = x - clickedObject.x;
            this.dragOffsetY = y - clickedObject.y;
            
            // 更新对象列表
            this.updateObjectsList();
            
            // 重绘画布以显示选择框
            this.redrawCanvas();
        } else {
            // 取消选择
            this.selectedObject = null;
            this.updateObjectsList();
            this.redrawCanvas();
        }
    }

    // 处理画布鼠标移动事件
    handleCanvasMouseMove(e) {
        // 如果没有选中对象，直接返回
        if (!this.selectedObject) return;
        
        // 检查是否按下了鼠标左键
        if (e.buttons !== 1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 更新选中对象的位置
        this.selectedObject.x = x - this.dragOffsetX;
        this.selectedObject.y = y - this.dragOffsetY;
        
        // 确保对象不会移出画布
        const minX = this.selectedObject.width/2;
        const maxX = this.canvas.width - this.selectedObject.width/2;
        const minY = this.selectedObject.height/2;
        const maxY = this.canvas.height - this.selectedObject.height/2;
        
        this.selectedObject.x = Math.max(minX, Math.min(maxX, this.selectedObject.x));
        this.selectedObject.y = Math.max(minY, Math.min(maxY, this.selectedObject.y));
        
        // 重绘画布
        this.redrawCanvas();
    }

    // 处理画布鼠标释放事件
    handleCanvasMouseUp() {
        // 可以在这里添加鼠标释放后的处理逻辑
    }

    // 获取指定位置的对象
    getObjectAtPosition(x, y) {
        // 从后往前遍历（最后添加的对象在最上面）
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            // 简单矩形碰撞检测
            const left = obj.x - obj.width/2;
            const right = obj.x + obj.width/2;
            const top = obj.y - obj.height/2;
            const bottom = obj.y + obj.height/2;
            
            if (x >= left && x <= right && y >= top && y <= bottom) {
                return obj;
            }
        }
        
        return null;
    }

    // 更新对象列表显示
    updateObjectsList() {
        if (!this.objectsList) return;
        
        this.objectsList.innerHTML = '<div style="color: #666; margin-bottom: 8px;">对象列表 (点击选择):</div>';
        
        if (this.objects.length === 0) {
            this.objectsList.innerHTML += '<div style="color: #999; font-style: italic;">暂无对象</div>';
            return;
        }
        
        this.objects.forEach((obj, index) => {
            const item = document.createElement('div');
            item.className = 'object-item';
            if (obj === this.selectedObject) {
                item.classList.add('selected');
            }
            
            const typeName = obj.type === 'tree' ? '树' : '女人';
            item.innerHTML = `
                <span>${typeName} ${index + 1}</span>
                <div>
                    <span style="color: #777; font-size: 11px;">(${Math.round(obj.x)}, ${Math.round(obj.y)})</span>
                    <button class="delete-btn" data-index="${index}">删除</button>
                </div>
            `;
            
            // 点击选择对象
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn')) return;
                
                this.selectedObject = obj;
                this.updateObjectsList();
                this.redrawCanvas();
            });
            
            // 删除按钮
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.objects.splice(index, 1);
                if (this.selectedObject === obj) {
                    this.selectedObject = null;
                }
                this.redrawCanvas();
                this.updateObjectsList();
            });
            
            this.objectsList.appendChild(item);
        });
    }

    // 清除画布
    clearCanvas() {
        this.objects = [];
        this.selectedObject = null;
        this.redrawCanvas();
        this.updateObjectsList();
        this.updateStatusBar();
    }

    // 刷新画布
    refreshCanvas() {
        this.findCanvas();
        this.initEventListeners();
        this.redrawCanvas();
        this.updateStatusBar();
    }

    // 更新状态栏
    updateStatusBar() {
        if (!this.statusBar) return;
        
        if (!this.canvas) {
            this.statusBar.textContent = "画布未找到 | 当前时间: " + new Date().toLocaleTimeString();
            return;
        }

        const sizeInfo = `画布尺寸: ${this.canvas.width}x${this.canvas.height}`;
        const objectsInfo = `对象数量: ${this.objects.length}`;
        const selectedInfo = this.selectedObject ? `选中: ${this.selectedObject.type === 'tree' ? '树' : '女人'}` : "未选中";
        const currentTime = `时间: ${new Date().toLocaleTimeString()}`;
        
        this.statusBar.textContent = `${sizeInfo} | ${objectsInfo} | ${selectedInfo} | ${currentTime}`;
        setTimeout(() => this.updateStatusBar(), 1000);
    }

    // 控制方法示例：
    toggleWindow() {
        this.window.style.display = this.window.style.display === 'none' ? 'block' : 'none';
        if (this.window.style.display === 'block') {
            this.updateObjectsList();
            this.updateStatusBar();
        }
    }

    static getInstance(id) {
        return window.canvasControllers?.find(obj => obj.id === id) || new this(id);
    }
}

// 初始化实例
const controller = CanvasController.getInstance('id_4_canvas');
controller.toggleWindow();

// 如果画布不存在，创建一个示例画布
if (!document.getElementById('id_4_canvas')) {
    const canvas = document.createElement('canvas');
    canvas.id = 'id_4_canvas';
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.cssText = 'border: 1px solid #ccc; background: #f9f9f9;';
    document.body.appendChild(canvas);
    
    // 重新初始化控制器
    const controller = CanvasController.getInstance('id_4_canvas');
    controller.toggleWindow();
}