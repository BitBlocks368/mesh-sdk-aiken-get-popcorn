import React from 'react';

interface GameState {
  gameActive: boolean;
  popcornCount: number;
  level: number;
  score: number;
  timeRemaining: number;
}

interface GameStatsProps {
  gameState: GameState;
  stats: {
    totalPopped: number;
    accuracy: number;
    streak: number;
    maxStreak: number;
  };
  currentLifetime: number;
}

const GameStats: React.FC<GameStatsProps> = ({ gameState, stats, currentLifetime }) => {
  return (
    <div className="game-stats">
      {/* Priority 1: Essential stats always visible */}
      <div className="stat-item priority-high">
        <span className="stat-label">Score:</span>
        <span className="stat-value">{gameState.score}</span>
      </div>
      
      <div className="stat-item priority-high">
        <span className="stat-label">Time:</span>
        <span className="stat-value">{gameState.timeRemaining}s</span>
      </div>
      
      <div className="stat-item priority-high">
        <span className="stat-label">Popped:</span>
        <span className="stat-value">{gameState.popcornCount}</span>
      </div>
      
      {/* Priority 2: Secondary stats for tablet+ */}
      <div className="stat-item priority-medium">
        <span className="stat-label">Level:</span>
        <span className="stat-value">{gameState.level}</span>
      </div>
      
      <div className="stat-item priority-medium">
        <span className="stat-label">Streak:</span>
        <span className="stat-value">{stats.streak}</span>
      </div>
      
      {/* Priority 3: Advanced stats for desktop */}
      <div className="stat-item priority-low">
        <span className="stat-label">Max Streak:</span>
        <span className="stat-value">{stats.maxStreak}</span>
      </div>
      
      <div className="stat-item priority-low">
        <span className="stat-label">Kernel Time:</span>
        <span className="stat-value">{(currentLifetime / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
};

export default GameStats;