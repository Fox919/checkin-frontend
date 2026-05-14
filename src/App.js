import React from 'react'; 
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// 導入組件
import BookingPage from './components/BookingPage'; 
import AdminPage from './pages/AdminPage'; 
import AdminBatchManager from './components/AdminBatchManager';
import Register from './components/Register';
import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
import Checkin from './Checkin'; 

const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

// 獨立出來的導航欄組件，方便使用 useNavigate
const Navbar = () => {
  const navigate = useNavigate();

  const navStyle = {
    padding: '10px 20px',
    borderBottom: '2px solid #eee',
    backgroundColor: '#2c3e50', // 改用深色調，看起來更專業
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  };

  const selectStyle = {
    padding: '8px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem'
  };

  const homeButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  };

  return (
    <nav style={navStyle}>
      {/* 區塊三：快速切換 (回首頁) */}
      <button onClick={() => navigate('/')} style={homeButtonStyle}>
        🏠 菩提簽到系統
      </button>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        
        {/* 區塊一：登記入口 (下拉選單) */}
        <select 
          style={selectStyle} 
          onChange={(e) => navigate(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>📝 登記/簽到</option>
          <option value="/on-site?type=Visitor">一般訪客登記</option>
          <option value="/on-site?source=expo&type=Expo-Newcomer">外展新人登記</option>
          <option value="/on-site?source=Hall-Newcomer&type=Hall-Newcomer">✨ 禪堂新人登記</option>
          <option value="/kiosk">⚡ 快速簽到 (手機末四碼)</option>
          <option value="/book">🗓️ 課程預約</option>
        </select>

        {/* 區塊二：管理工具 (下拉選單 + 密碼鎖邏輯已在組件內) */}
        <select 
          style={{ ...selectStyle, backgroundColor: '#e67e22', color: 'white' }} 
          onChange={(e) => navigate(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>🔐 管理工具</option>
          <option value="/admin">👥 簽到/名單管理</option>
          <option value="/admin-batches">📅 開班管理</option>
          <option value="/admin-config">⚙️ 系統設定</option>
          {/* 未來可增加數據統計頁面 */}
          <option value="/stats" disabled>📊 數據統計 (開發中)</option>
        </select>
      </div>
    </nav>
  );
};

function App() {
  const handleSaveBatch = async (id, sessions) => {
    if (!id) return alert("請選擇課程");
    try {
      const res = await fetch(`${API_BASE}/api/offerings/${id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { sessions: sessions } })
      });
      if (res.ok) alert("✅ 密集班期次儲存成功！");
      else alert("❌ 儲存失敗");
    } catch (err) {
      alert("❌ 無法連線至伺服器");
    }
  };

  return (
    <BrowserRouter>
      <Navbar />

      <div style={{ padding: '20px' }}>
        <Routes>
          {/* 首頁預設顯示一般訪客簽到 */}
          <Route path="/" element={<Register key="home" autoCheckin={true} />} />
          
          {/* 所有登記簽到統一由 Register 組件處理，內部會判斷 URL 參數 */}
          <Route path="/on-site" element={<Register key="onsite" autoCheckin={true} />} />
          <Route path="/register" element={<Register key="reg" autoCheckin={false} />} />
          
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/book" element={<BookingPage />} />

          {/* 管理後台 */}
          <Route path="/admin" element={<AdminList />} />
          <Route path="/admin-batches" element={<AdminBatchManager onSave={handleSaveBatch} />} />
          <Route path="/admin-config" element={<AdminPage />} />
          
          {/* 其他 */}
          <Route path="/checkin" element={<Checkin />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;