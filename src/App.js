import React from 'react'; // 移除 useState，因為我們改用路由
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// 導入組件
import BookingPage from './components/BookingPage'; 
import AdminPage from './pages/AdminPage'; 
import AdminBatchManager from './components/AdminBatchManager'; // 新增的期次管理
import Register from './components/Register';
import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
import Checkin from './Checkin'; 

function App() {
  // 儲存期次的邏輯
  const handleSaveBatch = async (sessions) => {
    console.log("準備存入資料庫的數據：", sessions);
    // 這裡未來可以對接 API，例如：
    // await fetch('/api/save-sessions', { method: 'POST', body: JSON.stringify(sessions) });
    alert("期次已產生，請記得在系統設定中關聯至特定課程");
  };

  return (
    <BrowserRouter>
      {/* 導航列 */}
      <nav style={{ padding: '15px', borderBottom: '1px solid #ccc', textAlign: 'center', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
        
        <Link to="/on-site"><button>現場登記簽到</button></Link>
        <Link to="/kiosk"><button>快速簽到</button></Link>

        {/* 預約系統 (前台) */}
        <Link to="/book">
          <button style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', fontWeight: 'bold' }}>🗓️ 課程預約</button>
        </Link>
        
        {/* 管理功能 (後台) */}
        <div style={{ borderLeft: '2px solid #ddd', marginLeft: '10px', paddingLeft: '10px', display: 'flex', gap: '10px' }}>
          <Link to="/admin"><button>簽到管理</button></Link>
          
          {/* 新增：期次管理入口 */}
          <Link to="/admin-batches">
            <button style={{ backgroundColor: '#d1ecf1', color: '#0c5460', fontWeight: 'bold' }}>📅 開班管理</button>
          </Link>

          <Link to="/admin-config">
            <button style={{ backgroundColor: '#e2e3e5' }}>⚙️ 系統設定</button>
          </Link>
        </div>
      </nav>

      {/* 頁面路由區 */}
      <div style={{ padding: '20px' }}>
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
          <Route path="/admin-config" element={<AdminPage />} />
          
          {/* 新增：開班管理路由 */}
          <Route path="/admin-batches" element={<AdminBatchManager onSave={handleSaveBatch} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;