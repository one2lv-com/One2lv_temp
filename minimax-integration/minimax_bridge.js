/**
 * ONE2LVOS MiniMax Bridge
 * Node.js gateway to MiniMax Python API
 */
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.MINIMAX_BRIDGE_PORT || 8002;
const MINIMAX_API = process.env.MINIMAX_API_URL || 'http://localhost:8001';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'minimax-bridge',
    backend: MINIMAX_API
  });
});

// Chat proxy
app.post('/api/minimax/chat', async (req, res) => {
  try {
    const response = await axios.post(`${MINIMAX_API}/chat`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reasoning proxy
app.post('/api/minimax/reasoning', async (req, res) => {
  try {
    const response = await axios.post(`${MINIMAX_API}/reasoning`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Creative proxy
app.post('/api/minimax/creative', async (req, res) => {
  try {
    const response = await axios.post(`${MINIMAX_API}/creative`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Conversation proxy
app.post('/api/minimax/conversation', async (req, res) => {
  try {
    const response = await axios.post(`${MINIMAX_API}/conversation`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint
app.get('/api/minimax/test', async (req, res) => {
  try {
    const testMessage = {
      message: "What is your role in the One2lvos ecosystem?",
      temperature: 0.7
    };

    const response = await axios.post(`${MINIMAX_API}/chat`, testMessage);
    res.json({
      test: 'passed',
      response: response.data
    });
  } catch (error) {
    res.status(500).json({
      test: 'failed',
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌉 MiniMax Bridge Active on port ${PORT}`);
  console.log(`🔗 Backend: ${MINIMAX_API}`);
});
