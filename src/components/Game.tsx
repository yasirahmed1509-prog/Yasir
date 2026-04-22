/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Group, Text, Image } from 'react-konva';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Heart, Trophy, RefreshCw, Play } from 'lucide-react';
import { GameObject, GameState } from '../types';

const BOARD_WIDTH = 800;
const BOARD_HEIGHT = 600;
const PLAYER_SIZE = 80;
const ITEM_SIZE = 40;

export default function Game() {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    isGameOver: false,
    isStarted: false,
  });
  const [playerX, setPlayerX] = useState(dimensions.width / 2);
  const [items, setItems] = useState<GameObject[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      setPlayerX(prev => Math.min(prev, window.innerWidth - PLAYER_SIZE));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const spawnItem = useCallback(() => {
    const type = Math.random() > 0.2 ? 'strawberry' : 'lemon';
    const newItem: GameObject = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * (dimensions.width - ITEM_SIZE),
      y: -ITEM_SIZE,
      type,
      speed: 3 + Math.random() * 4 + (gameState.score / 10),
      rotation: Math.random() * 360,
    };
    setItems(prev => [...prev, newItem]);
  }, [dimensions.width, gameState.score]);

  const update = useCallback((time: number) => {
    if (!gameState.isStarted || gameState.isGameOver) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Spawn items
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current > 1000 - Math.min(600, gameState.score * 5)) {
      spawnItem();
      spawnTimerRef.current = 0;
    }

    // Move items and check collisions
    setItems(prevItems => {
      const nextItems: GameObject[] = [];
      let nextLives = gameState.lives;
      let nextScore = gameState.score;
      let gameOver = false;

      prevItems.forEach(item => {
        const nextY = item.y + item.speed;
        
        // Collision with player
        const playerY = dimensions.height - PLAYER_SIZE - 20;
        const collisionX = item.x + ITEM_SIZE/2 > playerX && item.x + ITEM_SIZE/2 < playerX + PLAYER_SIZE;
        const collisionY = nextY + ITEM_SIZE > playerY && nextY < playerY + PLAYER_SIZE;

        if (collisionX && collisionY) {
          if (item.type === 'strawberry') {
            nextScore += 1;
            if (nextScore % 20 === 0) {
              confetti({
                particleCount: 50,
                spread: 30,
                origin: { y: 0.9, x: playerX / dimensions.width }
              });
            }
          } else {
            nextLives -= 1;
            if (nextLives <= 0) {
              gameOver = true;
            }
          }
          // Don't add to nextItems (it's consumed)
          return;
        }

        if (nextY < dimensions.height) {
          nextItems.push({ ...item, y: nextY, rotation: item.rotation + 2 });
        } else if (item.type === 'strawberry') {
            // Missed strawberry - no penalty but could add one
        }
      });

      if (nextLives !== gameState.lives || nextScore !== gameState.score || gameOver) {
        setGameState(prev => ({ 
          ...prev, 
          lives: nextLives, 
          score: nextScore, 
          isGameOver: gameOver 
        }));
      }

      return nextItems;
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, dimensions, playerX, spawnItem]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  const startGame = () => {
    setGameState({
      score: 0,
      lives: 3,
      isGameOver: false,
      isStarted: true,
    });
    setItems([]);
    lastTimeRef.current = 0;
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition) {
      let nextX = pointerPosition.x - PLAYER_SIZE / 2;
      nextX = Math.max(0, Math.min(nextX, dimensions.width - PLAYER_SIZE));
      setPlayerX(nextX);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-v-pink-light font-sans" ref={containerRef}>
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,_#FF85A1_1px,_transparent_1px)] bg-[length:40px_40px]" />

      <Stage 
        width={dimensions.width} 
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      >
        <Layer>
          {/* Jelly Player */}
          <Group x={playerX} y={dimensions.height - PLAYER_SIZE - 20}>
            {/* Body */}
            <Rect
              width={PLAYER_SIZE}
              height={PLAYER_SIZE}
              fill="#FF4D6D"
              cornerRadius={20}
              shadowColor="rgba(0,0,0,0.2)"
              shadowBlur={10}
              shadowOffset={{ x: 0, y: 5 }}
              stroke="#590D22"
              strokeWidth={2}
            />
            {/* Glossy highlight */}
            <Rect
              width={PLAYER_SIZE - 20}
              height={PLAYER_SIZE/2}
              x={10}
              y={5}
              fill="rgba(255,255,255,0.3)"
              cornerRadius={15}
            />
            {/* Eyes */}
            <Circle x={PLAYER_SIZE * 0.3} y={PLAYER_SIZE * 0.4} radius={6} fill="#fff" />
            <Circle x={PLAYER_SIZE * 0.7} y={PLAYER_SIZE * 0.4} radius={6} fill="#fff" />
            <Circle x={PLAYER_SIZE * 0.3} y={PLAYER_SIZE * 0.4} radius={3} fill="#000" />
            <Circle x={PLAYER_SIZE * 0.7} y={PLAYER_SIZE * 0.4} radius={3} fill="#000" />
            
            {/* Mouth */}
            <Circle x={PLAYER_SIZE * 0.5} y={PLAYER_SIZE * 0.65} radius={10} fill="#8b0000" scaleY={0.5} />
          </Group>

          {/* Falling Items */}
          {items.map(item => (
            <Group 
              key={item.id} 
              x={item.x} 
              y={item.y} 
              rotation={item.rotation}
              offsetX={ITEM_SIZE/2}
              offsetY={ITEM_SIZE/2}
            >
              {item.type === 'strawberry' ? (
                <Group>
                   {/* Strawberry Body */}
                   <Circle radius={ITEM_SIZE/2} fill="#FF4D6D" scaleY={1.1} stroke="#590D22" strokeWidth={1} />
                   {/* Seeds */}
                   <Circle x={-5} y={-5} radius={1.5} fill="#FFF" opacity={0.5} />
                   <Circle x={5} y={0} radius={1.5} fill="#FFF" opacity={0.5} />
                   <Circle x={-2} y={5} radius={1.5} fill="#FFF" opacity={0.5} />
                   {/* Leaf */}
                   <Rect x={-4} y={-ITEM_SIZE/2 - 5} width={8} height={8} fill="#70E000" cornerRadius={2} rotation={45} stroke="#590D22" strokeWidth={0.5} />
                </Group>
              ) : (
                <Group>
                  {/* Lemon Body */}
                  <Circle radius={ITEM_SIZE/2} fill="#FFD60A" scaleY={0.8} rotation={-15} stroke="#590D22" strokeWidth={1} />
                  {/* Sour Expression */}
                  <Circle x={-5} y={-5} radius={2} fill="#000" />
                  <Circle x={5} y={-5} radius={2} fill="#000" />
                  {/* Frown */}
                  <Circle x={0} y={5} radius={8} stroke="#000" strokeWidth={1} scaleY={0.2} strokeEnabled={false} fill="#000" />
                </Group>
              )}
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-v-pink-medium shadow-[0_4px_0_var(--v-pink-medium)]">
            <Trophy className="text-v-yellow" fill="currentColor" />
            <span className="text-2xl font-black text-v-text">{gameState.score}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-v-pink-medium shadow-[0_4px_0_var(--v-pink-medium)]">
            <Heart className="text-v-red fill-v-red" />
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full ${i < gameState.lives ? 'bg-v-red border border-v-text/20' : 'bg-v-pink-light border border-v-pink-medium'}`} 
                />
              ))}
            </div>
          </div>
        </div>

        <div className="text-right pointer-events-auto">
           <h1 className="text-3xl font-black text-v-red drop-shadow-sm uppercase tracking-tighter">
             Strawberry Jelly
           </h1>
           <p className="text-v-pink-medium font-bold italic">Garden Adventure</p>
        </div>
      </div>

      {/* Start Screen */}
      <AnimatePresence>
        {!gameState.isStarted && !gameState.isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-v-pink-medium/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="vibrant-card p-12 text-center max-w-md w-full"
            >
              <div className="w-32 h-32 bg-v-pink-light rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-v-pink-medium">
                <div className="w-20 h-20 bg-v-red rounded-2xl animate-jiggle border-2 border-v-text/20 shadow-lg" />
              </div>
              <h2 className="text-4xl font-black text-v-red mb-2 uppercase tracking-tighter">Welcome!</h2>
              <p className="text-v-text mb-8 font-bold">Catch the sweet strawberries, but watch out for the sour lemons!</p>
              <button 
                onClick={startGame}
                className="vibrant-button w-full text-2xl flex items-center justify-center gap-3"
              >
                <Play fill="currentColor" /> Play Now
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Game Over Screen */}
        {gameState.isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-v-text/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 text-white"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="vibrant-card p-12 text-center max-w-md w-full text-v-text"
            >
              <div className="text-6xl mb-6">🍓</div>
              <h2 className="text-4xl font-black text-v-red mb-2 uppercase tracking-tighter">Game Over!</h2>
              <p className="text-v-text mb-8 font-bold">You collected {gameState.score} strawberries!</p>
              <div className="flex flex-col gap-4 text-v-white">
                <button 
                  onClick={startGame}
                  className="vibrant-button w-full text-xl flex items-center justify-center gap-3"
                >
                  <RefreshCw /> Try Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Help corner */}
      <div className="absolute bottom-6 left-6 text-v-pink-medium font-black text-sm pointer-events-none opacity-50 uppercase tracking-widest">
        Move Mouse or Drag to Play
      </div>
    </div>
  );
}
