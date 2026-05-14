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
    padding: '8px 12px', // 縮小內距
    borderBottom: '1px solid #34495e',
    backgroundColor: '#2c3e50',
    display: 'flex',
    flexDirection: 'column', // 預設改為垂直排列（適合手機）
    alignItems: 'center',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    gap: '8px' // 元素間的間距
  };

  const menuContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    width: '100%', // 讓選單容器撐滿寬度
  };

  const selectStyle = {
    flex: 1, // 讓兩個選單平均分配寬度，不會一大一小
    padding: '8px 4px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem', // 稍微縮小字體以適應寬度
    maxWidth: '150px' // 限制最大寬度防止在平板上太寬
  };

  const homeButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '4px 0'
  };

  return (
    <nav style={navStyle}>
      {/* 第一行：標題 */}
      <button onClick={() => navigate('/')} style={homeButtonStyle}>
        🏠 菩提簽到系統
      </button>

      {/* 第二行：兩個下拉選單並排 */}
      <div style={menuContainerStyle}>
        <select 
          style={selectStyle} 
          onChange={(e) => navigate(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>📝 登記入口</option>
          <option value="/on-site?type=Visitor">一般訪客</option>
          <option value="/on-site?source=expo&type=Expo-Newcomer">外展新人</option>
          <option value="/on-site?source=Hall-Newcomer&type=Hall-Newcomer">禪堂新人</option>
          <option value="/kiosk">⚡ 快速簽到</option>
          <option value="/book">🗓️ 課程預約</option>
        </select>

        <select 
          style={{ ...selectStyle, backgroundColor: '#e67e22', color: 'white' }} 
          onChange={(e) => navigate(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>🔐 管理工具</option>
          <option value="/admin">👥 名單管理</option>
          <option value="/admin-batches">📅 開班管理</option>
          <option value="/admin-config">⚙️ 設定</option>
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