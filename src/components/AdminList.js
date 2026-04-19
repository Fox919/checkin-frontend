import React, { useEffect, useState } from 'react';
import ExportButton from './ExportButton';

const AdminList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  // 檢查是否有登入紀錄 (從 sessionStorage 讀取)
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('adminAuth') === 'true'
  );
  const [password, setPassword] = useState('');

  // 登入邏輯
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Only321') { // 設定你的管理密碼
      sessionStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
    } else {
      alert('密碼錯誤');
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/checkins?t=${Date.now()}`);
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error("讀取失敗", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchList();
  }, [isAuthenticated]);

  // 如果尚未登入，顯示輸入密碼畫面
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>管理員登入</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            placeholder="請輸入管理密碼" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', fontSize: '16px' }}
          />
          <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px' }}>進入</button>
        </form>
      </div>
    );
  }

  // 已經登入，顯示名單 (原本的邏輯)
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📋 簽到名單管理</h2>
        <div>
          <button onClick={() => {sessionStorage.removeItem('adminAuth'); window.location.reload();}} style={{ marginRight: '10px' }}>登出</button>
          <button onClick={fetchList} style={{ marginRight: '10px' }}>🔄 重整</button>
          <ExportButton />
        </div>
      </div>

      {loading ? <p>載入中...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          {/* ...原本的表格結構... */}
          <thead>
            <tr><th>姓名</th><th>電話</th><th>時間</th></tr>
          </thead>
          <tbody>
            {list.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.phone}</td>
                <td>{new Date(item.checkin_time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminList;