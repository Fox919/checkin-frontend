import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
// 1. 匯入 Checkin 元件 (請確認檔案路徑是否正確，假設在 components 資料夾內)
import Checkin from './Checkin'; 

function App() {
  return (
    <BrowserRouter>
      {/* 導航列 */}
      <nav style={{ padding: '15px', borderBottom: '1px solid #ccc', textAlign: 'center' }}>
        <Link to="/" style={{ marginRight: '10px' }}>
          <button>前往登記</button>
        </Link>
        
        {/* 2. 新增掃碼簽到連結 */}
        <Link to="/checkin" style={{ marginRight: '10px' }}>
          <button>掃碼簽到</button>
        </Link>
        
<Link to="/Kiosk" style={{ marginRight: '10px' }}>
          <button>快速簽到</button>
        </Link>



        <Link to="/admin">
          <button>前往管理員後台</button>
        </Link>
      </nav>

      {/* 頁面路由區 */}
      <Routes>
        <Route path="/" element={<Register />} />
        {/* 3. 新增掃碼簽到路由 */}
       <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/admin" element={<AdminList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;