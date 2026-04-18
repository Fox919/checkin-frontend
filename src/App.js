import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// 確保這裡的路徑與你的資料夾結構一致
import Register from './components/Register';
import Scanner from './components/Scanner';
import AdminList from './components/AdminList'; 

function App() {
  return (
    <Router>
      {/* 導覽列 */}
      <nav style={{ 
        padding: '15px', 
        textAlign: 'center', 
        background: '#333', 
        marginBottom: '20px' 
      }}>
        <Link to="/" style={{ margin: '10px', color: 'white', textDecoration: 'none' }}>📝 登記</Link>
        <Link to="/scanner" style={{ margin: '10px', color: 'white', textDecoration: 'none' }}>🔍 簽到掃描</Link>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/scanner" element={<Scanner />} />
          
          {/* 管理頁面路由 */}
          <Route path="/admin-list-999" element={<AdminList />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;