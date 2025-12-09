// src/main.js - Beexo Snake Game (Validación real por alias + wallet)
import { XOConnect } from "xo-connect";

// ==================== ESTADO WEB3 / BEEXO ====================
let client = null;
let currentAlias = "";
let isConnected = false;
let hasValidAlias = false;

// ==================== DOM ====================
const aliasInput = document.getElementById("aliasInput");
const aliasPlayBtn = document.getElementById("aliasPlayBtn");
const aliasSpans = document.querySelectorAll(".xo-alias");
const previewHighScoreElement = document.getElementById("previewHighScore");
const leaderboardList = document.getElementById("leaderboardList");

// ==================== PÁGINAS ====================
const pages = {
  home: document.getElementById("homePage"),
  game: document.getElementById("gamePage"),
  about: document.getElementById("aboutPage"),
};

const navButtons = document.querySelectorAll(".nav-btn");

// ==================== UTIL ====================
function showPage(pageName) {
  Object.keys(pages).forEach((key) => {
    pages[key]?.classList.toggle("hidden", key !== pageName);
    pages[key]?.classList.toggle("flex", key === pageName);
  });
}

function isValidAlias(alias) {
  return typeof alias === "string" && alias.trim().length > 0;
}

// ==================== CONEXIÓN BEEXO + VALIDACIÓN REAL ====================
async function connectBexxoWallet() {
  try {
    const typedAlias = aliasInput.value.trim();

    if (!typedAlias) {
      alert("⚠️ Debes escribir tu alias de Beexo para jugar.");
      return false;
    }

    aliasPlayBtn.disabled = true;
    aliasPlayBtn.textContent = "CONECTANDO...";

    // 👉 MÉTODO OFICIAL
    const clientRes = await XOConnect.getClient();

    if (!clientRes || !isValidAlias(clientRes.alias)) {
      alert("❌ Tu cuenta Beexo NO tiene alias configurado.");
      throw new Error("NO_ALIAS");
    }

    const walletAlias = clientRes.alias;

    // 👉 COMPARACIÓN REAL
    if (walletAlias.toLowerCase() !== typedAlias.toLowerCase()) {
      alert(
        `❌ Alias incorrecto\n\nAlias de tu wallet: ${walletAlias}\nAlias escrito: ${typedAlias}`
      );
      aliasPlayBtn.disabled = false;
      aliasPlayBtn.textContent = "JUGAR";
      return false;
    }

    // ✅ TODO OK
    client = clientRes;
    currentAlias = walletAlias;
    hasValidAlias = true;
    isConnected = true;

    updateAliasUI(walletAlias);
    loadUserHighScore();

    showPage("game");
    initGame();
    startGame();

    aliasPlayBtn.disabled = false;
    aliasPlayBtn.textContent = "JUGAR";
    return true;

  } catch (error) {
    console.error("❌ Error Beexo:", error);
    alert("❌ Error conectando con Beexo. Asegúrate de estar en la app.");
    aliasPlayBtn.disabled = false;
    aliasPlayBtn.textContent = "JUGAR";
    return false;
  }
}

// ==================== UI ====================
function updateAliasUI(alias) {
  aliasSpans.forEach((el) => (el.textContent = alias));
}

// ==================== HIGHSCORE Y LEADERBOARD ====================
let leaderboard = [];

function loadUserHighScore() {
  if (!currentAlias) return 0;
  const key = `bexxo_highscore_${currentAlias}`;
  const score = parseInt(localStorage.getItem(key)) || 0;
  previewHighScoreElement.textContent = score;
  updateLeaderboard();
  return score;
}

function saveHighScore(score) {
  const key = `bexxo_highscore_${currentAlias}`;
  const stored = parseInt(localStorage.getItem(key)) || 0;

  if (score > stored) {
    localStorage.setItem(key, score);
    saveToLeaderboard(currentAlias, score);
    return true;
  }
  return false;
}

function saveToLeaderboard(alias, score) {
  leaderboard = JSON.parse(localStorage.getItem("bexxo_snake_leaderboard")) || [];

  const i = leaderboard.findIndex((x) => x.alias === alias);
  if (i >= 0) leaderboard[i].score = Math.max(leaderboard[i].score, score);
  else leaderboard.push({ alias, score });

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);

  localStorage.setItem("bexxo_snake_leaderboard", JSON.stringify(leaderboard));
  updateLeaderboard();
}

function updateLeaderboard() {
  leaderboard = JSON.parse(localStorage.getItem("bexxo_snake_leaderboard")) || [];
  if (!leaderboardList) return;

  if (!leaderboard.length) {
    leaderboardList.innerHTML = `<li class="text-white/50 text-center">Sin registros</li>`;
    return;
  }

  leaderboardList.innerHTML = leaderboard
    .map(
      (p, i) => `
    <li class="flex justify-between p-2 ${p.alias === currentAlias ? "text-emerald-400" : ""}">
      <span>${i + 1}. ${p.alias}</span>
      <span>${p.score}</span>
    </li>`
    )
    .join("");
}

// ==================== SNAKE GAME ====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const restartButton = document.getElementById("restartButton");

const GRID = 20;
const SIZE = 400;

canvas.width = SIZE;
canvas.height = SIZE;

const game = {
  snake: [],
  food: {},
  dir: { x: 1, y: 0 },
  score: 0,
  loop: null,
};

function initGame() {
  game.snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
  ];
  game.dir = { x: 1, y: 0 };
  game.score = 0;
  placeFood();
  updateScore();
}

function startGame() {
  game.loop = setInterval(updateGame, 120);
}

function stopGame() {
  clearInterval(game.loop);
}

function updateGame() {
  const head = {
    x: game.snake[0].x + game.dir.x,
    y: game.snake[0].y + game.dir.y,
  };

  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= SIZE / GRID ||
    head.y >= SIZE / GRID ||
    game.snake.some((s) => s.x === head.x && s.y === head.y)
  ) {
    stopGame();
    saveHighScore(game.score);
    return;
  }

  game.snake.unshift(head);

  if (head.x === game.food.x && head.y === game.food.y) {
    game.score += 10;
    updateScore();
    placeFood();
  } else {
    game.snake.pop();
  }

  drawGame();
}

function drawGame() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.fillStyle = "#22c55e";
  for (let s of game.snake) {
    ctx.fillRect(s.x * GRID, s.y * GRID, GRID - 1, GRID - 1);
  }

  ctx.fillStyle = "#f97316";
  ctx.fillRect(game.food.x * GRID, game.food.y * GRID, GRID - 1, GRID - 1);
}

function updateScore() {
  scoreElement.textContent = `Score: ${game.score}`;
}

function placeFood() {
  game.food = {
    x: Math.floor(Math.random() * (SIZE / GRID)),
    y: Math.floor(Math.random() * (SIZE / GRID)),
  };
}

// ==================== CONTROLES ====================
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") game.dir = { x: 0, y: -1 };
  if (e.key === "ArrowDown") game.dir = { x: 0, y: 1 };
  if (e.key === "ArrowLeft") game.dir = { x: -1, y: 0 };
  if (e.key === "ArrowRight") game.dir = { x: 1, y: 0 };
});

// ==================== BOTONES ====================
aliasPlayBtn?.addEventListener("click", connectBexxoWallet);
restartButton?.addEventListener("click", () => {
  stopGame();
  initGame();
  startGame();
});

// ==================== INIT ====================
updateLeaderboard();
console.log("🐍 BEEXO SNAKE LISTO");
