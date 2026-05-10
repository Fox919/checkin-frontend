import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { enUS } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

const AdminBatchManager = ({ onSave }) => {
  // --- 權限控管狀態 ---
  const [authorized, setAuthorized] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  // --- 原有的開班狀態 ---
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [totalDays, setTotalDays] = useState(8);
  const [courseType, setCourseType] = useState('Full Day');
  const [sessions, setSessions] = useState([]);
  const [offeringList, setOfferingList] = useState([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    if (authorized) { // 只有通過驗證才抓資料
      fetch(`${API_BASE}/api/offerings`)
        .then(res => res.json())
        .then(data => {
          setOfferingList(data.filter(i => i.type === 'course'));
        })
        .catch(err => console.error("Fetch error:", err));
    }
  }, [authorized]);

  // 密碼驗證邏輯
  const handlePasswordSubmit = () => {
    if (tempPassword === "my789") { // 這裡設定你的開班管理密碼
      setAuthorized(true);
      setTempPassword('');
    } else {
      alert("密碼錯誤！");
    }
  };

  const handleAutoGenerate = () => {
    if (!batchName || !startDate || !selectedOfferingId) {
      alert("Please select a course and enter batch details.");
      return;
    }
    const newSessions = [];
    let current = new Date(startDate);
    for (let i = 0; i < totalDays; i++) {
      newSessions.push({
        id: Date.now() + i,
        date: format(current, 'yyyy-MM-dd'),
        label: i === 0 ? `${batchName}` : `Day ${i + 1} (${courseType})`,
        is_start: i === 0,
        type: courseType
      });
      current.setDate(current.getDate() + 1);
    }
    setSessions(newSessions);
  };

  // --- 1. 如果尚未授權，顯示密碼鎖定畫面 ---
  if (!authorized) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f9f9f9', borderRadius: '10px' }}>
        <h3 style={{ marginBottom: '20px' }}>🔐 開班管理權限驗證</h3>
        <input 
          type="password" 
          placeholder="請輸入管理密碼" 
          value={tempPassword} 
          onChange={(e) => setTempPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', marginRight: '10px' }}
        />
        <button 
          onClick={handlePasswordSubmit}
          style={{ padding: '10px 20px', background: '#e67e22', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          解鎖
        </button>
      </div>
    );
  }

  // --- 2. 授權通過後顯示原本的管理介面 ---
  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '10px' }}>
      <h3>Course Batch Manager</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <select value={selectedOfferingId} onChange={(e) => setSelectedOfferingId(e.target.value)}>
          <option value="">-- Select Course --</option>
          {offeringList.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>

        <input placeholder="Batch Name" value={batchName} onChange={(e) => setBatchName(e.target.value)} />

        <DatePicker 
          selected={startDate} 
          onChange={(date) => setStartDate(date)} 
          locale={enUS} 
          dateFormat="yyyy-MM-dd"
        />

        <select value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))}>
          <option value={7}>7 Days</option>
          <option value={8}>8 Days</option>
        </select>

        <select value={courseType} onChange={(e) => setCourseType(e.target.value)}>
          <option value="Full Day">Full Day</option>
          <option value="AM Session">AM Session</option>
          <option value="PM Session">PM Session</option>
        </select>

        <button onClick={handleAutoGenerate} style={{ background: '#3498db', color: '#fff', padding: '10px', cursor: 'pointer', border: 'none', borderRadius: '5px' }}>
          Generate Schedule
        </button>
      </div>

      {sessions.length > 0 && (
        <div>
          {sessions.map((s, idx) => (
            <div key={s.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{ minWidth: '60px' }}>Day {idx + 1}:</span>
              <input 
                type="date" 
                value={s.date} 
                onChange={(e) => {
                  const updated = [...sessions];
                  updated[idx].date = e.target.value;
                  setSessions(updated);
                }} 
              />
              <input 
                value={s.label} 
                onChange={(e) => {
                  const updated = [...sessions];
                  updated[idx].label = e.target.value;
                  setSessions(updated);
                }} 
                style={{ flex: 1, padding: '5px' }}
              />
            </div>
          ))}
          <button 
            onClick={() => onSave(selectedOfferingId, sessions)} 
            style={{ background: '#2ecc71', color: '#fff', padding: '15px', width: '100%', border: 'none', borderRadius: '5px', marginTop: '10px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            Publish Batch
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminBatchManager;