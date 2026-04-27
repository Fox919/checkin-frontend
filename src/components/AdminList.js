import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const AdminList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all'); 
  const [selectedDate, setSelectedDate] = useState(''); // 新增：日期篩選
  const [selectedQrId, setSelectedQrId] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  const checkPassword = () => {
    const pass = prompt("請輸入管理員密碼");
    if (pass === "123456") {
      setAuthorized(true);
    } else {
      alert("密碼錯誤！");
    }
  };

  const handleExportClick = () => {
    const pass = prompt("請輸入密碼以驗證身份並匯出資料：");
    if (pass === "123456") {
      exportToCSV();
    } else {
      alert("密碼錯誤，拒絕匯出！");
    }
  };

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

 // 5. 過濾邏輯 (根據狀態動態選擇對應的日期欄位)
  const filteredList = users.filter(user => {
    // 搜尋功能
    const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (user.phone && user.phone.includes(searchTerm));
    
    // 狀態篩選
    const matchesStatus = viewMode === 'all' || user.status === viewMode;
    
    // 日期篩選 (動態判斷)
    // 如果選「已簽到」，比對 checkin_date；否則比對 created_at
    const targetDate = viewMode === 'checked-in' ? user.checkin_date : user.created_at;
    const matchesDate = !selectedDate || (targetDate && targetDate.startsWith(selectedDate));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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
        {/* 狀態切換 */}
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setViewMode('all')} style={{ fontWeight: viewMode === 'all' ? 'bold' : 'normal', marginRight: '5px' }}>全部</button>
          <button onClick={() => setViewMode('active')} style={{ fontWeight: viewMode === 'active' ? 'bold' : 'normal', marginRight: '5px' }}>已登記</button>
          <button onClick={() => setViewMode('checked-in')} style={{ fontWeight: viewMode === 'checked-in' ? 'bold' : 'normal' }}>已簽到</button>
        </div>
        
        {/* 搜尋與日期篩選 */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="🔍 搜尋姓名或電話..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px', width: '200px' }}
          />
          
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px' }}
          />
          <button onClick={() => setSelectedDate('')} style={{ padding: '8px' }}>重置日期</button>

          <button onClick={fetchUsers} style={{ padding: '8px' }}>🔄 重整</button>
          <button onClick={handleExportClick} style={{ padding: '8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>📥 匯出 CSV</button>
        </div>
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