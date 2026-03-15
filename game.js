/**
 * WeSeeWe - 跳跃方块游戏
 * 纯 Canvas 实现，无框架依赖
 */

// ==================== 游戏配置 ====================
const CONFIG = {
    CANVAS_WIDTH: 400,
    CANVAS_HEIGHT: 600,
    GRAVITY: 0.6,
    JUMP_FORCE: -14,
    BLOCK_SPEED: 3,
    BLOCK_WIDTH: 80,
    BLOCK_MIN_HEIGHT: 60,
    BLOCK_MAX_HEIGHT: 300,
    PLAYER_SIZE: 40,
    MAX_JUMPS: 2,
    COLORS: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']
};

// ==================== 游戏状态 ====================
let canvas, ctx;
let gameState = 'start'; // start, playing, gameover
let score = 0;
let highScore = localStorage.getItem('weseewe_highscore') || 0;

// ==================== 玩家 ====================
const player = {
    x: 100,
    y: 300,
    vy: 0,
    width: CONFIG.PLAYER_SIZE,
    height: CONFIG.PLAYER_SIZE,
    jumpsLeft: CONFIG.MAX_JUMPS,
    rotation: 0,
    isGrounded: false,
    color: '#fff'
};

// ==================== 方块 ====================
let blocks = [];
let currentColorIndex = 0;
let targetColor = CONFIG.COLORS[0];

// ==================== 云朵装饰 ====================
let clouds = [];

// ==================== 初始化 ====================
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置画布大小
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    
    // 事件监听
    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput();
    });
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleInput();
        }
    });
    
    // 初始化云朵
    for (let i = 0; i < 3; i++) {
        clouds.push({
            x: Math.random() * CONFIG.CANVAS_WIDTH,
            y: 50 + Math.random() * 100,
            width: 60 + Math.random() * 40,
            speed: 0.3 + Math.random() * 0.3
        });
    }
    
    // 开始动画循环
    requestAnimationFrame(gameLoop);
}

// ==================== 输入处理 ====================
function handleInput() {
    if (gameState === 'playing') {
        jump();
    }
}

function jump() {
    if (player.jumpsLeft > 0) {
        player.vy = CONFIG.JUMP_FORCE;
        player.jumpsLeft--;
        player.isGrounded = false;
        player.rotation = 0;
    }
}

// ==================== 开始游戏 ====================
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    
    // 重置状态
    gameState = 'playing';
    score = 0;
    player.x = 100;
    player.y = 300;
    player.vy = 0;
    player.jumpsLeft = CONFIG.MAX_JUMPS;
    player.rotation = 0;
    
    // 重置方块
    blocks = [];
    currentColorIndex = 0;
    targetColor = CONFIG.COLORS[0];
    
    // 生成初始方块
    let lastX = -CONFIG.BLOCK_WIDTH;
    for (let i = 0; i < 8; i++) {
        addBlock(lastX);
        lastX += CONFIG.BLOCK_WIDTH + 20;
    }
    
    updateColorDots();
    updateScore();
}

// ==================== 重新开始 ====================
function restartGame() {
    startGame();
}

// ==================== 添加方块 ====================
function addBlock(x) {
    const height = CONFIG.BLOCK_MIN_HEIGHT + Math.random() * (CONFIG.BLOCK_MAX_HEIGHT - CONFIG.BLOCK_MIN_HEIGHT);
    const colorIndex = currentColorIndex % CONFIG.COLORS.length;
    
    // 确保前几个方块是目标颜色
    let color;
    if (blocks.length < 3) {
        color = targetColor;
    } else {
        color = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
    }
    
    blocks.push({
        x: x || CONFIG.CANVAS_WIDTH,
        y: CONFIG.CANVAS_HEIGHT - height,
        width: CONFIG.BLOCK_WIDTH,
        height: height,
        color: color,
        passed: false
    });
    
    currentColorIndex++;
    
    // 每 5 个方块换一个目标颜色
    if (currentColorIndex % 5 === 0) {
        targetColor = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
        updateColorDots();
    }
}

// ==================== 更新颜色点 ====================
function updateColorDots() {
    const container = document.getElementById('colorDots');
    container.innerHTML = '';
    
    const dot = document.createElement('div');
    dot.className = 'color-dot';
    dot.style.backgroundColor = targetColor;
    container.appendChild(dot);
}

// ==================== 更新分数 ====================
function updateScore() {
    document.getElementById('score').textContent = `分数: ${score}`;
}

// ==================== 游戏结束 ====================
function gameOver() {
    gameState = 'gameover';
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('weseewe_highscore', highScore);
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// ==================== 碰撞检测 ====================
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ==================== 游戏循环 ====================
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ==================== 更新逻辑 ====================
function update() {
    if (gameState !== 'playing') return;
    
    // 更新玩家
    player.vy += CONFIG.GRAVITY;
    player.y += player.vy;
    
    // 旋转效果（跳跃时）
    if (!player.isGrounded) {
        player.rotation += 8;
    }
    
    // 检查是否掉出屏幕
    if (player.y > CONFIG.CANVAS_HEIGHT) {
        gameOver();
        return;
    }
    
    // 更新方块
    let onBlock = false;
    
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        block.x -= CONFIG.BLOCK_SPEED;
        
        // 碰撞检测
        if (checkCollision(player, block)) {
            // 从上方落下
            if (player.vy > 0 && player.y + player.height - player.vy <= block.y + 10) {
                player.y = block.y - player.height;
                player.vy = 0;
                player.jumpsLeft = CONFIG.MAX_JUMPS;
                player.isGrounded = true;
                player.rotation = 0;
                onBlock = true;
                
                // 计分
                if (!block.passed) {
                    block.passed = true;
                    if (block.color === targetColor) {
                        score += 10;
                    } else {
                        score += 1;
                    }
                    updateScore();
                }
            }
        }
        
        // 移除屏幕外的方块
        if (block.x + block.width < 0) {
            blocks.splice(i, 1);
            addBlock();
        }
    }
    
    // 如果不在方块上且在地面上方，应用重力
    if (!onBlock && player.y < CONFIG.CANVAS_HEIGHT - player.height) {
        player.isGrounded = false;
    }
    
    // 更新云朵
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = CONFIG.CANVAS_WIDTH + cloud.width;
        }
    });
}

// ==================== 渲染 ====================
function render() {
    // 清空画布
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // 绘制背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#9fb8ad');
    gradient.addColorStop(1, '#9ad3df');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // 绘制云朵
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.width);
    });
    
    // 绘制方块
    blocks.forEach(block => {
        drawBlock(block);
    });
    
    // 绘制玩家
    drawPlayer();
}

// ==================== 绘制云朵 ====================
function drawCloud(x, y, width) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - width / 4, y + 10, width / 3, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + width / 4, y + 10, width / 3, 15, 0, 0, Math.PI * 2);
    ctx.fill();
}

// ==================== 绘制方块 ====================
function drawBlock(block) {
    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(block.x + 4, block.y + 4, block.width, block.height);
    
    // 主体
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.width, block.height);
    
    // 顶部高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(block.x, block.y, block.width, 8);
    
    // 边框
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(block.x, block.y, block.width, block.height);
}

// ==================== 绘制玩家 ====================
function drawPlayer() {
    ctx.save();
    
    // 移动到玩家中心
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // 旋转
    ctx.rotate(player.rotation * Math.PI / 180);
    
    // 绘制玩家（圆形）
    const radius = player.width / 2;
    
    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(2, 2, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 主体
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-radius / 3, -radius / 3, radius / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-5, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛高光
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -4, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// ==================== 启动游戏 ====================
window.onload = init;