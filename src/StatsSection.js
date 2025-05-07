import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './StatsSection.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatsSection = ({ games, accountStats }) => {
  // Подготовка данных для графиков
  const prepareGenreData = () => {
    if (!games || games.length === 0) return [];
    
    const genreMap = new Map();
    games.forEach(game => {
      if (game.genres && Array.isArray(game.genres)) {
        game.genres.forEach(genre => {
          if (genre) {
            genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
          }
        });
      }
    });

    const genreData = Array.from(genreMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return genreData.length > 0 ? genreData : [{ name: 'Нет данных', value: 1 }];
  };

  const preparePlaytimeByMonth = () => {
    if (!games || games.length === 0) return [];
    
    const monthMap = new Map();
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);

    // Создаем записи для последних 6 месяцев
    for (let d = new Date(sixMonthsAgo); d <= now; d.setMonth(d.getMonth() + 1)) {
      const monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthMap.set(monthKey, 0);
    }

    // Добавляем данные по играм
    games.forEach(game => {
      if (game.rtime_last_played) {
        const date = new Date(game.rtime_last_played * 1000);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (monthMap.has(monthKey)) {
          monthMap.set(monthKey, monthMap.get(monthKey) + (game.playtime_forever || 0));
        }
      }
    });

    const monthlyData = Array.from(monthMap.entries())
      .map(([name, value]) => {
        const [year, month] = name.split('-');
        const monthName = new Date(year, month - 1).toLocaleString('ru-RU', { month: 'short' });
        return {
          name: `${monthName} ${year}`,
          hours: Math.round(value / 60)
        };
      })
      .sort((a, b) => {
        const [yearA, monthA] = a.name.split(' ');
        const [yearB, monthB] = b.name.split(' ');
        return new Date(yearB, monthB) - new Date(yearA, monthA);
      });

    return monthlyData;
  };

  const genreData = prepareGenreData();
  const monthlyPlaytime = preparePlaytimeByMonth();

  return (
    <div className="stats-section">
      <h2>Detailed Statistics</h2>
      
      <div className="stats-grid">
        <div className="stats-card">
          <h3>Top Genres</h3>
          <div className="chart-container">
            {genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genreData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">Нет данных о жанрах</div>
            )}
          </div>
          <div className="genre-legend">
            {genreData.map((genre, index) => (
              <div key={genre.name} className="genre-item">
                <span className="genre-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="genre-name">{genre.name}</span>
                <span className="genre-value">{genre.value} games</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-card">
          <h3>Monthly Playtime</h3>
          <div className="chart-container">
            {monthlyPlaytime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPlaytime}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#66c0f4" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">Нет данных об игровом времени</div>
            )}
          </div>
        </div>

        <div className="stats-card">
          <h3>Achievement Progress</h3>
          <div className="achievement-stats">
            <div className="achievement-row">
              <span>Total Achievements:</span>
              <span>{accountStats.totalAchievements} / {accountStats.totalAchievementsAvailable}</span>
            </div>
            <div className="achievement-progress">
              <div 
                className="achievement-bar" 
                style={{ width: `${accountStats.achievementRate}%` }}
              ></div>
              <span>{accountStats.achievementRate}%</span>
            </div>
            <div className="achievement-row">
              <span>Perfect Games:</span>
              <span>{games.filter(game => game.progress === 100).length}</span>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <h3>Playtime Distribution</h3>
          <div className="playtime-stats">
            <div className="playtime-row">
              <span>Less than 1 hour:</span>
              <span>{games.filter(g => g.playtime_forever > 0 && g.playtime_forever < 60).length} games</span>
            </div>
            <div className="playtime-row">
              <span>1-10 hours:</span>
              <span>{games.filter(g => g.playtime_forever >= 60 && g.playtime_forever < 600).length} games</span>
            </div>
            <div className="playtime-row">
              <span>10-50 hours:</span>
              <span>{games.filter(g => g.playtime_forever >= 600 && g.playtime_forever < 3000).length} games</span>
            </div>
            <div className="playtime-row">
              <span>50+ hours:</span>
              <span>{games.filter(g => g.playtime_forever >= 3000).length} games</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSection; 