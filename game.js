/**
 * WeSeeWe - 跳跃方块游戏 v2.0
 * 纯 Canvas 实现，无框架依赖
 * 
 * 新增功能：
 * - 渐进式难度
 * - 平台类型（安全/危险/奖励/弹簧）
 * - 道具系统
 * - 预判辅助线
 * - 动态分数反馈
 * - 成就系统
 * - 复活机制
 * - 排行榜
 */

// ==================== 游戏配置 ====================
const CONFIG = {
    CANVAS_WIDTH: 400,
    CANVAS_HEIGHT: 600,
    GRAVITY: 0.5,
    JUMP_FORCE: -13,
    SPRING_JUMP_FORCE: -18,
    BLOCK_SPEED: 3,
    BLOCK_WIDTH: 80,
    BLOCK_MIN_HEIGHT: 80,
    BLOCK_MAX_HEIGHT: 350,
    PLAYER_SIZE: 36,
    MAX_JUMPS: 2,
    
    // 难度配置
    DIFFICULTY: {
        EASY: { speedMult: 0.8, heightRange: 0.5, gapChance: 0.1 },
        NORMAL: { speedMult: 1.0, heightRange: 0.75, gapChance: 0.2 },
        HARD: { speedMult: 1.2, heightRange: 1.0, gapChance: 0.3 }
    },
    
    // 平台类型
    BLOCK_TYPES: {
        NORMAL: { color: '#3498db', score: 1, safe: true },
        SAFE: { color: '#2ecc71', score: 5, safe: true, glow: true },
        DANGER: { color: '#e74c3c', score: -5, safe: false, fragile: true },
        REWARD: { color: '#f1c40f', score: 15, safe: true, bonus: true },
        SPRING: { color: '#9b59b6', score: 3, safe: true, spring: true }
    },
    
    // 道具类型
    POWERUP_TYPES: {
        SHIELD: { color: '#00d4ff', duration: 5000, icon: '🛡️' },
        MAGNET: { color: '#ff6b6b', duration: 3000, icon: '🧲' },
        DOUBLE: { color: '#ffd93d', duration: 5000, icon: '2️⃣' }
    }
};

// ==================== 游戏状态 ====================
let canvas, ctx;
let gameState = 'start';
let score = 0;
let highScore = parseInt(localStorage.getItem('weseewe_highscore')) || 0;
let leaderboard = JSON.parse(localStorage.getItem('weseewe_leaderboard')) || [];
let difficulty = 'EASY';
let combo = 0;
let maxCombo = 0;

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
    color: '#fff',
    
    // 状态效果
    shield: false,
    magnet: false,
    doubleScore: false,
    invincible: false,
    invincibleTimer: 0,
    
    // 动画
    scale: 1,
    glowIntensity: 0,
    shakeX: 0,
    shakeY: 0
};

// ==================== 方块 ====================
let blocks = [];
let particles = [];
let floatingTexts = [];
let powerups = [];
let collectibles = [];

// ==================== 云朵装饰 ====================
let clouds = [];

// ==================== 音效系统 ====================
const AudioSystem = {
    sounds: {},
    enabled: true,
    
    init() {
        // 使用 Web Audio API 生成简单音效
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    },
    
    play(type) {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        switch(type) {
            case 'jump':
                oscillator.frequency.setValueAtTime(400, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.1);
                break;
            case 'land':
                oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.05);
                break;
            case 'score':
                oscillator.frequency.setValueAtTime(523, ctx.currentTime);
                oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.2);
                break;
            case 'powerup':
                oscillator.frequency.setValueAtTime(400, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.15);
                break;
            case 'gameover':
                oscillator.frequency.setValueAtTime(300, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.3);
                break;
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
};

// ==================== 初始化 ====================
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    
    AudioSystem.init();
    
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
    for (let i = 0; i < 4; i++) {
        clouds.push({
            x: Math.random() * CONFIG.CANVAS_WIDTH,
            y: 30 + Math.random() * 80,
            width: 50 + Math.random() * 50,
            speed: 0.2 + Math.random() * 0.3,
            opacity: 0.3 + Math.random() * 0.4
        });
    }
    
    // 显示最高分
    document.getElementById('highScore').textContent = `最高分: ${highScore}`;
    
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
        player.scale = 1.2; // 弹跳动画
        
        AudioSystem.play('jump');
        
        // 跳跃粒子效果
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: player.x + player.width / 2,
                y: player.y + player.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 2,
                life: 20,
                color: '#fff',
                size: 3 + Math.random() * 3
            });
        }
    }
}

// ==================== 开始游戏 ====================
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    
    // 重置状态
    gameState = 'playing';
    score = 0;
    combo = 0;
    maxCombo = 0;
    difficulty = 'EASY';
    
    // 重置玩家
    Object.assign(player, {
        x: 100, y: 300, vy: 0,
        jumpsLeft: CONFIG.MAX_JUMPS,
        rotation: 0, isGrounded: false,
        shield: false, magnet: false, doubleScore: false,
        invincible: false, invincibleTimer: 0,
        scale: 1, glowIntensity: 0, shakeX: 0, shakeY: 0
    });
    
    // 重置游戏对象
    blocks = [];
    particles = [];
    floatingTexts = [];
    powerups = [];
    collectibles = [];
    
    // 生成初始方块
    let lastX = -CONFIG.BLOCK_WIDTH;
    for (let i = 0; i < 8; i++) {
        addBlock(lastX, i < 3); // 前3个是安全平台
        lastX += CONFIG.BLOCK_WIDTH + 30;
    }
    
    updateScore();
    updateCombo();
}

// ==================== 重新开始 ====================
function restartGame() {
    startGame();
}

// ==================== 复活 ====================
let canRevive = true;

function revive() {
    if (!canRevive) return;
    
    canRevive = false;
    document.getElementById('gameOverScreen').style.display = 'none';
    
    gameState = 'playing';
    player.y = 200;
    player.vy = 0;
    player.invincible = true;
    player.invincibleTimer = 180; // 3秒无敌
    
    // 扣除分数
    score = Math.max(0, score - 20);
    updateScore();
}

// ==================== 添加方块 ====================
function addBlock(x, forceSafe = false) {
    const diffConfig = CONFIG.DIFFICULTY[difficulty];
    const heightRange = CONFIG.BLOCK_MAX_HEIGHT - CONFIG.BLOCK_MIN_HEIGHT;
    const adjustedRange = heightRange * diffConfig.heightRange;
    
    const height = CONFIG.BLOCK_MIN_HEIGHT + 
        Math.random() * adjustedRange;
    
    // 确定平台类型
    let type;
    if (forceSafe) {
        type = 'SAFE';
    } else {
        const rand = Math.random();
        if (rand < 0.5) type = 'NORMAL';
        else if (rand < 0.7) type = 'SAFE';
        else if (rand < 0.85) type = 'REWARD';
        else if (rand < 0.95) type = 'SPRING';
        else type = 'DANGER';
    }
    
    const blockConfig = CONFIG.BLOCK_TYPES[type];
    
    blocks.push({
        x: x || CONFIG.CANVAS_WIDTH,
        y: CONFIG.CANVAS_HEIGHT - height,
        width: CONFIG.BLOCK_WIDTH,
        height: height,
        type: type,
        color: blockConfig.color,
        safe: blockConfig.safe,
        fragile: blockConfig.fragile,
        spring: blockConfig.spring,
        bonus: blockConfig.bonus,
        glow: blockConfig.glow,
        passed: false,
        breaking: false,
        breakTimer: 0
    });
    
    // 随机添加收集物
    if (Math.random() < 0.15 && !forceSafe) {
        collectibles.push({
            x: (x || CONFIG.CANVAS_WIDTH) + CONFIG.BLOCK_WIDTH / 2,
            y: CONFIG.CANVAS_HEIGHT - height - 50,
            collected: false,
            type: Math.random() < 0.5 ? 'coin' : 'star',
            bobOffset: Math.random() * Math.PI * 2
        });
    }
    
    // 随机添加道具
    if (Math.random() < 0.05 && score > 30) {
        const types = Object.keys(CONFIG.POWERUP_TYPES);
        const powerupType = types[Math.floor(Math.random() * types.length)];
        powerups.push({
            x: (x || CONFIG.CANVAS_WIDTH) + CONFIG.BLOCK_WIDTH / 2,
            y: CONFIG.CANVAS_HEIGHT - height - 80,
            type: powerupType,
            collected: false,
            bobOffset: Math.random() * Math.PI * 2
        });
    }
}

// ==================== 更新分数 ====================
function updateScore() {
    document.getElementById('score').textContent = `分数: ${score}`;
    
    // 更新难度
    if (score >= 100) difficulty = 'HARD';
    else if (score >= 50) difficulty = 'NORMAL';
}

// ==================== 更新连击 ====================
function updateCombo() {
    document.getElementById('combo').textContent = combo > 1 ? `连击 x${combo}` : '';
}

// ==================== 添加浮动文字 ====================
function addFloatingText(x, y, text, color = '#fff') {
    floatingTexts.push({
        x, y, text, color,
        life: 60,
        vy: -2
    });
}

// ==================== 游戏结束 ====================
function gameOver() {
    if (player.invincible) return;
    
    gameState = 'gameover';
    AudioSystem.play('gameover');
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('weseewe_highscore', highScore);
        document.getElementById('highScore').textContent = `最高分: ${highScore}`;
    }
    
    // 更新排行榜
    leaderboard.push({ score, date: new Date().toLocaleDateString() });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('weseewe_leaderboard', JSON.stringify(leaderboard));
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('maxCombo').textContent = `最大连击: ${maxCombo}`;
    
    // 显示/隐藏复活按钮
    document.getElementById('reviveBtn').style.display = canRevive ? 'inline-block' : 'none';
    
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
    
    const diffConfig = CONFIG.DIFFICULTY[difficulty];
    const currentSpeed = CONFIG.BLOCK_SPEED * diffConfig.speedMult;
    
    // 更新无敌状态
    if (player.invincible) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }
    
    // 更新玩家
    player.vy += CONFIG.GRAVITY;
    player.y += player.vy;
    
    // 缩放动画恢复
    player.scale += (1 - player.scale) * 0.1;
    
    // 震动效果恢复
    player.shakeX *= 0.9;
    player.shakeY *= 0.9;
    
    // 旋转效果
    if (!player.isGrounded) {
        player.rotation += 6;
    }
    
    // 检查是否掉出屏幕
    if (player.y > CONFIG.CANVAS_HEIGHT + 50) {
        gameOver();
        return;
    }
    
    // 更新方块
    let onBlock = false;
    
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        block.x -= currentSpeed;
        
        // 破碎动画
        if (block.breaking) {
            block.breakTimer++;
            if (block.breakTimer > 15) {
                blocks.splice(i, 1);
                continue;
            }
        }
        
        // 碰撞检测
        if (!block.breaking && checkCollision(player, block)) {
            if (player.vy > 0 && player.y + player.height - player.vy <= block.y + 15) {
                
                if (block.safe || player.shield) {
                    // 安全着陆
                    player.y = block.y - player.height;
                    player.vy = 0;
                    player.jumpsLeft = CONFIG.MAX_JUMPS;
                    player.isGrounded = true;
                    player.rotation = 0;
                    onBlock = true;
                    
                    // 弹簧平台
                    if (block.spring) {
                        player.vy = CONFIG.SPRING_JUMP_FORCE;
                        player.isGrounded = false;
                        AudioSystem.play('powerup');
                        addFloatingText(player.x, player.y, '🚀 弹射!', '#9b59b6');
                    }
                    
                    // 着陆效果
                    player.shakeY = 3;
                    AudioSystem.play('land');
                    
                    // 计分
                    if (!block.passed) {
                        block.passed = true;
                        
                        let points = CONFIG.BLOCK_TYPES[block.type].score;
                        if (player.doubleScore) points *= 2;
                        if (block.bonus) points += combo * 2;
                        
                        score += points;
                        combo++;
                        maxCombo = Math.max(maxCombo, combo);
                        
                        updateScore();
                        updateCombo();
                        
                        if (points > 0) {
                            AudioSystem.play('score');
                            addFloatingText(player.x + 20, player.y, `+${points}`, block.color);
                        }
                        
                        // 成就检测
                        checkAchievements();
                    }
                } else {
                    // 危险平台
                    if (!player.invincible) {
                        block.breaking = true;
                        player.shakeX = 5;
                        player.shakeY = 5;
                        
                        score = Math.max(0, score + CONFIG.BLOCK_TYPES[block.type].score);
                        combo = 0;
                        updateScore();
                        updateCombo();
                        
                        addFloatingText(player.x, player.y, '💥 危险!', '#e74c3c');
                        
                        // 破碎粒子
                        for (let j = 0; j < 10; j++) {
                            particles.push({
                                x: block.x + block.width / 2,
                                y: block.y,
                                vx: (Math.random() - 0.5) * 8,
                                vy: -Math.random() * 5,
                                life: 30,
                                color: block.color,
                                size: 5 + Math.random() * 5
                            });
                        }
                    }
                }
            }
        }
        
        // 移除屏幕外的方块
        if (block.x + block.width < -50) {
            blocks.splice(i, 1);
            addBlock();
        }
    }
    
    // 更新收集物
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        c.x -= currentSpeed;
        c.bobOffset += 0.1;
        
        // 磁铁效果
        if (player.magnet) {
            const dx = player.x + player.width / 2 - c.x;
            const dy = player.y + player.height / 2 - c.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                c.x += dx * 0.1;
                c.y += dy * 0.1;
            }
        }
        
        // 碰撞检测
        if (!c.collected && Math.abs(c.x - player.x - player.width/2) < 30 && 
            Math.abs(c.y - player.y - player.height/2) < 30) {
            c.collected = true;
            const points = c.type === 'star' ? 5 : 2;
            score += player.doubleScore ? points * 2 : points;
            updateScore();
            AudioSystem.play('score');
            addFloatingText(c.x, c.y, `+${points}`, '#ffd93d');
            collectibles.splice(i, 1);
        } else if (c.x < -30) {
            collectibles.splice(i, 1);
        }
    }
    
    // 更新道具
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.x -= currentSpeed;
        p.bobOffset += 0.08;
        
        if (!p.collected && Math.abs(p.x - player.x - player.width/2) < 35 && 
            Math.abs(p.y - player.y - player.height/2) < 35) {
            p.collected = true;
            applyPowerup(p.type);
            powerups.splice(i, 1);
        } else if (p.x < -30) {
            powerups.splice(i, 1);
        }
    }
    
    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // 更新浮动文字
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy;
        t.life--;
        if (t.life <= 0) floatingTexts.splice(i, 1);
    }
    
    // 更新云朵
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = CONFIG.CANVAS_WIDTH + cloud.width;
        }
    });
    
    // 不在方块上
    if (!onBlock && player.y < CONFIG.CANVAS_HEIGHT - player.height) {
        player.isGrounded = false;
    }
}

// ==================== 应用道具效果 ====================
function applyPowerup(type) {
    AudioSystem.play('powerup');
    const config = CONFIG.POWERUP_TYPES[type];
    
    switch(type) {
        case 'SHIELD':
            player.shield = true;
            setTimeout(() => player.shield = false, config.duration);
            addFloatingText(player.x, player.y - 30, '🛡️ 护盾!', config.color);
            break;
        case 'MAGNET':
            player.magnet = true;
            setTimeout(() => player.magnet = false, config.duration);
            addFloatingText(player.x, player.y - 30, '🧲 磁铁!', config.color);
            break;
        case 'DOUBLE':
            player.doubleScore = true;
            setTimeout(() => player.doubleScore = false, config.duration);
            addFloatingText(player.x, player.y - 30, '2️⃣ 双倍!', config.color);
            break;
    }
}

// ==================== 成就检测 ====================
function checkAchievements() {
    if (score === 50) {
        addFloatingText(CONFIG.CANVAS_WIDTH/2 - 50, 200, '🏆 50分里程碑!', '#f1c40f');
    } else if (score === 100) {
        addFloatingText(CONFIG.CANVAS_WIDTH/2 - 50, 200, '🏆 100分里程碑!', '#f1c40f');
    } else if (combo === 10) {
        addFloatingText(CONFIG.CANVAS_WIDTH/2 - 50, 200, '🔥 10连击!', '#e74c3c');
    }
}

// ==================== 渲染 ====================
function render() {
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#9fb8ad');
    gradient.addColorStop(1, '#9ad3df');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // 云朵
    clouds.forEach(cloud => {
        ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cloud.x - cloud.width / 4, cloud.y + 8, cloud.width / 3, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cloud.x + cloud.width / 4, cloud.y + 8, cloud.width / 3, 12, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // 方块
    blocks.forEach(block => {
        drawBlock(block);
    });
    
    // 收集物
    collectibles.forEach(c => {
        if (c.collected) return;
        const bobY = Math.sin(c.bobOffset) * 5;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(c.type === 'star' ? '⭐' : '🪙', c.x, c.y + bobY);
    });
    
    // 道具
    powerups.forEach(p => {
        if (p.collected) return;
        const bobY = Math.sin(p.bobOffset) * 8;
        const config = CONFIG.POWERUP_TYPES[p.type];
        
        // 光晕
        ctx.fillStyle = config.color + '40';
        ctx.beginPath();
        ctx.arc(p.x, p.y + bobY, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(config.icon, p.x, p.y + bobY + 8);
    });
    
    // 粒子
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctx.globalAlpha = 1;
    });
    
    // 玩家
    drawPlayer();
    
    // 浮动文字
    floatingTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.life / 60;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x + 20, t.y);
        ctx.globalAlpha = 1;
    });
    
    // 预判线（跳跃时显示）
    if (!player.isGrounded && player.jumpsLeft < CONFIG.MAX_JUMPS) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(player.x + player.width/2, player.y + player.height);
        ctx.lineTo(player.x + player.width/2, player.y + player.height + 100);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// ==================== 绘制方块 ====================
function drawBlock(block) {
    ctx.save();
    
    // 破碎效果
    if (block.breaking) {
        ctx.globalAlpha = 1 - block.breakTimer / 15;
        ctx.translate(block.x + block.width/2, block.y + block.height/2);
        ctx.rotate(block.breakTimer * 0.1);
        ctx.translate(-(block.x + block.width/2), -(block.y + block.height/2));
    }
    
    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(block.x + 3, block.y + 3, block.width, block.height);
    
    // 发光效果
    if (block.glow || block.bonus) {
        ctx.shadowColor = block.color;
        ctx.shadowBlur = 15;
    }
    
    // 主体
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.width, block.height);
    
    // 顶部高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(block.x, block.y, block.width, 6);
    
    // 弹簧标记
    if (block.spring) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⬆', block.x + block.width/2, block.y + 25);
    }
    
    // 危险标记
    if (block.fragile && !block.breaking) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠', block.x + block.width/2, block.y + 30);
    }
    
    ctx.restore();
}

// ==================== 绘制玩家 ====================
function drawPlayer() {
    ctx.save();
    
    const drawX = player.x + player.shakeX;
    const drawY = player.y + player.shakeY;
    
    // 无敌闪烁
    if (player.invincible && Math.floor(player.invincibleTimer / 5) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    // 护盾效果
    if (player.shield) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(drawX + player.width/2, drawY + player.height/2, player.width/2 + 8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.translate(drawX + player.width/2, drawY + player.height/2);
    ctx.rotate(player.rotation * Math.PI / 180);
    ctx.scale(player.scale, player.scale);
    
    const radius = player.width / 2;
    
    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(2, 2, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 主体
    const playerGradient = ctx.createRadialGradient(-radius/3, -radius/3, 0, 0, 0, radius);
    playerGradient.addColorStop(0, '#fff');
    playerGradient.addColorStop(1, player.doubleScore ? '#ffd93d' : '#e0e0e0');
    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(-radius/3, -radius/3, radius/3, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-5, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛高光
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// ==================== 启动游戏 ====================
window.onload = init;