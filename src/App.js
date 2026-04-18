import React from 'react'; // 建議加上這行
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import Scanner from './components/Scanner';
import AdminList from './components/AdminList'; 

function App() {
  return (
    <Router>
      {/* 導覽列：只有登記跟掃描是公開的 */}
      <nav style={{ 
        padding: '15px', 
        textAlign: 'center', 
        background: '#333', 
        color: 'white',
        marginBottom: '20px' 
      }}>
        <Link to="/" style={{ margin: '10px', color: 'white', textDecoration: 'none' }}>📝 登記</Link>
        <Link to="/scanner" style={{ margin: '10px', color: 'white', textDecoration: 'none' }}>🔍 簽到掃描</Link>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/scanner" element={<Scanner />} />
          
          {/* 管理頁面：路徑設為隱藏，導覽列不放連結 */}
          <Route path="/admin-list-999" element={<AdminList />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;