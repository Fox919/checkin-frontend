import React, { useState, useEffect } from 'react';

const AdminBatchManager = ({ onSave }) => {
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalDays, setTotalDays] = useState(8);
  const [courseType, setCourseType] = useState('全天');
  const [sessions, setSessions] = useState([]);

  // --- 新增：管理課程清單與選中項 ---
  const [offeringList, setOfferingList] = useState([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 1. 組件載入時抓取課程
  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        // 只過濾出課程 (course) 類型的
        setOfferingList(data.filter(i => i.type === 'course'));
      })
      .catch(err => console.error("抓取失敗:", err));
  }, []);

  // 2. 自動產生連續日期邏輯 (+1)
  const handleAutoGenerate = () => {
    if (!batchName || !startDate || !selectedOfferingId) {
      alert("請選擇課程、輸入班級名稱並選擇開課日期");
      return;
    }

    const newSessions = [];
    let current = new Date(startDate.replace(/-/g, '/'));

    for (let i = 0; i < totalDays; i++) {
      const dateStr = current.toISOString().split('T')[0];
      newSessions.push({
        id: Date.now() + i,
        date: dateStr,
        label: i === 0 ? `${batchName}` : `第 ${i + 1} 天 (${courseType})`,
        is_start: i === 0,
        type: courseType
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
      <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>📅 密集班期次管理</h3>

      {/* --- A. 選擇要套用的課程項目 --- */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>第一步：選擇課程項目</label>
        <select 
          value={selectedOfferingId} 
          onChange={(e) => setSelectedOfferingId(e.target.value)}
          style={inputStyle}
        >
          <option value="">-- 請選擇課程 (例如：健身班) --</option>
          {offeringList.map(item => (
            <option key={item.id} value={item.id}>{item.title}</option>
          ))}
        </select>
      </div>

      {/* --- B. 設定班級資訊 --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '10px', marginBottom: '20px', alignItems: 'end' }}>
        <div>
          <label style={labelStyle}>班級名稱</label>
          <input type="text" placeholder="6月密集健身班" value={batchName} onChange={(e) => setBatchName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>開課第一天</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>天數</label>
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

      {/* --- C. 預覽與修改清單 --- */}
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
                <option value="下午半天">半天</option>
              </select>
            </div>
          ))}
          
          {/* 修改這裡：傳回 ID 和 sessions */}
          <button 
            onClick={() => onSave(selectedOfferingId, sessions)} 
            style={btnSaveStyle}
          >
            ✅ 確認儲存並發佈期次
          </button>
        </div>
      )}
    </div>
  );
};

const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' };
const smallInputStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #eee', fontSize: '0.85rem', width: '100%' };
const btnGenerateStyle = { padding: '10px 20px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const btnSaveStyle = { width: '100%', marginTop: '15px', padding: '12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' };

export default AdminBatchManager;