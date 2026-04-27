import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const AdminList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all'); 
  const [selectedQrId, setSelectedQrId] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  // 1. 密碼檢查
  const checkPassword = () => {
    const pass = prompt("請輸入管理員密碼");
    if (pass === "123456") {
      setAuthorized(true);
    } else {
      alert("密碼錯誤！");
    }
  };

  // 2. 獲取資料
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/users?t=${Date.now()}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("讀取資料失敗", err);
      alert("無法讀取名單");
    } finally {
      setLoading(false);
    }
  };

  // 3. 更新備註
  const handleNoteChange = async (userId, newNote) => {
    try {
      await fetch('https://checkin-system-production-2a74.up.railway.app/admin/update-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, note: newNote })
      });
    } catch (err) {
      alert("更新備註失敗");
    }
  };

  // 4. CSV 匯出功能
  const exportToCSV = () => {
    const headers = ["姓名", "電話", "狀態", "備註"];
    const csvRows = filteredList.map(u => [
      `"${u.name || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.status || ''}"`,
      `"${u.notes || ''}"`
    ].join(","));
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "user_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. 過濾邏輯
  const filteredList = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (user.phone && user.phone.includes(searchTerm));
    const matchesStatus = viewMode === 'all' || user.status === viewMode;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- 渲染 ---

  if (!authorized) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>管理後台</h2>
        <button onClick={checkPassword} style={{ padding: '10px 20px', fontSize: '16px' }}>點擊進入管理後台</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>📋 用戶管理與備註</h2>
      
      <div style={{ marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setViewMode('all')} style={{ fontWeight: viewMode === 'all' ? 'bold' : 'normal', marginRight: '5px' }}>全部</button>
          <button onClick={() => setViewMode('active')} style={{ fontWeight: viewMode === 'active' ? 'bold' : 'normal', marginRight: '5px' }}>已登記</button>
          <button onClick={() => setViewMode('checked-in')} style={{ fontWeight: viewMode === 'checked-in' ? 'bold' : 'normal' }}>已簽到</button>
        </div>
        
        <input 
          type="text" 
          placeholder="🔍 搜尋姓名或電話..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '250px' }}
        />
        <button onClick={fetchUsers} style={{ marginLeft: '10px', padding: '8px' }}>🔄 重整</button>
        <button onClick={exportToCSV} style={{ marginLeft: '10px', padding: '8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>📥 匯出 CSV</button>
      </div>

      {loading ? <p>載入中...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>姓名</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>電話</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>備註</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map(user => (
              <tr key={user.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.phone}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <input 
                    defaultValue={user.notes || ''} 
                    onBlur={(e) => handleNoteChange(user.id, e.target.value)} 
                    placeholder="輸入備註..."
                    style={{ width: '90%', padding: '5px' }}
                  />
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button onClick={() => setSelectedQrId(user.id)}>顯示 QR</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedQrId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setSelectedQrId(null)}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3>{users.find(u => u.id === selectedQrId)?.name} 的 QR Code</h3>
            <QRCodeCanvas value={String(selectedQrId)} size={200} />
            <br /><br />
            <button onClick={() => setSelectedQrId(null)}>關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;