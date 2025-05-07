import React, { useState, useEffect } from 'react';
import { steamApi } from '../services/steamApi';
import './InventoryStats.css';

const InventoryStats = ({ steamId }) => {
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValue, setTotalValue] = useState(0);
  const [itemsByGame, setItemsByGame] = useState({});

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true);
        const inventory = await steamApi.getUserInventory(steamId);
        
        // Группировка предметов по играм
        const groupedItems = inventory.reduce((acc, item) => {
          if (!acc[item.appId]) {
            acc[item.appId] = [];
          }
          acc[item.appId].push(item);
          return acc;
        }, {});

        // Получение цен для всех предметов
        const allPrices = await Promise.all(
          Object.entries(groupedItems).map(async ([appId, items]) => {
            const itemNames = items.map(item => item.marketHashName);
            const prices = await steamApi.getItemPrices(appId, itemNames);
            return { appId, prices };
          })
        );

        // Расчет общей стоимости и организация данных
        let total = 0;
        const itemsWithPrices = {};

        allPrices.forEach(({ appId, prices }) => {
          itemsWithPrices[appId] = groupedItems[appId].map(item => {
            const price = prices[item.marketHashName] || 0;
            total += price * item.amount;
            return {
              ...item,
              price
            };
          });
        });

        setTotalValue(total);
        setItemsByGame(itemsWithPrices);
        setInventoryData(inventory);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (steamId) {
      fetchInventoryData();
    }
  }, [steamId]);

  if (loading) return <div className="inventory-stats loading">Загрузка данных инвентаря...</div>;
  if (error) return <div className="inventory-stats error">Ошибка: {error}</div>;
  if (!inventoryData) return null;

  return (
    <div className="inventory-stats">
      <h2>Статистика инвентаря</h2>
      <div className="total-value">
        <h3>Общая стоимость инвентаря</h3>
        <p>{totalValue.toFixed(2)} USD</p>
      </div>
      
      <div className="inventory-by-game">
        {Object.entries(itemsByGame).map(([appId, items]) => {
          const gameTotal = items.reduce((sum, item) => sum + (item.price * item.amount), 0);
          return (
            <div key={appId} className="game-section">
              <h3>{items[0]?.gameName || `App ${appId}`}</h3>
              <p className="game-total">Стоимость: {gameTotal.toFixed(2)} USD</p>
              <div className="items-grid">
                {items.map(item => (
                  <div key={item.assetId} className="item-card">
                    <img src={item.iconUrl} alt={item.name} />
                    <p className="item-name">{item.name}</p>
                    <p className="item-price">{item.price.toFixed(2)} USD</p>
                    {item.amount > 1 && <p className="item-amount">x{item.amount}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryStats; 