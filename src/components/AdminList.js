import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const AdminList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all'); 
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedQrId, setSelectedQrId] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); 
  const [tempPassword, setTempPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 確保後端 API 已更新 SELECT 語句以包含新欄位
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/users?t=${Date.now()}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("讀取資料失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) fetchUsers();
  }, [authorized]);

  const handleOpenModal = (type) => {
    setActionType(type);
    setIsModalOpen(true);
  };

  const handlePasswordSubmit = () => {
    if (tempPassword === "123456") {
      if (actionType === 'login') setAuthorized(true);
      if (actionType === 'export') exportToCSV();
      setIsModalOpen(false);
      setTempPassword('');
    } else {
      alert("密碼錯誤！");
    }
  };

  // 更新備註
  const handleNoteChange = async (userId, newNote) => {
    try {
      await fetch('https://checkin-system-production-2a74.up.railway.app/admin/update-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, note: newNote })
      });
    } catch (err) {
      console.error("更新備註失敗");
    }
  };

  // 更新接待人員 (方案 A)
  const handleReceptionistChange = async (userId, name) => {
    try {
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/api/users/${userId}/receptionist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receptionistName: name })
      });
      if (res.ok) {
        // 局部更新狀態，不需重新 fetch 全表
        setUsers(users.map(u => u.id === userId ? { ...u, receptionist_name: name } : u));
      }
    } catch (err) {
      alert("更新接待人員失敗");
    }
  };

  const exportToCSV = () => {
    const headers = ["姓名", "電話", "身分", "性別", "城市", "管道", "介紹人", "YouTube", "接待人員", "狀態", "備註"];
    const csvRows = filteredList.map(u => [
      `"${u.name || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.user_type || ''}"`,
      `"${u.gender || ''}"`,
      `"${u.city || ''}"`,
      `"${u.discovery_source || ''}"`,
      `"${u.referrer_name || ''}"`,
      `"${u.youtube_subscribed ? '已訂閱' : '未訂閱'}"`,
      `"${u.receptionist_name || ''}"`,
      `"${u.status || ''}"`,
      `"${u.notes || ''}"`
    ].join(","));
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bodhi_Users_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
  };

  const filteredList = users.filter(user => {
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchStr) || 
      user.phone?.includes(searchTerm) ||
      user.city?.toLowerCase().includes(searchStr);

    const matchesStatus = viewMode === 'all' || user.status === viewMode;
    const rawDate = viewMode === 'checked-in' ? user.checkin_date : user.created_at;
    const targetDate = rawDate ? String(rawDate) : ''; 
    const matchesDate = !selectedDate || targetDate.startsWith(selectedDate);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // 樣式輔助
  const badgeStyle = (type) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    backgroundColor: type === 'volunteer' ? '#e3f2fd' : type === 'student' ? '#f1f8e9' : '#f5f5f5',
    color: type === 'volunteer' ? '#1976d2' : type === 'student' ? '#388e3c' : '#616161'
  });

  const tableHeaderStyle = { padding: '12px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', textAlign: 'left', fontSize: '0.9rem' };
  const tableCellStyle = { padding: '10px', border: '1px solid #ddd', fontSize: '0.85rem' };

  const modalElement = isModalOpen && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <h3>請輸入管理員密碼</h3>
        <input type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} autoFocus style={{ padding: '10px', marginBottom: '15px', width: '200px', borderRadius: '4px', border: '1px solid #ddd' }} />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => setIsModalOpen(false)} style={{ padding: '8px 20px' }}>取消</button>
          <button onClick={handlePasswordSubmit} style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>確認</button>
        </div>
      </div>
    </div>
  );

  if (!authorized) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50' }}>☸️ 菩提禪修管理系統</h2>
        <button onClick={() => handleOpenModal('login')} style={{ padding: '12px 30px', fontSize: '1.1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>登入管理後台</button>
        {modalElement}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📋 名單管理控制台</h2>
        <button onClick={fetchUsers} style={{ padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>🔄 刷新數據</button>
      </div>
      
      {/* 篩選工具欄 */}
      <div style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '15px' }}>
          {['all', 'active', 'checked-in'].map(mode => (
            <button 
              key={mode}
              onClick={() => setViewMode(mode)} 
              style={{ 
                marginRight: '10px', padding: '8px 20px', borderRadius: '20px', border: '1px solid #ddd', cursor: 'pointer',
                backgroundColor: viewMode === mode ? '#007bff' : '#fff', color: viewMode === mode ? '#fff' : '#333'
              }}
            >
              {mode === 'all' ? '全部' : mode === 'active' ? '僅登記' : '今日已簽到'}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" placeholder="🔍 搜尋姓名、電話或城市..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px', width: '250px', borderRadius: '5px', border: '1px solid #ddd' }} />
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
          <button onClick={() => setSelectedDate('')} style={{ padding: '10px 15px' }}>重置日期</button>
          <button onClick={() => handleOpenModal('export')} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>📥 匯出完整 CSV</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '50px' }}>載入資料中...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>姓名/性別</th>
                <th style={tableHeaderStyle}>身分</th>
                <th style={tableHeaderStyle}>電話/城市</th>
                <th style={tableHeaderStyle}>管道/介紹人</th>
                <th style={tableHeaderStyle}>接待人員 </th>
                <th style={tableHeaderStyle}>備註</th>
                <th style={tableHeaderStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{user.gender === 'Male' ? '男' : '女'}</div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={badgeStyle(user.user_type)}>{user.user_type}</span>
                  </td>
                  <td style={tableCellStyle}>
                    <div>{user.phone}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>📍 {user.city || '未知'}</div>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ fontSize: '0.8rem' }}>{user.discovery_source}</div>
                    {user.referrer_name && <div style={{ fontSize: '0.75rem', color: '#007bff' }}>👤 引薦: {user.referrer_name}</div>}
                  </td>
                  <td style={tableCellStyle}>
                    <input 
                      defaultValue={user.receptionist_name || ''} 
                      onBlur={(e) => handleReceptionistChange(user.id, e.target.value)}
                      placeholder="填入接待人..."
                      style={{ width: '100px', padding: '5px', border: '1px solid #eee', borderRadius: '3px' }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <textarea 
                      defaultValue={user.notes || ''} 
                      onBlur={(e) => handleNoteChange(user.id, e.target.value)} 
                      placeholder="輸入備註..."
                      style={{ width: '150px', height: '40px', padding: '5px', fontSize: '0.8rem', border: '1px solid #eee' }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <button onClick={() => setSelectedQrId(user.id)} style={{ padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>QR碼</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalElement}

      {/* QR Code 彈出視窗 */}
      {selectedQrId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }} onClick={() => setSelectedQrId(null)}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{users.find(u => u.id === selectedQrId)?.name} 的專屬碼</h3>
            <QRCodeCanvas value={String(selectedQrId)} size={250} level="H" />
            <div style={{ marginTop: '20px', color: '#666' }}>ID: {selectedQrId}</div>
            <br />
            <button onClick={() => setSelectedQrId(null)} style={{ padding: '10px 30px', borderRadius: '5px', cursor: 'pointer' }}>關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;