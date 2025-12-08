// src/main.js - Bexxo Snake Game con integración de Wallet
import { XOConnectProvider, XOConnect } from "xo-connect";
import { ethers } from "ethers";

// ==================== ESTADO WEB3 / BEEXO ====================
let xoConnect = null;
let signer = null;
let address = null;
let currentAlias = ""; // alias actual del jugador

// Imagen del logo para usar como comida
const foodImage = new Image();
foodImage.src = "/logo.png";

// Referencias a elementos de alias / UI
const aliasInput = document.getElementById("aliasInput");
const aliasPlayBtn = document.getElementById("aliasPlayBtn");
const aliasSpans = document.querySelectorAll(".xo-alias");
const previewHighScoreElement = document.getElementById("previewHighScore");
const leaderboardList = document.getElementById("leaderboardList");

// Leaderboard en memoria
let leaderboard = [];

// ==================== NAVEGACIÓN ENTRE PÁGINAS ====================
const pages = {
  home: document.getElementById("homePage"),
  game: document.getElementById("gamePage"),
  about: document.getElementById("aboutPage"),
};

const navButtons = document.querySelectorAll(".nav-btn");
const mobileNavButtons = document.querySelectorAll(".mobile-nav-btn");
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const mobileOverlay = document.getElementById("mobileOverlay");
const mobileClose = document.getElementById("mobileClose");

function showPage(pageName) {
  Object.keys(pages).forEach((key) => {
    if (pages[key]) {
      if (key === pageName) {
        pages[key].classList.remove("hidden");
        pages[key].classList.add("flex");
      } else {
        pages[key].classList.add("hidden");
        pages[key].classList.remove("flex");
      }
    }
  });

  // Actualizar botones activos
  navButtons.forEach((btn) => {
    if (btn.dataset.page === pageName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  mobileNavButtons.forEach((btn) => {
    if (btn.dataset.page === pageName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Cerrar menú móvil
  closeMobileMenu();
}

function closeMobileMenu() {
  if (mobileNav) mobileNav.classList.remove("active");
  if (mobileOverlay) mobileOverlay.classList.remove("active");
}

// Event listeners para navegación
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

mobileNavButtons.forEach((btn) => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    mobileNav?.classList.add("active");
    mobileOverlay?.classList.add("active");
  });
}

if (mobileClose) {
  mobileClose.addEventListener("click", closeMobileMenu);
}

if (mobileOverlay) {
  mobileOverlay.addEventListener("click", closeMobileMenu);
}

// ==================== CONEXIÓN BEXXO ====================
async function connectBexxoWallet() {
  try {
    console.log("🔌 Conectando con Bexxo Wallet...");

    // Mostrar estado de carga
    if (aliasPlayBtn) {
      aliasPlayBtn.disabled = true;
      aliasPlayBtn.textContent = "CONECTANDO...";
    }

    // Inicializar XOConnect
    xoConnect = new XOConnect();

    // Conectar a Bexxo wallet
    await xoConnect.connect();

    // Obtener provider y signer
    const provider = xoConnect.getProvider();
    signer = provider.getSigner();
    address = await signer.getAddress();

    // Obtener alias de Bexxo (derivado del seed phrase)
    const bexxoAlias = xoConnect.getAlias();

    // Si Bexxo proporciona un alias, usarlo. Si no, usar el del input o generar uno
    if (bexxoAlias && bexxoAlias.trim() !== "") {
      currentAlias = bexxoAlias;
      if (aliasInput) {
        aliasInput.value = bexxoAlias;
      }
    } else if (aliasInput && aliasInput.value.trim() !== "") {
      currentAlias = aliasInput.value.trim();
    } else {
      currentAlias = generateAliasFromAddress(address);
      if (aliasInput) {
        aliasInput.value = currentAlias;
      }
    }

    console.log("✅ Conectado a Bexxo:", { address, alias: currentAlias });

    // Actualizar UI
    updateAliasUI(currentAlias);
    loadUserHighScore();

    // Ir a la página de juego
    showPage("game");
    initGame();
    startGame();

    return true;
  } catch (error) {
    console.error("❌ Error conectando con Bexxo:", error);

    alert(
      "No se pudo conectar con Bexxo Wallet. Asegúrate de tener la extensión instalada."
    );

    if (aliasPlayBtn) {
      aliasPlayBtn.disabled = false;
      aliasPlayBtn.textContent = "JUGAR";
    }

    return false;
  }
}

// Generar alias desde address si no hay uno de Bexxo
function generateAliasFromAddress(addr) {
  const adjectives = [
    "Swift",
    "Brave",
    "Wise",
    "Noble",
    "Fierce",
    "Quick",
    "Bold",
    "Silent",
    "Mighty",
    "Clever",
  ];
  const nouns = [
    "Snake",
    "Dragon",
    "Phoenix",
    "Tiger",
    "Warrior",
    "Hunter",
    "Viper",
    "Cobra",
    "Python",
    "Serpent",
  ];

  const hash = addr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const adj = adjectives[hash % adjectives.length];
  const noun = nouns[Math.floor(hash / 100) % nouns.length];
  const num = (hash % 9999).toString().padStart(4, "0");

  return `${adj}${noun}#${num}`;
}

// Actualizar textos donde aparece el alias
function updateAliasUI(alias) {
  const value = alias || "Sin alias";
  aliasSpans.forEach((el) => {
    el.textContent = value;
  });
}

// ==================== HIGH SCORE Y LEADERBOARD ====================
function loadUserHighScore() {
  if (!address) return 0;

  const key = `bexxo_highscore_${address}`;
  const stored = localStorage.getItem(key);
  const highScore = stored ? parseInt(stored) : 0;

  if (previewHighScoreElement) {
    previewHighScoreElement.textContent = highScore;
  }

  // Actualizar leaderboard
  updateLeaderboard();

  return highScore;
}

function saveHighScore(score) {
  if (!address) return false;

  const key = `bexxo_highscore_${address}`;
  const currentHigh = parseInt(localStorage.getItem(key)) || 0;

  if (score > currentHigh) {
    localStorage.setItem(key, score.toString());

    // Guardar también en el leaderboard
    saveToLeaderboard(currentAlias, address, score);

    console.log("🏆 Nuevo High Score:", score);
    return true;
  }
  return false;
}

function saveToLeaderboard(alias, walletAddress, score) {
  const key = "bexxo_snake_leaderboard";
  const stored = localStorage.getItem(key);
  leaderboard = stored ? JSON.parse(stored) : [];

  // Buscar si el usuario ya existe
  const existingIndex = leaderboard.findIndex(
    (entry) => entry.address === walletAddress
  );

  if (existingIndex !== -1) {
    // Actualizar score si es mayor
    if (score > leaderboard[existingIndex].score) {
      leaderboard[existingIndex].score = score;
      leaderboard[existingIndex].alias = alias;
    }
  } else {
    // Agregar nuevo entry
    leaderboard.push({
      address: walletAddress,
      alias: alias,
      score: score,
    });
  }

  // Ordenar por score descendente
  leaderboard.sort((a, b) => b.score - a.score);

  // Mantener solo top 10
  leaderboard = leaderboard.slice(0, 10);

  // Guardar
  localStorage.setItem(key, JSON.stringify(leaderboard));

  // Actualizar UI
  updateLeaderboard();
}

function updateLeaderboard() {
  if (!leaderboardList) return;

  const stored = localStorage.getItem("bexxo_snake_leaderboard");
  leaderboard = stored ? JSON.parse(stored) : [];

  if (leaderboard.length === 0) {
    leaderboardList.innerHTML =
      '<li class="text-white/50 text-center py-2">No hay scores todavía</li>';
    return;
  }

  leaderboardList.innerHTML = leaderboard
    .map((entry, index) => {
      const isCurrentUser = entry.address === address;
      const medal =
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;

      return `
        <li class="flex justify-between items-center p-2 rounded-lg ${
          isCurrentUser ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/5"
        }">
          <div class="flex items-center gap-2">
            <span class="text-base font-semibold w-6">${medal}</span>
            <div>
              <div class="font-semibold ${
                isCurrentUser ? "text-emerald-400" : "text-white"
              }">
                ${entry.alias}
              </div>
              <div class="text-[10px] text-white/50">
                ${entry.address.slice(0, 6)}...${entry.address.slice(-4)}
              </div>
            </div>
          </div>
          <div class="text-base font-bold ${
            isCurrentUser ? "text-emerald-400" : "text-white"
          }">
            ${entry.score}
          </div>
        </li>
      `;
    })
    .join("");
}

// ==================== SNAKE GAME ====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas?.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const pauseBtn = document.getElementById("pauseBtn");
const backToHome = document.getElementById("backToHome");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreElement = document.getElementById("finalScore");
const newRecordElement = document.getElementById("newRecord");
const restartButton = document.getElementById("restartButton");

const GRID_SIZE = 20;
let CANVAS_SIZE = 400;
let CELL_COUNT = CANVAS_SIZE / GRID_SIZE;

// Ajustar tamaño del canvas según el viewport
function resizeCanvas() {
  if (!canvas) return;

  const maxSize = Math.min(window.innerWidth - 40, 500);
  CANVAS_SIZE = Math.floor(maxSize / GRID_SIZE) * GRID_SIZE;
  CELL_COUNT = CANVAS_SIZE / GRID_SIZE;

  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  if (gameState.isRunning) {
    draw();
  }
}

// Game state
const gameState = {
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: { x: 0, y: 0 },
  score: 0,
  highScore: 0,
  speed: 150,
  isRunning: false,
  isPaused: false,
  gameLoop: null,
};

function initGame() {
  resizeCanvas();

  gameState.snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  gameState.direction = { x: 1, y: 0 };
  gameState.nextDirection = { x: 1, y: 0 };
  gameState.score = 0;
  gameState.speed = 150;
  gameState.isPaused = false;

  placeFood();
  updateScore();
  gameState.highScore = loadUserHighScore();

  if (highScoreElement) {
    highScoreElement.textContent = `Best: ${gameState.highScore}`;
  }

  if (gameOverScreen) {
    gameOverScreen.classList.add("hidden");
  }
}

function startGame() {
  if (!gameState.isRunning && ctx) {
    gameState.isRunning = true;
    gameState.gameLoop = setInterval(update, gameState.speed);
    draw();
  }
}

function stopGame() {
  gameState.isRunning = false;
  if (gameState.gameLoop) {
    clearInterval(gameState.gameLoop);
    gameState.gameLoop = null;
  }
}

function pauseGame() {
  gameState.isPaused = !gameState.isPaused;
  if (pauseBtn) {
    pauseBtn.innerHTML = gameState.isPaused
      ? '<i class="ri-play-line"></i>'
      : '<i class="ri-pause-line"></i>';
  }
}

function restartGame() {
  stopGame();
  initGame();
  startGame();
}

function update() {
  if (gameState.isPaused) return;

  gameState.direction = { ...gameState.nextDirection };

  const head = {
    x: gameState.snake[0].x + gameState.direction.x,
    y: gameState.snake[0].y + gameState.direction.y,
  };

  // Colisión con paredes
  if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
    gameOver();
    return;
  }

  // Colisión consigo misma
  if (gameState.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  gameState.snake.unshift(head);

  // Comió comida
  if (head.x === gameState.food.x && head.y === gameState.food.y) {
    gameState.score += 10;
    updateScore();
    placeFood();

    // Aumentar velocidad cada 50 puntos
    if (gameState.score % 50 === 0 && gameState.speed > 80) {
      gameState.speed -= 10;
      stopGame();
      startGame();
    }
  } else {
    gameState.snake.pop();
  }

  draw();
}

function draw() {
  if (!ctx) return;

  // Limpiar canvas con color de fondo oscuro
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Dibujar grid sutil
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= CELL_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(i * GRID_SIZE, 0);
    ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * GRID_SIZE);
    ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
    ctx.stroke();
  }

  // Dibujar serpiente con gradiente verde
  gameState.snake.forEach((segment, index) => {
    const gradient = ctx.createLinearGradient(
      segment.x * GRID_SIZE,
      segment.y * GRID_SIZE,
      (segment.x + 1) * GRID_SIZE,
      (segment.y + 1) * GRID_SIZE
    );

    if (index === 0) {
      // Cabeza más brillante
      gradient.addColorStop(0, "#22c55e");
      gradient.addColorStop(1, "#16a34a");
    } else {
      // Cuerpo
      gradient.addColorStop(0, "#16a34a");
      gradient.addColorStop(1, "#15803d");
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(
      segment.x * GRID_SIZE + 1,
      segment.y * GRID_SIZE + 1,
      GRID_SIZE - 2,
      GRID_SIZE - 2
    );
  });

  // ==================== DIBUJAR COMIDA (LOGO BEEXO) ====================
  const foodPixelX = gameState.food.x * GRID_SIZE;
  const foodPixelY = gameState.food.y * GRID_SIZE;
  const size = GRID_SIZE - 4;
  const offset = (GRID_SIZE - size) / 2;

  if (foodImage.complete && foodImage.naturalWidth !== 0) {
    // Logo Beexo centrado en la celda
    ctx.drawImage(
      foodImage,
      foodPixelX + offset,
      foodPixelY + offset,
      size,
      size
    );
  } else {
    // Fallback: bolita naranja original mientras carga la imagen
    const foodGradient = ctx.createRadialGradient(
      foodPixelX + GRID_SIZE / 2,
      foodPixelY + GRID_SIZE / 2,
      0,
      foodPixelX + GRID_SIZE / 2,
      foodPixelY + GRID_SIZE / 2,
      GRID_SIZE / 2
    );
    foodGradient.addColorStop(0, "#f97316");
    foodGradient.addColorStop(1, "#ea580c");

    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(
      foodPixelX + GRID_SIZE / 2,
      foodPixelY + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function placeFood() {
  do {
    gameState.food.x = Math.floor(Math.random() * CELL_COUNT);
    gameState.food.y = Math.floor(Math.random() * CELL_COUNT);
  } while (
    gameState.snake.some(
      (segment) => segment.x === gameState.food.x && segment.y === gameState.food.y
    )
  );
}

function updateScore() {
  if (scoreElement) {
    scoreElement.textContent = `Score: ${gameState.score}`;
  }
}

function gameOver() {
  stopGame();

  // Guardar high score
  const isNewRecord = saveHighScore(gameState.score);

  if (isNewRecord) {
    gameState.highScore = gameState.score;
    if (highScoreElement) {
      highScoreElement.textContent = `Best: ${gameState.highScore}`;
    }
  }

  // Mostrar pantalla de game over
  if (finalScoreElement) {
    finalScoreElement.textContent = `Tu Score: ${gameState.score}`;
  }

  if (newRecordElement) {
    if (isNewRecord) {
      newRecordElement.classList.remove("hidden");
    } else {
      newRecordElement.classList.add("hidden");
    }
  }

  if (gameOverScreen) {
    gameOverScreen.classList.remove("hidden");
  }
}

function changeDirection(newDirection) {
  // Prevenir reversa
  if (
    newDirection.x === -gameState.direction.x &&
    newDirection.y === -gameState.direction.y
  ) {
    return;
  }
  gameState.nextDirection = newDirection;
}

// ==================== EVENT LISTENERS ====================

// Botón de jugar (conecta wallet)
if (aliasPlayBtn) {
  aliasPlayBtn.addEventListener("click", async () => {
    const aliasValue = aliasInput?.value?.trim() || "";

    if (!aliasValue) {
      alert("Por favor, ingresa tu alias de Bexxo antes de jugar.");
      return;
    }

    await connectBexxoWallet();
  });
}

// Controles del juego
if (pauseBtn) {
  pauseBtn.addEventListener("click", pauseGame);
}

if (restartButton) {
  restartButton.addEventListener("click", restartGame);
}

if (backToHome) {
  backToHome.addEventListener("click", () => {
    stopGame();
    showPage("home");
  });
}

// Controles de teclado
document.addEventListener("keydown", (e) => {
  if (!gameState.isRunning) return;

  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      e.preventDefault();
      changeDirection({ x: 0, y: -1 });
      break;
    case "ArrowDown":
    case "s":
    case "S":
      e.preventDefault();
      changeDirection({ x: 0, y: 1 });
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      e.preventDefault();
      changeDirection({ x: -1, y: 0 });
      break;
    case "ArrowRight":
    case "d":
    case "D":
      e.preventDefault();
      changeDirection({ x: 1, y: 0 });
      break;
    case " ":
      e.preventDefault();
      pauseGame();
      break;
  }
});

// Controles táctiles (botones en pantalla)
const controlButtons = document.querySelectorAll(".control-btn");
controlButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const direction = btn.dataset.direction;
    switch (direction) {
      case "UP":
        changeDirection({ x: 0, y: -1 });
        break;
      case "DOWN":
        changeDirection({ x: 0, y: 1 });
        break;
      case "LEFT":
        changeDirection({ x: -1, y: 0 });
        break;
      case "RIGHT":
        changeDirection({ x: 1, y: 0 });
        break;
    }
  });
});

// Prevenir scroll con flechas
window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
});

// Resize canvas cuando cambie el tamaño de ventana
window.addEventListener("resize", () => {
  if (gameState.isRunning || pages.game?.classList.contains("flex")) {
    resizeCanvas();
  }
});

// ==================== INICIALIZACIÓN ====================
// Cargar leaderboard al inicio
updateLeaderboard();

console.log("🐍 Bexxo Snake Game cargado exitosamente!");
