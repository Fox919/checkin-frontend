import React, { useState, useEffect } from 'react';

const AdminPage = () => {
  const [offerings, setOfferings] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 定義所有可能的時段選項
  const timeOptions = ["10:00", "11:00", "14:00", "15:00", "16:00", "19:00"];
  const dayNames = { "0": "週日", "3": "週三", "6": "週六" };

  useEffect(() => {
    const password = prompt("請輸入管理員密碼：");
    if (password !== "my789") {
      alert("密碼錯誤！");
      window.location.href = "/";
      return;
    }

    fetch(`${API_BASE}/offerings`)
      .then(res => res.json())
      .then(data => {
        // 確保 config 是物件格式
        const formatted = data.map(item => ({
          ...item,
          config: typeof item.config === 'string' ? JSON.parse(item.config || '{}') : item.config
        }));
        setOfferings(formatted);
      });
  }, []);

  const handleSave = async () => {
    try {
      await fetch(`${API_BASE}/offerings/${editingItem.id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: editingItem.config })
      });
      alert('✅ 設定已更新，前端已同步！');
    } catch (err) {
      alert('❌ 儲存失敗');
    }
  };

  // 處理服務模式的 Checkbox 切換
  const toggleTimeSlot = (day, time) => {
    const currentSchedule = { ...editingItem.config.regular_schedule };
    if (!currentSchedule[day]) currentSchedule[day] = [];

    if (currentSchedule[day].includes(time)) {
      currentSchedule[day] = currentSchedule[day].filter(t => t !== time);
    } else {
      currentSchedule[day] = [...currentSchedule[day], time].sort();
    }

    setEditingItem({
      ...editingItem,
      config: { ...editingItem.config, regular_schedule: currentSchedule }
    });
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>⚙️ 系統後台管理</h1>
      <div style={{ display: 'flex', gap: '30px' }}>
        
        {/* 左側清單 */}
        <div style={{ width: '30%' }}>
          {offerings.map(item => (
            <div key={item.id} onClick={() => setEditingItem(item)}
              style={{ padding: '15px', border: '1px solid #ddd', marginBottom: '10px', cursor: 'pointer', borderRadius: '8px', background: editingItem?.id === item.id ? '#3498db' : '#fff', color: editingItem?.id === item.id ? '#fff' : '#333' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>{item.icon}</span>
              {item.title}
            </div>
          ))}
        </div>

        {/* 右側編輯面板 */}
        {editingItem && (
          <div style={{ flex: 1, padding: '25px', border: '1px solid #3498db', borderRadius: '15px', background: '#f9f9f9' }}>
            <h2 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>編輯：{editingItem.title}</h2>
            
            {/* 模式 A：班級模式 (Course) */}
            {editingItem.type === 'course' && (
              <div>
                <h3>📅 開班期次管理</h3>
                {editingItem.config.sessions?.map((s, idx) => (
                  <div key={idx} style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input style={{ padding: '8px' }} value={s.label} placeholder="如: 5月班" onChange={(e) => {
                      const newSessions = [...editingItem.config.sessions];
                      newSessions[idx].label = e.target.value;
                      setEditingItem({...editingItem, config: {...editingItem.config, sessions: newSessions}});
                    }} />
                    <input style={{ padding: '8px' }} type="date" value={s.date} onChange={(e) => {
                      const newSessions = [...editingItem.config.sessions];
                      newSessions[idx].date = e.target.value;
                      setEditingItem({...editingItem, config: {...editingItem.config, sessions: newSessions}});
                    }} />
                    <button onClick={() => {
                       const newSessions = editingItem.config.sessions.filter((_, i) => i !== idx);
                       setEditingItem({...editingItem, config: {...editingItem.config, sessions: newSessions}});
                    }} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>移除</button>
                  </div>
                ))}
                <button onClick={() => {
                  const newSessions = [...(editingItem.config.sessions || []), { id: Date.now(), label: '', date: '' }];
                  setEditingItem({...editingItem, config: {...editingItem.config, sessions: newSessions}});
                }} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #3498db', background: '#fff', cursor: 'pointer' }}>➕ 新增一期</button>
              </div>
            )}

            {/* 模式 B：服務模式 (Service) */}
            {editingItem.type === 'service' && (
              <div>
                <h3>⏰ 每週預約時段設定</h3>
                {["0", "3", "6"].map(dayKey => (
                  <div key={dayKey} style={{ marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '10px', border: '1px solid #eee' }}>
                    <strong style={{ display: 'block', marginBottom: '10px', color: '#2c3e50' }}>{dayNames[dayKey]} 的時段：</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {timeOptions.map(time => {
                        const isChecked = editingItem.config.regular_schedule?.[dayKey]?.includes(time);
                        return (
                          <label key={time} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', background: isChecked ? '#e67e22' : '#fff', color: isChecked ? '#fff' : '#666', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input type="checkbox" style={{ display: 'none' }} checked={isChecked} onChange={() => toggleTimeSlot(dayKey, time)} />
                            {time}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '30px' }}>
              <button onClick={handleSave} style={{ width: '100%', padding: '15px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                💾 儲存並發佈到前端
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;