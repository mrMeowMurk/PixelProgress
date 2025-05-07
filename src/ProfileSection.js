import React from 'react';
import './ProfileSection.css';

const ProfileSection = ({ playerInfo }) => {
  const getStatusText = (state) => {
    const states = {
      0: 'Оффлайн',
      1: 'Онлайн',
      2: 'Занят',
      3: 'Отошёл',
      4: 'Спит',
      5: 'Готов к обмену',
      6: 'Готов играть'
    };
    return states[state] || 'Неизвестно';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Не указано';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp * 1000);
    const diffYears = now.getFullYear() - then.getFullYear();
    const diffMonths = now.getMonth() - then.getMonth();
    const totalMonths = diffYears * 12 + diffMonths;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    
    return `${years} лет ${months} месяцев`;
  };

  if (!playerInfo) return null;

  const profileAge = getTimeSince(playerInfo.timecreated);

  return (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-container">
            <img src={playerInfo.avatarfull} alt="Avatar" className="profile-avatar" />
            <div className={`status-indicator ${playerInfo.personastate === 1 ? 'online' : 'offline'}`} />
          </div>
          <div className="profile-quick-stats">
            <div className="quick-stat">
              <span className="stat-icon">🎮</span>
              <span className="stat-value">{playerInfo.gameextrainfo || 'Не в игре'}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-icon">🌍</span>
              <span className="stat-value">{playerInfo.loccountrycode || 'Не указано'}</span>
            </div>
          </div>
        </div>
        
        <div className="profile-info">
          <div className="profile-name-container">
            <h2 className="profile-name">{playerInfo.personaname}</h2>
            <div className="profile-status" data-status={playerInfo.personastate}>
              {getStatusText(playerInfo.personastate)}
            </div>
          </div>
          
          {playerInfo.realname && (
            <div className="profile-realname">
              <span className="realname-icon">👤</span>
              {playerInfo.realname}
            </div>
          )}

          <div className="profile-badges">
            {profileAge && (
              <div className="profile-badge">
                <span className="badge-icon">📅</span>
                <span className="badge-text">Ветеран Steam</span>
                <span className="badge-subtext">{profileAge}</span>
              </div>
            )}
            {playerInfo.communityvisibilitystate === 3 && (
              <div className="profile-badge">
                <span className="badge-icon">👁️</span>
                <span className="badge-text">Открытый профиль</span>
              </div>
            )}
          </div>

          <div className="profile-links">
            <a 
              href={playerInfo.profileurl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="profile-link primary"
            >
              <span className="link-icon">🎮</span>
              Профиль Steam
            </a>
            {playerInfo.profileurl && (
              <a 
                href={`${playerInfo.profileurl}friends/`}
                target="_blank" 
                rel="noopener noreferrer"
                className="profile-link"
              >
                <span className="link-icon">👥</span>
                Друзья
              </a>
            )}
          </div>
        </div>

        <div className="profile-meta">
          <div className="meta-section">
            <h3 className="meta-title">Информация о профиле</h3>
            <div className="meta-item">
              <span className="meta-label">Профиль создан</span>
              <span className="meta-value highlight">{formatDate(playerInfo.timecreated)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Последний вход</span>
              <span className="meta-value">{formatDate(playerInfo.lastlogoff)}</span>
            </div>
            {playerInfo.personastate === 1 && playerInfo.gameextrainfo && (
              <div className="meta-item">
                <span className="meta-label">Текущая игра</span>
                <span className="meta-value game-highlight">{playerInfo.gameextrainfo}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {playerInfo.gameextrainfo && (
        <div className="current-game-banner">
          <div className="game-status">
            <span className="game-icon">🎮</span>
            <span className="game-text">Сейчас в игре:</span>
            <span className="game-name">{playerInfo.gameextrainfo}</span>
          </div>
          {playerInfo.gameid && (
            <a 
              href={`https://store.steampowered.com/app/${playerInfo.gameid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="game-store-link"
            >
              Открыть в Steam
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSection; 