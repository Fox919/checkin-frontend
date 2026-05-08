import React from 'react'; 
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// 導入組件
import BookingPage from './components/BookingPage'; 
import AdminPage from './pages/AdminPage'; 
import AdminBatchManager from './components/AdminBatchManager';
import Register from './components/Register';
import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
import Checkin from './Checkin'; 

// 建議定義在這裡，方便全域修改
const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

function App() {
  // 儲存期次的邏輯
  const handleSaveBatch = async (id, sessions) => {
    if (!id) return alert("請選擇課程");
    
    try {
      const res = await fetch(`${API_BASE}/api/offerings/${id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { sessions: sessions } })
      });
      
      if (res.ok) {
        alert("✅ 密集班期次儲存成功！");
      } else {
        const errorData = await res.json();
        alert(`❌ 儲存失敗: ${errorData.message || '未知錯誤'}`);
      }
    } catch (err) {
      console.error("Save Error:", err);
      alert("❌ 無法連線至伺服器");
    }
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
          
          {/* 開班管理入口 */}
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
          <Route path="/" element={<Register key="home" autoCheckin={true} />} />
          <Route path="/register" element={<Register key="reg" autoCheckin={false} />} />
          <Route path="/on-site" element={<Register key="onsite" autoCheckin={true} />} />
          <Route path="/checkin" element={<Checkin />} />
          <Route path="/kiosk" element={<Kiosk />} />

          <Route path="/book" element={<BookingPage />} />

          <Route path="/admin" element={<AdminList />} />
          <Route path="/admin-config" element={<AdminPage />} />
          
          {/* 使用剛才優化過的組件 */}
          <Route path="/admin-batches" element={<AdminBatchManager onSave={handleSaveBatch} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;