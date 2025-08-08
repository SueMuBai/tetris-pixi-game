// 游戏配置
const CONFIG = {
    BOARD_WIDTH: 10,
    BOARD_HEIGHT: 20,
    BLOCK_SIZE: 30,
    CANVAS_WIDTH: 300,
    CANVAS_HEIGHT: 600,
    COLORS: [
        0x00F5FF, // 青色 - I型
        0x0000FF, // 蓝色 - J型  
        0xFF8C00, // 橙色 - L型
        0xFFFF00, // 黄色 - O型
        0x32CD32, // 绿色 - S型
        0x800080, // 紫色 - T型
        0xFF0000, // 红色 - Z型
        0xFFFFFF, // 白色
    ],
    SHAPES: [
        // I型
        [
            [1,1,1,1]
        ],
        // J型
        [
            [1,0,0],
            [1,1,1]
        ],
        // L型
        [
            [0,0,1],
            [1,1,1]
        ],
        // O型
        [
            [1,1],
            [1,1]
        ],
        // S型
        [
            [0,1,1],
            [1,1,0]
        ],
        // T型
        [
            [0,1,0],
            [1,1,1]
        ],
        // Z型
        [
            [1,1,0],
            [0,1,1]
        ],
         // 凹型
         [
            [1,1,1],
            [1,0,1]
        ]
    ]
};

class TetrisGame {
    constructor() {
        try {
            this.app = new PIXI.Application({
                view: document.getElementById('gameCanvas'),
                width: CONFIG.CANVAS_WIDTH,
                height: CONFIG.CANVAS_HEIGHT,
                backgroundColor: 0x1a1a2e,
                antialias: true
            });

            this.nextApp = new PIXI.Application({
                view: document.getElementById('nextCanvas'),
                width: 100,
                height: 80,
                backgroundColor: 0xf0f0f0,
                antialias: true
            });
            
            console.log('PixiJS 应用初始化成功');
        } catch (error) {
            console.error('PixiJS 应用初始化失败:', error);
            alert('游戏初始化失败，请刷新页面重试');
            return;
        }

        this.board = Array(CONFIG.BOARD_HEIGHT).fill().map(() => Array(CONFIG.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000; // 1秒
        this.fastDrop = false;
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.gameContainer = new PIXI.Container();
        this.nextContainer = new PIXI.Container();
        this.particleContainer = new PIXI.Container();
        
        this.app.stage.addChild(this.gameContainer);
        this.app.stage.addChild(this.particleContainer);
        this.nextApp.stage.addChild(this.nextContainer);
        
        this.init();
    }

    init() {
        console.log('开始初始化游戏...');
        this.createBoard();
        console.log('游戏板创建完成');
        this.spawnPiece();
        console.log('第一个方块生成完成');
        this.setupControls();
        console.log('控制设置完成');
        this.gameLoop();
        console.log('游戏循环启动');
        this.updateUI();
        console.log('UI更新完成');
    }

    createBoard() {
        // 创建游戏板背景
        const boardBg = new PIXI.Graphics();
        boardBg.beginFill(0x16213e, 0.8);
        boardBg.drawRoundedRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 10);
        boardBg.endFill();
        this.gameContainer.addChild(boardBg);

        // 创建网格线
        const grid = new PIXI.Graphics();
        grid.lineStyle(1, 0x333333, 0.3);
        
        for (let x = 0; x <= CONFIG.BOARD_WIDTH; x++) {
            grid.moveTo(x * CONFIG.BLOCK_SIZE, 0);
            grid.lineTo(x * CONFIG.BLOCK_SIZE, CONFIG.CANVAS_HEIGHT);
        }
        
        for (let y = 0; y <= CONFIG.BOARD_HEIGHT; y++) {
            grid.moveTo(0, y * CONFIG.BLOCK_SIZE);
            grid.lineTo(CONFIG.CANVAS_WIDTH, y * CONFIG.BLOCK_SIZE);
        }
        
        this.gameContainer.addChild(grid);
    }

    createPiece() {
        const shapeIndex = Math.floor(Math.random() * CONFIG.SHAPES.length);
        return {
            shape: CONFIG.SHAPES[shapeIndex],
            color: CONFIG.COLORS[shapeIndex],
            x: Math.floor(CONFIG.BOARD_WIDTH / 2) - 1,
            y: 0,
            graphics: new PIXI.Container()
        };
    }

    spawnPiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.createPiece();
        }
        
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        this.gameContainer.addChild(this.currentPiece.graphics);
        this.drawPiece(this.currentPiece);
        this.drawNextPiece();
        
        // 检查游戏结束
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }

    drawPiece(piece) {
        piece.graphics.removeChildren();
        
        piece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const block = this.createBlock(piece.color);
                    block.x = (piece.x + x) * CONFIG.BLOCK_SIZE;
                    block.y = (piece.y + y) * CONFIG.BLOCK_SIZE;
                    piece.graphics.addChild(block);
                }
            });
        });
    }

    drawNextPiece() {
        this.nextContainer.removeChildren();
        
        const piece = this.nextPiece;
        const offsetX = (100 - piece.shape[0].length * 20) / 2;
        const offsetY = (80 - piece.shape.length * 20) / 2;
        
        piece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const block = this.createBlock(piece.color, 20);
                    block.x = offsetX + x * 20;
                    block.y = offsetY + y * 20;
                    this.nextContainer.addChild(block);
                }
            });
        });
    }

    createBlock(color, size = CONFIG.BLOCK_SIZE) {
        const block = new PIXI.Graphics();
        
        // 主体颜色
        block.beginFill(color, 0.9);
        block.drawRoundedRect(1, 1, size - 2, size - 2, 4);
        block.endFill();
        
        // 高光效果
        block.beginFill(0xFFFFFF, 0.3);
        block.drawRoundedRect(2, 2, size - 8, size - 8, 2);
        block.endFill();
        
        // 边框
        block.lineStyle(1, 0x000000, 0.2);
        block.drawRoundedRect(0, 0, size, size, 4);
        
        return block;
    }

    checkCollision(piece, deltaX, deltaY) {
        const newX = piece.x + deltaX;
        const newY = piece.y + deltaY;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= CONFIG.BOARD_WIDTH || 
                        boardY >= CONFIG.BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    movePiece(deltaX, deltaY) {
        if (!this.checkCollision(this.currentPiece, deltaX, deltaY)) {
            this.currentPiece.x += deltaX;
            this.currentPiece.y += deltaY;
            this.drawPiece(this.currentPiece);
            return true;
        }
        return false;
    }

    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, index) =>
            this.currentPiece.shape.map(row => row[index]).reverse()
        );
        
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.currentPiece.shape = originalShape;
        } else {
            this.drawPiece(this.currentPiece);
        }
    }

    lockPiece() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            });
        });
        
        this.gameContainer.removeChild(this.currentPiece.graphics);
        this.drawBoard();
        this.clearLines();
        this.spawnPiece();
    }

    drawBoard() {
        // 清除旧的方块
        this.gameContainer.children = this.gameContainer.children.filter(child => 
            child !== this.currentPiece?.graphics
        );
        
        // 重新绘制背景和网格
        this.gameContainer.removeChildren();
        this.createBoard();
        
        // 绘制已锁定的方块
        for (let y = 0; y < CONFIG.BOARD_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    const block = this.createBlock(this.board[y][x]);
                    block.x = x * CONFIG.BLOCK_SIZE;
                    block.y = y * CONFIG.BLOCK_SIZE;
                    this.gameContainer.addChild(block);
                }
            }
        }
        
        // 重新添加当前方块
        if (this.currentPiece) {
            this.gameContainer.addChild(this.currentPiece.graphics);
        }
    }

    clearLines() {
        const linesToClear = [];
        
        for (let y = CONFIG.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }
        
        if (linesToClear.length > 0) {
            this.createExplosionEffect(linesToClear);
            
            // 延迟清除行，让爆炸效果播放
            setTimeout(() => {
                // 创建新的游戏板，跳过要清除的行
                const newBoard = [];
                
                for (let y = 0; y < CONFIG.BOARD_HEIGHT; y++) {
                    if (!linesToClear.includes(y)) {
                        newBoard.push([...this.board[y]]);
                    }
                }
                
                // 在顶部添加空行
                while (newBoard.length < CONFIG.BOARD_HEIGHT) {
                    newBoard.unshift(Array(CONFIG.BOARD_WIDTH).fill(0));
                }
                
                this.board = newBoard;
                
                this.lines += linesToClear.length;
                this.score += this.calculateScore(linesToClear.length);
                this.level = Math.floor(this.lines / 10) + 1;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
                
                this.drawBoard();
                this.updateUI();
            }, 500);
        }
    }

    calculateScore(linesCleared) {
        const baseScore = [0, 100, 300, 500, 800];
        return baseScore[linesCleared] * this.level;
    }

    createExplosionEffect(lines) {
        lines.forEach(lineY => {
            for (let x = 0; x < CONFIG.BOARD_WIDTH; x++) {
                this.createParticle(x * CONFIG.BLOCK_SIZE + CONFIG.BLOCK_SIZE/2, 
                                 lineY * CONFIG.BLOCK_SIZE + CONFIG.BLOCK_SIZE/2);
            }
        });
    }

    createParticle(x, y) {
        const particle = new PIXI.Graphics();
        particle.beginFill(0xFFD700);
        particle.drawCircle(0, 0, Math.random() * 3 + 2);
        particle.endFill();
        
        particle.x = x;
        particle.y = y;
        particle.vx = (Math.random() - 0.5) * 10;
        particle.vy = (Math.random() - 0.5) * 10;
        particle.life = 1.0;
        
        this.particleContainer.addChild(particle);
        
        // 粒子动画
        const animate = () => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3; // 重力
            particle.life -= 0.02;
            particle.alpha = particle.life;
            
            if (particle.life > 0) {
                requestAnimationFrame(animate);
            } else {
                this.particleContainer.removeChild(particle);
            }
        };
        animate();
    }

    setupControls() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (!this.currentPiece) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.fastDrop = true;
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case 'Space':
                    while (this.movePiece(0, 1)) {}
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown') {
                this.fastDrop = false;
            }
        });
        
        // 移动端触控控制
        this.setupMobileControls();
        
        // 触摸手势控制
        this.setupTouchGestures();
    }
    
    setupMobileControls() {
        console.log('设置移动端控制...');
        
        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnRotate = document.getElementById('btnRotate');
        const btnDown = document.getElementById('btnDown');
        const btnDrop = document.getElementById('btnDrop');
        
        console.log('按钮元素:', { btnLeft, btnRight, btnRotate, btnDown, btnDrop });
        
        // 同时添加 click 和 touchstart 事件，确保在所有设备上都能工作
        if (btnLeft) {
            btnLeft.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('左移按钮点击');
                if (this.currentPiece) this.movePiece(-1, 0);
            });
            btnLeft.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('左移按钮触摸');
                if (this.currentPiece) this.movePiece(-1, 0);
            });
        }
        
        if (btnRight) {
            btnRight.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('右移按钮点击');
                if (this.currentPiece) this.movePiece(1, 0);
            });
            btnRight.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('右移按钮触摸');
                if (this.currentPiece) this.movePiece(1, 0);
            });
        }
        
        if (btnRotate) {
            btnRotate.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('旋转按钮点击');
                if (this.currentPiece) this.rotatePiece();
            });
            btnRotate.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('旋转按钮触摸');
                if (this.currentPiece) this.rotatePiece();
            });
        }
        
        if (btnDown) {
            btnDown.addEventListener('mousedown', (e) => {
                e.preventDefault();
                console.log('下降按钮按下');
                this.fastDrop = true;
            });
            btnDown.addEventListener('mouseup', (e) => {
                e.preventDefault();
                console.log('下降按钮释放');
                this.fastDrop = false;
            });
            btnDown.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('下降按钮触摸开始');
                this.fastDrop = true;
            });
            btnDown.addEventListener('touchend', (e) => {
                e.preventDefault();
                console.log('下降按钮触摸结束');
                this.fastDrop = false;
            });
        }
        
        if (btnDrop) {
            btnDrop.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('瞬降按钮点击');
                if (this.currentPiece) {
                    while (this.movePiece(0, 1)) {}
                }
            });
            btnDrop.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('瞬降按钮触摸');
                if (this.currentPiece) {
                    while (this.movePiece(0, 1)) {}
                }
            });
        }
    }
    
    setupTouchGestures() {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        
        this.app.view.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        });
        
        this.app.view.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.currentPiece) return;
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const endTime = Date.now();
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;
            
            // 快速点击 = 旋转
            if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20 && deltaTime < 200) {
                this.rotatePiece();
                return;
            }
            
            // 水平滑动
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
                if (deltaX > 0) {
                    this.movePiece(1, 0); // 右移
                } else {
                    this.movePiece(-1, 0); // 左移
                }
            }
            
            // 向下滑动 = 快速下降
            if (deltaY > 50 && deltaY > Math.abs(deltaX)) {
                while (this.movePiece(0, 1)) {}
            }
        });
    }

    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - (this.lastTime || currentTime);
        this.lastTime = currentTime;
        
        this.dropTime += deltaTime;
        const currentDropInterval = this.fastDrop ? 50 : this.dropInterval;
        
        if (this.dropTime >= currentDropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.dropTime = 0;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    gameOver() {
        alert(`游戏结束！\n最终分数: ${this.score}\n等级: ${this.level}\n消除行数: ${this.lines}`);
        location.reload();
    }
}

// TetrisGame 类已定义，启动逻辑移到 HTML 中