import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { enUS } from 'date-fns/locale';
import { format } from 'date-fns';

const AdminBatchManager = ({ onSave }) => {
  // --- 權限控管狀態 ---
  const [authorized, setAuthorized] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  // --- 開班狀態 ---
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [totalDays, setTotalDays] = useState(8);
  const [courseType, setCourseType] = useState('Full Day'); // Full Day, AM Session, PM Session
  const [sessions, setSessions] = useState([]);
  const [offeringList, setOfferingList] = useState([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');

  // 🌟 新增：對應後端 Slot 的具體打卡時間區間狀態
  const [slot1Start, setSlot1Start] = useState('08:00:00');
  const [slot1End, setSlot1End] = useState('11:00:00');
  const [slot2Start, setSlot2Start] = useState('13:00:00');
  const [slot2End, setSlot2End] = useState('15:00:00');
  const [slot3Start, setSlot3Start] = useState('17:00:00');
  const [slot3End, setSlot3End] = useState('19:00:00');

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    if (authorized) { 
      fetch(`${API_BASE}/api/offerings`)
        .then(res => res.json())
        .then(data => {
          setOfferingList(data.filter(i => i.type === 'course'));
        })
        .catch(err => console.error("Fetch error:", err));
    }
  }, [authorized]);

  // 當切換課程型態時，自動預設合理的打卡區間與名稱，省去手動輸入時間
  useEffect(() => {
    if (courseType === 'Full Day') {
      setSlot1Start('08:00:00'); setSlot1End('11:00:00');
      setSlot2Start('13:00:00'); setSlot2End('15:00:00');
      setSlot3Start('17:00:00'); setSlot3End('19:00:00');
    } else if (courseType === 'AM Session') {
      setSlot1Start('08:00:00'); setSlot1End('11:00:00');
      setSlot2Start(null); setSlot2End(null); // 上午班關閉二、三節
      setSlot3Start(null); setSlot3End(null);
    } else if (courseType === 'PM Session') {
      setSlot1Start('13:00:00'); setSlot1End('15:00:00'); // 下午班將第一節移到下午上課簽到
      setSlot2Start(null); setSlot2End(null);
      setSlot3Start('17:00:00'); setSlot3End('19:00:00'); // 下午班保留下課簽退
    }
  }, [courseType]);

  const handlePasswordSubmit = () => {
    if (tempPassword === "my789") { 
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

  // 🌟 計算總共需要打卡幾次 (用來計算 85% 畢業門檻)
  const calculateTotalCheckinsRequired = () => {
    let checkinsPerDay = 3; // Full Day 預設一天 3 次
    if (courseType === 'AM Session') checkinsPerDay = 1;
    if (courseType === 'PM Session') checkinsPerDay = 2;
    return totalDays * checkinsPerDay;
  };

  // 🌟 包裝完整的配置資料發送給父層或後端
  const handlePublish = () => {
    const totalRequired = calculateTotalCheckinsRequired();
    
    // 把考勤時段規則包進配置物件中
    const configPayload = {
      course_style: courseType === 'Full Day' ? 'full_day' : (courseType === 'AM Session' ? 'morning_only' : 'afternoon_only'),
      total_checkins_required: totalRequired,
      slot_1_start: slot1Start,
      slot_1_end: slot1End,
      slot_2_start: slot2Start,
      slot_2_end: slot2End,
      slot_3_start: slot3Start,
      slot_3_end: slot3End,
      sessions: sessions // 原有的排班細節
    };

    // 呼叫原本的儲存發布函式
    onSave(selectedOfferingId, configPayload);
  };

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
        <button onClick={handlePasswordSubmit} style={{ padding: '10px 20px', background: '#e67e22', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          解鎖
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '10px' }}>
      <h3>Course Batch Manager</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>1. 選擇基礎課程</label>
        <select value={selectedOfferingId} onChange={(e) => setSelectedOfferingId(e.target.value)}>
          <option value="">-- Select Course --</option>
          {offeringList.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>

        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>2. 填寫本期名稱與開課日</label>
        <input placeholder="Batch Name (e.g. 第2605期健身班)" value={batchName} onChange={(e) => setBatchName(e.target.value)} />

        <DatePicker 
          selected={startDate} 
          onChange={(date) => setStartDate(date)} 
          locale={enUS} 
          dateFormat="yyyy-MM-dd"
        />

        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>3. 設定天數與班別型態</label>
        <select value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))}>
          <option value={7}>7 Days</option>
          <option value={8}>8 Days</option>
        </select>

        <select value={courseType} onChange={(e) => setCourseType(e.target.value)}>
          <option value="Full Day">Full Day (全天班 - 一天3次考勤)</option>
          <option value="AM Session">AM Session (半天上午班 - 一天1次考勤)</option>
          <option value="PM Session">PM Session (半天下午/晚上班 - 一天2次考勤)</option>
        </select>

        {/* 🌟 新增：允許現場隨時微調微調打卡區間（例如移到晚上時可手動改） */}
        <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '5px', fontSize: '0.8rem' }}>
          <span style={{ fontWeight: 'bold' }}>⚙️ 本期考勤區間微調預覽：</span>
          {slot1Start && <div style={{ marginTop: '5px' }}>時段一：<input type="text" value={slot1Start} onChange={(e) => setSlot1Start(e.target.value)} style={{ width: '70px' }} /> ~ <input type="text" value={slot1End} onChange={(e) => setSlot1End(e.target.value)} style={{ width: '70px' }} /></div>}
          {slot2Start && <div style={{ marginTop: '5px' }}>時段二：<input type="text" value={slot2Start} onChange={(e) => setSlot2Start(e.target.value)} style={{ width: '70px' }} /> ~ <input type="text" value={slot2End} onChange={(e) => setSlot2End(e.target.value)} style={{ width: '70px' }} /></div>}
          {slot3Start && <div style={{ marginTop: '5px' }}>時段三：<input type="text" value={slot3Start} onChange={(e) => setSlot3Start(e.target.value)} style={{ width: '70px' }} /> ~ <input type="text" value={slot3End} onChange={(e) => setSlot3End(e.target.value)} style={{ width: '70px' }} /></div>}
          <div style={{ marginTop: '5px', color: '#e67e22', fontWeight: 'bold' }}>🎯 本期 graduation 總要求打卡次數：{calculateTotalCheckinsRequired()} 次</div>
        </div>

        <button onClick={handleAutoGenerate} style={{ background: '#3498db', color: '#fff', padding: '10px', cursor: 'pointer', border: 'none', borderRadius: '5px' }}>
          Generate Schedule
        </button>
      </div>

      {sessions.length > 0 && (
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>4. 核對每日日期流水帳</label>
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
            onClick={handlePublish} 
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