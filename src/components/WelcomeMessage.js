import React, { useState, useEffect } from 'react';
import './WelcomeMessage.css';

const WelcomeMessage = () => {
  const [timePhrase, setTimePhrase] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 12) return 'Доброе утро';
      if (hour >= 12 && hour < 17) return 'Добрый день';
      if (hour >= 17 && hour < 23) return 'Добрый вечер';
      return 'Доброй ночи';
    };

    const getTimePhrase = () => {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) {
        return {
          emoji: '🌙',
          title: 'Ночной геймер',
          subtitle: 'Самое время для хорроров'
        };
      }
      if (hour >= 5 && hour < 9) {
        return {
          emoji: '🌅',
          title: 'Ранняя пташка',
          subtitle: 'Успей больше всех'
        };
      }
      if (hour >= 9 && hour < 12) {
        return {
          emoji: '☀️',
          title: 'Утренний игрок',
          subtitle: 'Бодрого настроения'
        };
      }
      if (hour >= 12 && hour < 15) {
        return {
          emoji: '🎮',
          title: 'Дневной геймер',
          subtitle: 'Время для новых побед'
        };
      }
      if (hour >= 15 && hour < 18) {
        return {
          emoji: '🏆',
          title: 'Вечерний охотник',
          subtitle: 'Охота за достижениями'
        };
      }
      if (hour >= 18 && hour < 21) {
        return {
          emoji: '🌆',
          title: 'Ночной страж',
          subtitle: 'Время эпических битв'
        };
      }
      return {
        emoji: '🌃',
        title: 'Полуночник',
        subtitle: 'Ночные приключения ждут'
      };
    };

    setGreeting(getGreeting());
    setTimePhrase(getTimePhrase());

    const interval = setInterval(() => {
      setGreeting(getGreeting());
      setTimePhrase(getTimePhrase());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="welcome-banner">
      <div className="welcome-text">
        <span className="welcome-greeting">{greeting}</span>
        <span className="welcome-emoji">{timePhrase.emoji}</span>
        <span className="welcome-title">{timePhrase.title}</span>
        <span className="welcome-subtitle">{timePhrase.subtitle}</span>
      </div>
    </div>
  );
};

export default WelcomeMessage; 