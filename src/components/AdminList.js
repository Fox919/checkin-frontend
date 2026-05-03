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
    if (tempPassword === "my789") {
      if (actionType === 'login') setAuthorized(true);
      if (actionType === 'export') exportToCSV();
      setIsModalOpen(false);
      setTempPassword('');
    } else {
      alert("密碼錯誤！");
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
      console.error("更新備註失敗");
    }
  };

  const handleReceptionistChange = async (userId, name) => {
    try {
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/api/users/${userId}/receptionist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receptionistName: name })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, receptionist_name: name } : u));
      }
    } catch (err) {
      alert("更新接待人員失敗");
    }
  };

  const exportToCSV = () => {
    // 增加 CSV 欄位：聯絡偏好
    const headers = ["姓名", "電話", "身分", "性別", "城市", "管道", "介紹人", "聯絡偏好", "YouTube", "接待人員", "狀態", "備註"];
    const csvRows = filteredList.map(u => [
      `"${u.name || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.user_type || ''}"`,
      `"${u.gender === 'Male' ? '男' : '女'}"`,
      `"${u.city || ''}"`,
      `"${u.discovery_source || ''}"`,
      `"${u.referrer_name || ''}"`,
      `"${u.contact_method || ''}"`, // 對應資料庫字串
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
    link.setAttribute("download", `Bodhi_Master_List_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
  };

  const filteredList = users.filter(user => {
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchStr) || 
      user.phone?.includes(searchTerm) ||
      user.city?.toLowerCase().includes(searchStr) ||
      user.receptionist_name?.toLowerCase().includes(searchStr);

    const matchesStatus = viewMode === 'all' || user.status === viewMode;
    const rawDate = viewMode === 'checked-in' ? user.last_checkin_date : user.created_at;
    const targetDate = rawDate ? String(rawDate) : ''; 
    const matchesDate = !selectedDate || targetDate.startsWith(selectedDate);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // 樣式輔助
  const badgeStyle = (type) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    backgroundColor: type === 'volunteer' ? '#e3f2fd' : type === 'student' ? '#f1f8e9' : '#f5f5f5',
    color: type === 'volunteer' ? '#1976d2' : type === 'student' ? '#388e3c' : '#616161',
    display: 'inline-block'
  });

  const contactTagStyle = {
    fontSize: '0.7rem',
    background: '#f0f0f0',
    padding: '2px 5px',
    borderRadius: '3px',
    marginRight: '3px',
    color: '#666'
  };

  const tableHeaderStyle = { padding: '12px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', textAlign: 'left', fontSize: '0.85rem', whiteSpace: 'nowrap' };
  const tableCellStyle = { padding: '10px', border: '1px solid #ddd', fontSize: '0.85rem' };

  const modalElement = isModalOpen && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <h3>管理權限驗證</h3>
        <input type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} autoFocus placeholder="輸入密碼" style={{ padding: '10px', marginBottom: '15px', width: '200px', borderRadius: '4px', border: '1px solid #ddd' }} />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => setIsModalOpen(false)} style={{ padding: '8px 20px', cursor: 'pointer' }}>取消</button>
          <button onClick={handlePasswordSubmit} style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>確認</button>
        </div>
      </div>
    </div>
  );

  if (!authorized) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
        <h2 style={{ color: '#2c3e50', fontSize: '2rem' }}>☸️ 菩提禪修管理系統</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>請登入以存取學員與義工名單</p>
        <button onClick={() => handleOpenModal('login')} style={{ padding: '15px 40px', fontSize: '1.1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,123,255,0.3)' }}>進入管理後台</button>
        {modalElement}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1500px', margin: 'auto', backgroundColor: '#fdfdfd' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>📋 名單管理控制台</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchUsers} style={{ padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ddd' }}>🔄 刷新數據</button>
          <button onClick={() => handleOpenModal('export')} style={{ padding: '8px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>📥 匯出 CSV</button>
        </div>
      </div>
      
      <div style={{ marginBottom: '25px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
          {[['all', '全部'], ['active', '僅登記'], ['checked-in', '今日已簽到']].map(([mode, label]) => (
            <button 
              key={mode}
              onClick={() => setViewMode(mode)} 
              style={{ 
                padding: '8px 20px', borderRadius: '20px', border: '1px solid #eee', cursor: 'pointer',
                backgroundColor: viewMode === mode ? '#007bff' : '#f8f9fa', color: viewMode === mode ? '#fff' : '#666',
                fontWeight: viewMode === mode ? 'bold' : 'normal', transition: 'all 0.2s'
              }}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" placeholder="🔍 搜尋姓名、電話、接待人..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px', width: '300px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>日期篩選:</span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
          </div>
          <button onClick={() => setSelectedDate('')} style={{ padding: '10px 15px', background: 'none', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' }}>重置</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '100px', color: '#999' }}>正在讀取雲端資料...</div> : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>姓名/性別</th>
                <th style={tableHeaderStyle}>身分</th>
                <th style={tableHeaderStyle}>電話</th>
                <th style={tableHeaderStyle}>管道/介紹人</th>
                <th style={tableHeaderStyle}>聯絡偏好</th>
                <th style={tableHeaderStyle}>接待人員</th>
                <th style={tableHeaderStyle}>備註</th>
                <th style={tableHeaderStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f9f9f9' }} className="table-row-hover">
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#95a5a6' }}>{user.gender === 'Male' ? '男' : '女'}</div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={badgeStyle(user.user_type)}>{user.user_type === 'guest' ? '來賓' : user.user_type === 'volunteer' ? '義工' : '學員'}</span>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ color: '#2980b9', fontWeight: '500' }}>{user.phone}</div>
                    <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}></div>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ fontSize: '0.8rem', color: '#444' }}>{user.discovery_source}</div>
                    {user.referrer_name && <div style={{ fontSize: '0.75rem', color: '#8e44ad' }}>👤 引薦: {user.referrer_name}</div>}
                  </td>
                  <td style={tableCellStyle}>
                    {user.contact_method ? user.contact_method.split(',').map(m => (
                      <span key={m} style={contactTagStyle}>{m === 'Call' ? '電話' : m === 'Text' ? '簡訊' : '電郵'}</span>
                    )) : <span style={{ color: '#ccc' }}>未設定</span>}
                  </td>
                  <td style={tableCellStyle}>
                    <input 
                      defaultValue={user.receptionist_name || ''} 
                      onBlur={(e) => handleReceptionistChange(user.id, e.target.value)}
                      placeholder="填入接待人..."
                      style={{ width: '100px', padding: '6px', border: '1px solid #eee', borderRadius: '4px', fontSize: '0.8rem' }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <textarea 
                      defaultValue={user.notes || ''} 
                      onBlur={(e) => handleNoteChange(user.id, e.target.value)} 
                      placeholder="輸入備註..."
                      style={{ width: '160px', height: '40px', padding: '5px', fontSize: '0.8rem', border: '1px solid #eee', borderRadius: '4px', resize: 'none' }}
                    />
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                    <button onClick={() => setSelectedQrId(user.id)} style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', background: '#fff', border: '1px solid #007bff', color: '#007bff', borderRadius: '4px' }}>QR碼</button>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000 }} onClick={() => setSelectedQrId(null)}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>{users.find(u => u.id === selectedQrId)?.name}</h3>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>學員專屬簽到二維碼</p>
            <div style={{ border: '10px solid #f8f9fa', padding: '10px', borderRadius: '10px', display: 'inline-block' }}>
              <QRCodeCanvas value={String(selectedQrId)} size={250} level="H" />
            </div>
            <div style={{ marginTop: '20px', fontSize: '1.1rem', fontWeight: 'bold', color: '#007bff' }}>ID: {selectedQrId}</div>
            <button onClick={() => setSelectedQrId(null)} style={{ marginTop: '30px', padding: '12px 40px', borderRadius: '30px', cursor: 'pointer', border: 'none', background: '#eee', color: '#333', fontWeight: 'bold' }}>關閉窗口</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;