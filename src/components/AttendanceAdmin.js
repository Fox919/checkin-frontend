import React, { useState, useEffect } from 'react';

const AttendanceAdmin = ({ offeringId = 1 }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 模擬總天數與每節課時段
  const totalDays = 8;
  const slots = [
    { id: 'slot_1', label: '上午簽到' },
    { id: 'slot_2', label: '下午簽到' },
    { id: 'slot_3', label: '下課簽退' }
  ];

  // 1. 讀取該堂課所有學員與考勤流水帳
  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // 🔗 實務上從後端 API 撈取整合後的選課名單與考勤紀錄
      // 假設後端回傳的結構包含：user_id, name, attendance_rate, certificate_no, records (已打卡的清單)
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/course-attendance/${offeringId}`);
      const data = await res.json();
      setEnrollments(data);
    } catch (err) {
      console.error("讀取考勤失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [offeringId]);

  // 🌟 2. 管理員手動點擊格子：切換打卡狀態 (已簽到 <-> 未簽到)
  const handleToggleAttendance = async (userId, dayNumber, slotType, currentStatus) => {
    try {
      // 🔗 對接後端手動修改 API
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/toggle-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          offeringId,
          dayNumber, // 第幾天 (1~8)
          slotType,  // 'slot_1', 'slot_2', 'slot_3'
          status: !currentStatus // 把它反轉
        })
      });

      if (res.ok) {
        // 畫面上即時更新狀態與出勤率，免去整頁刷新
        fetchAttendanceData(); 
      }
    } catch (err) {
      alert("同步考勤失敗，請檢查網路");
    }
  };

  // 🎓 3. 一鍵生成畢業證書
  const handleGraduate = async (userId) => {
    const confirmGrad = window.confirm("確定為該學員生成畢業證書號嗎？");
    if (!confirmGrad) return;

    try {
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/evaluate-graduation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, offeringId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`🎉 畢業成功！證書號：${data.certificate_no}`);
        fetchAttendanceData();
      } else {
        alert(`⚠️ 無法畢業：${data.message}`);
      }
    } catch (err) {
      alert("系統錯誤");
    }
  };

  // 樣式定義 (保持你原本乾淨 Scannable 的風格)
  const tableHeaderStyle = { padding: '10px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', fontSize: '0.8rem', textAlign: 'center' };
  const tableCellStyle = { padding: '8px', border: '1px solid #ddd', fontSize: '0.85rem', textAlign: 'center' };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>考勤載入中...</div>;

  return (
    <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h3>📊 課程考勤動態看板 (8天健身班)</h3>
      <p style={{ fontSize: '0.8rem', color: '#666' }}>💡 提示：此表格與前台掃碼同步。管理員可直接「點擊」下方任何考勤方塊，手動為學員補簽到或取消簽到。</p>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
          <thead>
            <tr>
              <th style={{ ...tableHeaderStyle, width: '100px', textAlign: 'left' }}>學員姓名</th>
              <th style={{ ...tableHeaderStyle, width: '90px' }}>目前出勤率</th>
              {/* 動態生成 Day 1 到 Day 8 的表頭 */}
              {Array.from({ length: totalDays }).map((_, i) => (
                <th key={i} style={{ ...tableHeaderStyle, minWidth: '100px' }}>Day {i + 1}</th>
              ))}
              <th style={{ ...tableHeaderStyle, width: '150px' }}>畢業證書號</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map(student => {
              const rate = parseFloat(student.attendance_rate || 0);
              const isEligible = rate >= 85.0; // 是否達到 85% 門檻

              return (
                <tr key={student.user_id} style={{ backgroundColor: student.certificate_no ? '#f1fcf6' : '#fff' }}>
                  {/* 姓名 */}
                  <td style={{ ...tableCellStyle, textAlign: 'left', fontWeight: 'bold' }}>
                    {student.name}
                  </td>
                  
                  {/* 出勤率比例 */}
                  <td style={{ ...tableCellStyle, fontWeight: 'bold', color: isEligible ? '#28a745' : '#dc3545' }}>
                    {rate}%
                  </td>

                  {/* Day 1 ~ Day 8 考勤方塊核心區塊 */}
                  {Array.from({ length: totalDays }).map((_, dayIdx) => {
                    const dayNum = dayIdx + 1;
                    
                    return (
                      <td key={dayIdx} style={{ ...tableCellStyle, backgroundColor: '#fdfdfd' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          {slots.map(slot => {
                            // 🔍 檢查此學員、這一天、這個時段是否有打卡紀錄
                            // 實務上這裏比對 student.records 陣列
                            const hasAttended = student.records?.some(
                              r => r.day_number === dayNum && r.slot_type === slot.id
                            );

                            return (
                              <button
                                key={slot.id}
                                title={`第 ${dayNum} 天 - ${slot.label}`}
                                onClick={() => handleToggleAttendance(student.user_id, dayNum, slot.id, hasAttended)}
                                style={{
                                  width: '90%',
                                  padding: '2px 4px',
                                  fontSize: '0.7rem',
                                  borderRadius: '3px',
                                  border: '1px solid',
                                  cursor: 'pointer',
                                  transition: 'all 0.1s ease',
                                  // 根據打卡狀態動態著色
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

                  {/* 畢業資格 / 證書號生成 */}
                  <td style={tableCellStyle}>
                    {student.certificate_no ? (
                      <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '0.75rem' }}>
                        🎓 {student.certificate_no}
                      </span>
                    ) : isEligible ? (
                      <button 
                        onClick={() => handleGraduate(student.user_id)}
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
    </div>
  );
};

export default AttendanceAdmin;