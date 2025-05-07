import React, { useState } from 'react';
import './App.css';
import { steamApi } from './services/steamApi';

function App() {
  const [steamId, setSteamId] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, completed, in-progress, want-to-play
  const [searchQuery, setSearchQuery] = useState('');
  const [playerInfo, setPlayerInfo] = useState(null);

  const formatPlayTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    return `${hours.toLocaleString()} hours`;
  };

  const handleSteamIdSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let finalSteamId = steamId;

      // Проверяем, является ли введенное значение vanity URL
      if (!steamId.match(/^\d+$/)) {
        try {
          finalSteamId = await steamApi.resolveVanityUrl(steamId);
        } catch (error) {
          throw new Error('Invalid Steam ID or vanity URL');
        }
      }

      // Получаем информацию о пользователе
      const player = await steamApi.getPlayerInfo(finalSteamId);
      setPlayerInfo(player);

      // Получаем список игр
      const ownedGames = await steamApi.getOwnedGames(finalSteamId);
      
      // Получаем недавно сыгранные игры
      const recentGames = await steamApi.getRecentlyPlayedGames(finalSteamId);
      const recentGameIds = new Set(recentGames.map(game => game.appid));

      // Формируем список игр с дополнительной информацией
      const gamesWithDetails = await Promise.all(
        ownedGames.map(async (game) => {
          const achievements = await steamApi.getGameAchievements(finalSteamId, game.appid);
          const completedAchievements = achievements.filter(a => a.achieved).length;
          const progress = Math.round((completedAchievements / achievements.length) * 100) || 0;
          
          // Автоматически помечаем игру как Completed, если все достижения выполнены
          const status = progress === 100 ? 'completed' : 'in-progress';
          
          return {
            id: game.appid,
            title: game.name,
            progress: progress,
            achievements: completedAchievements,
            totalAchievements: achievements.length,
            lastPlayed: recentGameIds.has(game.appid) ? 'Recently' : 'Not recently',
            image: `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`,
            playTime: formatPlayTime(game.playtime_forever),
            status: status
          };
        })
      );

      setGames(gamesWithDetails);
    } catch (err) {
      setError('Failed to fetch games. Please check your Steam ID or vanity URL and try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateGameStatus = (gameId, newStatus) => {
    setGames(games.map(game => 
      game.id === gameId ? { ...game, status: newStatus } : game
    ));
  };

  const filteredGames = games.filter(game => {
    const matchesFilter = filter === 'all' || game.status === filter;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>Steam Game Progress Tracker</h1>
        {playerInfo && (
          <div className="player-info">
            <img src={playerInfo.avatarfull} alt="Player Avatar" className="player-avatar" />
            <h2>{playerInfo.personaname}</h2>
          </div>
        )}
        <form onSubmit={handleSteamIdSubmit} className="steam-id-form">
          <input
            type="text"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            placeholder="Enter your Steam ID or vanity URL"
            className="steam-id-input"
          />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Loading...' : 'Load Games'}
          </button>
        </form>
      </header>

      {error && <div className="error-message">{error}</div>}

      {games.length > 0 && (
        <div className="filters">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="search-input"
          />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Games</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="want-to-play">Want to Play</option>
          </select>
        </div>
      )}

      <main className="games-container">
        {filteredGames.map(game => (
          <div key={game.id} className="game-card">
            <div className="game-image">
              <img src={game.image} alt={game.title} />
            </div>
            <div className="game-info">
              <h2>{game.title}</h2>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${game.progress}%` }}
                ></div>
                <span>{game.progress}% Complete</span>
              </div>
              <div className="game-details">
                <p className="play-time">Play Time: {game.playTime}</p>
                <p className="achievements">
                  Achievements: {game.achievements}/{game.totalAchievements}
                </p>
                <p className="last-played">Last played: {game.lastPlayed}</p>
              </div>
              <div className="game-status">
                <select
                  value={game.status}
                  onChange={(e) => updateGameStatus(game.id, e.target.value)}
                  className="status-select"
                >
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="want-to-play">Want to Play</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;
