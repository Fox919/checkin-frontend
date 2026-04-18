import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import Scanner from './components/Scanner';
import AdminList from './components/AdminList'; // 1. 引入新頁面

function App() {
  return (
    <Router>
      <nav style={{ padding: '10px', textAlign: 'center', background: '#f0f0f0' }}>
        <Link to="/" style={{ margin: '10px' }}>登記</Link>
        <Link to="/scanner" style={{ margin: '10px' }}>簽到掃描</Link>
        {/* 為了安全，管理連結可以不放在導覽列，你自己記住網址就好 */}
      </nav>

      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/scanner" element={<Scanner />} />
        
        {/* 2. 設定管理頁面的網址路徑 */}
        <Route path="/admin-list-999" element={<AdminList />} /> 
      </Routes>
    </Router>
  );
}

export default App;