import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './components/Register'; // 假設你的 Register 在這裡
import AdminList from './components/AdminList'; // 匯入你的管理頁面

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 使用者登記頁面 */}
        <Route path="/" element={<Register />} />
        
        {/* 管理員簽到頁面，網址是 /admin */}
        <Route path="/admin" element={<AdminList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;