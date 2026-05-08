import React, { useState } from 'react';

const AdminBatchManager = ({ onSave }) => {
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalDays, setTotalDays] = useState(8); // 可切換 7 或 8
  const [courseType, setCourseType] = useState('全天'); // 全天 或 半天
  const [sessions, setSessions] = useState([]);

  // --- 自動產生連續日期邏輯 (+1) ---
  const handleAutoGenerate = () => {
    if (!batchName || !startDate) {
      alert("請先輸入班級名稱與第一天日期");
      return;
    }

    const newSessions = [];
    let current = new Date(startDate.replace(/-/g, '/'));

    for (let i = 0; i < totalDays; i++) {
      const dateStr = current.toISOString().split('T')[0];
      newSessions.push({
        id: Date.now() + i,
        date: dateStr,
        // 第一天顯示班級名稱，其餘顯示 第 X 天 + 時段
        label: i === 0 ? `${batchName}` : `第 ${i + 1} 天 (${courseType})`,
        is_start: i === 0,
        type: courseType // 註記這堂課是全天還是半天
      });
      
      // 密集班邏輯：日期每次 +1 天
      current.setDate(current.getDate() + 1); 
    }
    setSessions(newSessions);
  };

  const updateSession = (idx, field, value) => {
    const updated = [...sessions];
    updated[idx][field] = value;
    setSessions(updated);
  };

  return (
    <div style={{ background: '#f4f7f6', padding: '20px', borderRadius: '15px', maxWidth: '800px', margin: '20px auto' }}>
      <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>📅 密集班期次管理 (+1 連續模式)</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '10px', marginBottom: '20px', alignItems: 'end' }}>
        <div>
          <label style={labelStyle}>班級名稱</label>
          <input type="text" placeholder="5月密集班" value={batchName} onChange={(e) => setBatchName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>開課第一天</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>總天數</label>
          <select value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))} style={inputStyle}>
            <option value="7">7 天</option>
            <option value="8">8 天</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>預設時段</label>
          <select value={courseType} onChange={(e) => setCourseType(e.target.value)} style={inputStyle}>
            <option value="全天">全天</option>
            <option value="上午半天">上午半天</option>
            <option value="下午半天">下午半天</option>
          </select>
        </div>
        <button onClick={handleAutoGenerate} style={btnGenerateStyle}>產生</button>
      </div>

      {sessions.length > 0 && (
        <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          {sessions.map((s, idx) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '80px 150px 1fr 100px', gap: '10px', marginBottom: '8px', alignItems: 'center', borderBottom: '1px solid #f9f9f9', paddingBottom: '5px' }}>
              <span style={{ fontWeight: 'bold' }}>{idx === 0 ? "第一天" : `第 ${idx+1} 天`}</span>
              <input type="date" value={s.date} onChange={(e) => updateSession(idx, 'date', e.target.value)} style={smallInputStyle} />
              <input type="text" value={s.label} onChange={(e) => updateSession(idx, 'label', e.target.value)} style={smallInputStyle} />
              <select value={s.type} onChange={(e) => updateSession(idx, 'type', e.target.value)} style={smallInputStyle}>
                <option value="全天">全天</option>
                <option value="上午半天">半天</option>
              </select>
            </div>
          ))}
          <button onClick={() => onSave(sessions)} style={btnSaveStyle}>✅ 確認儲存密集班期次</button>
        </div>
      )}
    </div>
  );
};

const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', color: '#666' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' };
const smallInputStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #eee', fontSize: '0.85rem' };
const btnGenerateStyle = { padding: '8px 15px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const btnSaveStyle = { width: '100%', marginTop: '15px', padding: '12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default AdminBatchManager;