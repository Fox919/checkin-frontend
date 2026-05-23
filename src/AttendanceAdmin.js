import React, { useState, useEffect } from 'react';

const AttendanceAdmin = () => {
  // --- 🆕 1. 多班級動態切換狀態 ---
  const [offerings, setOfferings] = useState([]);               // 所有可選的課程下拉清單
  const [currentOfferingId, setCurrentOfferingId] = useState(''); // 當前選中的課程 ID
  const [enrollments, setEnrollments] = useState([]);           // 當前選中課程的學員考勤清單
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(true);

  // --- 🆕 2. 動態班級特徵狀態 (天數與時段) ---
  const [totalDays, setTotalDays] = useState(8); 
  const [slots, setSlots] = useState([
    { id: 'slot_1', label: '上午簽到' },
    { id: 'slot_2', label: '下午簽到' },
    { id: 'slot_3', label: '下課簽退' }
  ]);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 🔤 智慧姓名格式化：將英文的「姓 在 前」優雅轉換為「名 在 前」
  const formatStudentName = (rawName) => {
    if (!rawName) return '無';
    const trimmed = rawName.trim();
    
    // 檢查是否包含空格，且主要由英文字母組成
    const hasSpace = trimmed.includes(' ');
    const isEnglish = /^[A-Za-z\s,.-]+$/.test(trimmed);

    if (hasSpace && isEnglish) {
      const nameParts = trimmed.split(/\s+/);
      if (nameParts.length > 1) {
        const [lastName, ...firstNameParts] = nameParts;
        // 重新組合：名在前 (firstNameParts)，姓在後 (lastName)
        return `${firstNameParts.join(' ')} ${lastName}`;
      }
    }
    // 中文名或單一單字維持原樣
    return trimmed;
  };

  // --- 🆕 3. 初始化：先撈取所有開班期次作為選單 ---
  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        const onlyCourses = data.filter(item => item.type === 'course');
        setOfferings(onlyCourses);
        if (onlyCourses.length > 0) {
          // 預設選中清單中的第一門課
          setCurrentOfferingId(onlyCourses[0].id);
        }
      })
      .catch(err => console.error("撈取下拉選單班級失敗:", err))
      .finally(() => setCourseLoading(false));
  }, []);

  // --- 🆕 4. 智慧解析當前課程配置 (動態調整天數與時段按鈕) ---
  useEffect(() => {
    if (!currentOfferingId || offerings.length === 0) return;
    
    const currentCourse = offerings.find(o => String(o.id) === String(currentOfferingId));
    if (!currentCourse) return;

    const courseTitle = currentCourse.title || '';
    
    // 🧠 智慧判斷：減壓班或內文含減壓 -> 7天 下午班(時段1+時段3)
    if (courseTitle.includes('減壓')) {
      setTotalDays(7);
      setSlots([
        { id: 'slot_1', label: '下午簽到' },
        { id: 'slot_3', label: '傍晚簽退' }
      ]);
    } else {
      // 預設健身班或其他全天班 -> 8天 3個時段
      setTotalDays(8);
      setSlots([
        { id: 'slot_1', label: '上午簽到' },
        { id: 'slot_2', label: '下午簽到' },
        { id: 'slot_3', label: '下課簽退' }
      ]);
    }

    // 重新載入學員考勤名單
    fetchAttendanceData(currentOfferingId);
  }, [currentOfferingId, offerings]);

  // --- 5. 核心：讀取選定班級的所有學員考勤流水帳 ---
  const fetchAttendanceData = async (offeringId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/course-attendance/${offeringId}`);
      const data = await res.json();
      setEnrollments(data);
    } catch (err) {
      console.error("讀取考勤失敗:", err);
      setEnrollments([]); // 出錯時清空，避免畫面殘留舊班級資料
    } finally {
      setLoading(false);
    }
  };

  // --- 6. 管理員手動切換打卡狀態 ---
  const handleToggleAttendance = async (userId, dayNumber, slotType, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/admin/toggle-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          offeringId: currentOfferingId, // ✨ 動態傳入當前選中的課程 ID
          dayNumber, 
          slotType,  
          status: !currentStatus 
        })
      });

      if (res.ok) {
        fetchAttendanceData(currentOfferingId); 
      }
    } catch (err) {
      alert("同步考勤失敗，請檢查網路");
    }
  };

  // --- 7. 一鍵生成畢業證書 ---
  const handleGraduate = async (userId, rawName) => {
    const displayName = formatStudentName(rawName);
    const confirmGrad = window.confirm(`確定要為學員「${displayName}」生成畢業證書號嗎？`);
    if (!confirmGrad) return;

    try {
      const res = await fetch(`${API_BASE}/admin/evaluate-graduation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, offeringId: currentOfferingId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`🎉 畢業成功！證書號：${data.certificate_no}`);
        fetchAttendanceData(currentOfferingId);
      } else {
        alert(`⚠️ 無法畢業：${data.message}`);
      }
    } catch (err) {
      alert("系統錯誤");
    }
  };

  // 樣式
  const tableHeaderStyle = { padding: '10px', border: '1px solid #ddd', backgroundColor: '#f4f6f7', fontSize: '0.8rem', textAlign: 'center' };
  const tableCellStyle = { padding: '8px', border: '1px solid #ddd', fontSize: '0.85rem', textAlign: 'center' };

  if (courseLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>正在初始化班級選單...</div>;

  return (
    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      
      {/* --- 🆕 8. 頂部多功能班級切換條 --- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
        <div>
          <label style={{ fontWeight: 'bold', marginRight: '10px', color: '#2c3e50', fontSize: '0.95rem' }}>🎯 切換考勤班級：</label>
          <select 
            value={currentOfferingId} 
            onChange={(e) => setCurrentOfferingId(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.95rem', borderRadius: '5px', border: '1px solid #cbd5e1', width: '280px', cursor: 'pointer', fontWeight: 'bold', color: '#e67e22' }}
          >
            {offerings.map(o => (
              <option key={o.id} value={o.id}>
                【ID: {o.id}】{o.title}
              </option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
          當前配置：<strong style={{ color: '#2980b9' }}>{totalDays}天班</strong> ｜ 每天要求 <strong style={{ color: '#2980b9' }}>{slots.length}次打卡</strong>
        </div>
      </div>

      <h3>📊 課程考勤動態看板</h3>
      <p style={{ fontSize: '0.8rem', color: '#666' }}>💡 提示：管理員可直接「點擊」下方任何考勤方塊，手動為學員補簽到或取消簽到。</p>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d', fontWeight: 'bold' }}>🔄 正在載入該班級考勤名單...</div>
      ) : enrollments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fafafa', borderRadius: '6px', color: '#e74c3c', border: '1px dashed #ecc', marginTop: '15px' }}>
          📭 目前此班級內尚無綁定學員。請先至【名單管理】將訪客轉為此課程學員（填寫 ID: {currentOfferingId}）。
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '15px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
            <thead>
              <tr>
                <th style={{ ...tableHeaderStyle, width: '120px', textAlign: 'left' }}>學員姓名</th>
                <th style={{ ...tableHeaderStyle, width: '90px' }}>目前出勤率</th>
                {/* 🆕 動態生成對應天數的表頭 (7天或8天) */}
                {Array.from({ length: totalDays }).map((_, i) => (
                  <th key={i} style={{ ...tableHeaderStyle, minWidth: '100px' }}>Day {i + 1}</th>
                ))}
                <th style={{ ...tableHeaderStyle, width: '150px' }}>畢業證書號</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(student => {
                const rate = parseFloat(student.attendance_rate || 0);
                const isEligible = rate >= 85.0;
                // 🌟 優雅呈現調整後的「名在前、姓在後」名字
                const finalDisplayName = formatStudentName(student.name);

                return (
                  <tr key={student.user_id} style={{ backgroundColor: student.certificate_no ? '#f1fcf6' : '#fff' }}>
                    {/* 姓名 */}
                    <td style={{ ...tableCellStyle, textAlign: 'left', fontWeight: 'bold' }}>
                      {finalDisplayName}
                    </td>
                    
                    {/* 出勤率 */}
                    <td style={{ ...tableCellStyle, fontWeight: 'bold', color: isEligible ? '#28a745' : '#dc3545' }}>
                      {rate}%
                    </td>

                    {/* 動態天數考勤網格 */}
                    {Array.from({ length: totalDays }).map((_, dayIdx) => {
                      const dayNum = dayIdx + 1;
                      
                      return (
                        <td key={dayIdx} style={{ ...tableCellStyle, backgroundColor: '#fdfdfd' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            {/* 🆕 根據當前班別動態渲染 2個 或 3個 按鈕 */}
                            {slots.map(slot => {
                              const hasAttended = student.records?.some(
                                r => r.day_number === dayNum && r.slot_type === slot.id
                              );

                              return (
                                <button
                                  key={slot.id}
                                  title={`第 ${dayNum} 天 - ${slot.label}`}
                                  onClick={() => handleToggleAttendance(student.user_id, dayNum, slot.id, hasAttended)}
                                  style={{
                                    width: '95%',
                                    padding: '3px 4px',
                                    fontSize: '0.7rem',
                                    borderRadius: '3px',
                                    border: '1px solid',
                                    cursor: 'pointer',
                                    transition: 'all 0.1s ease',
                                    backgroundColor: hasAttended ? '#28a745' : '#fff',
                                    color: hasAttended ? '#fff' : '#666',
                                    borderColor: hasAttended ? '#28a745' : '#ccc'
                                  }}
                                >
                                  {slot.label.slice(0, 2)} {hasAttended ? '✓' : '·'}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}

                    {/* 畢業證書 */}
                    <td style={tableCellStyle}>
                      {student.certificate_no ? (
                        <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '0.75rem' }}>
                          🎓 {student.certificate_no}
                        </span>
                      ) : isEligible ? (
                        <button 
                          onClick={() => handleGraduate(student.user_id, student.name)}
                          style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          🎓 點此畢業
                        </button>
                      ) : (
                        <span style={{ color: '#999', fontSize: '0.75rem' }}>未達 85% 門檻</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceAdmin;