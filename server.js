const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

const STEAM_API_KEY = "B8F2171A1393F44FD6C3491949BE15EF";
const STEAM_API_BASE_URL = 'https://api.steampowered.com';

app.use(cors());
app.use(express.json());

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
      res.status(404).json({ error: 'Steam ID not found' });
    }
  } catch (error) {
    console.error('Error resolving vanity URL:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Прокси для получения информации о пользователе
app.get('/api/player/:steamId', async (req, res) => {
  try {
    console.log(`Fetching player info for Steam ID: ${req.params.steamId}`);
    const response = await axios.get(
      `${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${req.params.steamId}`
    );
    console.log('Player info response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching player info:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Прокси для получения списка игр
app.get('/api/games/:steamId', async (req, res) => {
  try {
    console.log(`Fetching games for Steam ID: ${req.params.steamId}`);
    const response = await axios.get(
      `${STEAM_API_BASE_URL}/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${req.params.steamId}&include_appinfo=true&include_played_free_games=true`
    );
    console.log('Games response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching games:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
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
    console.error('Error fetching achievements:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
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
    console.error('Error fetching recent games:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 