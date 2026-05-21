import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#2c3e50',
    color: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  };

  const selectStyle = {
    padding: '6px 10px',
    borderRadius: '5px',
    border: 'none',
    fontSize: '0.9rem',
    cursor: 'pointer'
  };

  // 處理選單切換並自動歸零選單狀態
  const handleNavigation = (e) => {
    if (e.target.value) {
      navigate(e.target.value);
      e.target.value = ""; // 導頁後將選單歸位，方便下次重複點選
    }
  };

  return (
    <nav style={navStyle}>
      {/* 快速切換：回首頁 */}
      <div 
        onClick={() => navigate('/')} 
        style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
      >
        🏠 菩提首頁
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>
        {/* 區塊一：登記入口 */}
        <select 
          onChange={handleNavigation} 
          style={selectStyle}
          value=""
        >
          <option value="" disabled>📝 登記入口</option>
          <option value="/register?type=Visitor">一般訪客登記</option>
          <option value="/register?source=expo&type=Expo-Newcomer">外展新人登記</option>
          <option value="/register?source=Hall-Newcomer&type=Hall-Newcomer">禪堂新人登記</option>
        </select>

        {/* 區塊二：管理工具 */}
        <select 
          onChange={handleNavigation} 
          style={{ ...selectStyle, backgroundColor: '#e67e22', color: 'white' }}
          value=""
        >
          <option value="" disabled>🔐 管理工具</option>
          <option value="/admin">👥 名單管理</option>
          <option value="/batch-manager">📖 開班管理</option>
          <option value="/stats">📊 數據統計</option>
          
          {/* 🆕 新增：行動點名掃描入口 */}
          <option value="/admin/checkin" style={{ backgroundColor: '#2c3e50', color: 'white', fontWeight: 'bold' }}>
            📷 密集班行動點名
          </option>
        </select>
      </div>
    </nav>
  );
};

export default Navbar;