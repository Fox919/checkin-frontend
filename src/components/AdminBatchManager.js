import React, { useState, useEffect } from 'react';

const AdminBatchManager = ({ onSave }) => {
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalDays, setTotalDays] = useState(8);
  const [courseType, setCourseType] = useState('Full Day');
  const [sessions, setSessions] = useState([]);

  const [offeringList, setOfferingList] = useState([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 1. Fetch available courses on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        // Filter for items of type 'course'
        setOfferingList(data.filter(i => i.type === 'course'));
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  // 2. Auto-generate daily sessions logic
  const handleAutoGenerate = () => {
    if (!batchName || !startDate || !selectedOfferingId) {
      alert("Please select a course, enter batch name, and choose a start date.");
      return;
    }

    const newSessions = [];
    // Split date to avoid timezone offset issues
    const [year, month, day] = startDate.split('-').map(Number);
    let current = new Date(year, month - 1, day);

    for (let i = 0; i < totalDays; i++) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      newSessions.push({
        id: Date.now() + i,
        date: dateStr,
        // Labeling in English: Day 1, Day 2, etc.
        label: i === 0 ? `${batchName}` : `Day ${i + 1} (${courseType})`,
        is_start: i === 0,
        type: courseType
      });
      
      // Increment date by 1 day
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
    <div style={{ background: '#f4f7f6', padding: '20px', borderRadius: '15px', maxWidth: '800px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', color: '#2c3e50' }}>
        📅 Intensive Batch Management
      </h3>

      {/* --- Section A: Select Course --- */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Step 1: Select Course Offering</label>
        <select 
          value={selectedOfferingId} 
          onChange={(e) => setSelectedOfferingId(e.target.value)}
          style={inputStyle}
        >
          <option value="">-- Select Course (e.g., Fitness Class) --</option>
          {offeringList.map(item => (
            <option key={item.id} value={item.id}>{item.title}</option>
          ))}
        </select>
      </div>

      {/* --- Section B: Batch Configuration --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '10px', marginBottom: '20px', alignItems: 'end' }}>
        <div>
          <label style={labelStyle}>Batch Name</label>
          <input type="text" placeholder="June Intensive" value={batchName} onChange={(e) => setBatchName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Days</label>
          <select value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))} style={inputStyle}>
            <option value="7">7 Days</option>
            <option value="8">8 Days</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Default Session</label>
          <select value={courseType} onChange={(e) => setCourseType(e.target.value)} style={inputStyle}>
            <option value="Full Day">Full Day</option>
            <option value="AM Session">AM Session</option>
            <option value="PM Session">PM Session</option>
          </select>
        </div>
        <button onClick={handleAutoGenerate} style={btnGenerateStyle}>Generate</button>
      </div>

      {/* --- Section C: Preview & Edit List --- */}
      {sessions.length > 0 && (
        <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h4 style={{ marginTop: 0, fontSize: '0.9rem', color: '#7f8c8d' }}>Preview Schedule</h4>
          {sessions.map((s, idx) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '80px 150px 1fr 120px', gap: '10px', marginBottom: '8px', alignItems: 'center', borderBottom: '1px solid #f9f9f9', paddingBottom: '5px' }}>
              <span style={{ fontWeight: 'bold', color: '#34495e' }}>{idx === 0 ? "Start" : `Day ${idx+1}`}</span>
              <input type="date" value={s.date} onChange={(e) => updateSession(idx, 'date', e.target.value)} style={smallInputStyle} />
              <input type="text" value={s.label} onChange={(e) => updateSession(idx, 'label', e.target.value)} style={smallInputStyle} />
              <select value={s.type} onChange={(e) => updateSession(idx, 'type', e.target.value)} style={smallInputStyle}>
                <option value="Full Day">Full Day</option>
                <option value="AM Session">AM Session</option>
                <option value="PM Session">PM Session</option>
              </select>
            </div>
          ))}
          
          <button 
            onClick={() => onSave(selectedOfferingId, sessions)} 
            style={btnSaveStyle}
          >
            ✅ Save & Publish Schedule
          </button>
        </div>
      )}
    </div>
  );
};

// Styles
const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' };
const smallInputStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #eee', fontSize: '0.85rem', width: '100%' };
const btnGenerateStyle = { padding: '10px 20px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const btnSaveStyle = { width: '100%', marginTop: '15px', padding: '12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' };

export default AdminBatchManager;