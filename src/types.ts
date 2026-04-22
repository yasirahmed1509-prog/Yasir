/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameObject {
  id: string;
  x: number;
  y: number;
  type: 'strawberry' | 'lemon';
  speed: number;
  rotation: number;
}

export interface GameState {
  score: number;
  lives: number;
  isGameOver: boolean;
  isStarted: boolean;
}
