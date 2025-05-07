import React, { useState } from 'react';
import './App.css';
import { steamApi } from './services/steamApi';
import GameCard from './GameCard';

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

  // Извлечение Steam ID или vanity URL из разных форматов ввода
  const extractSteamIdentifier = (input) => {
    // Если это числовой Steam ID
    if (/^\d+$/.test(input)) {
      return input;
    }

    // Если это полный URL профиля
    const urlMatch = input.match(/steamcommunity\.com\/(id|profiles)\/([^\/]+)/);
    if (urlMatch) {
      // Если это прямой Steam ID в URL
      if (urlMatch[1] === 'profiles') {
        return urlMatch[2];
      }
      // Если это vanity URL
      return urlMatch[2];
    }

    // Если это просто vanity URL без полного адреса
    return input;
  };

  const handleSteamIdSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const identifier = extractSteamIdentifier(steamId);
      let finalSteamId = identifier;

      // Если это не числовой ID, пробуем получить Steam ID через vanity URL
      if (!identifier.match(/^\d+$/)) {
        try {
          finalSteamId = await steamApi.resolveVanityUrl(identifier);
        } catch (error) {
          throw new Error('Invalid Steam ID or profile URL. Please check your input and try again.');
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
            image: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
            playTime: formatPlayTime(game.playtime_forever),
            status: status
          };
        })
      );

      setGames(gamesWithDetails);
    } catch (err) {
      setError(err.message || 'Failed to fetch games. Please check your Steam ID or profile URL and try again.');
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

  // Быстрые фильтры
  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'want-to-play', label: 'Want to Play' },
  ];

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
            placeholder="Enter Steam ID, profile URL, or custom URL"
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
          <div className="filter-buttons">
            {filterButtons.map(btn => (
              <button
                key={btn.value}
                className={`filter-btn${filter === btn.value ? ' active' : ''}`}
                onClick={() => setFilter(btn.value)}
                type="button"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="games-container">
        {filteredGames.map(game => (
          <GameCard key={game.id} game={game} onStatusChange={updateGameStatus} />
        ))}
      </main>
    </div>
  );
}

export default App;
