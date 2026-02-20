"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const COLS = 10;
const ROWS = 20;
const CELL = 20;
const COLORS = [
  "#6366f1", // I - indigo
  "#8b5cf6", // O - violet
  "#ec4899", // T - pink
  "#10b981", // S - emerald
  "#f59e0b", // Z - amber
  "#3b82f6", // L - blue
  "#ef4444", // J - red
];

const SHAPES = [
  [[1, 1, 1, 1]],                     // I
  [[1, 1], [1, 1]],                    // O
  [[0, 1, 0], [1, 1, 1]],             // T
  [[0, 1, 1], [1, 1, 0]],             // S
  [[1, 1, 0], [0, 1, 1]],             // Z
  [[1, 0], [1, 0], [1, 1]],           // L
  [[0, 1], [0, 1], [1, 1]],           // J
];

type Piece = { shape: number[][]; color: string; x: number; y: number };

function randomPiece(): Piece {
  const i = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[i].map((r) => [...r]),
    color: COLORS[i],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[i][0].length / 2),
    y: 0,
  };
}

function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = [];
  for (let c = 0; c < cols; c++) {
    rotated.push([]);
    for (let r = rows - 1; r >= 0; r--) {
      rotated[c].push(shape[r][c]);
    }
  }
  return rotated;
}

export function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<(string | null)[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const pieceRef = useRef<Piece>(randomPiece());
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const loopRef = useRef<ReturnType<typeof setInterval>>();
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const collides = useCallback((board: (string | null)[][], piece: Piece, dx = 0, dy = 0, shape?: number[][]) => {
    const s = shape || piece.shape;
    for (let r = 0; r < s.length; r++) {
      for (let c = 0; c < s[r].length; c++) {
        if (!s[r][c]) continue;
        const nx = piece.x + c + dx;
        const ny = piece.y + r + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }, []);

  const lock = useCallback(() => {
    const board = boardRef.current;
    const piece = pieceRef.current;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const y = piece.y + r;
        const x = piece.x + c;
        if (y < 0) {
          gameOverRef.current = true;
          setGameOver(true);
          return;
        }
        board[y][x] = piece.color;
      }
    }
    // Clear lines
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((c) => c !== null)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] || 800;
      scoreRef.current += points;
      setScore(scoreRef.current);
    }
    pieceRef.current = randomPiece();
    if (collides(board, pieceRef.current)) {
      gameOverRef.current = true;
      setGameOver(true);
    }
  }, [collides]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const board = boardRef.current;
    const piece = pieceRef.current;

    // Clear
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(COLS * CELL, r * CELL);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, ROWS * CELL);
      ctx.stroke();
    }

    // Board
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) {
          ctx.fillStyle = board[r][c]!;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }

    // Ghost piece
    let ghostY = piece.y;
    while (!collides(board, piece, 0, ghostY - piece.y + 1)) {
      ghostY++;
    }
    ctx.globalAlpha = 0.15;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        ctx.fillStyle = piece.color;
        ctx.fillRect((piece.x + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2);
      }
    }
    ctx.globalAlpha = 1;

    // Current piece
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const x = (piece.x + c) * CELL + 1;
        const y = (piece.y + r) * CELL + 1;
        ctx.fillStyle = piece.color;
        ctx.fillRect(x, y, CELL - 2, CELL - 2);
      }
    }

    // Game over overlay
    if (gameOverRef.current) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("按 R 重新开始", canvas.width / 2, canvas.height / 2 + 15);
    }
  }, [collides]);

  const tick = useCallback(() => {
    if (gameOverRef.current) return;
    const board = boardRef.current;
    const piece = pieceRef.current;
    if (collides(board, piece, 0, 1)) {
      lock();
    } else {
      piece.y++;
    }
    draw();
  }, [collides, lock, draw]);

  const reset = useCallback(() => {
    boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    pieceRef.current = randomPiece();
    scoreRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    draw();
  }, [draw]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        if (gameOverRef.current) reset();
        return;
      }
      if (gameOverRef.current) return;
      const board = boardRef.current;
      const piece = pieceRef.current;

      switch (e.key) {
        case "ArrowLeft":
          if (!collides(board, piece, -1, 0)) piece.x--;
          break;
        case "ArrowRight":
          if (!collides(board, piece, 1, 0)) piece.x++;
          break;
        case "ArrowDown":
          if (!collides(board, piece, 0, 1)) piece.y++;
          break;
        case "ArrowUp": {
          const rotated = rotate(piece.shape);
          if (!collides(board, piece, 0, 0, rotated)) piece.shape = rotated;
          break;
        }
        case " ":
          while (!collides(board, piece, 0, 1)) piece.y++;
          lock();
          break;
      }
      draw();
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [collides, lock, draw, reset]);

  useEffect(() => {
    draw();
    loopRef.current = setInterval(tick, 500);
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [tick, draw]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-[200px]">
        <span className="text-xs text-muted">得分</span>
        <span className="text-sm font-mono font-medium text-accent">{score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={COLS * CELL}
        height={ROWS * CELL}
        className="rounded-lg border border-border"
      />
      <div className="text-[10px] text-muted text-center space-y-0.5">
        <p>← → 移动 &nbsp; ↑ 旋转 &nbsp; ↓ 加速 &nbsp; 空格 落下</p>
      </div>
    </div>
  );
}
