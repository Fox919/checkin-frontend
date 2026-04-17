import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './Register'; // 引入你剛寫好的登記組件
import Checkin from './Checkin';   // 假設你原本的簽到代碼叫 Checkin.js

function App() {
  return (
    <Router>
      <div className="App">
        {/* 簡單的導航選單，方便測試 */}
        <nav style={{ padding: '10px', background: '#eee', marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '15px' }}>管理員簽到</Link>
          <Link to="/register">來賓/義工登記</Link>
        </nav>

        {/* 頁面路徑配置 */}
        <Routes>
          {/* 首頁：原本的掃碼簽到功能 */}
          <Route path="/" element={<Checkin />} />
          
          {/* 登記頁：新增加的首次登記功能 */}
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;