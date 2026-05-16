import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// 定義來源對照表
const sourceMap = {
  'expo': '-',
  'Outreach': '-',
  'outreach': '-',
  'Hall-Newcomer': '禪堂新人',
  
  // 新增來源項目
  'Outreach-Flyer': '外出發票',
  'Poster': '通過海報來的',
  'Performance': '來禪堂參加表演的'
};

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

  // 1. 強化的格式化時間函數：UTC 顯示解決時差
  const formatTime = (timeStr) => {
    if (!timeStr || String(timeStr) === 'undefined' || String(timeStr) === 'null') return '-';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString('zh-TW', {
      timeZone: 'UTC', 
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

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

  const handleReceptionistChange = async (userId, name) => {
    try {
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/update-receptionist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, receptionistName: name })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, receptionist_name: name } : u));
      }
    } catch (err) { console.error("網路錯誤:", err); }
  };

  const handleNoteChange = async (userId, newNote) => {
    try {
      const res = await fetch('https://checkin-system-production-2a74.up.railway.app/admin/update-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notes: newNote }) 
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, notes: newNote } : u));
      }
    } catch (err) { console.error("更新備註錯誤:", err); }
  };

  const handlePasswordSubmit = () => {
    if (tempPassword === "my789") {
      if (actionType === 'login') setAuthorized(true);
      if (actionType === 'export') exportToCSV();
      setIsModalOpen(false);
      setTempPassword('');
    } else { alert("密碼錯誤！"); }
  };

  // 匯出 CSV 函數（已同步最新過濾邏輯）
  const exportToCSV = () => {
    try {
      if (!filteredList || filteredList.length === 0) {
        alert("目前沒有資料可供匯出");
        return;
      }

      const headers = ["姓名", "電話", "Email", "身份", "語言", "介紹人", "來源", "已加持", "登記時間", "最後簽到", "接待人員", "備註"];
      
      const csvRows = filteredList.map(u => {
        const getCsvSource = () => {
          const raw = (u.discovery_source || '').toString().trim();
          if (!raw || /^(null|undefined)$/i.test(raw)) return '-';
          if (sourceMap[raw]) return sourceMap[raw];
          if (/expo/i.test(raw)) return '-';
          return raw;
        };

        return [
          `"${(u.name || '').replace(/"/g, '""')}"`, 
          `"${u.phone || ''}"`, 
          `"${u.email || ''}"`, 
          `"${u.user_type || ''}"`,
          `"${u.lang || ''}"`,
          `"${(u.referrer_name || '').replace(/"/g, '""')}"`,
          `"${getCsvSource()}"`, 
          `"${u.is_blessed ? '是' : '否'}"`, 
          `"${formatTime(u.created_at)}"`, 
          `"${formatTime(u.last_checkin_time)}"`, 
          `"${(u.receptionist_name || '').replace(/"/g, '""')}"`, 
          `"${(u.notes || '').replace(/"/g, '""')}"`
        ].join(",");
      });

      const csvContent = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Bodhi_List_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

    } catch (err) {
      console.error("匯出過程出錯:", err);
      alert("匯出失敗");
    }
  };

  const filteredList = users.filter(user => {
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchStr) || 
      user.phone?.includes(searchTerm) ||
      (user.receptionist_name || user.receptionist || '').toLowerCase().includes(searchStr);
    
    const matchesStatus = viewMode === 'all' || user.status === viewMode;
    const rawDate = viewMode === 'checked-in' ? (user.last_checkin_time || user.last_checkin) : user.created_at;
    const matchesDate = !selectedDate || (rawDate && String(rawDate).startsWith(selectedDate));

    return matchesSearch && matchesStatus && matchesDate;
  });

  const tableHeaderStyle = { padding: '12px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', textAlign: 'left', fontSize: '0.85rem' };
  const tableCellStyle = { padding: '10px', border: '1px solid #ddd', fontSize: '0.85rem' };

  if (!authorized) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>☸️ 菩提禪修管理系統</h2>
        <button onClick={() => { setActionType('login'); setIsModalOpen(true); }} style={{ padding: '15px 40px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer' }}>進入管理後台</button>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000 }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center' }}>
              <h3>管理權限驗證</h3>
              <input type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} autoFocus style={{ padding: '10px', marginBottom: '15px' }} onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()} />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={() => setIsModalOpen(false)}>取消</button>
                <button onClick={handlePasswordSubmit} style={{ backgroundColor: '#007bff', color: 'white' }}>確認</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
        <h2>📋 名單管理控制台</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchUsers} style={{ padding: '8px 15px' }}>🔄 刷新</button>
          <button onClick={exportToCSV} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', padding: '8px 20px', cursor: 'pointer' }}>📥 匯出 CSV</button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="🔍 搜尋姓名、電話、接待..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px', width: '250px' }} />
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={{ padding: '10px' }}>
          <option value="all">顯示全部</option>
          <option value="checked-in">今日已簽到</option>
        </select>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '10px' }} />
        <button onClick={() => {setSearchTerm(''); setSelectedDate(''); setViewMode('all');}}>重置</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '50px' }}>讀取中...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>姓名</th>
                <th style={tableHeaderStyle}>電話</th>
                <th style={tableHeaderStyle}>身份</th>
                <th style={tableHeaderStyle}>語言</th>
                <th style={tableHeaderStyle}>來源</th>
                <th style={tableHeaderStyle}>介紹人</th>
                <th style={tableHeaderStyle}>登記時間</th>
                <th style={tableHeaderStyle}>最後簽到</th>
                <th style={tableHeaderStyle}>接待人員</th>
                <th style={tableHeaderStyle}>備註</th>
                <th style={tableHeaderStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(user => {
                const getDisplaySource = () => {
                  const raw = (user.discovery_source || '').toString().trim();
                  if (!raw || /^(null|undefined)$/i.test(raw)) return '-';
                  if (sourceMap[raw]) return sourceMap[raw];
                  if (/expo/i.test(raw)) return '-';
                  return raw;
                };

                const displaySource = getDisplaySource();

                return (
                  <tr key={user.id}>
                    <td style={{ ...tableCellStyle, minWidth: '80px' }}>
                      <strong>{user.name || '無'}</strong>
                      {user.is_blessed === 1 && '✨'}
                    </td>
                    <td style={tableCellStyle}>{user.phone || '-'}</td>
                    <td style={tableCellStyle}>
                      <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#eee', color: '#666' }}>
                        {user.user_type || '-'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {user.lang === 'en-US' ? '🇺🇸 EN' : 
                       user.lang === 'zh-CN' ? '🇨🇳 簡' : 
                       user.lang === 'zh-TW' ? '🇭🇰 繁' : user.lang || '-'}
                    </td>

                    <td style={tableCellStyle}>{displaySource}</td>

                    <td style={tableCellStyle}>
                      {(!user.referrer_name || user.referrer_name === 'null') ? '-' : user.referrer_name}
                    </td>
                    <td style={tableCellStyle}>{formatTime(user.created_at)}</td>
                    <td style={{ ...tableCellStyle, color: '#27ae60', fontWeight: 'bold' }}>
                      {(() => {
                        const val = user.last_checkin_time;
                        if (!val || /^(null|undefined)$/i.test(String(val))) {
                          return <span style={{ color: '#ccc', fontWeight: 'normal' }}>-</span>;
                        }
                        return formatTime(val);
                      })()}
                    </td>
                    <td style={tableCellStyle}>
                      <input 
                        value={String(user.receptionist_name || user.receptionist || '').replace(/undefined|null/gi, '')} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, receptionist_name: val } : u));
                        }}
                        onBlur={(e) => handleReceptionistChange(user.id, e.target.value)}
                        style={{ width: '70px' }} 
                      />
                    </td>
                    <td style={tableCellStyle}>
                      <textarea 
                        value={String(user.notes || user.note || '').replace(/undefined|null/gi, '')} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, notes: val } : u));
                        }}
                        onBlur={(e) => handleNoteChange(user.id, e.target.value)}
                        style={{ width: '120px', height: '35px' }} 
                      />
                    </td>
                    <td style={tableCellStyle}>
                      <button onClick={() => setSelectedQrId(user.id)}>QR</button>
                    </td>
                  </tr>
                );
              })}   
            </tbody>
          </table>
        </div>
      )}

      {selectedQrId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000 }} onClick={() => setSelectedQrId(null)}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{users.find(u => u.id === selectedQrId)?.name} 的 QR Code</h3>
            <QRCodeCanvas 
              value={String(selectedQrId || '')} 
              size={200} 
              includeMargin={true}
            />
            <button onClick={() => setSelectedQrId(null)} style={{ marginTop: '20px', display: 'block', width: '100%', padding: '10px' }}>關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;