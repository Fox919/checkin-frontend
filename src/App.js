import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
import Checkin from './Checkin'; 

function App() {
  return (
    <BrowserRouter>
      {/* 導航列：將 Link 平行放置，不要互相包住 */}
      <nav style={{ padding: '15px', borderBottom: '1px solid #ccc', textAlign: 'center' }}>
        
        {/* 新增的現場登記頁面 (自動簽到) */}
        <Link to="/on-site" style={{ marginRight: '10px' }}>
          <button>活動登記簽到 </button>
        </Link>

        {/* 原有的登記頁面 (不自動簽到) */}
        <Link to="/register" style={{ marginRight: '10px' }}>
          <button>登記</button>
        </Link>
        
        <Link to="/checkin" style={{ marginRight: '10px' }}>
          <button>掃碼簽到</button>
        </Link>
        
        <Link to="/kiosk" style={{ marginRight: '10px' }}>
          <button>快速簽到</button>
        </Link>

        <Link to="/admin">
          <button>簽到管理</button>
        </Link>
      </nav>

      {/* 頁面路由區 */}
      <Routes>
        {/* 設定預設頁面，如果不設定的話，網址輸入 / 時會是一片空白 */}
        <Route path="/" element={<Register autoCheckin={true} />} />
        
        <Route path="/register" element={<Register autoCheckin={false} />} />
        <Route path="/on-site" element={<Register autoCheckin={true} />} />
        <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/admin" element={<AdminList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;