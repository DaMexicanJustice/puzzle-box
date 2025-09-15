"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { Draggable } from "gsap/Draggable"
import type { Draggable as DraggableInstance } from "gsap/Draggable"

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable)
}

interface CoinPosition {
  x: number
  y: number
  socketIndex: number | null
}

interface Socket {
  x: number
  y: number
  occupied: boolean
  coinId: string | null
}

const COIN_TYPES = [
  { id: "seer", name: "The Seer", color: "from-purple-600 to-indigo-800", front: "🔔", back: "🧝‍♀️" },
  { id: "bloom", name: "The Bloom", color: "from-pink-500 to-rose-700", front: "🌸", back: "💎" },
  { id: "stranger", name: "The Stranger", color: "from-yellow-500 to-amber-700", front: "💀", back: "👽" },
]

export default function MysticalPuzzle() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [coins, setCoins] = useState<Record<string, CoinPosition>>({})
  const [sockets, setSockets] = useState<Socket[]>([])
  const [isComplete] = useState(false)
  const draggableRefs = useRef<Record<string, DraggableInstance | null>>({})
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

  //Add this line for coin flip state
  const [flippedCoins, setFlippedCoins] = useState<Record<string, boolean>>({})


  // Initialize socket positions (responsive)
  useEffect(() => {
    const initializeSockets = () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height * 0.6

      setContainerDimensions({ width: rect.width, height: rect.height })

      // Create 5 sockets in a mystical pattern
      const socketPositions = [
        { x: centerX - 120, y: centerY }, // Left
        { x: centerX - 60, y: centerY - 40 }, // Top Left
        { x: centerX, y: centerY - 60 }, // Top Center
        { x: centerX + 60, y: centerY - 40 }, // Top Right
        { x: centerX + 120, y: centerY }, // Right
      ]

      setSockets(
        socketPositions.map((pos) => ({
          ...pos,
          occupied: false,
          coinId: null,
        })),
      )
    }

    initializeSockets()
    window.addEventListener("resize", initializeSockets)
    return () => window.removeEventListener("resize", initializeSockets)
  }, [])

  // Initialize coin positions at the bottom
  useEffect(() => {
    if (containerDimensions.width === 0 || containerDimensions.height === 0) return

    // Responsive spacing: coins always centered
    const initialCoins: Record<string, CoinPosition> = {}
    const coinCount = COIN_TYPES.length
    const coinSize = 64 // px, matches w-16/h-16
    const gap = Math.min(32, containerDimensions.width / (coinCount * 4)) // responsive gap
    const totalWidth = coinCount * coinSize + (coinCount - 1) * gap
    const startX = containerDimensions.width / 2 - totalWidth / 2 + coinSize / 2

    COIN_TYPES.forEach((coin, index) => {
      initialCoins[coin.id] = {
        x: startX + index * (coinSize + gap),
        y: containerDimensions.height - coinSize - 32, // 32px above bottom
        socketIndex: null,
      }
    })

    setCoins(initialCoins)
  }, [containerDimensions])

  // Initialize draggable functionality
  useEffect(() => {
    if (!containerRef.current || sockets.length === 0 || Object.keys(coins).length === 0) return

    const container = containerRef.current

    // Setup GSAP draggable for each coin
    COIN_TYPES.forEach((coin) => {
      const coinElement = document.getElementById(`coin-${coin.id}`)
      if (coinElement && coins[coin.id]) {
        gsap.set(coinElement, {
          x: coins[coin.id].x - 32,
          y: coins[coin.id].y - 32,
        })

        draggableRefs.current[coin.id] = Draggable.create(coinElement, {
          type: "x,y",
          bounds: container,
          onDrag: function () {
            gsap.to(this.target, { scale: 1.1, duration: 0.2 })
          },
          onDragEnd: function () {
            // Do NOT call handleFlip here!
          },
        })[0]
      }
    })

    const draggablesSnapshot = draggableRefs.current
    return () => {
      Object.values(draggablesSnapshot).forEach((draggable) => {
        if (draggable) draggable.kill()
      })
    }
  }, [sockets, coins])

  let lastTap = 0
  const handleTouchEnd = (coinId: string) => {
    const now = Date.now()
    if (now - lastTap < 300) {
      handleFlip(coinId)
    }
    lastTap = now
  }

  // Step 2: Add this function for flipping coins
  const handleFlip = (coinId: string) => {
    setFlippedCoins((prev) => ({
      ...prev,
      [coinId]: !prev[coinId],
    }))
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{
        backgroundImage: "url(/background.png)",
        backgroundSize: "contain",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 h-full flex flex-col lg:flex-row items-start justify-start p-4 md:p-8 gap-8">
        {/* Riddle Text */}
        <div className="flex-1 max-w-2xl">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-6 md:p-8 border border-amber-500/30">
            <h1 className="text-2xl md:text-3xl font-bold text-amber-300 mb-6 text-center text-balance">
              The Riddle of Three Relics
            </h1>
            <div className="text-amber-100 text-sm md:text-base leading-relaxed space-y-2 font-serif">
              <p className="text-pretty">Three relics rest in five hollowed stones,</p>
              <p className="text-pretty">First claims her place, the Seer with bones.</p>
              <p className="text-pretty">Beneath the blighted roots she dreams alone,</p>
              <p className="text-pretty">While eldritch winds behind her moan.</p>
              <br />
              <p className="text-pretty">A single Bloom, radiant yet cursed,</p>
              <p className="text-pretty">Stirs where the void&apos;s breath is unrehearsed.</p>
              <br />
              <p className="text-pretty">And last comes the Stranger, forged in gold,</p>
              <p className="text-pretty">With shattered light in his eyes so bold.</p>
              <p className="text-pretty">Ahead of fate, he walks alone,</p>
              <p className="text-pretty">Before secrets stir or truth is known.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-row lg:flex-col gap-4 items-center justify-center lg:justify-start">
          <div className="text-amber-300 text-sm font-medium mb-2 hidden lg:block">Mystical Relics</div>
          {/* Coins Row - Always centered at bottom */}
          <div className="absolute left-0 right-0 bottom-20 z-20" style={{ height: 64 }}>
            {COIN_TYPES.map((coin) => (
              <div
                key={coin.id}
                id={`coin-${coin.id}`}
                className={`coin w-12 h-12 rounded-full bg-gradient-to-br ${coin.color} flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-amber-400 cursor-pointer`}
                style={{
                  position: "absolute",
                  left: coins[coin.id]?.x ? coins[coin.id].x - 32 : 0,
                  top: coins[coin.id]?.y ? coins[coin.id].y - 32 : 0,
                  zIndex: 20,
                  pointerEvents: "auto",
                  perspective: 600,
                }}
                onDoubleClick={() => handleFlip(coin.id)}
                onTouchEnd={() => handleTouchEnd(coin.id)} // Use double-tap handler for mobile
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transition: "transform 0.6s",
                    transformStyle: "preserve-3d",
                    transform: flippedCoins[coin.id] ? "rotateY(180deg)" : "none",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {/* Front */}
                  <div
                    className="absolute w-full h-full flex items-center justify-center"
                    style={{
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {coin.front}
                  </div>
                  {/* Back */}
                  <div
                    className="absolute w-full h-full flex items-center justify-center text-amber-300"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    {coin.back}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Puzzle Area - Moved to center of screen */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="relative pointer-events-auto">
          {/* Sockets */}
          {sockets.map((socket, index) => (
            <div
              key={index}
              className={`absolute w-16 h-16 rounded-full border-4 transition-all duration-300 ${socket.occupied
                ? "border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50"
                : "border-amber-600/50 bg-amber-900/20"
                }`}
              style={{
                left: socket.x - 32,
                top: socket.y - 32,
                transform: "translate(0, 0)",
              }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-800/30 to-amber-900/50" />
            </div>
          ))}
        </div>
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-amber-500/90 backdrop-blur-sm rounded-lg p-6 border border-amber-300 shadow-2xl">
            <h2 className="text-2xl font-bold text-amber-900 text-center mb-2">🎉 Puzzle Solved! 🎉</h2>
            <p className="text-amber-800 text-center">The three relics have found their destined places!</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {/* <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-amber-500/30 max-w-md mx-auto">
          <p className="text-amber-200 text-sm text-center">
            Drag the three mystical coins to any of the five ancient sockets to solve the riddle
          </p>
        </div>
      </div> */}
    </div>
  )
}
