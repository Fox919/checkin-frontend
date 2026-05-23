import React, { useState, useEffect, useRef } from 'react';
// 💡 提示：請確保專案有安裝 qrcode.react (npm install qrcode.react)
// 如果尚未安裝，此處會使用文字替代，安裝後即可完美呈現二維碼
import QRCode from 'qrcode.react'; 

const AttendanceAdmin = () => {
  // --- 🆕 多班級動態切換狀態 ---
  const [offerings, setOfferings] = useState([]);               // 所有可選的課程下拉清單
  const [currentOfferingId, setCurrentOfferingId] = useState(''); // 當前選中的課程 ID
  const [enrollments, setEnrollments] = useState([]);           // 當前選中課程的學員考勤清單
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(true);

  // --- 動態班級特徵狀態 ---
  const [totalDays, setTotalDays] = useState(8); 
  const [slots, setSlots] = useState([
    { id: 'slot_1', label: '上午簽到' },
    { id: 'slot_2', label: '下午簽到' },
    { id: 'slot_3', label: '下課簽退' }
  ]);

  // --- 🆕 學員證模組狀態 ---
  const [selectedStudent, setSelectedStudent] = useState(null); // 當前選中要列印證件的學員
  const [showBadgeModal, setShowBadgeModal] = useState(false);  // 控制學員證彈窗

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 🔤 智慧姓名格式化：名在前、姓在後
  const formatStudentName = (rawName) => {
    if (!rawName) return '無';
    const trimmed = rawName.trim();
    const hasSpace = trimmed.includes(' ');
    const isEnglish = /^[A-Za-z\s,.-]+$/.test(trimmed);

    if (hasSpace && isEnglish) {
      const nameParts = trimmed.split(/\s+/);
      if (nameParts.length > 1) {
        const [lastName, ...firstNameParts] = nameParts;
        return `${firstNameParts.join(' ')} ${lastName}`;
      }
    }
    return trimmed;
  };

  // --- 初始化：撈取所有開班期次 ---
  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        const onlyCourses = data.filter(item => item.type === 'course');
        setOfferings(onlyCourses);
        if (onlyCourses.length > 0) {
          setCurrentOfferingId(onlyCourses[0].id);
        }
      })
      .catch(err => console.error("撈取下拉選單班級失敗:", err))
      .finally(() => setCourseLoading(false));
  }, []);

  // --- 智慧解析當前課程配置 ---
  useEffect(() => {
    if (!currentOfferingId || offerings.length === 0) return;
    
    const currentCourse = offerings.find(o => String(o.id) === String(currentOfferingId));
    if (!currentCourse) return;

    const courseTitle = currentCourse.title || '';
    
    if (courseTitle.includes('減壓')) {
      setTotalDays(7);
      setSlots([
        { id: 'slot_1', label: '下午簽到' },
        { id: 'slot_3', label: '傍晚簽退' }
      ]);
    } else {
      setTotalDays(8);
      setSlots([
        { id: 'slot_1', label: '上午簽到' },
        { id: 'slot_2', label: '下午簽到' },
        { id: 'slot_3', label: '下課簽退' }
      ]);
    }

    fetchAttendanceData(currentOfferingId);
  }, [currentOfferingId, offerings]);

  // --- 核心：讀取選定班級的考勤流水帳 ---
  const fetchAttendanceData = async (offeringId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/course-attendance/${offeringId}`);
      const data = await res.json();
      setEnrollments(data);
    } catch (err) {
      console.error("讀取考勤失敗:", err);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  // --- 管理員手動切換打卡狀態 ---
  const handleToggleAttendance = async (userId, dayNumber, slotType, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/admin/toggle-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          offeringId: currentOfferingId,
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

  // --- 一鍵生成畢業證書 ---
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

  // --- 🆕 開啟學員證預覽 ---
  const handleOpenBadge = (student) => {
    setSelectedStudent(student);
    setShowBadgeModal(true);
  };

  // --- 🆕 呼叫原生列印功能 (僅列印學員證區塊) ---
  const handlePrintBadge = () => {
    window.print();
  };

  // --- 🆕 數據統計計算 ---
  const totalStudents = enrollments.length;
  const graduatedCount = enrollments.filter(s => s.certificate_no).length;
  const highAttendanceCount = enrollments.filter(s => parseFloat(s.attendance_rate || 0) >= 85.0).length;

  // 樣式
  const tableHeaderStyle = { padding: '10px', border: '1px solid #ddd', backgroundColor: '#f4f6f7', fontSize: '0.8rem', textAlign: 'center' };
  const tableCellStyle = { padding: '8px', border: '1px solid #ddd', fontSize: '0.85rem', textAlign: 'center' };

  if (courseLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>正在初始化班級選單...</div>;

  return (
    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      
      {/* 注入列印專用的 CSS，確保點擊列印時，網頁其他雜項隱藏，只留下學員證卡片 */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-badge-area, #printable-badge-area * { visibility: visible; }
          #printable-badge-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* --- 頂部多功能班級切換條 --- */}
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

      {/* --- 🆕 人數與狀態即時統計看板 --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '150px', background: 'linear-gradient(135deg, #3498db, #2980b9)', color: '#fff', padding: '12px 15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>👥 班級總人數</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '2px' }}>{totalStudents} <span style={{ fontSize: '0.9rem' }}>人</span></div>
        </div>
        <div style={{ flex: '1', minWidth: '150px', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: '#fff', padding: '12px 15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>🎓 已畢業人數</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '2px' }}>{graduatedCount} <span style={{ fontSize: '0.9rem' }}>人</span></div>
        </div>
        <div style={{ flex: '1', minWidth: '150px', background: 'linear-gradient(135deg, #e67e22, #d35400)', color: '#fff', padding: '12px 15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>📈 出勤達標率 (≥85%)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '2px' }}>
            {highAttendanceCount} <span style={{ fontSize: '0.9rem' }}>人 ({totalStudents ? Math.round((highAttendanceCount/totalStudents)*100) : 0}%)</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <h3 style={{ margin: 0 }}>📊 課程考勤動態看板</h3>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>💡 提示：點擊學員名字旁的 🪪 按鈕，可自動導入名字與專屬二維碼並列印學員證。</p>
      
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
                <th style={{ ...tableHeaderStyle, width: '160px', textAlign: 'left' }}>學員姓名 / 證件</th>
                <th style={{ ...tableHeaderStyle, width: '90px' }}>目前出勤率</th>
                {/* 動態生成對應天數的表頭 */}
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
                const finalDisplayName = formatStudentName(student.name);

                return (
                  <tr key={student.user_id} style={{ backgroundColor: student.certificate_no ? '#f1fcf6' : '#fff' }}>
                    {/* 🆕 姓名與學員證列印快捷鍵 */}
                    <td style={{ ...tableCellStyle, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>{finalDisplayName}</span>
                        <button 
                          onClick={() => handleOpenBadge(student)}
                          title="預覽與列印學員證"
                          style={{ padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          🪪 證照
                        </button>
                      </div>
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

      {/* --- 🆕 9. 學員證優雅彈窗預覽與列印系統 --- */}
      {showBadgeModal && selectedStudent && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', textAlign: 'center', width: '360px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🪪 學員證預覽</h4>
            
            {/* 📥 學員證樣式模板區塊（可依實際規格調整寬高、背景色與字體） */}
            <div id="printable-badge-area" style={{ 
              width: '280px', 
              height: '420px', 
              border: '2px solid #2c3e50', 
              borderRadius: '12px', 
              margin: '0 auto 20px auto', 
              padding: '20px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff',
              background: 'linear-gradient(to bottom, #f8fbfd 0%, #ffffff 100%)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
            }}>
              {/* 模板頭部 */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#e67e22', letterSpacing: '2px', marginBottom: '4px' }}>OFFICIAL STUDENT ID</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #e67e22', paddingBottom: '8px' }}>
                  {offerings.find(o => String(o.id) === String(currentOfferingId))?.title || "大會課程"}
                </div>
              </div>

              {/* 核心：動態帶入格式化姓名 */}
              <div style={{ textAlign: 'center', margin: '15px 0' }}>
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '2px' }}>學員姓名</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a252f' }}>
                  {formatStudentName(selectedStudent.name)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#95a5a6', marginTop: '4px' }}>ID: {selectedStudent.user_id}</div>
              </div>

              {/* 核心：動態生成二維碼 (帶入學員ID供現場掃描打卡) */}
              <div style={{ padding: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {typeof QRCode !== 'undefined' ? (
                  <QRCode 
                    value={JSON.stringify({ userId: selectedStudent.user_id, offeringId: currentOfferingId })} 
                    size={110} 
                    fgColor="#2c3e50"
                  />
                ) : (
                  <div style={{ width: '110px', height: '110px', backgroundColor: '#eee', fontSize: '0.65rem', padding: '10px' }}>
                    請先安裝 qrcode.react 庫以呈現二維碼
                  </div>
                )}
              </div>

              {/* 模板尾部 */}
              <div style={{ fontSize: '0.65rem', color: '#bdc3c7', textAlign: 'center', width: '100%' }}>
                憑本證件至各打卡處掃描登記
              </div>
            </div>

            {/* 操作按鈕 */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={handlePrintBadge}
                style={{ backgroundColor: '#2ecc71', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🖨️ 立即列印
              </button>
              <button 
                onClick={() => { setShowBadgeModal(false); setSelectedStudent(null); }}
                style={{ backgroundColor: '#95a5a6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceAdmin;