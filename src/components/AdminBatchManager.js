import React, { useState, useEffect } from 'react';
// 引入 DatePicker 與樣式
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
// 引入語系設定
import { enUS } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

const AdminBatchManager = ({ onSave }) => {
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState(new Date()); // 預設今天
  const [totalDays, setTotalDays] = useState(8);
  const [courseType, setCourseType] = useState('Full Day');
  const [sessions, setSessions] = useState([]);
  const [offeringList, setOfferingList] = useState([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        setOfferingList(data.filter(i => i.type === 'course'));
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  // 自動產生排程
  const handleAutoGenerate = () => {
    if (!batchName || !startDate || !selectedOfferingId) {
      alert("Please select a course, enter batch name, and choose a start date.");
      return;
    }

    const newSessions = [];
    let current = new Date(startDate);

    for (let i = 0; i < totalDays; i++) {
      const dateStr = format(current, 'yyyy-MM-dd'); // 格式化為資料庫需要的字串

      newSessions.push({
        id: Date.now() + i,
        date: dateStr,
        label: i === 0 ? `${batchName}` : `Day ${i + 1} (${courseType})`,
        is_start: i === 0,
        type: courseType
      });
      
      current.setDate(current.getDate() + 1);
    }
    setSessions(newSessions);
  };

  const updateSessionDate = (idx, newDate) => {
    const updated = [...sessions];
    updated[idx].date = format(newDate, 'yyyy-MM-dd');
    setSessions(updated);
  };

  return (
    <div style={{ background: '#f4f7f6', padding: '20px', borderRadius: '15px', maxWidth: '900px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', color: '#2c3e50' }}>
        📅 Intensive Batch Management
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        {/* Step 1: Course Selection */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Step 1: Select Course Offering</label>
          <select value={selectedOfferingId} onChange={(e) => setSelectedOfferingId(e.target.value)} style={inputStyle}>
            <option value="">-- Select Course --</option>
            {offeringList.map(item => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </div>

        {/* Batch Info */}
        <div>
          <label style={labelStyle}>Batch Name</label>
          <input type="text" placeholder="e.g. May Intensive" value={batchName} onChange={(e) => setBatchName(e.target.value)} style={inputStyle} />
        </div>

        {/* 這裡改用 React DatePicker */}
        <div>
          <label style={labelStyle}>Start Date (Forced English)</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            locale={enUS}           // 強制英文語系
            dateFormat="yyyy-MM-dd" // 顯示格式
            placeholderText="Select Date"
            customInput={<input style={inputStyle} />} // 讓它跟原本樣式一致
          />
        </div>

        <div>
          <label style={labelStyle}>Days</label>
          <select value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))} style={inputStyle}>
            <option value="7">7 Days</option>
            <option value="8">8 Days</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={handleAutoGenerate} style={btnGenerateStyle}>Generate</button>
        </div>
      </div>

      {/* Preview Schedule */}
      {sessions.length > 0 && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 15px rgba(0,0,0,0.1)' }}>
          <h4 style={{ marginTop: 0, color: '#7f8c8d' }}>Preview Schedule</h4>
          {sessions.map((s, idx) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 150px', gap: '15px', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>Day {idx + 1}</span>
              
              {/* 列表中的日期也可以用 DatePicker */}
              <DatePicker
                selected={parseISO(s.date)}
                onChange={(date) => updateSessionDate(idx, date)}
                locale={enUS}
                dateFormat="yyyy-MM-dd"
                customInput={<input style={smallInputStyle} />}
              />

              <input 
                type="text" 
                value={s.label} 
                onChange={(e) => {
                  const updated = [...sessions];
                  updated[idx].label = e.target.value;
                  setSessions(updated);
                }} 
                style={smallInputStyle} 
              />

              <select 
                value={s.type} 
                onChange={(e) => {
                  const updated = [...sessions];
                  updated[idx].type = e.target.value;
                  setSessions(updated);
                }} 
                style={smallInputStyle}
              >
                <option value="Full Day">Full Day</option>
                <option value="AM Session">AM</option>
                <option value="PM Session">PM</option>
              </select>
            </div>
          ))}
          
          <button onClick={() => onSave(selectedOfferingId, sessions)} style={btnSaveStyle}>
            ✅ Publish Schedule
          </button>
        </div>
      )}
    </div>
  );
};

// 樣式保持不變
const labelStyle = { fontSize: '0.8rem', fontWeight: 'bold', color: '#555', marginBottom: '5px', display: 'block' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '1rem' };
const smallInputStyle = { padding: '8px', borderRadius: '5px', border: '1px solid #eee', width: '100%' };
const btnGenerateStyle = { width: '100%', padding: '10px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const btnSaveStyle = { width: '100%', marginTop: '20px', padding: '15px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' };

export default AdminBatchManager;