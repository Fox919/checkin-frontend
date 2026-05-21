import React from 'react'; 
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// 導入核心考勤與開班組件
import AttendanceAdmin from './AttendanceAdmin';
import CourseOfferings from './components/AdminBatchManager'; // 別名引用，用於設定路由

// 導入其他既有組件
import BookingPage from './components/BookingPage'; 
import AdminPage from './pages/AdminPage'; 
import Register from './components/Register';
import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
import Checkin from './Checkin'; 

const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

// 獨立出來的導航欄組件
const Navbar = () => {
  const navigate = useNavigate();

  const navStyle = {
    padding: '8px 12px', 
    borderBottom: '1px solid #34495e',
    backgroundColor: '#2c3e50',
    display: 'flex',
    flexDirection: 'column', 
    alignItems: 'center',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    gap: '8px' 
  };

  const menuContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    width: '100%', 
  };

  const selectStyle = {
    flex: 1, 
    padding: '8px 4px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem', 
    maxWidth: '160px' // 稍微加寬以適應長選單文字
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
          value="" // 強制每次選完重置，否則無法重複點選同一個路由
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
          value="" // 強制每次選完重置
        >
          <option value="" disabled>🔐 管理工具</option>
          <option value="/admin">👥 名單管理</option>
          {/* ✨ 修正點 1：在選單中新增「學員考勤看板」 */}
          <option value="/admin/attendance">📊 學員考勤看板</option>
          {/* ✨ 修正點 2：在選單中新增「課程期次設定」 */}
          <option value="/admin/course-offerings">📅 課程期次設定</option>
          <option value="/admin-config">⚙️ 系統常規設定</option>
        </select>
      </div>
    </nav>
  );
};

function App() {
  // 發布課程配置的處理函式 (完美對接通用 Slot 智慧考勤規格)
  const handleSaveBatch = async (id, configPayload) => {
    if (!id) return alert("請選擇課程");
    try {
      const res = await fetch(`${API_BASE}/api/offerings/${id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configPayload }) // 傳送包含彈性 slot 時間與總次數的 payload
      });
      if (res.ok) alert("✅ 密集班期次儲存與考勤規則發布成功！");
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
          
          {/* 所有登記簽到統一由 Register 組件處理 */}
          <Route path="/on-site" element={<Register key="onsite" autoCheckin={true} />} />
          <Route path="/register" element={<Register key="reg" autoCheckin={false} />} />
          
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/book" element={<BookingPage />} />

          {/* 管理後台 */}
          <Route path="/admin" element={<AdminList />} />
          
          {/* 📊 學員考勤看板 (Day 1 - Day 8 簽到大矩陣) */}
          <Route path="/admin/attendance" element={<AttendanceAdmin />} />
          
          {/* 📅 課程期次與考勤時段設定 */}
          <Route path="/admin/course-offerings" element={<CourseOfferings onSave={handleSaveBatch} />} />
          
          <Route path="/admin-config" element={<AdminPage />} />
          
          {/* 其他 */}
          <Route path="/checkin" element={<Checkin />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;