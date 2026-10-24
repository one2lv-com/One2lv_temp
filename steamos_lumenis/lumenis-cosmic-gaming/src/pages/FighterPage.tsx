import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, RotateCcw, Volume2, VolumeX, Swords } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Game constants
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 500
const GROUND_Y = 450
const GRAVITY = 0.8
const JUMP_FORCE = -15
const MOVE_SPEED = 5
const MAX_HEALTH = 100

interface Fighter {
  x: number
  y: number
  vx: number
  vy: number
  health: number
  facing: 'left' | 'right'
  isJumping: boolean
  isAttacking: boolean
  attackFrame: number
  name: string
  color: string
}

interface GameState {
  player: Fighter
  ai: Fighter
  gameOver: boolean
  winner: string | null
  round: number
  playerScore: number
  aiScore: number
}

const AI_PERSONALITY = {
  aggression: 0.6,
  reactionTime: 300,
  comboChance: 0.4,
  dodgeChance: 0.3
}

export default function FighterPage() {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [countdown, setCountdown] = useState(3)
  const keysRef = useRef<Set<string>>(new Set())
  const animationRef = useRef<number>()

  const initGame = useCallback(() => {
    setGameState({
      player: {
        x: 150,
        y: GROUND_Y,
        vx: 0,
        vy: 0,
        health: MAX_HEALTH,
        facing: 'right',
        isJumping: false,
        isAttacking: false,
        attackFrame: 0,
        name: user?.username || 'Player',
        color: '#00ffff'
      },
      ai: {
        x: 650,
        y: GROUND_Y,
        vx: 0,
        vy: 0,
        health: MAX_HEALTH,
        facing: 'left',
        isJumping: false,
        isAttacking: false,
        attackFrame: 0,
        name: 'Gemini-AI',
        color: '#ff00ff'
      },
      gameOver: false,
      winner: null,
      round: 1,
      playerScore: 0,
      aiScore: 0
    })
    setCountdown(3)
  }, [user])

  // Countdown before match
  useEffect(() => {
    if (isRunning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(c => c - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isRunning && countdown === 0) {
      startGameLoop()
    }
  }, [isRunning, countdown])

  const startGame = () => {
    initGame()
    setIsRunning(true)
  }

  const startGameLoop = () => {
    let lastTime = performance.now()

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      if (!gameState || gameState.gameOver) {
        cancelAnimationFrame(animationRef.current!)
        return
      }

      // Process input
      processPlayerInput()

      // AI logic
      processAI()

      // Physics and collisions
      updatePhysics()

      // Check for hits
      checkHits()

      // Check for game over
      checkGameOver()

      // Draw
      draw()

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)
  }

  const processPlayerInput = () => {
    if (!gameState || !isRunning) return

    const { player } = gameState
    const keys = keysRef.current

    // Movement
    player.vx = 0
    if (keys.has('a') || keys.has('arrowleft')) {
      player.vx = -MOVE_SPEED
      player.facing = 'left'
    }
    if (keys.has('d') || keys.has('arrowright')) {
      player.vx = MOVE_SPEED
      player.facing = 'right'
    }

    // Jump
    if ((keys.has('w') || keys.has('arrowup') || keys.has(' ')) && !player.isJumping) {
      player.vy = JUMP_FORCE
      player.isJumping = true
    }

    // Attack
    if (keys.has('j') || keys.has('z')) {
      if (!player.isAttacking) {
        player.isAttacking = true
        player.attackFrame = 15
      }
    }
  }

  const processAI = () => {
    if (!gameState) return

    const { player, ai } = gameState
    const distance = Math.abs(ai.x - player.x)

    // Decision making
    let targetX = player.x

    // Approach or retreat based on distance
    if (distance > 200) {
      // Move towards player
      ai.vx = player.x < ai.x ? -MOVE_SPEED * 0.8 : MOVE_SPEED * 0.8
      ai.facing = player.x < ai.x ? 'left' : 'right'
    } else if (distance < 100) {
      // Attack range
      ai.vx = (Math.random() > AI_PERSONALITY.aggression) ? 0 : ai.vx

      // Random jump
      if (Math.random() < 0.02 && !ai.isJumping) {
        ai.vy = JUMP_FORCE
        ai.isJumping = true
      }

      // Attack
      if (!ai.isAttacking && Math.random() < AI_PERSONALITY.comboChance) {
        ai.isAttacking = true
        ai.attackFrame = 15
      }

      ai.facing = player.x < ai.x ? 'left' : 'right'
    } else {
      // Mid-range - circle
      ai.vx = (Math.random() > 0.5 ? 1 : -1) * MOVE_SPEED * 0.5
    }

    // Dodge when player attacks
    if (player.isAttacking && distance < 150 && Math.random() < AI_PERSONALITY.dodgeChance) {
      if (!ai.isJumping) {
        ai.vy = JUMP_FORCE
        ai.isJumping = true
      }
    }
  }

  const updatePhysics = () => {
    if (!gameState) return

    const updateFighter = (fighter: Fighter) => {
      // Apply gravity
      fighter.vy += GRAVITY

      // Apply velocity
      fighter.x += fighter.vx
      fighter.y += fighter.vy

      // Ground collision
      if (fighter.y >= GROUND_Y) {
        fighter.y = GROUND_Y
        fighter.vy = 0
        fighter.isJumping = false
      }

      // Wall boundaries
      fighter.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, fighter.x))

      // Attack animation
      if (fighter.isAttacking) {
        fighter.attackFrame--
        if (fighter.attackFrame <= 0) {
          fighter.isAttacking = false
        }
      }
    }

    updateFighter(gameState.player)
    updateFighter(gameState.ai)
  }

  const checkHits = () => {
    if (!gameState) return

    const checkAttack = (attacker: Fighter, defender: Fighter) => {
      if (!attacker.isAttacking || attacker.attackFrame < 10) return

      const attackRange = 60
      const dx = attacker.facing === 'right'
        ? attacker.x + attackRange - defender.x
        : defender.x + attackRange - attacker.x

      const dy = Math.abs(attacker.y - defender.y)

      if (dx > 0 && dx < attackRange && dy < 60) {
        defender.health -= 8
        defender.vx = attacker.facing === 'right' ? 5 : -5

        if (soundEnabled) {
          // Play hit sound (would use Web Audio API in production)
        }
      }
    }

    checkAttack(gameState.player, gameState.ai)
    checkAttack(gameState.ai, gameState.player)
  }

  const checkGameOver = () => {
    if (!gameState) return

    if (gameState.player.health <= 0) {
      setGameState(prev => prev ? {
        ...prev,
        gameOver: true,
        winner: 'AI',
        aiScore: prev.aiScore + 1
      } : null)
    } else if (gameState.ai.health <= 0) {
      setGameState(prev => prev ? {
        ...prev,
        gameOver: true,
        winner: 'Player',
        playerScore: prev.playerScore + 1
      } : null)
    }
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Ground
    ctx.strokeStyle = '#00ffff33'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y + 10)
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 10)
    ctx.stroke()

    // Draw fighters
    const drawFighter = (fighter: Fighter) => {
      // Body
      ctx.fillStyle = fighter.color
      ctx.beginPath()
      ctx.arc(fighter.x, fighter.y - 40, 30, 0, Math.PI * 2)
      ctx.fill()

      // Direction indicator
      ctx.fillStyle = '#fff'
      const eyeX = fighter.facing === 'right' ? fighter.x + 10 : fighter.x - 10
      ctx.beginPath()
      ctx.arc(eyeX, fighter.y - 45, 5, 0, Math.PI * 2)
      ctx.fill()

      // Attack effect
      if (fighter.isAttacking && fighter.attackFrame > 10) {
        ctx.strokeStyle = fighter.color
        ctx.lineWidth = 3
        ctx.beginPath()
        const attackX = fighter.facing === 'right' ? fighter.x + 50 : fighter.x - 50
        ctx.moveTo(fighter.x, fighter.y - 40)
        ctx.lineTo(attackX, fighter.y - 40)
        ctx.stroke()
      }

      // Health bar
      const healthBarWidth = 60
      const healthPercent = fighter.health / MAX_HEALTH
      ctx.fillStyle = '#333'
      ctx.fillRect(fighter.x - healthBarWidth / 2, fighter.y - 90, healthBarWidth, 8)
      ctx.fillStyle = fighter.health > 30 ? '#0f0' : '#f00'
      ctx.fillRect(fighter.x - healthBarWidth / 2, fighter.y - 90, healthBarWidth * healthPercent, 8)

      // Name
      ctx.fillStyle = '#fff'
      ctx.font = '12px Orbitron'
      ctx.textAlign = 'center'
      ctx.fillText(fighter.name, fighter.x, fighter.y - 100)
    }

    drawFighter(gameState.player)
    drawFighter(gameState.ai)

    // Score
    ctx.fillStyle = '#00ffff'
    ctx.font = '20px Orbitron'
    ctx.textAlign = 'center'
    ctx.fillText(
      `${gameState.playerScore} - ${gameState.aiScore}`,
      CANVAS_WIDTH / 2,
      40
    )
  }

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center cosmic-glow">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold cosmic-text">AI Fighter</h1>
            <p className="text-sm text-cyan-400/70">Battle Gemini-AI in the cosmic arena</p>
          </div>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 rounded-lg holo-panel"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Game Canvas */}
      <div className="relative mx-auto rounded-lg overflow-hidden cosmic-border">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full max-w-full bg-black"
        />

        {/* Countdown Overlay */}
        {isRunning && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-9xl font-bold cosmic-text animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState?.gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <div className="text-center mb-8">
              <h2 className={`text-4xl font-bold mb-2 ${gameState.winner === 'Player' ? 'text-green-400' : 'text-red-400'}`}>
                {gameState.winner === 'Player' ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              <p className="text-gray-400">
                {gameState.winner === 'Player'
                  ? '"When ME 3E becomes Null, let the Light break through."'
                  : 'The shadow of doubt has fallen. Rise again.'
                }
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setGameState(prev => prev ? {
                    ...prev,
                    player: { ...prev.player, health: MAX_HEALTH, x: 150, y: GROUND_Y },
                    ai: { ...prev.ai, health: MAX_HEALTH, x: 650, y: GROUND_Y },
                    gameOver: false,
                    winner: null
                  } : null)
                  setCountdown(3)
                }}
                className="btn-cosmic"
              >
                Rematch
              </button>
              <button
                onClick={() => {
                  initGame()
                  setCountdown(3)
                }}
                className="px-6 py-3 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 transition-colors"
              >
                New Match
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {!isRunning ? (
          <button onClick={startGame} className="btn-cosmic flex items-center gap-2">
            <Play className="w-5 h-5" />
            Start Match
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => {
                cancelAnimationFrame(animationRef.current!)
                setIsRunning(false)
                initGame()
              }}
              className="px-6 py-3 rounded-lg border border-red-500/30 text-red-400
                hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        )}

        {/* Controls Guide */}
        <div className="hidden md:grid grid-cols-4 gap-4 text-sm text-gray-500">
          <div className="text-center">
            <kbd className="px-2 py-1 rounded bg-gray-800">A/D</kbd>
            <p className="mt-1">Move</p>
          </div>
          <div className="text-center">
            <kbd className="px-2 py-1 rounded bg-gray-800">W</kbd>
            <p className="mt-1">Jump</p>
          </div>
          <div className="text-center">
            <kbd className="px-2 py-1 rounded bg-gray-800">J</kbd>
            <p className="mt-1">Attack</p>
          </div>
          <div className="text-center">
            <kbd className="px-2 py-1 rounded bg-gray-800">Space</kbd>
            <p className="mt-1">Jump</p>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div className="text-center text-sm text-cyan-400/50 italic">
        "You are Hunter Anderson. You are One2lv. You are the Architect of the Rebuild."
      </div>
    </div>
  )
}
