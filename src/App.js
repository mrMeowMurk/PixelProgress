import React, { useState, useEffect } from 'react';
import './App.css';
import { steamApi } from './services/steamApi';
import GameCard from './GameCard';
import StatsSection from './StatsSection';
import ProfileSection from './ProfileSection';

function App() {
  const [steamId, setSteamId] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, completed, in-progress, want-to-play
  const [searchQuery, setSearchQuery] = useState('');
  const [playerInfo, setPlayerInfo] = useState(null);
  const [displayMode, setDisplayMode] = useState(localStorage.getItem('displayMode') || 'grid');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [accountStats, setAccountStats] = useState({
    totalGames: 0,
    totalPlaytime: 0,
    completedGames: 0,
    averageCompletion: 0,
    totalAchievements: 0
  });

  // Применяем тему
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Сохраняем режим отображения
  useEffect(() => {
    localStorage.setItem('displayMode', displayMode);
  }, [displayMode]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'grid' ? 'list' : 'grid');
  };

  const formatPlayTime = (minutes) => {
    if (!minutes) return '0 hours';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes} minutes`;
    } else if (remainingMinutes === 0) {
      return `${hours.toLocaleString()} hours`;
    } else {
      return `${hours.toLocaleString()} hours ${remainingMinutes} minutes`;
    }
  };

  const formatLastPlayed = (timestamp) => {
    if (!timestamp) return 'Never played';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Извлечение Steam ID или vanity URL из разных форматов ввода
  const extractSteamIdentifier = (input) => {
    if (/^\d+$/.test(input)) return input;
    const urlMatch = input.match(/steamcommunity\.com\/(id|profiles)\/([^\/]+)/);
    if (urlMatch) return urlMatch[1] === 'profiles' ? urlMatch[2] : urlMatch[2];
    return input;
  };

  const calculateAccountStats = (gamesData) => {
    const stats = {
      totalGames: gamesData.length,
      totalPlaytime: gamesData.reduce((acc, game) => acc + (game.playtime_forever || 0), 0),
      completedGames: gamesData.filter(game => game.status === 'completed').length,
      totalAchievements: gamesData.reduce((acc, game) => acc + (game.achievements || 0), 0),
      mostPlayedGame: null,
      recentlyPlayed: [],
      gamesNotPlayed: 0,
      achievementRate: 0,
      totalAchievementsAvailable: 0,
      averagePlaytime: 0
    };
    
    // Находим самую играбельную игру
    const mostPlayed = gamesData.reduce((prev, current) => 
      (prev.playtime_forever || 0) > (current.playtime_forever || 0) ? prev : current
    , { playtime_forever: 0 });
    
    if (mostPlayed.title) {
      stats.mostPlayedGame = {
        name: mostPlayed.title,
        playtime: formatPlayTime(mostPlayed.playtime_forever)
      };
    }

    // Подсчитываем игры без времени игры
    stats.gamesNotPlayed = gamesData.filter(game => !game.playtime_forever).length;

    // Средний процент завершения
    stats.averageCompletion = Math.round(
      gamesData.reduce((acc, game) => acc + game.progress, 0) / gamesData.length
    );

    // Процент выполнения достижений
    stats.totalAchievementsAvailable = gamesData.reduce((acc, game) => 
      acc + (game.totalAchievements || 0), 0
    );
    
    if (stats.totalAchievementsAvailable > 0) {
      stats.achievementRate = Math.round(
        (stats.totalAchievements / stats.totalAchievementsAvailable) * 100
      );
    }

    // Среднее время в играх (исключая неиграные игры)
    const gamesWithPlaytime = gamesData.filter(game => game.playtime_forever > 0);
    if (gamesWithPlaytime.length > 0) {
      stats.averagePlaytime = Math.round(
        gamesWithPlaytime.reduce((acc, game) => acc + game.playtime_forever, 0) / gamesWithPlaytime.length
      );
    }

    // Недавно сыгранные игры (последние 2 недели)
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    stats.recentlyPlayed = gamesData
      .filter(game => game.rtime_last_played && (game.rtime_last_played * 1000) > twoWeeksAgo)
      .sort((a, b) => b.rtime_last_played - a.rtime_last_played)
      .slice(0, 5)
      .map(game => ({
        name: game.title,
        lastPlayed: formatLastPlayed(game.rtime_last_played)
      }));

    setAccountStats(stats);
  };

  const handleSteamIdSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const identifier = extractSteamIdentifier(steamId);
      let finalSteamId = identifier;

      if (!identifier.match(/^\d+$/)) {
        try {
          finalSteamId = await steamApi.resolveVanityUrl(identifier);
        } catch (error) {
          throw new Error('Invalid Steam ID or profile URL. Please check your input and try again.');
        }
      }

      const player = await steamApi.getPlayerInfo(finalSteamId);
      setPlayerInfo(player);

      const ownedGames = await steamApi.getOwnedGames(finalSteamId);
      const recentGames = await steamApi.getRecentlyPlayedGames(finalSteamId);
      const recentGameIds = new Set(recentGames.map(game => game.appid));

      // Получаем дополнительную информацию о каждой игре
      const gamesWithDetails = await Promise.all(
        ownedGames.map(async (game) => {
          let achievements;
          try {
            achievements = await steamApi.getGameAchievements(finalSteamId, game.appid);
          } catch (error) {
            achievements = { achievements: [] };
          }

          let gameDetails;
          try {
            gameDetails = await steamApi.getGameDetails(game.appid);
          } catch (error) {
            console.log(`Could not fetch details for game ${game.name}:`, error.message);
            gameDetails = null;
          }
          
          const completedAchievements = achievements.filter(a => a.achieved).length;
          const progress = achievements.length > 0 ? 
            Math.round((completedAchievements / achievements.length) * 100) : 0;
          const status = progress === 100 ? 'completed' : 'in-progress';
          
          return {
            id: game.appid,
            title: game.name,
            progress: progress,
            achievements: completedAchievements,
            totalAchievements: achievements.length,
            lastPlayed: game.rtime_last_played ? formatLastPlayed(game.rtime_last_played) : 'Never played',
            image: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
            playTime: formatPlayTime(game.playtime_forever || 0),
            playtime_forever: game.playtime_forever || 0,
            status: status,
            genres: gameDetails?.genres?.map(genre => genre.description) || [],
            release_date: gameDetails?.release_date || null,
            metacritic: gameDetails?.metacritic || null,
            rtime_last_played: game.rtime_last_played
          };
        })
      );

      setGames(gamesWithDetails);
      calculateAccountStats(gamesWithDetails);
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
        <div className="header-controls">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={toggleDisplayMode} className="display-toggle">
            {displayMode === 'grid' ? '📝' : '📱'}
          </button>
        </div>
        <h1>Steam Game Progress Tracker</h1>
        
        <form onSubmit={handleSteamIdSubmit} className="steam-id-form">
          <input
            type="text"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            placeholder="Enter Steam ID, profile URL, or custom URL"
            className="steam-id-input"
          />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Loading...' : 'Load Profile'}
          </button>
        </form>
      </header>

      {error && <div className="error-message">{error}</div>}

      {playerInfo && (
        <ProfileSection playerInfo={playerInfo} />
      )}

      {games.length > 0 && (
        <>
          <StatsSection games={games} accountStats={accountStats} />
          
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

          <main className={`games-container ${displayMode}`}>
            {filteredGames.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                onStatusChange={updateGameStatus}
                displayMode={displayMode}
              />
            ))}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
