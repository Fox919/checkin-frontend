import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
// 修正引用路徑以避免 Critical dependency 警告
import enUS from 'date-fns/locale/en-US';
import { format, parseISO } from 'date-fns';

const AdminBatchManager = ({ onSave }) => {
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [totalDays, setTotalDays] = useState(8);
  const [courseType, setCourseType] = useState('Full Day'); // 確保這裡有正確定義
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
      alert("Please fill all fields!");
      return;
    }

    const newSessions = [];
    let current = new Date(startDate);

    for (let i = 0; i < totalDays; i++) {
      const dateStr = format(current, 'yyyy-MM-dd');
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

  return (
    <div>
       {/* 確保這裡有用到 setCourseType 就不會報 ESLint 錯誤 */}
       <select value={courseType} onChange={(e) => setCourseType(e.target.value)}>
          <option value="Full Day">Full Day</option>
          <option value="AM Session">AM</option>
          <option value="PM Session">PM</option>
       </select>
       {/* ... 其餘代碼 ... */}
       <button onClick={handleAutoGenerate}>Generate</button>
    </div>
  );
};

export default AdminBatchManager;