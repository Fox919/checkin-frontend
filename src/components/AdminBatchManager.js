import React, { useState } from 'react';

const AdminBatchManager = ({ onSave }) => {
  const [batchName, setBatchName] = useState(''); // 例如：5月健身班
  const [startDate, setStartDate] = useState('');
  const [totalDays, setTotalDays] = useState(8); // 預設 8 堂課
  const [sessions, setSessions] = useState([]); // 存儲每一堂的詳情

  // --- 1. 自動產生邏輯 ---
  const handleAutoGenerate = () => {
    if (!batchName || !startDate) {
      alert("請先輸入班級名稱與開課第一天日期");
      return;
    }

    const newSessions = [];
    let current = new Date(startDate.replace(/-/g, '/'));

    for (let i = 0; i < totalDays; i++) {
      const dateStr = current.toISOString().split('T')[0];
      newSessions.push({
        id: Date.now() + i,
        date: dateStr,
        label: i === 0 ? batchName : `第 ${i + 1} 天`, // 第一天用班級名，後面用天數
        is_start: i === 0
      });
      
      // 自動增加 7 天 (每週一次)
      current.setDate(current.getDate() + 7);
    }
    setSessions(newSessions);
  };

  // --- 2. 個別微調邏輯 ---
  const updateSession = (index, field, value) => {
    const updated = [...sessions];
    updated[index][field] = value;
    setSessions(updated);
  };

  return (
    <div style={{ background: '#f4f7f6', padding: '20px', borderRadius: '15px', maxWidth: '800px', margin: '20px auto' }}>
      <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>📅 開班期次管理</h3>

      {/* 第一步：基礎設定 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '15px', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>班級名稱</label>
          <input 
            type="text" 
            placeholder="例如：5月健身班" 
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            style={inputStyle} 
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>開課第一天</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle} 
          />
        </div>
        <button onClick={handleAutoGenerate} style={btnGenerateStyle}>產生期次</button>
      </div>

      {/* 第二步：清單預覽與微調 */}
      {sessions.length > 0 && (
        <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr', gap: '10px', marginBottom: '10px', fontWeight: 'bold', color: '#7f8c8d' }}>
            <span>堂數</span>
            <span>日期</span>
            <span>備註/顯示名稱</span>
          </div>
          
          {sessions.map((s, idx) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: s.is_start ? '#3498db' : '#333' }}>
                {idx === 0 ? "第一天" : `第 ${idx + 1} 天`}
              </span>
              <input 
                type="date" 
                value={s.date} 
                onChange={(e) => updateSession(idx, 'date', e.target.value)}
                style={smallInputStyle} 
              />
              <input 
                type="text" 
                value={s.label} 
                onChange={(e) => updateSession(idx, 'label', e.target.value)}
                style={smallInputStyle} 
              />
            </div>
          ))}

          <button 
            onClick={() => onSave(sessions)} 
            style={btnSaveStyle}
          >
            ✅ 確認儲存期次
          </button>
        </div>
      )}
    </div>
  );
};

// --- 樣式設定 ---
const inputStyle = {
  width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px'
};

const smallInputStyle = {
  padding: '6px 10px', borderRadius: '5px', border: '1px solid #eee', fontSize: '0.9rem'
};

const btnGenerateStyle = {
  alignSelf: 'end', height: '40px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
};

const btnSaveStyle = {
  width: '100%', marginTop: '20px', padding: '12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
};

export default AdminBatchManager;