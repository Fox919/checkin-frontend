import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import AdminList from './components/AdminList';

function App() {
  return (
    <BrowserRouter>
      {/* 這部分放在 Routes 外面，所以它會一直存在於所有頁面 */}
      <nav style={{ padding: '15px', borderBottom: '1px solid #ccc', textAlign: 'center' }}>
  <Link to="/">
    <button>前往登記</button>
  </Link>
  <Link to="/admin" style={{ marginLeft: '10px' }}>
    <button>前往管理員後台</button>
  </Link>
</nav>

      {/* 這是頁面切換區 */}
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/admin" element={<AdminList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;