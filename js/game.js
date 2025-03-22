// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 音效系统
const SOUNDS = {
    march: new Audio('assets/march.mp3'),
    command: new Audio('assets/command.mp3'),
    cheer: new Audio('assets/cheer.mp3')  // 欢呼声
};

// 调整音量
SOUNDS.march.volume = 0.3;
SOUNDS.command.volume = 0.5;
SOUNDS.cheer.volume = 0.4;
SOUNDS.march.loop = true;

// 调整画布大小函数
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 初始化时调整画布大小
resizeCanvas();

// 监听窗口大小变化
window.addEventListener('resize', resizeCanvas);

// 游戏配置
const GAME_CONFIG = {
    width: window.innerWidth,
    height: window.innerHeight,
    playerSpeed: 5,
    scrollSpeed: 3,
    frameInterval: 100,
    scale: 1,
    minScale: 0.5,
    maxScale: 2,
    soldierCount: 16,
    formationSpacing: 60,
    maxSoldiers: 32,
    minSoldiers: 4,
    formations: {
        square: '方阵',
        circle: '圆阵',
        arrow: '箭阵',
        line: '横阵'
    },
    touchControls: {
        buttonSize: 50,
        buttonSpacing: 10,
        buttonRadius: 25,
        opacity: 0.5
    }
};

// 背景配置
const background = {
    image: new Image(),
    x: 0,
    y: 0,
    scrollSpeed: 3,
    isLoaded: false,
    originalWidth: 0,
    originalHeight: 0,
    scale: 1,
    targetHeight: 0
};

// 加载背景图片
background.image.onload = function() {
    background.isLoaded = true;
    background.originalWidth = this.width;
    background.originalHeight = this.height;
    background.scale = window.innerHeight / this.height;
    background.targetHeight = window.innerHeight;
    player.y = GAME_CONFIG.height / 2;
    initializeSoldiers(); // 初始化士兵
};
background.image.onerror = function() {
    console.log('背景图片加载失败');
    background.isLoaded = false;
};
background.image.src = 'assets/background.jpg';

// 角色动画配置
const SPRITE_CONFIG = {
    width: 40,  // 加宽以适应马匹
    height: 50, // 加高以适应骑马形象
    colors: {
        commander: {
            body: '#8B0000',
            head: '#FFE4C4',
            helmet: '#DAA520',
            weapon: '#8B4513',
            horse: '#8B4513'  // 马的颜色
        },
        soldier: {
            body: '#A52A2A',
            head: '#FFE4C4',
            helmet: '#4A4A4A',
            weapon: '#8B4513',
            horse: '#DEB887'  // 马的颜色
        }
    }
};

// 玩家对象（指挥官）
const player = {
    x: 100,
    y: GAME_CONFIG.height / 2,
    width: SPRITE_CONFIG.width,
    height: SPRITE_CONFIG.height,
    speed: GAME_CONFIG.playerSpeed,
    direction: 1,
    frame: 0,
    frameCount: 4,
    lastFrameTime: 0,
    isMoving: false,
    isCommanding: false
};

// 士兵数组
let soldiers = [];

// 当前阵型
let currentFormation = 'square';
let formationTransitioning = false;
let morale = 100; // 士气值

// 触摸控制状态
const touchControls = {
    moveTouch: null,
    moveStartPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    buttons: [
        { x: 0, y: 0, key: 'Space', text: '命令' },
        { x: 0, y: 0, key: 'KeyF', text: '阵型' },
        { x: 0, y: 0, key: 'KeyC', text: '欢呼' },
        { x: 0, y: 0, key: 'Equal', text: '+兵' },
        { x: 0, y: 0, key: 'Minus', text: '-兵' }
    ]
};

// 更新触摸按钮位置
function updateTouchButtonPositions() {
    const { buttonSize, buttonSpacing } = GAME_CONFIG.touchControls;
    const margin = buttonSpacing;
    
    // 移动摇杆位置（左下角）
    const joystickX = buttonSize + margin;
    const joystickY = GAME_CONFIG.height - buttonSize - margin;
    
    // 功能按钮位置（右下角）
    touchControls.buttons.forEach((button, index) => {
        button.x = GAME_CONFIG.width - (buttonSize + buttonSpacing) * (index + 1);
        button.y = GAME_CONFIG.height - buttonSize - margin;
    });
}

// 初始化时更新按钮位置
updateTouchButtonPositions();

// 监听窗口大小变化
window.addEventListener('resize', () => {
    resizeCanvas();
    updateTouchButtonPositions();
});

// 触摸事件处理
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    
    // 检查是否点击了功能按钮
    touchControls.buttons.forEach(button => {
        const dx = touchX - button.x - GAME_CONFIG.touchControls.buttonRadius;
        const dy = touchY - button.y - GAME_CONFIG.touchControls.buttonRadius;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < GAME_CONFIG.touchControls.buttonRadius) {
            // 模拟按键按下
            const event = new KeyboardEvent('keydown', { code: button.key });
            window.dispatchEvent(event);
        }
    });
    
    // 检查是否在移动区域（左侧）
    if (touchX < GAME_CONFIG.width / 2) {
        touchControls.moveTouch = touch.identifier;
        touchControls.moveStartPos = { x: touchX, y: touchY };
        touchControls.currentPos = { x: touchX, y: touchY };
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    // 更新移动控制
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchControls.moveTouch) {
            touchControls.currentPos = { x: touch.clientX, y: touch.clientY };
            
            // 计算移动方向
            const dx = touch.clientX - touchControls.moveStartPos.x;
            const dy = touch.clientY - touchControls.moveStartPos.y;
            
            // 更新按键状态
            keys.ArrowLeft = dx < -20;
            keys.ArrowRight = dx > 20;
            keys.ArrowUp = dy < -20;
            keys.ArrowDown = dy > 20;
            break;
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    // 检查是否释放了移动触摸
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchControls.moveTouch) {
            touchControls.moveTouch = null;
            // 重置所有方向键状态
            keys.ArrowLeft = false;
            keys.ArrowRight = false;
            keys.ArrowUp = false;
            keys.ArrowDown = false;
            break;
        }
    }
    
    // 检查是否释放了功能按钮
    touchControls.buttons.forEach(button => {
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        const dx = touchX - button.x - GAME_CONFIG.touchControls.buttonRadius;
        const dy = touchY - button.y - GAME_CONFIG.touchControls.buttonRadius;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < GAME_CONFIG.touchControls.buttonRadius) {
            // 模拟按键释放
            const event = new KeyboardEvent('keyup', { code: button.key });
            window.dispatchEvent(event);
        }
    });
});

// 防止默认的触摸行为（如滚动）
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// 初始化士兵
function initializeSoldiers() {
    soldiers = [];
    const rows = 4;
    const cols = 4;
    for (let i = 0; i < GAME_CONFIG.soldierCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        soldiers.push({
            x: player.x - (col + 1) * GAME_CONFIG.formationSpacing,
            y: player.y + (row - 1.5) * GAME_CONFIG.formationSpacing,
            width: SPRITE_CONFIG.width * 0.8,
            height: SPRITE_CONFIG.height * 0.8,
            direction: 1,
            frame: Math.random() * 4 | 0,
            targetX: 0,
            targetY: 0,
            speed: GAME_CONFIG.playerSpeed * 0.8,
            isMoving: false
        });
    }
}

// 缩放控制
function zoomIn() {
    if (background.scale < GAME_CONFIG.maxScale) {
        background.scale += 0.1;
    }
}

function zoomOut() {
    if (background.scale > GAME_CONFIG.minScale) {
        background.scale -= 0.1;
    }
}

// 按键状态
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false,
    KeyF: false,  // 切换阵型
    KeyC: false,  // 欢呼
    Equal: false, // 增加士兵 (+键)
    Minus: false  // 减少士兵 (-键)
};

// 监听键盘事件
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        keys.Space = true;
        player.isCommanding = true;
        SOUNDS.command.currentTime = 0;
        SOUNDS.command.play();
        e.preventDefault();
    } else if (e.code === 'KeyF' && !keys.KeyF) {
        keys.KeyF = true;
        switchFormation();
        e.preventDefault();
    } else if (e.code === 'KeyC' && !keys.KeyC) {
        keys.KeyC = true;
        cheer();
        e.preventDefault();
    } else if (e.code === 'Equal' && !keys.Equal) {  // 增加士兵
        keys.Equal = true;
        addSoldier();
        e.preventDefault();
    } else if (e.code === 'Minus' && !keys.Minus) {  // 减少士兵
        keys.Minus = true;
        removeSoldier();
        e.preventDefault();
    } else if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        if (!SOUNDS.march.playing) {
            SOUNDS.march.play();
        }
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        keys.Space = false;
        player.isCommanding = false;
    } else if (e.code === 'KeyF') {
        keys.KeyF = false;
    } else if (e.code === 'KeyC') {
        keys.KeyC = false;
    } else if (e.code === 'Equal') {
        keys.Equal = false;
    } else if (e.code === 'Minus') {
        keys.Minus = false;
    } else if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
    
    if (!keys.ArrowLeft && !keys.ArrowRight && !keys.ArrowUp && !keys.ArrowDown) {
        SOUNDS.march.pause();
        SOUNDS.march.currentTime = 0;
    }
});

// 切换阵型
function switchFormation() {
    const formations = Object.keys(GAME_CONFIG.formations);
    const currentIndex = formations.indexOf(currentFormation);
    currentFormation = formations[(currentIndex + 1) % formations.length];
    formationTransitioning = true;
    SOUNDS.command.play();
}

// 欢呼效果
function cheer() {
    SOUNDS.cheer.currentTime = 0;
    SOUNDS.cheer.play();
    morale = Math.min(morale + 10, 100);
    soldiers.forEach(soldier => {
        soldier.cheering = true;
        soldier.cheerTime = 60;  // 欢呼持续时间
    });
}

// 获取阵型位置
function getFormationPosition(index) {
    const spacing = GAME_CONFIG.formationSpacing;
    const centerX = player.x - spacing * 2;
    const centerY = player.y;
    
    switch(currentFormation) {
        case 'square':
            const row = Math.floor(index / 4);
            const col = index % 4;
            return {
                x: centerX - col * spacing,
                y: centerY + (row - 1.5) * spacing
            };
        case 'circle':
            const angle = (index / GAME_CONFIG.soldierCount) * Math.PI * 2;
            const radius = spacing * 2;
            return {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            };
        case 'arrow':
            if (index === 0) {
                return { x: centerX, y: centerY };  // 箭头尖
            }
            const arrowRow = Math.floor((index - 1) / 3);
            const arrowCol = (index - 1) % 3;
            return {
                x: centerX - spacing - arrowCol * spacing,
                y: centerY + (arrowRow - 0.5) * spacing + (Math.abs(arrowCol - 1) * spacing * 0.5)
            };
        case 'line':
            return {
                x: centerX - index * (spacing * 0.8),
                y: centerY
            };
    }
}

// 更新士兵位置
function updateSoldiers() {
    soldiers.forEach((soldier, index) => {
        const formation = getFormationPosition(index);
        const dx = formation.x - soldier.x;
        const dy = formation.y - soldier.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
            soldier.isMoving = true;
            soldier.x += (dx / distance) * soldier.speed;
            soldier.y += (dy / distance) * soldier.speed;
            soldier.direction = dx > 0 ? 1 : -1;
        } else {
            soldier.isMoving = false;
            formationTransitioning = false;
        }
        
        // 更新动画帧
        if (soldier.isMoving) {
            soldier.frame = (soldier.frame + 0.1) % 4;
        }
        
        // 更新欢呼动画
        if (soldier.cheering) {
            soldier.cheerTime--;
            if (soldier.cheerTime <= 0) {
                soldier.cheering = false;
            }
        }
    });
    
    // 缓慢降低士气
    if (!formationTransitioning && !player.isCommanding) {
        morale = Math.max(50, morale - 0.01);
    }
}

// 更新玩家位置和动画
function updatePlayer(currentTime) {
    player.isMoving = keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown;

    const previousX = player.x;
    
    if (keys.ArrowLeft) {
        player.x -= player.speed;
        player.direction = -1;
    }
    if (keys.ArrowRight) {
        player.x += player.speed;
        player.direction = 1;
    }
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;

    // 边界检查
    player.x = Math.max(50, Math.min(player.x, GAME_CONFIG.width - player.width - 50));
    player.y = Math.max(50, Math.min(player.y, GAME_CONFIG.height - player.height - 50));

    // 更新背景位置
    if (background.isLoaded) {
        if (player.x !== previousX) {
            const maxScroll = (background.originalWidth * background.scale) - window.innerWidth;
            
            if (player.x > GAME_CONFIG.width * 0.7 && background.x > -maxScroll) {
                background.x -= background.scrollSpeed;
                player.x = previousX;
            } else if (player.x < GAME_CONFIG.width * 0.3 && background.x < 0) {
                background.x += background.scrollSpeed;
                player.x = previousX;
            }
            
            background.x = Math.min(0, Math.max(-maxScroll, background.x));
        }
    }

    // 更新动画帧
    if (player.isMoving && currentTime - player.lastFrameTime > GAME_CONFIG.frameInterval) {
        player.frame = (player.frame + 1) % player.frameCount;
        player.lastFrameTime = currentTime;
    }
    
    // 更新士兵位置
    updateSoldiers();
}

// 绘制角色
function drawCharacter(x, y, direction, frame, scale = 1, isCommander = false, isMoving = false, isCheering = false) {
    const { width, height } = SPRITE_CONFIG;
    const colors = isCommander ? SPRITE_CONFIG.colors.commander : SPRITE_CONFIG.colors.soldier;
    
    ctx.save();
    if (direction === -1) {
        ctx.translate(x + width * scale, 0);
        ctx.scale(-1, 1);
        x = 0;
    }

    const bounceOffset = isMoving ? Math.sin(frame * Math.PI / 2) * 3 : 0;
    const cheerOffset = isCheering ? Math.sin(frame * Math.PI) * 5 : 0;

    // 绘制马
    ctx.fillStyle = colors.horse;
    // 马身
    ctx.beginPath();
    ctx.ellipse(
        x + width * scale * 0.5,
        y + height * scale * 0.7 + bounceOffset,
        width * scale * 0.4,
        height * scale * 0.25,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // 马腿
    const legOffset = isMoving ? Math.sin(frame * Math.PI) * 5 : 0;
    // 前腿
    ctx.fillRect(
        x + width * scale * 0.7,
        y + height * scale * 0.7 + bounceOffset,
        width * scale * 0.1,
        height * scale * 0.3 + legOffset
    );
    // 后腿
    ctx.fillRect(
        x + width * scale * 0.3,
        y + height * scale * 0.7 + bounceOffset,
        width * scale * 0.1,
        height * scale * 0.3 - legOffset
    );

    // 马头
    ctx.beginPath();
    ctx.ellipse(
        x + width * scale * 0.8,
        y + height * scale * 0.6 + bounceOffset,
        width * scale * 0.15,
        height * scale * 0.15,
        Math.PI * 0.25,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // 绘制骑士身体
    ctx.fillStyle = colors.body;
    ctx.fillRect(
        x + width * scale * 0.35,
        y + height * scale * 0.3 + bounceOffset,
        width * scale * 0.3,
        height * scale * 0.4
    );

    // 绘制头部
    ctx.fillStyle = colors.head;
    ctx.beginPath();
    ctx.arc(
        x + width * scale * 0.5,
        y + height * scale * 0.25 + bounceOffset,
        width * scale * 0.12,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // 绘制头盔
    ctx.fillStyle = colors.helmet;
    ctx.beginPath();
    ctx.arc(
        x + width * scale * 0.5,
        y + height * scale * 0.25 + bounceOffset,
        width * scale * 0.12,
        Math.PI,
        Math.PI * 2
    );
    ctx.fill();

    // 绘制武器（长矛）
    ctx.fillStyle = colors.weapon;
    ctx.save();
    ctx.translate(
        x + width * scale * 0.5,
        y + height * scale * 0.3 + bounceOffset
    );
    ctx.rotate(Math.PI * 0.25);
    ctx.fillRect(0, 0, width * scale * 0.8, width * scale * 0.05);
    ctx.restore();

    // 如果是指挥官且正在发出命令，绘制命令光环
    if (isCommander && player.isCommanding) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            x + width * scale * 0.5,
            y + height * scale * 0.5,
            width * scale,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }

    // 如果在欢呼，添加欢呼效果
    if (isCheering) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            x + width * scale * 0.5,
            y + height * scale * 0.25,
            width * scale * 0.3,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }

    ctx.restore();
}

// 绘制游戏
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (background.isLoaded) {
        const scaledWidth = background.originalWidth * background.scale;
        const scaledHeight = background.originalHeight * background.scale;
        
        ctx.drawImage(
            background.image,
            background.x, 0,
            scaledWidth, scaledHeight
        );
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 绘制士兵
    soldiers.forEach(soldier => {
        drawCharacter(
            soldier.x,
            soldier.y,
            soldier.direction,
            soldier.frame,
            0.8,
            false,
            soldier.isMoving,
            soldier.cheering
        );
    });

    // 绘制玩家（指挥官）
    drawCharacter(
        player.x,
        player.y,
        player.direction,
        player.frame,
        1,
        true,
        player.isMoving
    );

    // 绘制游戏信息
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 250, 150);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('使用方向键移动角色', 20, 30);
    ctx.fillText('按住空格键发出命令', 20, 50);
    ctx.fillText('按F键切换阵型: ' + GAME_CONFIG.formations[currentFormation], 20, 70);
    ctx.fillText('按C键欢呼', 20, 90);
    ctx.fillText('按+键增加士兵，按-键减少士兵', 20, 110);
    ctx.fillText(`士气: ${Math.round(morale)}%`, 20, 130);
    ctx.fillText(`士兵数量: ${soldiers.length}/${GAME_CONFIG.maxSoldiers}`, 20, 150);

    // 绘制触摸控制UI
    if ('ontouchstart' in window) {  // 仅在触摸设备上显示
        const { buttonSize, buttonRadius, opacity } = GAME_CONFIG.touchControls;
        
        // 绘制移动区域提示（左侧）
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(
            buttonSize + 10,
            GAME_CONFIG.height - buttonSize - 10,
            buttonRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // 如果正在移动，绘制当前位置
        if (touchControls.moveTouch !== null) {
            ctx.beginPath();
            ctx.arc(
                touchControls.currentPos.x,
                touchControls.currentPos.y,
                buttonRadius * 0.5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // 绘制功能按钮
        touchControls.buttons.forEach(button => {
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(
                button.x + buttonRadius,
                button.y + buttonRadius,
                buttonRadius,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // 绘制按钮文字
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                button.x + buttonRadius,
                button.y + buttonRadius
            );
        });
    }
}

// 游戏主循环
function gameLoop(currentTime) {
    updatePlayer(currentTime);
    draw();
    requestAnimationFrame(gameLoop);
}

// 启动游戏
gameLoop(0);

// 添加士兵
function addSoldier() {
    if (soldiers.length < GAME_CONFIG.maxSoldiers) {
        const lastSoldier = soldiers[soldiers.length - 1];
        const newSoldier = {
            x: lastSoldier ? lastSoldier.x : player.x - GAME_CONFIG.formationSpacing,
            y: lastSoldier ? lastSoldier.y : player.y,
            width: SPRITE_CONFIG.width * 0.8,
            height: SPRITE_CONFIG.height * 0.8,
            direction: 1,
            frame: Math.random() * 4 | 0,
            targetX: 0,
            targetY: 0,
            speed: GAME_CONFIG.playerSpeed * 0.8,
            isMoving: false,
            cheering: false,
            cheerTime: 0
        };
        soldiers.push(newSoldier);
        SOUNDS.command.currentTime = 0;
        SOUNDS.command.play();
        morale = Math.min(morale + 5, 100);  // 增加士气
    }
}

// 移除士兵
function removeSoldier() {
    if (soldiers.length > GAME_CONFIG.minSoldiers) {
        soldiers.pop();
        morale = Math.max(morale - 5, 50);  // 降低士气
    }
} 