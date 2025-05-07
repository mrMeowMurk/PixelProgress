const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Проверяем наличие API ключа
const STEAM_API_KEY = process.env.STEAM_API_KEY;
if (!STEAM_API_KEY) {
  console.error('ERROR: STEAM_API_KEY not found in environment variables!');
  console.error('Please create a .env file with your Steam API key.');
  process.exit(1);
}

const STEAM_API_BASE_URL = 'https://api.steampowered.com';

app.use(cors());
app.use(express.json());

// Обработчик ошибок Steam API
const handleSteamError = (error, res) => {
  console.error('Steam API Error:', error.response?.data || error.message);
  
  if (error.response?.status === 403) {
    return res.status(403).json({
      error: 'Access Denied. This might be because: 1) The profile is private 2) Invalid Steam ID 3) Steam API key is invalid'
    });
  }
  
  if (error.response?.status === 404) {
    return res.status(404).json({
      error: 'Profile not found. Please check the Steam ID'
    });
  }

  return res.status(500).json({
    error: 'Failed to fetch data from Steam API. Please try again later.'
  });
};

// Конвертация vanity URL в Steam ID
app.get('/api/resolve/:vanityUrl', async (req, res) => {
  try {
    console.log(`Resolving vanity URL: ${req.params.vanityUrl}`);
    const response = await axios.get(
      `${STEAM_API_BASE_URL}/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${req.params.vanityUrl}`
    );
    console.log('Vanity URL resolution response:', response.data);
    
    if (response.data.response.success === 1) {
      res.json({ steamId: response.data.response.steamid });
    } else {
      res.status(404).json({ error: 'Steam ID not found. Please check the vanity URL.' });
    }
  } catch (error) {
    handleSteamError(error, res);
  }
});

// Прокси для получения информации о пользователе
app.get('/api/player/:steamId', async (req, res) => {
  try {
    console.log(`Fetching player info for Steam ID: ${req.params.steamId}`);
    const response = await axios.get(
      `${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${req.params.steamId}`
    );
    
    if (!response.data.response.players.length) {
      return res.status(404).json({ error: 'Player not found. Please check the Steam ID.' });
    }

    console.log('Player info response:', response.data);
    res.json(response.data);
  } catch (error) {
    handleSteamError(error, res);
  }
});

// Прокси для получения списка игр
app.get('/api/games/:steamId', async (req, res) => {
  try {
    console.log(`Fetching games for Steam ID: ${req.params.steamId}`);
    const response = await axios.get(
      `${STEAM_API_BASE_URL}/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${req.params.steamId}&include_appinfo=true&include_played_free_games=true`
    );

    if (!response.data.response?.game_count) {
      return res.status(403).json({ 
        error: 'No games found. This might be because the profile is private or the game list is hidden.' 
      });
    }

    console.log('Games response:', response.data);
    res.json(response.data);
  } catch (error) {
    handleSteamError(error, res);
  }
});

// Прокси для получения достижений
app.get('/api/achievements/:steamId/:appId', async (req, res) => {
  try {
    console.log(`Fetching achievements for Steam ID: ${req.params.steamId}, App ID: ${req.params.appId}`);
    const response = await axios.get(
      `${STEAM_API_BASE_URL}/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${req.params.steamId}&appid=${req.params.appId}`
    );
    console.log('Achievements response:', response.data);
    res.json(response.data);
  } catch (error) {
    // Для достижений особая обработка - некоторые игры могут не иметь достижений
    if (error.response?.status === 400) {
      return res.json({ playerstats: { achievements: [] } });
    }
    handleSteamError(error, res);
  }
});

// Прокси для получения недавно сыгранных игр
app.get('/api/recent/:steamId', async (req, res) => {
  try {
    console.log(`Fetching recent games for Steam ID: ${req.params.steamId}`);
    const response = await axios.get(
      `${STEAM_API_BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${req.params.steamId}`
    );
    console.log('Recent games response:', response.data);
    res.json(response.data);
  } catch (error) {
    handleSteamError(error, res);
  }
});

// Прокси для получения информации об игре
app.get('/api/game/:appId', async (req, res) => {
  try {
    console.log(`Fetching game details for App ID: ${req.params.appId}`);
    
    // Пробуем несколько разных методов получения данных
    const methods = [
      // Метод 1: Прямой запрос к Steam Store API
      async () => {
        const response = await axios.get(
          `https://store.steampowered.com/api/appdetails?appids=${req.params.appId}`,
          {
            headers: {
              'Accept-Language': 'en-US,en;q=0.9',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000
          }
        );
        return response.data;
      },
      
      // Метод 2: Использование Steam API для получения базовой информации
      async () => {
        const response = await axios.get(
          `${STEAM_API_BASE_URL}/ISteamApps/GetAppList/v2/`,
          { timeout: 5000 }
        );
        
        const app = response.data.applist.apps.find(
          app => app.appid.toString() === req.params.appId
        );
        
        if (!app) {
          throw new Error('App not found');
        }
        
        return {
          [req.params.appId]: {
            success: true,
            data: {
              name: app.name,
              steam_appid: app.appid,
              genres: []  // Базовая информация без жанров
            }
          }
        };
      }
    ];

    // Пробуем каждый метод по очереди
    let lastError = null;
    for (const method of methods) {
      try {
        const data = await method();
        if (data && data[req.params.appId] && data[req.params.appId].success) {
          console.log('Game details response:', data[req.params.appId].data);
          return res.json({ response: { gameDetails: data[req.params.appId].data } });
        }
      } catch (error) {
        console.log('Method failed:', error.message);
        lastError = error;
      }
    }

    // Если все методы не сработали, возвращаем базовую информацию
    return res.json({
      response: {
        gameDetails: {
          steam_appid: req.params.appId,
          name: 'Unknown Game',
          genres: []
        }
      }
    });

  } catch (error) {
    console.error('Error fetching game details:', error.message);
    handleSteamError(error, res);
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 