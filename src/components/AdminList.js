import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// ✨ 完美補齊來源對照表，與前端登記頁面完全對齊
const sourceMap = {
  'expo': '外展活動',
  'Outreach': '外展活動',
  'outreach': '外展活動',
  'Hall-Newcomer': '禪堂新人',
  'Outreach-Flyer': '外出發票',
  'Poster': '通過海報來的',
  'Performance': '來禪堂參加表演的',
  'Friend': '朋友 / 親戚', 
  'Google/YouTube': '谷歌 / YouTube',
  'Facebook/IG': '臉書 / Instagram',
  'Magazine': '雜誌',
  'Website': '官方網站',
  'Other': '其他'
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
  
  // 🌟 記錄目前點選的來源索引（null 代表顯示全部）
  const [selectedSourceFilter, setSelectedSourceFilter] = useState(null);

  // 🔤 智慧姓名格式化：將英文的「姓 在 前」優雅轉換為「名 在 前」
  const formatStudentName = (rawName) => {
    if (!rawName) return '無';
    const trimmed = rawName.trim();
    
    // 檢查是否包含空格，且主要由英文字母組成
    const hasSpace = trimmed.includes(' ');
    const isEnglish = /^[A-Za-z\s,.-]+$/.test(trimmed);

    if (hasSpace && isEnglish) {
      // 將字串依空格拆開
      const nameParts = trimmed.split(/\s+/);
      if (nameParts.length > 1) {
        const [lastName, ...firstNameParts] = nameParts;
        // 重新組合：名在前 (firstNameParts)，姓在後 (lastName)
        return `${firstNameParts.join(' ')} ${lastName}`;
      }
    }
    // 中文名或單一單字維持原樣
    return trimmed;
  };

  // ⏰ 強化的格式化時間函數 — 完美校正為洛杉磯當地時間
  const formatTime = (timeStr) => {
    if (!timeStr || String(timeStr) === 'undefined' || String(timeStr) === 'null') return '-';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString('zh-TW', {
      timeZone: 'America/Los_Angeles', // 🌟 核心修正：完美同步洛杉磯時區！
      year: 'numeric',                 // 🌟 補上年份顯示，避免跨年混淆
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

  // 🌟 處理身分轉換的後台發送邏輯
  const handleUpdateUserType = async (userId, currentName, newType) => {
    const displayName = formatStudentName(currentName);
    const confirmChange = window.confirm(`確定要將「${displayName}」的身分轉換為【${newType}】嗎？`);
    if (!confirmChange) return;

    let selectedOfferingId = null;

    if (newType === 'Student' || newType === 'Member' || newType === '學員') {
      const courseIdInput = window.prompt(
        `請輸入要將「${displayName}」加入的【課程期次 ID】：\n\n(提示：必須指定課程 ID，考勤看板才能看到該學員。可至『課程期次設定』頁面查看 ID，例如：1)`
      );
      
      if (courseIdInput === null) return; 
      if (!courseIdInput.trim()) {
        alert("⚠️ 轉換失敗：必須輸入正確的課程 ID 才能將訪客轉為學員！");
        return;
      }
      selectedOfferingId = courseIdInput.trim();
    }

    try {
      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/update-type/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          new_type: newType,        
          offeringId: selectedOfferingId 
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        alert(`✨ ${data.message || '身分轉換與課程綁定成功！'}`);
        fetchUsers();
      } else {
        alert(`⚠️ 轉換失敗: ${data.error || '未知錯誤'}`);
      }
    } catch (err) {
      console.error(err);
      alert("網路連線失敗，請檢查網路或稍後再試");
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

  const getDisplaySourceText = (rawSource) => {
    const raw = (rawSource || '').toString().trim();
    if (!raw || /^(null|undefined)$/i.test(raw)) return '-';
    if (sourceMap[raw]) return sourceMap[raw];
    if (/expo/i.test(raw)) return '外展活動'; 
    return raw;
  };

  const getSourceStats = () => {
    const targetDate = selectedDate || new Date().toLocaleDateString('en-CA');
    
    const dayNewcomers = users.filter(user => {
      if (!user.created_at || !user.user_type?.toLowerCase().includes('newcomer')) return false;
      const userDate = new Date(user.created_at).toLocaleDateString('en-CA');
      return userDate === targetDate;
    });

    const totalCount = dayNewcomers.length;

    const statsMap = {
      '外展活動': 0,
      '禪堂新人': 0,
      '外出發票': 0,
      '通過海報來的': 0,
      '來禪堂參加表演的': 0,
      '朋友 / 親戚': 0,
      '網路平台 (Google/FB/IG)': 0,
      '其他 / 未知': 0
    };

    dayNewcomers.forEach(user => {
      const src = user.discovery_source;
      
      if (!src || /^(null|undefined)$/i.test(src)) {
        if (user.user_type === 'Hall-Newcomer') statsMap['禪堂新人']++;
        else statsMap['其他 / 未知']++;
        return;
      }

      if (/expo|outreach/i.test(src) && !/flyer/i.test(src)) {
        statsMap['外展活動']++;
      } else if (src === 'Hall-Newcomer') {
        statsMap['禪堂新人']++;
      } else if (src === 'Outreach-Flyer') {
        statsMap['外出發票']++;
      } else if (src === 'Poster') {
        statsMap['通過海報來的']++;
      } else if (src === 'Performance') {
        statsMap['來禪堂參加表演的']++;
      } else if (src === 'Friend') {
        statsMap['朋友 / 親戚']++;
      } else if (/google|youtube|facebook|ig/i.test(src)) {
        statsMap['網路平台 (Google/FB/IG)']++;
      } else {
        const chineseName = sourceMap[src] || '其他 / 未知';
        statsMap[chineseName] = (statsMap[chineseName] || 0) + 1;
      }
    });

    return { totalCount, statsMap };
  };

  const { totalCount: statTotal, statsMap: statData } = getSourceStats();

  const filteredList = users.filter(user => {
    const searchStr = searchTerm.toLowerCase();
    
    // 🌟 搜尋時同時支援配對原本名字與調整後的名字
    const adjustedName = formatStudentName(user.name);
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchStr) || 
      adjustedName.toLowerCase().includes(searchStr) ||
      user.phone?.includes(searchTerm) ||
      (user.receptionist_name || user.receptionist || '').toLowerCase().includes(searchStr);
    
    const matchesStatus = viewMode === 'all' || user.status === viewMode;

    let matchesDate = true;
    const todayStr = new Date().toLocaleDateString('en-CA'); 
    const rawDate = viewMode === 'checked-in' ? user.last_checkin_time : user.created_at;

    if (rawDate) {
      const targetIsoDate = new Date(rawDate).toLocaleDateString('en-CA');
      if (selectedDate) {
        matchesDate = targetIsoDate === selectedDate;
      } else if (viewMode === 'checked-in') {
        matchesDate = targetIsoDate === todayStr;
      }
    } else {
      if (selectedDate || viewMode === 'checked-in') {
        matchesDate = false;
      }
    }

    let matchesSourceFilter = true;
    if (selectedSourceFilter) {
      const currentSrcText = getDisplaySourceText(user.discovery_source);
      
      if (selectedSourceFilter === '禪堂新人') {
        matchesSourceFilter = currentSrcText === '禪堂新人' || (!user.discovery_source && user.user_type === 'Hall-Newcomer');
      } else if (selectedSourceFilter === '網路平台 (Google/FB/IG)') {
        matchesSourceFilter = /谷歌|YouTube|臉書|Instagram/i.test(currentSrcText);
      } else if (selectedSourceFilter === '其他 / 未知') {
        matchesSourceFilter = currentSrcText === '-' || currentSrcText === '其他' || !statData[currentSrcText];
      } else {
        matchesSourceFilter = currentSrcText === selectedSourceFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesDate && matchesSourceFilter;
  });

  const exportToCSV = () => {
    try {
      if (!filteredList || filteredList.length === 0) {
        alert("目前沒有資料可供匯出");
        return;
      }

      const headers = ["姓名", "電話", "Email", "身份", "語言", "介紹人", "來源", "已加持", "登記時間", "最後簽到", "接待人員", "備註"];
      
      const csvRows = filteredList.map(u => {
        // 🌟 匯出時也同步套用「名在前、姓在後」的規格
        const formattedCSVName = formatStudentName(u.name);
        return [
          `"${formattedCSVName.replace(/"/g, '""')}"`, 
          `"${u.phone || ''}"`, 
          `"${u.email || ''}"`, 
          `"${u.user_type || ''}"`,
          `"${u.lang || ''}"`,
          `"${(u.referrer_name || '').replace(/"/g, '""')}"`,
          `"${getDisplaySourceText(u.discovery_source)}"`, 
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
        <button onClick={() => {setSearchTerm(''); setSelectedDate(''); setViewMode('all'); setSelectedSourceFilter(null);}}>重置</button>
      </div>

      <div style={{ 
        backgroundColor: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
        marginBottom: '25px',
        borderLeft: '5px solid #007bff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 {selectedDate ? `${selectedDate}` : '今日'} 新人來源管道統計 
            <span style={{ fontSize: '0.9rem', backgroundColor: '#007bff', color: '#fff', padding: '2px 10px', borderRadius: '12px' }}>
              共 {statTotal} 位新人登記
            </span>
          </h4>
          
          {selectedSourceFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: '#007bff', fontWeight: 'bold' }}>
                🔍 正在過濾：{selectedSourceFilter}
              </span>
              <button 
                onClick={() => setSelectedSourceFilter(null)}
                style={{ padding: '3px 8px', fontSize: '0.8rem', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                顯示全部
              </button>
            </div>
          )}
        </div>

        {statTotal === 0 ? (
          <p style={{ color: '#999', margin: 0, fontSize: '0.9rem' }}>📅 該日期沒有新註冊的新人資料。</p>
        ) : (
          <div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 0, marginBottom: '10px' }}>💡 提示：點擊下方任何一個來源卡片，下方表格會立刻過濾出該管道的新人。</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              {Object.entries(statData).map(([sourceName, count]) => {
                const percentage = statTotal > 0 ? ((count / statTotal) * 100).toFixed(0) : 0;
                
                let barColor = '#6c757d'; 
                if (sourceName === '外展活動') barColor = '#28a745'; 
                if (sourceName === '禪堂新人') barColor = '#007bff'; 
                if (sourceName === '外出發票') barColor = '#fd7e14'; 
                if (sourceName === '通過海報來的') barColor = '#20c997'; 
                if (sourceName === '來禪堂參加表演的') barColor = '#17a2b8'; 
                if (sourceName === '朋友 / 親戚') barColor = '#e83e8c'; 
                if (sourceName.includes('網路平台')) barColor = '#6f42c1'; 

                if (count === 0) return null; 

                const isCurrentFilter = selectedSourceFilter === sourceName;

                return (
                  <div 
                    key={sourceName} 
                    onClick={() => setSelectedSourceFilter(isCurrentFilter ? null : sourceName)}
                    style={{ 
                      backgroundColor: isCurrentFilter ? '#f1f7ff' : '#f8f9fa', 
                      padding: '12px', 
                      borderRadius: '6px', 
                      border: isCurrentFilter ? `2px solid ${barColor}` : '1px solid #eee',
                      cursor: 'pointer',
                      boxShadow: isCurrentFilter ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <span style={{ color: '#555' }}>{sourceName}</span>
                      <span style={{ color: barColor }}>{count} 人 ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#e9ecef', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, backgroundColor: barColor, height: '100%', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                const displaySource = getDisplaySourceText(user.discovery_source);
                // 🌟 優雅呈現調整後的「名在前、姓在後」名字
                const finalDisplayName = formatStudentName(user.name);

                return (
                  <tr key={user.id}>
                    <td style={{ ...tableCellStyle, minWidth: '80px' }}>
                      <strong>{finalDisplayName}</strong>
                      {user.is_blessed === 1 && ' ✨'}
                    </td>
                    <td style={tableCellStyle}>{user.phone || '-'}</td>
                    
                    <td style={tableCellStyle}>
                      <select
                        value={user.user_type || 'Visitor'} 
                        onChange={(e) => handleUpdateUserType(user.id, user.name, e.target.value)}
                        style={{
                          padding: '4px 6px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor: 
                            user.user_type === 'Volunteer' ? '#FF9800' : 
                            user.user_type === 'Student' ? '#4CAF50' : 
                            user.user_type === 'Hall-Newcomer' ? '#2196F3' : 
                            user.user_type === 'Expo-Newcomer' ? '#9C27B0' : '#6c757d',
                          backgroundColor: '#fff',
                          color: '#333'
                        }}
                      >
                        <option value="Visitor">😊 訪客 (Visitor)</option>
                        <option value="Volunteer">🧡 義工 (Volunteer)</option>
                        <option value="Student">🌿 學員 (Student)</option>
                        <option value="Hall-Newcomer">🏠 禪堂新人 (Hall-Newcomer)</option>
                        <option value="Expo-Newcomer">🎪 展會新人 (Expo-Newcomer)</option>
                      </select>
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
            <h3 style={{ marginTop: 0 }}>{formatStudentName(users.find(u => u.id === selectedQrId)?.name)} 的 QR Code</h3>
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