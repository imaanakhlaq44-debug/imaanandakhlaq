import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const ProductColoringPage = () => html`
${Head()}
${Header()}

<style>
  .products-page { font-family: 'Inter', sans-serif; color: #334155; background: #F8FAFC; overflow-x: hidden; min-height: 100vh; }
  
  /* Hero */
  .hero-section { position: relative; padding: 180px 20px 80px; background: linear-gradient(135deg, #D63678 0%, #C99A6B 50%, #E08020 100%); color: white; text-align: center; overflow: hidden; }
  .hero-section::before { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: url('https://www.transparenttextures.com/patterns/stardust.png'); opacity: 0.2; animation: floatBG 20s linear infinite; }
  @keyframes floatBG { from { background-position: 0 0; } to { background-position: 500px 500px; } }
  .hero-content { position: relative; z-index: 2; max-width: 900px; margin: 0 auto; }
  .hero-content h1 { font-family: 'Fredoka One', cursive; font-size: clamp(2.5rem, 5vw, 4.5rem); margin-bottom: 20px; text-shadow: 2px 4px 10px rgba(0,0,0,0.3); }
  .hero-content p { font-size: 1.25rem; opacity: 0.95; line-height: 1.8; font-weight: 500; }
  
  /* Coloring Workspace */
  .coloring-content { max-width: 1100px; margin: -40px auto 100px; padding: 0 20px; position: relative; z-index: 10; }
  
  .studio-interface { display: flex; flex-direction: column; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; }
  @media(min-width: 992px) { .studio-interface { flex-direction: row; } }
  
  /* Sidebar Tools */
  .tools-panel { background: #1e293b; color: white; padding: 30px; width: 100%; display: flex; flex-direction: column; gap: 30px; }
  @media(min-width: 992px) { .tools-panel { width: 300px; flex-shrink: 0; } }
  
  .tool-section h4 { font-family: 'Fredoka One', cursive; font-size: 1.2rem; margin-bottom: 15px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
  
  /* Color Swatches */
  .colors-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
  .color-btn { width: 45px; height: 45px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
  .color-btn:hover { transform: scale(1.15); }
  .color-btn.active { border-color: white; transform: scale(1.15); box-shadow: 0 0 15px rgba(255,255,255,0.5); }
  
  /* Brush Sizes */
  .brush-sizes { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 16px; }
  .brush-btn { background: transparent; border: none; color: white; cursor: pointer; display: flex; justify-content: center; align-items: center; border-radius: 50%; transition: background 0.3s; width: 50px; height: 50px; }
  .brush-btn:hover, .brush-btn.active { background: rgba(255,255,255,0.15); }
  .brush-dot { background: white; border-radius: 50%; }
  
  /* Actions */
  .action-buttons { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
  .btn-tool { padding: 15px; border-radius: 12px; font-weight: bold; font-family: 'Nunito', sans-serif; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.3s; }
  .btn-clear { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
  .btn-clear:hover { background: #ef4444; color: white; }
  .btn-save { background: #10b981; color: white; }
  .btn-save:hover { background: #059669; }
  
  /* Canvas Area */
  .canvas-panel { flex-grow: 1; padding: 30px; background: #f1f5f9; display: flex; justify-content: center; align-items: center; position: relative; }
  .canvas-wrapper { position: relative; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; }
  
  /* Canvas Stack */
  canvas { display: block; border-radius: 16px; touch-action: none; cursor: crosshair; }
  #drawingCanvas { position: absolute; top: 0; left: 0; z-index: 2; }
  #outlineCanvas { position: absolute; top: 0; left: 0; z-index: 3; pointer-events: none; }
  #bgCanvas { z-index: 1; }

  .page-select { margin-bottom: 20px; display: flex; gap: 10px; justify-content: center; }
  .page-btn { background: white; border: 2px solid #cbd5e1; padding: 10px 20px; border-radius: 30px; cursor: pointer; font-weight: bold; color: #475569; transition: all 0.3s; }
  .page-btn.active { background: #8b5cf6; color: white; border-color: #8b5cf6; }

</style>

<div class="products-page">
  <div class="hero-section">
    <div class="hero-content" data-aos="fade-up">
      <h1>Digital Studio 🎨</h1>
      <p>Color inside the lines or make your own masterpiece!</p>
    </div>
  </div>

  <div class="coloring-content">
    <div class="page-select" data-aos="fade-down" data-aos-delay="100">
      <button class="page-btn active" onclick="loadArt('mosque')">The Happy Mosque</button>
      <button class="page-btn" onclick="loadArt('rocket')">Adventure Rocket</button>
    </div>

    <div class="studio-interface" data-aos="fade-up" data-aos-delay="200">
      
      <!-- Tools Sidebar -->
      <div class="tools-panel">
        
        <div class="tool-section">
          <h4>Colors</h4>
          <div class="colors-grid" id="colorPalette">
            <!-- Colors injected via JS -->
          </div>
        </div>
        
        <div class="tool-section">
          <h4>Brush Size</h4>
          <div class="brush-sizes">
            <button class="brush-btn" onclick="setBrushSize(5, this)"><div class="brush-dot" style="width: 8px; height: 8px;"></div></button>
            <button class="brush-btn active" onclick="setBrushSize(15, this)"><div class="brush-dot" style="width: 16px; height: 16px;"></div></button>
            <button class="brush-btn" onclick="setBrushSize(30, this)"><div class="brush-dot" style="width: 26px; height: 26px;"></div></button>
            <button class="brush-btn" onclick="setBrushSize(50, this)"><div class="brush-dot" style="width: 40px; height: 40px;"></div></button>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-tool btn-tool-eraser" onclick="setEraser()" style="background: white; color: #1e293b; margin-bottom: 20px;">
            <i class="fas fa-eraser"></i> Eraser
          </button>
          
          <button class="btn-tool btn-clear" onclick="clearCanvas()">
            <i class="fas fa-trash-alt"></i> Start Over
          </button>
          <button class="btn-tool btn-save" onclick="downloadArt()">
            <i class="fas fa-download"></i> Save Art
          </button>
        </div>
      </div>
      
      <!-- Interactive Drawing Area -->
      <div class="canvas-panel">
        <div class="canvas-wrapper" id="canvasWrapper" style="width: 600px; height: 600px;">
          <!-- BG Canvas (Solid White) -->
          <canvas id="bgCanvas" width="600" height="600"></canvas>
          <!-- Drawing Canvas (Where colors go) -->
          <canvas id="drawingCanvas" width="600" height="600"></canvas>
          <!-- Outline Canvas (Line Art on top) -->
          <canvas id="outlineCanvas" width="600" height="600"></canvas>
        </div>
      </div>

    </div>
  </div>
</div>

${Footer()}

<script>
  // --- STATE ---
  let currentColor = '#ef4444';
  let currentSize = 15;
  let isEraser = false;
  let isDrawing = false;
  
  // Elements
  const drawingCanvas = document.getElementById('drawingCanvas');
  const ctx = drawingCanvas.getContext('2d');
  
  const outlineCanvas = document.getElementById('outlineCanvas');
  const outlineCtx = outlineCanvas.getContext('2d');
  
  const bgCanvas = document.getElementById('bgCanvas');
  const bgCtx = bgCanvas.getContext('2d');

  // Fill BG White
  bgCtx.fillStyle = 'white';
  bgCtx.fillRect(0,0,600,600);

  // Setup Palette
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#1e293b'];
  const paletteContainer = document.getElementById('colorPalette');
  
  colors.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'color-btn' + (idx === 0 ? ' active' : '');
    btn.style.backgroundColor = c;
    btn.onclick = (e) => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = c;
      isEraser = false;
    };
    paletteContainer.appendChild(btn);
  });

  function setBrushSize(size, el) {
    currentSize = size;
    document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  }

  function setEraser() {
    isEraser = true;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  }

  function clearCanvas() {
    ctx.clearRect(0,0, 600, 600);
  }

  function downloadArt() {
    // Combine layers to export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 600; exportCanvas.height = 600;
    const eCtx = exportCanvas.getContext('2d');
    eCtx.drawImage(bgCanvas, 0,0);
    eCtx.drawImage(drawingCanvas, 0,0);
    eCtx.drawImage(outlineCanvas, 0,0);
    
    const link = document.createElement('a');
    link.download = 'imaan-akhlaq-art.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  // --- LINE ART SVGs ---
  const artSources = {
    mosque: \`data:image/svg+xml;utf8,<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
      <path d="M 150 450 L 150 250 A 100 100 0 0 1 250 150 A 100 100 0 0 1 350 250 L 350 450 Z" fill="none" stroke="black" stroke-width="8" stroke-linejoin="round"/>
      <rect x="220" y="350" width="60" height="100" fill="none" stroke="black" stroke-width="8" />
      <path d="M 250 150 L 250 80 L 230 80 L 250 50 L 270 80 L 250 80" fill="none" stroke="black" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="450" cy="150" r="40" fill="none" stroke="black" stroke-width="8"/>
    </svg>\`,
    rocket: \`data:image/svg+xml;utf8,<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
      <path d="M 300 100 C 400 100 450 250 450 400 C 350 450 250 450 150 400 C 150 250 200 100 300 100 Z" fill="none" stroke="black" stroke-width="8" stroke-linejoin="round"/>
      <circle cx="300" cy="270" r="40" fill="none" stroke="black" stroke-width="8"/>
      <path d="M 150 400 L 80 450 L 170 350" fill="none" stroke="black" stroke-width="8" stroke-linejoin="round"/>
      <path d="M 450 400 L 520 450 L 430 350" fill="none" stroke="black" stroke-width="8" stroke-linejoin="round"/>
      <path d="M 250 430 L 300 520 L 350 430 Z" fill="none" stroke="black" stroke-width="5" stroke-linejoin="round"/>
    </svg>\`
  };

  const imgObj = new Image();
  imgObj.onload = () => {
    outlineCtx.clearRect(0,0,600,600);
    outlineCtx.drawImage(imgObj, 0, 0);
  };

  window.loadArt = function(key) {
    document.querySelectorAll('.page-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    imgObj.src = artSources[key];
    clearCanvas();
  }
  
  // Initial load
  imgObj.src = artSources['mosque'];

  // --- DRAWING LOGIC ---
  function getPos(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const scaleX = drawingCanvas.width / rect.width;
    const scaleY = drawingCanvas.height / rect.height;
    
    // Support Touch
    let clientX = e.clientX; let clientY = e.clientY;
    if(e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function startPosition(e) { 
    isDrawing = true; 
    draw(e); 
  }
  function endPosition() { 
    isDrawing = false; 
    ctx.beginPath(); 
  }
  function draw(e) {
    if(!isDrawing) return;
    if(e.cancelable) e.preventDefault(); // prevent scroll on touch

    const pos = getPos(e);
    
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    
    if(isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = "rgba(0,0,0,1)"; // Must be solid
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  // Mouse setup
  drawingCanvas.addEventListener('mousedown', startPosition);
  drawingCanvas.addEventListener('mouseup', endPosition);
  drawingCanvas.addEventListener('mouseout', endPosition);
  drawingCanvas.addEventListener('mousemove', draw);
  
  // Touch setup
  drawingCanvas.addEventListener('touchstart', startPosition, {passive: false});
  drawingCanvas.addEventListener('touchend', endPosition);
  drawingCanvas.addEventListener('touchmove', draw, {passive: false});
</script>
`
