const API_BASE_URL = 'http://localhost:3002/api';

export const steamApi = {
  // Конвертация vanity URL в Steam ID
  async resolveVanityUrl(vanityUrl) {
    try {
      console.log(`Resolving vanity URL: ${vanityUrl}`);
      const response = await fetch(`${API_BASE_URL}/resolve/${vanityUrl}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve vanity URL');
      }

      const data = await response.json();
      console.log('Vanity URL resolution data received:', data);
      return data.steamId;
    } catch (error) {
      console.error('Error resolving vanity URL:', error);
      throw error;
    }
  },

  // Получение списка игр пользователя
  async getOwnedGames(steamId) {
    try {
      console.log(`Fetching games for Steam ID: ${steamId}`);
      const response = await fetch(`${API_BASE_URL}/games/${steamId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch games');
      }

      const data = await response.json();
      console.log('Games data received:', data);
      return data.response.games || [];
    } catch (error) {
      console.error('Error fetching owned games:', error);
      throw error;
    }
  },

  // Получение достижений для конкретной игры
  async getGameAchievements(steamId, appId) {
    try {
      console.log(`Fetching achievements for Steam ID: ${steamId}, App ID: ${appId}`);
      const response = await fetch(`${API_BASE_URL}/achievements/${steamId}/${appId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch achievements');
      }

      const data = await response.json();
      console.log('Achievements data received:', data);
      return data.playerstats?.achievements || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  },

  // Получение информации о последней игре
  async getRecentlyPlayedGames(steamId) {
    try {
      console.log(`Fetching recent games for Steam ID: ${steamId}`);
      const response = await fetch(`${API_BASE_URL}/recent/${steamId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recently played games');
      }

      const data = await response.json();
      console.log('Recent games data received:', data);
      return data.response?.recentlyPlayedGames || [];
    } catch (error) {
      console.error('Error fetching recently played games:', error);
      return [];
    }
  },

  // Получение информации о пользователе
  async getPlayerInfo(steamId) {
    try {
      console.log(`Fetching player info for Steam ID: ${steamId}`);
      const response = await fetch(`${API_BASE_URL}/player/${steamId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch player info');
      }

      const data = await response.json();
      console.log('Player info data received:', data);
      return data.response?.players[0] || null;
    } catch (error) {
      console.error('Error fetching player info:', error);
      throw error;
    }
  }
}; 