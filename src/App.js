import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import Register from './components/Register';
import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
import Checkin from './Checkin'; 
// trigger
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

        <Link to="/admin">
          <button>簽到管理</button>
        </Link>
      </nav>

      {/* 頁面路由區 */}
      <Routes>
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