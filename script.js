// 增强的雨滴效果和交互功能
class EnhancedRainWeaver {
    constructor(options = {}) {
        this.rainContainer = options.rainContainer || document.getElementById('rainContainer');
        this.isSecondary = !!options.rainContainer; // 用于区分主/副实例
        this.interactionArea = !this.isSecondary ? document.getElementById('interactionArea') : null;
        this.title = !this.isSecondary ? document.querySelector('.title') : null;
        this.mainContent = !this.isSecondary ? document.getElementById('mainContent') : null;
        this.raindrops = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.mouseGlow = null;
        this.rainDensity = options.rainDensity || 80; // 雨滴数量
        this.windStrength = 0;
        this.windDirection = 0;
        this.scrollThreshold = 0.3; // 滚动阈值（30%的视窗高度）
        this.frameCount = 0; // 新增：全局帧计数器
        
        this.init();
    }

    init() {
        if (!this.isSecondary) {
            this.createMouseGlow();
            this.setupEventListeners();
            this.startWindSimulation();
            this.startMemoryCleanup();
            this.setupScrollListener();
        }
        this.createRaindrops();
        this.animate();
    }

    setupScrollListener() {
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const scrollProgress = scrollY / windowHeight;
        
        // 使用更平滑的缓动函数计算透明度
        const smoothFadeProgress = this.easeInOutCubic(Math.min(scrollProgress / 0.8, 1));
        
        // 淡出雨滴容器
        if (this.rainContainer) {
            this.rainContainer.style.opacity = Math.max(0, 1 - smoothFadeProgress);
        }
        
        // 淡出标题 - 只改变透明度，不缩放
        if (this.title) {
            const titleOpacity = Math.max(0, 1 - smoothFadeProgress);
            this.title.style.opacity = titleOpacity;
            this.title.style.transform = 'translate(-50%, -50%) scale(1)';
        }
        
        // 淡出交互区域
        if (this.interactionArea) {
            this.interactionArea.style.opacity = Math.max(0, 1 - smoothFadeProgress);
        }
        
        // 显示正文内容 - 在滚动到50%时开始显示
        if (this.mainContent && scrollProgress > 0.5) {
            const contentOpacity = this.easeInOutCubic(Math.min((scrollProgress - 0.5) / 0.3, 1));
            this.mainContent.style.opacity = contentOpacity;
            this.mainContent.style.transform = `translateY(${50 - contentOpacity * 50}px)`;
        } else if (this.mainContent) {
            this.mainContent.style.opacity = 0;
            this.mainContent.style.transform = 'translateY(50px)';
        }
    }

    // 平滑的缓动函数
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    createMouseGlow() {
        this.mouseGlow = document.createElement('div');
        this.mouseGlow.className = 'mouse-glow';
        document.body.appendChild(this.mouseGlow);
    }

    createRaindrops() {
        const raindropChars = ['|', ':', "'", '.'];
        
        for (let i = 0; i < this.rainDensity; i++) {
            this.createRaindrop(raindropChars);
        }
    }

    createRaindrop(chars) {
        const raindrop = document.createElement('div');
        raindrop.className = 'raindrop';
        
        // 随机属性
        const baseChar = chars[Math.floor(Math.random() * chars.length)];
        const x = Math.random() * window.innerWidth;
        const size = 8 + Math.random() * 12; // 更小的字体大小
        const angle = -5 + Math.random() * 10;
        const opacity = 0.5 + Math.random() * 0.3;
        
        // 随机长度 10-19
        const dropLength = 10 + Math.floor(Math.random() * 10);
        // 初始只显示1个字符
        let currentLength = 1;
        
        // 深浅不一的蓝色
        const blueColors = [
            '#1e3a8a', // 深蓝
            '#3b82f6', // 中蓝
            '#60a5fa', // 浅蓝
            '#93c5fd', // 更浅蓝
            '#2563eb', // 标准蓝
            '#1d4ed8'  // 深蓝
        ];
        const color = blueColors[Math.floor(Math.random() * blueColors.length)];
        
        // 随机起始位置在屏幕顶部
        const startY = -200 - Math.random() * 100;
        
        // 物理下落参数
        const initialSpeed = 0.5 + Math.random() * 0.5; // 初速度（像素/帧）
        const acceleration = 0.15 + Math.random() * 0.05; // 加速度（像素/帧²）
        const terminalSpeed = 2.5 + Math.random() * 1.5; // 终端速度（最大速度）
        
        // 生成竖直排列的span结构
        raindrop.innerHTML = `<span>${baseChar}</span><br>`;
        raindrop.style.left = x + 'px';
        raindrop.style.fontSize = size + 'px';
        raindrop.style.color = color;
        raindrop.style.whiteSpace = 'pre-line';
        raindrop.style.lineHeight = '1';
        raindrop.style.transform = `rotate(${angle}deg)`;
        raindrop.style.opacity = opacity;
        raindrop.style.top = startY + 'px';
        
        // 存储雨滴数据
        raindrop.dataset.x = x;
        raindrop.dataset.y = startY;
        raindrop.dataset.speed = initialSpeed; // 当前速度
        raindrop.dataset.acceleration = acceleration;
        raindrop.dataset.terminalSpeed = terminalSpeed;
        raindrop.dataset.angle = angle;
        raindrop.dataset.length = dropLength;
        // 新增：生长动画相关
        raindrop.dataset.currentLength = currentLength;
        raindrop.dataset.baseChar = baseChar;
        raindrop.dataset.growFrame = this.frameCount; // 记录上一次生长的帧数
        
        this.rainContainer.appendChild(raindrop);
        this.raindrops.push(raindrop);
    }

    setupEventListeners() {
        // 鼠标移动
        this.interactionArea.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
            this.updateMouseGlow();
        });

        // 鼠标点击
        this.interactionArea.addEventListener('click', (e) => {
            this.createRipple(e.clientX, e.clientY);
        });

        // 鼠标按下
        this.interactionArea.addEventListener('mousedown', () => {
            this.isMouseDown = true;
        });

        this.interactionArea.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // 键盘控制
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        // 窗口大小改变
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 触摸事件支持
        this.interactionArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
            this.createRipple(touch.clientX, touch.clientY);
        });

        this.interactionArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
            this.updateMouseGlow();
            this.handleMouseMove();
        });
    }

    updateMouseGlow() {
        if (this.mouseGlow) {
            this.mouseGlow.style.left = this.mouseX + 'px';
            this.mouseGlow.style.top = this.mouseY + 'px';
        }
    }

    handleMouseMove(e) {
        // 只记录鼠标位置，不做任何计算
        if (e) {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }
    }

    createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 1000);
    }

    handleKeyPress(e) {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.createRipple(this.mouseX, this.mouseY);
                break;
            case 'r':
            case 'R':
                this.resetRaindrops();
                break;
            case 'ArrowLeft':
                this.windDirection = -1;
                break;
            case 'ArrowRight':
                this.windDirection = 1;
                break;
            case 'ArrowUp':
                this.windStrength = Math.min(this.windStrength + 0.5, 5);
                break;
            case 'ArrowDown':
                this.windStrength = Math.max(this.windStrength - 0.5, 0);
                break;
        }
    }

    startWindSimulation() {
        setInterval(() => {
            if (this.windStrength > 0) {
                this.raindrops.forEach(drop => {
                    const x = parseFloat(drop.dataset.x);
                    const windEffect = this.windStrength * this.windDirection * 0.5;
                    drop.dataset.x = x + windEffect;
                    drop.style.left = (x + windEffect) + 'px';
                });
            }
        }, 100);
    }

    resetRaindrops() {
        this.raindrops.forEach(drop => {
            if (drop.parentNode) {
                drop.parentNode.removeChild(drop);
            }
        });
        this.raindrops = [];
        const raindropChars = ['|', ':', "'", '.'];
        for (let i = 0; i < this.rainDensity; i++) {
            this.createRaindrop(raindropChars);
        }
    }

    handleResize() {
        this.recreateRaindrops();
    }

    recreateRaindrops() {
        this.raindrops.forEach(drop => {
            if (drop.parentNode) {
                drop.parentNode.removeChild(drop);
            }
        });
        this.raindrops = [];
        this.createRaindrops();
    }

    animate() {
        this.frameCount++;
        const mouseRadius = 160;
        this.raindrops.forEach(drop => {
            this.updateFallingDrop(drop);
            // 流线型整体偏移缓动
            if (drop._curOffsetX === undefined) drop._curOffsetX = 0;
            if (drop._targetOffsetX === undefined) drop._targetOffsetX = 0;
            // 计算整体偏移
            let dx = 0, dy = 0, dist = 0;
            if (!this.isSecondary) {
                const dropX = parseFloat(drop.dataset.x);
                const dropY = parseFloat(drop.dataset.y);
                dx = this.mouseX - dropX;
                dy = this.mouseY - dropY;
                dist = Math.sqrt(dx*dx + dy*dy);
            }
            let offsetX = 0;
            if (!this.isSecondary && dist < mouseRadius) {
                const norm = 1 - dist / mouseRadius;
                offsetX = 40 * Math.sin(norm * Math.PI/2) * (dx > 0 ? 1 : -1);
            }
            drop._targetOffsetX = offsetX;
            // 缓动
            drop._curOffsetX += (drop._targetOffsetX - drop._curOffsetX) * 0.18;
            if (Math.abs(drop._curOffsetX) < 0.2 && Math.abs(drop._targetOffsetX) < 0.2) drop._curOffsetX = 0;
            // 叠加原有旋转
            const angle = drop.dataset.angle || 0;
            drop.style.transform = `translateX(${drop._curOffsetX}px) rotate(${angle}deg)`;
            // 窗帘效果（每行span）
            if (!this.isSecondary) {
                const dropX = parseFloat(drop.dataset.x);
                const dropY = parseFloat(drop.dataset.y);
                const direction = (this.mouseX > dropX) ? 1 : -1;
                const spans = drop.querySelectorAll('span');
                spans.forEach((span, index) => {
                    const distanceFactor = dist < mouseRadius ? (1 - dist / mouseRadius) : 0;
                    const delay = index * 0.05;
                    const swingAngle = distanceFactor * 15 * direction * (1 - index/spans.length);
                    span.style.transform = `rotate(${swingAngle}deg)`;
                    span.style.transition = `transform 0.3s ${delay}s ease-out`;
                });
            }
        });
        
        // 创建新的雨滴来维持密度
        const raindropChars = ['|', ':', "'", '.'];
        while (this.raindrops.length < this.rainDensity) {
            this.createRaindrop(raindropChars);
        }

        requestAnimationFrame(() => this.animate());
    }

    updateFallingDrop(drop) {
        // 获取雨滴数据
        let x = parseFloat(drop.dataset.x);
        let y = parseFloat(drop.dataset.y);
        let speed = parseFloat(drop.dataset.speed);
        const acceleration = parseFloat(drop.dataset.acceleration);
        const terminalSpeed = parseFloat(drop.dataset.terminalSpeed);
        
        // 真实物理：有加速度，速度逐渐趋于终端速度
        if (speed < terminalSpeed) {
            speed = Math.min(speed + acceleration, terminalSpeed);
            drop.dataset.speed = speed;
        }
        
        // 下落
        y += speed;
        
        // 雨滴生长动画
        let currentLength = parseInt(drop.dataset.currentLength);
        const targetLength = parseInt(drop.dataset.length) || 1;
        const baseChar = drop.dataset.baseChar || '|';
        let lastGrowFrame = parseInt(drop.dataset.growFrame) || 0;
        // 计算当前需要的间隔：最小6帧，初始24帧，依次递减2帧
        let growInterval = Math.max(6, 24 - (currentLength - 1) * 2);
        if (currentLength < targetLength && (this.frameCount - lastGrowFrame) >= growInterval) {
            currentLength++;
            drop.dataset.currentLength = currentLength;
            drop.dataset.growFrame = this.frameCount;
            // 生成竖直排列的span结构
            let html = '';
            for (let i = 0; i < currentLength; i++) {
                html += `<span>${baseChar}</span><br>`;
            }
            drop.innerHTML = html;
        }
        
        // 检查是否到达底部
        const dropHeight = targetLength * 12; // 估算串状雨滴的高度
        
        if (y >= window.innerHeight) {
            // 雨滴到达底部后消失
            if (drop.parentNode) {
                drop.parentNode.removeChild(drop);
            }
            const index = this.raindrops.indexOf(drop);
            if (index > -1) {
                this.raindrops.splice(index, 1);
            }
            return;
        }
        
        // 更新雨滴数据
        drop.dataset.x = x;
        drop.dataset.y = y;
        drop.dataset.speed = speed;
        
        // 更新显示
        drop.style.left = x + 'px';
        drop.style.top = y + 'px';
    }

    startMemoryCleanup() {
        // 定期清理内存
        setInterval(() => {
            // 清理可能残留的ripple元素
            const ripples = document.querySelectorAll('.ripple');
            ripples.forEach(ripple => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            });
            
            // 强制垃圾回收（如果浏览器支持）
            if (window.gc) {
                window.gc();
            }
            
            // 性能监控
            this.monitorPerformance();
        }, 5000);
    }

    monitorPerformance() {
        // 监控DOM元素数量
        const raindropCount = this.raindrops.length;
        
        // 如果元素过多，减少雨滴密度
        if (raindropCount > this.rainDensity * 1.2) {
            this.rainDensity = Math.max(60, this.rainDensity - 5);
        }
    }


}

// 初始化增强版雨滴效果
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedRainWeaver();
    // 第二页雨滴
    const rainContainer2 = document.getElementById('rainContainer2');
    if (rainContainer2) {
        new EnhancedRainWeaver({ rainContainer: rainContainer2, rainDensity: 40 });
    }
});

// 添加屏幕闪烁效果
function addScreenFlicker() {
    const flicker = document.createElement('div');
    flicker.className = 'screen-flicker';
    document.body.appendChild(flicker);
    
    // 随机闪烁（降低频率）
    setInterval(() => {
        if (Math.random() < 0.05) {
            flicker.style.opacity = '1';
            setTimeout(() => {
                flicker.style.opacity = '0';
            }, 30);
        }
    }, 2000);
}

// 添加像素纹理
function addPixelTexture() {
    const texture = document.createElement('div');
    texture.className = 'pixel-texture';
    document.body.appendChild(texture);
}

// 添加像素噪点效果
function addPixelNoise() {
    const noiseCanvas = document.createElement('canvas');
    const ctx = noiseCanvas.getContext('2d');
    
    noiseCanvas.style.position = 'fixed';
    noiseCanvas.style.top = '0';
    noiseCanvas.style.left = '0';
    noiseCanvas.style.width = '100%';
    noiseCanvas.style.height = '100%';
    noiseCanvas.style.pointerEvents = 'none';
    noiseCanvas.style.opacity = '0.05';
    noiseCanvas.style.zIndex = '5';
    
    noiseCanvas.width = window.innerWidth;
    noiseCanvas.height = window.innerHeight;
    
    function generateNoise() {
        const imageData = ctx.createImageData(noiseCanvas.width, noiseCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 255;
            data[i] = noise;     // R
            data[i + 1] = noise; // G
            data[i + 2] = noise; // B
            data[i + 3] = 255;   // A
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    generateNoise();
    document.body.appendChild(noiseCanvas);
    
    // 定期更新噪点
    setInterval(generateNoise, 100);
}

// 页面加载完成后添加额外效果
window.addEventListener('load', () => {
    addScreenFlicker();
    addPixelTexture();
    addPixelNoise();
}); 