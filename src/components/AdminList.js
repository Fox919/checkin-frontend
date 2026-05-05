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

  const handleUserTypeChange = async (userId, userName, newType) => {
    const typeLabel = newType === 'volunteer' ? '義工' : newType === 'student' ? '學員' : '來賓';
    if (!window.confirm(`確定要將「${userName}」的身份修改為「${typeLabel}」嗎？`)) return;

    try {
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/update-type/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_type: newType })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, user_type: newType } : u));
      } else {
        alert("更新失敗：" + data.error);
      }
    } catch (err) {
      alert("⚠️ 連線伺服器失敗");
    }
  };

  const exportToCSV = () => {
    const headers = ["姓名", "電話", "身分", "性別", "城市", "管道", "介紹人", "聯絡偏好", "YouTube", "接待人員", "狀態", "備註"];
    const csvRows = filteredList.map(u => [
      `"${u.name || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.user_type || ''}"`,
      `"${u.gender === 'Male' ? '男' : '女'}"`,
      `"${u.city || ''}"`,
      `"${u.discovery_source || ''}"`,
      `"${u.referrer_name || ''}"`,
      `"${u.contact_method || ''}"`, 
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

  // 優化後的 Badge 樣式
  const badgeStyle = (type) => {
    let config = { bg: '#f5f5f5', text: '#616161', label: '來賓' };
    if (type === 'volunteer') config = { bg: '#E3F2FD', text: '#1976D2', label: '義工' };
    if (type === 'student') config = { bg: '#F1F8E9', text: '#388E3C', label: '學員' };
    if (type?.includes('newcomer')) config = { bg: '#FFF3E0', text: '#E65100', label: '新人' };
    if (type === 'visitor') config = { bg: '#EDE7F6', text: '#5E35B1', label: '正式訪客' };

    return {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      backgroundColor: config.bg,
      color: config.text,
      display: 'inline-block'
    };
  };

  const contactTagStyle = { fontSize: '0.7rem', background: '#f0f0f0', padding: '2px 5px', borderRadius: '3px', marginRight: '3px', color: '#666' };
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
        <button onClick={() => handleOpenModal('login')} style={{ padding: '15px 40px', fontSize: '1.1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer' }}>進入管理後台</button>
        {modalElement}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1500px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h2>📋 名單管理控制台</h2>
        <button onClick={() => handleOpenModal('export')} style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>📥 匯出 CSV</button>
      </div>
      
      {loading ? <div>載入中...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>姓名/性別</th>
                <th style={tableHeaderStyle}>身分/操作</th>
                <th style={tableHeaderStyle}>電話</th>
                <th style={tableHeaderStyle}>管道/介紹人</th>
                <th style={tableHeaderStyle}>聯絡偏好</th>
                <th style={tableHeaderStyle}>接待人員</th>
                <th style={tableHeaderStyle}>備註</th>
                <th style={tableHeaderStyle}>工具</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(user => (
                <tr key={user.id}>
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#95a5a6' }}>{user.gender === 'Male' ? '男' : '女'}</div>
                  </td>
                  
                  {/* 身分與快速升級按鈕 */}
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <span style={badgeStyle(user.user_type)}>
                        {user.user_type === 'volunteer' ? '義工' : user.user_type === 'student' ? '學員' : '來賓'}
                      </span>
                      {user.user_type !== 'volunteer' && (
                        <button 
                          onClick={() => handleUserTypeChange(user.id, user.name, 'volunteer')}
                          style={{ padding: '2px 6px', fontSize: '0.7rem', backgroundColor: '#FFF3E0', color: '#E65100', border: '1px solid #FFB74D', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          升為義工 🧡
                        </button>
                      )}
                    </div>
                  </td>

                  <td style={tableCellStyle}>{user.phone}</td>
                  <td style={tableCellStyle}>{user.discovery_source}</td>
                  <td style={tableCellStyle}>
                    {user.contact_method?.split(',').map(m => <span key={m} style={contactTagStyle}>{m}</span>)}
                  </td>
                  <td style={tableCellStyle}>
                    <input defaultValue={user.receptionist_name} onBlur={(e) => handleReceptionistChange(user.id, e.target.value)} style={{ width: '80px' }} />
                  </td>
                  <td style={tableCellStyle}>
                    <textarea defaultValue={user.notes} onBlur={(e) => handleNoteChange(user.id, e.target.value)} style={{ width: '120px', height: '30px' }} />
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => setSelectedQrId(user.id)} style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>QR碼</button>
                      <select 
                        value={user.user_type} 
                        onChange={(e) => handleUserTypeChange(user.id, user.name, e.target.value)}
                        style={{ fontSize: '0.75rem' }}
                      >
                        <option value="guest">來賓</option>
                        <option value="student">學員</option>
                        <option value="volunteer">義工</option>
                        <option value="visitor">正式訪客</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalElement}
      {/* QR Code 彈出視窗省略，保持原樣即可 */}
    </div>
  );
};

export default AdminList;