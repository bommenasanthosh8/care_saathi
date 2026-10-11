/**
 * CareSaathi AI - Unified Development Service Runner
 * Concurrently starts:
 *   1. Python FastAPI Backend (uvicorn with auto-reload, cwd: backend/)
 *   2. Vite React Frontend (cwd: frontend/)
 * 
 * Works cleanly with: `bun run dev` (or `node scripts/dev.js`) in Windows PowerShell.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// Virtualenv Python executable path
const VENV_PYTHON = path.join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe');
const SYSTEM_PYTHON = process.platform === 'win32' ? 'python.exe' : 'python3';
const PYTHON_EXEC = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : SYSTEM_PYTHON;

// Frontend package runner
const IS_BUN = typeof Bun !== 'undefined' || !!process.versions.bun;
const RUNNER_CMD = IS_BUN ? 'bun' : (process.platform === 'win32' ? 'npm.cmd' : 'npm');

// ANSI Color formatting
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

const PREFIX_BACKEND = `${COLORS.cyan}${COLORS.bold}[backend]${COLORS.reset} `;
const PREFIX_FRONTEND = `${COLORS.magenta}${COLORS.bold}[frontend]${COLORS.reset} `;

console.log(`${COLORS.green}${COLORS.bold}======================================================================${COLORS.reset}`);
console.log(`${COLORS.green}${COLORS.bold}  CareSaathi AI — Unified Development Environment${COLORS.reset}`);
console.log(`${COLORS.green}${COLORS.bold}======================================================================${COLORS.reset}`);
console.log(`${COLORS.dim}Root Directory:${COLORS.reset}     ${ROOT_DIR}`);
console.log(`${COLORS.cyan}Backend Service:${COLORS.reset}    ${PYTHON_EXEC} -m uvicorn app.main:app --reload`);
console.log(`${COLORS.cyan}Backend URL:${COLORS.reset}        http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)`);
console.log(`${COLORS.magenta}Frontend Service:${COLORS.reset}   ${RUNNER_CMD} run dev`);
console.log(`${COLORS.magenta}Frontend URL:${COLORS.reset}       http://localhost:5173`);
console.log(`${COLORS.dim}Press Ctrl+C to stop both services.${COLORS.reset}`);
console.log(`${COLORS.green}${COLORS.bold}======================================================================${COLORS.reset}\n`);

const processes = [];

function pipeLines(stream, prefix, isError = false) {
  if (!stream) return;
  const rl = readline.createInterface({ input: stream });
  rl.on('line', (line) => {
    if (isError) {
      console.error(`${prefix}${line}`);
    } else {
      console.log(`${prefix}${line}`);
    }
  });
}

function killProcessTree(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-proc.pid, 'SIGKILL');
    }
  } catch (e) {
    try {
      proc.kill('SIGKILL');
    } catch (_) {}
  }
}

let isShuttingDown = false;
function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${COLORS.yellow}Shutting down CareSaathi AI services...${COLORS.reset}`);
  for (const proc of processes) {
    killProcessTree(proc);
  }
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('exit', () => shutdown(0));

// 1. Spawn FastAPI Backend (cwd: backend/)
const backendProc = spawn(
  PYTHON_EXEC,
  ['-m', 'uvicorn', 'app.main:app', '--reload'],
  {
    cwd: BACKEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  }
);
processes.push(backendProc);

pipeLines(backendProc.stdout, PREFIX_BACKEND, false);
pipeLines(backendProc.stderr, PREFIX_BACKEND, false);

backendProc.on('error', (err) => {
  console.error(`${PREFIX_BACKEND}${COLORS.red}Failed to start backend: ${err.message}${COLORS.reset}`);
  shutdown(1);
});

backendProc.on('exit', (code, signal) => {
  if (!isShuttingDown) {
    console.log(`${PREFIX_BACKEND}${COLORS.yellow}Backend process exited (code: ${code}, signal: ${signal})${COLORS.reset}`);
    shutdown(code || 0);
  }
});

// 2. Spawn Vite React Frontend (cwd: frontend/)
const frontendProc = spawn(
  RUNNER_CMD,
  ['run', 'dev'],
  {
    cwd: FRONTEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: { ...process.env }
  }
);
processes.push(frontendProc);

pipeLines(frontendProc.stdout, PREFIX_FRONTEND, false);
pipeLines(frontendProc.stderr, PREFIX_FRONTEND, false);

frontendProc.on('error', (err) => {
  console.error(`${PREFIX_FRONTEND}${COLORS.red}Failed to start frontend: ${err.message}${COLORS.reset}`);
  shutdown(1);
});

frontendProc.on('exit', (code, signal) => {
  if (!isShuttingDown) {
    console.log(`${PREFIX_FRONTEND}${COLORS.yellow}Frontend process exited (code: ${code}, signal: ${signal})${COLORS.reset}`);
    shutdown(code || 0);
  }
});
