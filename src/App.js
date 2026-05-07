import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';

// 導入組件
import BookingPage from './components/BookingPage'; 
import AdminPage from './pages/AdminPage'; // 確保檔案在此路徑
import Register from './components/Register';
import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
import Checkin from './Checkin'; 

function App() {
  return (
    <BrowserRouter>
      {/* 導航列 */}
      <nav style={{ padding: '15px', borderBottom: '1px solid #ccc', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
        
        {/* 現場登記 */}
        <Link to="/on-site" style={{ marginRight: '10px' }}>
          <button>現場登記簽到</button>
        </Link>

        {/* 預約按鈕 (加強視覺) */}
        <Link to="/book" style={{ marginRight: '10px' }}>
          <button style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', fontWeight: 'bold' }}>🗓️ 課程預約</button>
        </Link>
        
        <Link to="/kiosk" style={{ marginRight: '10px' }}>
          <button>快速簽到</button>
        </Link>

        {/* 管理後台 (這裡連向 AdminList，也就是簽到清單) */}
        <Link to="/admin" style={{ marginRight: '10px' }}>
          <button>簽到管理</button>
        </Link>

        {/* 系統設定 (連向你剛寫的 AdminPage 配置頁) */}
        <Link to="/admin-config">
          <button style={{ backgroundColor: '#e2e3e5' }}>⚙️ 系統設定</button>
        </Link>
      </nav>

      {/* 頁面路由區 */}
      <Routes>
        {/* 1. 登記與簽到相關 */}
        <Route path="/" element={<Register key="home" autoCheckin={true} />} />
        <Route path="/register" element={<Register key="reg" autoCheckin={false} />} />
        <Route path="/on-site" element={<Register key="onsite" autoCheckin={true} />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/kiosk" element={<Kiosk />} />

        {/* 2. 預約系統 */}
        <Route path="/book" element={<BookingPage />} />

        {/* 3. 管理端 */}
        <Route path="/admin" element={<AdminList />} />
        <Route path="/admin-config" element={<AdminPage />} /> {/* 這是你剛才寫的配置頁 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;