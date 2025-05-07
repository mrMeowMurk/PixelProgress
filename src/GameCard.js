import React, { useState } from 'react';
import './GameCard.css';

function GameCard({ game, onStatusChange }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#43a047';
      case 'in-progress': return '#fb8c00';
      case 'want-to-play': return '#7e57c2';
      default: return '#66c0f4';
    }
  };

  return (
    <div className="game-card">
      <div className="game-image">
        <img 
          src={imageError ? 
            'https://cdn.akamai.steamstatic.com/steam/apps/steam_logo.jpg' : 
            game.image
          }
          alt={game.title}
          onError={handleImageError}
        />
        <div className="game-overlay">
          <span className="game-status" style={{ backgroundColor: getStatusColor(game.status) }}>
            {game.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
      </div>
      <div className="game-info">
        <h2>{game.title}</h2>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${game.progress}%`,
              backgroundColor: getStatusColor(game.status)
            }}
          />
          <span>{game.progress}% Complete</span>
        </div>
        <div className="game-details">
          <p className="play-time">⌛ {game.playTime}</p>
          <p>🏆 Achievements: {game.achievements}/{game.totalAchievements}</p>
          <p>🕹️ Last played: {game.lastPlayed}</p>
        </div>
        <select 
          className="status-select"
          value={game.status}
          onChange={(e) => onStatusChange(game.id, e.target.value)}
          style={{ borderColor: getStatusColor(game.status) }}
        >
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="want-to-play">Want to Play</option>
        </select>
      </div>
    </div>
  );
}

export default GameCard; 