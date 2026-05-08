import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import enUS from 'date-fns/locale/en-US/index.js'; 

import { format, parseISO } from 'date-fns';
import { format, parseISO } from 'date-fns';
//jjhkj
const AdminBatchManager = ({ onSave }) => {
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
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

        <button onClick={handleAutoGenerate} style={{ background: '#3498db', color: '#fff', padding: '10px', cursor: 'pointer' }}>
          Generate Schedule
        </button>
      </div>

      {sessions.length > 0 && (
        <div>
          {sessions.map((s, idx) => (
            <div key={s.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <span>Day {idx + 1}:</span>
              <input 
                type="date" 
                value={s.date} 
                onChange={(e) => {
                  const updated = [...sessions];
                  updated[idx].date = format(parseISO(e.target.value), 'yyyy-MM-dd');
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
              />
            </div>
          ))}
          <button onClick={() => onSave(selectedOfferingId, sessions)} style={{ background: '#2ecc71', color: '#fff', padding: '15px', width: '100%', border: 'none' }}>
            Publish Batch
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminBatchManager;