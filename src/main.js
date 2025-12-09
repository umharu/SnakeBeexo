// src/main.js - Bexxo Snake Game con VALIDACIÓN DE ALIAS OBLIGATORIA
import { XOConnectProvider, XOConnect } from "xo-connect";
import { ethers } from "ethers";

// ==================== ESTADO WEB3 / BEEXO ====================
let xoConnect = null;
let signer = null;
let address = null;
let currentAlias = ""; // alias actual del jugador
let isConnected = false;
let hasValidAlias = false; // NUEVO: bandera para validar si tiene alias válido

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

// ==================== VALIDACIÓN DE ALIAS ====================

/**
 * Valida si el alias es válido (no vacío, no null, no undefined)
 * @param {string} alias - El alias a validar
 * @returns {boolean} - true si es válido, false si no
 */
function isValidAlias(alias) {
  return (
    alias !== null &&
    alias !== undefined &&
    typeof alias === "string" &&
    alias.trim() !== "" &&
    alias.toLowerCase() !== "sin alias" &&
    alias.toLowerCase() !== "null" &&
    alias.toLowerCase() !== "undefined"
  );
}

/**
 * Muestra un mensaje de error cuando no hay alias válido
 */
function showAliasError() {
  alert(
    "❌ NO TIENES UN ALIAS VÁLIDO EN BEEXO\n\n" +
    "Para jugar necesitas:\n" +
    "1. Tener un alias configurado en tu wallet Beexo\n" +
    "2. El alias debe ser derivado de tu seed phrase\n\n" +
    "Por favor, configura tu alias en Beexo antes de jugar."
  );
}

/**
 * Bloquea el acceso al juego mostrando mensaje de error
 */
function blockGameAccess(reason) {
  console.error("🚫 Acceso al juego bloqueado:", reason);
  
  // Resetear estado del botón
  if (aliasPlayBtn) {
    aliasPlayBtn.disabled = false;
    aliasPlayBtn.textContent = "JUGAR";
  }
  
  // Mostrar error específico según la razón
  switch(reason) {
    case "NO_ALIAS":
      showAliasError();
      break;
    case "CONNECTION_FAILED":
      alert("❌ Error de conexión\n\nNo se pudo conectar con Beexo Wallet.\nPor favor, intenta nuevamente.");
      break;
    case "NO_ADDRESS":
      alert("❌ Error de autenticación\n\nNo se pudo obtener la dirección de tu wallet.\nPor favor, verifica tu conexión.");
      break;
    default:
      alert("❌ Error\n\nHubo un problema al validar tu cuenta.\nPor favor, intenta nuevamente.");
  }
  
  // Asegurar que estamos en la página de inicio
  showPage("home");
}

// ==================== CONEXIÓN BEXXO CON VALIDACIÓN ====================

async function connectBexxoWallet() {
  try {
    console.log("🔌 Iniciando conexión con Bexxo Wallet...");

    // Validar que el input tiene un alias (opcional, ya que Bexxo debería proporcionarlo)
    const inputAlias = aliasInput?.value?.trim() || "";
    
    // Mostrar estado de carga
    if (aliasPlayBtn) {
      aliasPlayBtn.disabled = true;
      aliasPlayBtn.textContent = "CONECTANDO...";
    }

    // PASO 1: Inicializar XOConnect
    console.log("📡 Inicializando XOConnect...");
    xoConnect = new XOConnect();

    // PASO 2: Conectar a Bexxo wallet
    console.log("🔐 Conectando a Bexxo Wallet...");
    await xoConnect.connect();
    console.log("✅ Conexión establecida");

    // PASO 3: Obtener provider y signer
    const provider = xoConnect.getProvider();
    if (!provider) {
      throw new Error("No se pudo obtener el provider de Bexxo");
    }

    signer = provider.getSigner();
    if (!signer) {
      throw new Error("No se pudo obtener el signer");
    }

    // PASO 4: Obtener dirección de la wallet
    console.log("📍 Obteniendo dirección de wallet...");
    address = await signer.getAddress();
    
    if (!address || address === "") {
      console.error("❌ No se pudo obtener la dirección de la wallet");
      blockGameAccess("NO_ADDRESS");
      return false;
    }
    
    console.log("✅ Dirección obtenida:", address);

    // PASO 5: VALIDACIÓN CRÍTICA - Obtener alias de Bexxo
    console.log("🏷️ Obteniendo alias de Bexxo...");
    const bexxoAlias = xoConnect.getAlias();
    
    console.log("🔍 Alias recibido de Bexxo:", bexxoAlias);
    console.log("🔍 Tipo de alias:", typeof bexxoAlias);
    console.log("🔍 Alias es válido?", isValidAlias(bexxoAlias));

    // VALIDACIÓN ESTRICTA DEL ALIAS
    if (!isValidAlias(bexxoAlias)) {
      console.error("❌ ALIAS INVÁLIDO O NO EXISTE");
      console.error("   - Alias recibido:", bexxoAlias);
      console.error("   - Se requiere un alias válido para jugar");
      
      // BLOQUEAR ACCESO AL JUEGO
      hasValidAlias = false;
      isConnected = false;
      blockGameAccess("NO_ALIAS");
      return false;
    }

    // ALIAS VÁLIDO - Continuar
    currentAlias = bexxoAlias;
    hasValidAlias = true;
    isConnected = true;
    
    console.log("✅ ALIAS VÁLIDO:", currentAlias);

    // Actualizar input con el alias de Bexxo
    if (aliasInput) {
      aliasInput.value = currentAlias;
    }

    // Actualizar UI
    updateAliasUI(currentAlias);
    loadUserHighScore();

    // SOLO SI TODO ES VÁLIDO, ir a la página de juego
    console.log("🎮 Iniciando juego...");
    showPage("game");
    initGame();
    startGame();

    return true;
    
  } catch (error) {
    console.error("❌ Error en connectBexxoWallet:", error);
    console.error("   Tipo de error:", error.name);
    console.error("   Mensaje:", error.message);
    console.error("   Stack:", error.stack);

    hasValidAlias = false;
    isConnected = false;
    
    // Manejar diferentes tipos de errores
    if (error.message && error.message.includes("alias")) {
      blockGameAccess("NO_ALIAS");
    } else if (error.message && error.message.includes("address")) {
      blockGameAccess("NO_ADDRESS");
    } else {
      blockGameAccess("CONNECTION_FAILED");
    }

    return false;
  }
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
  if (!address || !hasValidAlias) return 0;

  const key = `bexxo_highscore_${address}`;
  const stored = localStorage.getItem(key);
  const highScore = stored ? parseInt(stored) : 0;

  if (previewHighScoreElement) {
    previewHighScoreElement.textContent = highScore;
  }

  updateLeaderboard();
  return highScore;
}

function saveHighScore(score) {
  if (!address || !hasValidAlias) {
    console.warn("⚠️ No se puede guardar score sin alias válido");
    return false;
  }

  const key = `bexxo_highscore_${address}`;
  const currentHigh = parseInt(localStorage.getItem(key)) || 0;

  if (score > currentHigh) {
    localStorage.setItem(key, score.toString());
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

  const existingIndex = leaderboard.findIndex(
    (entry) => entry.address === walletAddress
  );

  if (existingIndex !== -1) {
    if (score > leaderboard[existingIndex].score) {
      leaderboard[existingIndex].score = score;
      leaderboard[existingIndex].alias = alias;
    }
  } else {
    leaderboard.push({
      address: walletAddress,
      alias: alias,
      score: score,
    });
  }

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  localStorage.setItem(key, JSON.stringify(leaderboard));
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
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;

      return `
        <li class="flex justify-between items-center p-2 rounded-lg ${
          isCurrentUser ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/5"
        }">
          <div class="flex items-center gap-2">
            <span class="text-base font-semibold w-6">${medal}</span>
            <div>
              <div class="font-semibold ${isCurrentUser ? "text-emerald-400" : "text-white"}">
                ${entry.alias}
              </div>
              <div class="text-[10px] text-white/50">
                ${entry.address.slice(0, 6)}...${entry.address.slice(-4)}
              </div>
            </div>
          </div>
          <div class="text-base font-bold ${isCurrentUser ? "text-emerald-400" : "text-white"}">
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
  // VALIDACIÓN: Solo iniciar si tiene alias válido
  if (!hasValidAlias || !isConnected) {
    console.error("🚫 No se puede iniciar el juego sin alias válido");
    blockGameAccess("NO_ALIAS");
    return;
  }

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
  // VALIDACIÓN: Solo iniciar si tiene alias válido
  if (!hasValidAlias || !isConnected) {
    console.error("🚫 No se puede iniciar el juego sin alias válido");
    blockGameAccess("NO_ALIAS");
    return;
  }

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

  if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
    gameOver();
    return;
  }

  if (gameState.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  gameState.snake.unshift(head);

  if (head.x === gameState.food.x && head.y === gameState.food.y) {
    gameState.score += 10;
    updateScore();
    placeFood();

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

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

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

  gameState.snake.forEach((segment, index) => {
    const gradient = ctx.createLinearGradient(
      segment.x * GRID_SIZE,
      segment.y * GRID_SIZE,
      (segment.x + 1) * GRID_SIZE,
      (segment.y + 1) * GRID_SIZE
    );

    if (index === 0) {
      gradient.addColorStop(0, "#22c55e");
      gradient.addColorStop(1, "#16a34a");
    } else {
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

  const foodGradient = ctx.createRadialGradient(
    gameState.food.x * GRID_SIZE + GRID_SIZE / 2,
    gameState.food.y * GRID_SIZE + GRID_SIZE / 2,
    0,
    gameState.food.x * GRID_SIZE + GRID_SIZE / 2,
    gameState.food.y * GRID_SIZE + GRID_SIZE / 2,
    GRID_SIZE / 2
  );
  foodGradient.addColorStop(0, "#f97316");
  foodGradient.addColorStop(1, "#ea580c");

  ctx.fillStyle = foodGradient;
  ctx.beginPath();
  ctx.arc(
    gameState.food.x * GRID_SIZE + GRID_SIZE / 2,
    gameState.food.y * GRID_SIZE + GRID_SIZE / 2,
    GRID_SIZE / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
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

  const isNewRecord = saveHighScore(gameState.score);

  if (isNewRecord) {
    gameState.highScore = gameState.score;
    if (highScoreElement) {
      highScoreElement.textContent = `Best: ${gameState.highScore}`;
    }
  }

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
  if (
    newDirection.x === -gameState.direction.x &&
    newDirection.y === -gameState.direction.y
  ) {
    return;
  }
  gameState.nextDirection = newDirection;
}

// ==================== EVENT LISTENERS ====================

// Botón de jugar CON VALIDACIÓN
if (aliasPlayBtn) {
  aliasPlayBtn.addEventListener("click", async () => {
    console.log("🎮 Botón JUGAR presionado");
    
    // Validar que hay algo en el input (opcional)
    const inputValue = aliasInput?.value?.trim() || "";
    if (!inputValue) {
      alert("⚠️ Por favor, ingresa tu alias antes de continuar.");
      return;
    }

    // Intentar conectar con Bexxo
    const connected = await connectBexxoWallet();
    
    if (!connected) {
      console.error("🚫 Conexión fallida o alias inválido");
      // blockGameAccess ya fue llamado dentro de connectBexxoWallet
    } else {
      console.log("✅ Conexión exitosa y alias válido");
    }
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

// Controles táctiles
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

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
});

window.addEventListener("resize", () => {
  if (gameState.isRunning || pages.game?.classList.contains("flex")) {
    resizeCanvas();
  }
});

// ==================== INICIALIZACIÓN ====================
updateLeaderboard();

console.log("🐍 Bexxo Snake Game cargado con VALIDACIÓN DE ALIAS estricta ✅");
console.log("🔒 El juego solo se iniciará con un alias válido de Beexo");