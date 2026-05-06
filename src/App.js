import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import Register from './components/Register';
import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
import Checkin from './Checkin'; 
import BookingPage from './components/BookingPage';
// trigger
// test
function App() {
  return (
    <BrowserRouter>
      {/* 導航列 */}
      <nav style={{ padding: '15px', borderBottom: '1px solid #ccc', textAlign: 'center' }}>
        
        {/* 現場登記 (Link) */}
        <Link to="/on-site" style={{ marginRight: '10px' }}>
          <button>活動登記簽到</button>
        </Link>

        {/* 登記頁面 (NavLink - 有選中狀態) */}
        <NavLink 
          to="/register" 
          style={({ isActive }) => ({ 
            marginRight: '10px', 
            fontWeight: isActive ? 'bold' : 'normal',
            color: isActive ? 'red' : 'black' 
          })}
        >
          <button>登記</button>
        </NavLink>

        {/* 其他頁面連結 (Link) */}
        <Link to="/checkin" style={{ marginRight: '10px' }}>
          <button>掃碼簽到</button>
        </Link>
        
        <Link to="/kiosk" style={{ marginRight: '10px' }}>
          <button>快速簽到</button>
        </Link>
       {/* 在導覽列中加入預約按鈕 */}
         <Link to="/book" style={{ marginRight: '10px' }}>
        <button style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba' }}>課程預約</button>
        </Link>

        <Link to="/admin">
          <button>簽到管理</button>
        </Link>
      </nav>

      {/* 頁面路由區 */}
      <Routes>
  {/* 加上 key 屬性，確保切換時狀態會徹底重置 */}
  <Route path="/" element={<Register key="home" autoCheckin={true} />} />
  <Route path="/register" element={<Register key="reg" autoCheckin={false} />} />
  <Route path="/on-site" element={<Register key="onsite" autoCheckin={true} />} />
  <Route path="/book" element={<BookingPage />} />
  <Route path="/kiosk" element={<Kiosk />} />
  <Route path="/checkin" element={<Checkin />} />
  <Route path="/admin" element={<AdminList />} />
</Routes>
    </BrowserRouter>
  );
}

export default App;