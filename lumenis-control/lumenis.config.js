const path = require('path');

const rootDir = __dirname;
const pythonPort = process.env.PYTHON_PORT || '3002';
const nodePort = process.env.NODE_PORT || '3000';

module.exports = {
  apps: [
    {
      name: 'lumenis-node-bridge',
      cwd: rootDir,
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        PORT: nodePort,
        PYTHON_API_URL: `http://127.0.0.1:${pythonPort}`,
      },
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      kill_timeout: 5000,
    },
    {
      name: 'lumenis-sovereign-core',
      cwd: path.join(rootDir, 'python-backend'),
      script: 'venv/bin/uvicorn',
      args: `main:app --host 0.0.0.0 --port ${pythonPort}`,
      interpreter: 'none',
      env: {
        PYTHONUNBUFFERED: '1',
      },
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      kill_timeout: 5000,
    },
  ],
};
