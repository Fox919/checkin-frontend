import React, { useState, useEffect } from 'react';

const AttendanceAdmin = () => {
  // --- 多班級動態切換狀態 ---
  const [offerings, setOfferings] = useState([]);               // 所有可選的課程下拉清單
  const [currentOfferingId, setCurrentOfferingId] = useState(''); // 當前選中的課程 ID
  const [enrollments, setEnrollments] = useState([]);           // 當前選中課程的學員考勤清單
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(true);

  // --- 手動更新鎖（修正卡死問題） ---
  const [isUpdating, setIsUpdating] = useState(false); 

  // --- 動態班級特徵狀態 ---
  const [totalDays, setTotalDays] = useState(8); 
  const [slots, setSlots] = useState([
    { id: 'slot_1', label: '上午簽到' },
    { id: 'slot_2', label: '下午簽到' },
    { id: 'slot_3', label: '下課簽退' }
  ]);

  // --- 學員證模組狀態 ---
  const [selectedStudent, setSelectedStudent] = useState(null); // 當前選中要單張列印的學員
  const [showBadgeModal, setShowBadgeModal] = useState(false);  // 控制單張預覽彈窗
  const [showBatchModal, setShowBatchModal] = useState(false);  // 控制「批量六宮格列印」彈窗

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

  // --- 核心：讀取選定班級的考勤流水帳 ---
  const fetchAttendanceData = async (offeringId, isSilent = false) => {
    if (!offeringId) return;
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/course-attendance/${offeringId}`);
      const data = await res.json();
      setEnrollments(data);
    } catch (err) {
      console.error("讀取考勤失敗:", err);
      setEnrollments([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
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

  // --- 全域事件監聽與背景 3 秒輪詢 (帶更新鎖防撞車) ---
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log("📢 偵測到全域學生簽到成功事件！看板即時同步資料中...");
      if (currentOfferingId) {
        fetchAttendanceData(currentOfferingId);
      }
    };

    window.addEventListener('student-checked-in', handleGlobalRefresh);
    
    const attendanceInterval = setInterval(() => {
      if (currentOfferingId && !isUpdating) { 
        console.log("🔄 考勤看板正自動與伺服器同步中...");
        fetchAttendanceData(currentOfferingId, true); 
      }
    }, 3000);

    return () => {
      window.removeEventListener('student-checked-in', handleGlobalRefresh);
      clearInterval(attendanceInterval);
    };
  }, [currentOfferingId, isUpdating]);

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

  // --- 管理員手動切換打卡狀態 ---
  const handleToggleAttendance = async (userId, dayNumber, slotType, currentStatus) => {
    if (isUpdating) return;
    setIsUpdating(true);
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
        await fetchAttendanceData(currentOfferingId, true); 
      } else {
        alert("同步失敗，伺服器無回應");
      }
    } catch (err) {
      alert("同步考勤失敗，請檢查網路");
    } finally {
      setIsUpdating(false);
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

  // --- 開啟學員證預覽 ---
  const handleOpenBadge = (student) => {
    setSelectedStudent(student);
    setShowBadgeModal(true);
  };

  // --- 呼叫原生列印功能 ---
  const handlePrint = () => {
    window.print();
  };

  // --- 將學員名單每 6 個切成一組 (用於六宮格排版) ---
  const chunkEnrollments = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const batchPages = chunkEnrollments(enrollments, 6);
  const currentCourseTitle = offerings.find(o => String(o.id) === String(currentOfferingId))?.title || "健身班";

  // --- 數據統計計算 ---
  const totalStudents = enrollments.length;
  const graduatedCount = enrollments.filter(s => s.certificate_no).length;
  const highAttendanceCount = enrollments.filter(s => parseFloat(s.attendance_rate || 0) >= 85.0).length;

  // 樣式定義
  const tableHeaderStyle = { padding: '10px', border: '1px solid #ddd', backgroundColor: '#f4f6f7', fontSize: '0.8rem', textAlign: 'center' };
  const tableCellStyle = { padding: '8px', border: '1px solid #ddd', fontSize: '0.85rem', textAlign: 'center' };

  if (courseLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>正在初始化班級選單...</div>;

  const qrDataString = selectedStudent 
    ? encodeURIComponent(JSON.stringify({ userId: selectedStudent.user_id, offeringId: currentOfferingId }))
    : '';

  return (
    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      
      {/* 🌟 修正版：列印專用 CSS 控制（徹底解決預覽空白問題） 🌟 */}
      <style>{`
        /* 🖨️ 當按下瀏覽器列印時的精準樣式覆蓋 */
        @media print {
          /* 1. 先把網頁最外層的主體版面全數隱藏 */
          body > div:not(.print-root-ignore) {
            display: none !important;
          }
          
          /* 2. 確保彈窗背景變成完全透明，不遮擋內容 */
          .print-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: none !important;
            display: block !important;
          }

          /* 3. 去除彈窗原本在網頁上的白色小方塊框架和陰影，直接釋放內容 */
          .print-modal-content {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: none !important;
            width: 100% !important;
          }

          /* 4. 批量六宮格滿頁排版設定 */
          .printable-batch-area {
            display: block !important;
          }

          /* 強制每 6 個人的 A4 完結時自動換頁 */
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important; 
            grid-template-rows: repeat(3, 1fr) !important;    
            grid-gap: 5mm !important;
            width: 210mm !important;                          
            height: 297mm !important;                         
            box-sizing: border-box !important;
            padding: 10mm 5mm !important;                         
            background: #fff !important;
          }

          /* 裁切線與區塊精準尺寸 */
          .print-card-box {
            width: 95mm !important;
            height: 90mm !important;
            border: 1px dashed #94a3b8 !important;               
            box-sizing: border-box !important;
            padding: 15px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important; /* 強制 Chrome 打印虛線 */
            print-color-adjust: exact !important;
          }

          /* 隱藏彈窗內的按鈕、標題等不該印出的文字 */
          .no-print { 
            display: none !important; 
          }
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

      {/* --- 人數與狀態即時統計看板 --- */}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>📊 課程考勤動態看板</h3>
        
        {enrollments.length > 0 && (
          <button
            onClick={() => setShowBatchModal(true)}
            style={{ backgroundColor: '#e67e22', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
          >
            🖨️ 批量列印全班學員證 (A4 六宮格版)
          </button>
        )}
      </div>
      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>💡 提示：點擊學員名字旁的 🪪 按鈕可列印單張；點擊右上方按鈕可一次排出 2x3 六宮格 A4 自動分頁列印。</p>
      
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
                    <td style={{ ...tableCellStyle, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>{finalDisplayName}</span>
                        <button 
                          onClick={() => handleOpenBadge(student)}
                          title="預覽與列印單張學員證"
                          style={{ padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          🪪 證照
                        </button>
                      </div>
                    </td>
                    
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
                                  title={`學員: ${finalDisplayName} | Day: ${dayNum} | 節次: ${slot.id} (${slot.label})`}
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

      {/* --- 彈窗 A：單張學員證預覽與列印 --- */}
      {showBadgeModal && selectedStudent && (
        <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="print-modal-content" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', textAlign: 'center', width: '360px' }}>
            <h4 className="no-print" style={{ margin: '0 0 15px 0', color: '#333' }}>🪪 學員證預覽 (單張)</h4>
            
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
              backgroundColor: '#fff'
            }}>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#e67e22', letterSpacing: '1px' }}>{currentCourseTitle}</div>
                <div style={{ fontSize: '0.65rem', color: '#7f8c8d', margin: '2px 0 6px 0' }}>Health & Happiness Retreat</div>
                <div style={{ borderBottom: '1px dashed #e67e22', width: '100%' }}></div>
              </div>

              <div style={{ textAlign: 'center', margin: '10px 0' }}>
                <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>學員姓名</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1a252f', margin: '3px 0' }}>
                  {formatStudentName(selectedStudent.name)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#95a5a6' }}>ID: {selectedStudent.user_id}</div>
              </div>

              <div style={{ padding: '6px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <img 
                  src={`https://quickchart.io/qr?text=${qrDataString}&size=110&margin=1&ecLevel=H`} 
                  alt="QR Code" 
                  style={{ width: '110px', height: '110px', display: 'block' }} 
                />
              </div>

              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2c3e50' }}>洛杉磯菩提禪堂</div>
                <div style={{ fontSize: '0.6rem', color: '#95a5a6', transform: 'scale(0.9)' }}>Los Angeles Bodhi Meditation Center</div>
                <div style={{ fontSize: '0.65rem', color: '#e67e22', fontWeight: 'bold', marginTop: '2px' }}>626-457-5316</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} className="no-print">
              <button onClick={handlePrint} style={{ backgroundColor: '#2ecc71', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ 立即列印</button>
              <button onClick={() => { setShowBadgeModal(false); setSelectedStudent(null); }} style={{ backgroundColor: '#95a5a6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* --- 彈窗 B：2x3 六宮格批量列印預覽系統 --- */}
      {showBatchModal && (
        <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="print-modal-content" style={{ backgroundColor: '#f1f5f9', padding: '25px', borderRadius: '12px', width: '85vw', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #cbd5e1', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>🖨️ 全班學員證批量列印預覽 (每頁 6 張 A4 版面)</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handlePrint} style={{ backgroundColor: '#2ecc71', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  🚀 發送至印表機 (列印)
                </button>
                <button onClick={() => setShowBatchModal(false)} style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  返回看板
                </button>
              </div>
            </div>

            <p className="no-print" style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              💡 排版提示：下方為模擬 A4 效果。虛線為<strong>裁切輔助線</strong>。列印時請務必勾選 <strong>「列印背景圖片/顏色」</strong>。
            </p>

            {/* 批量列印網格容器 */}
            <div className="printable-batch-area">
              {batchPages.map((pageStudents, pageIdx) => (
                <div key={pageIdx} className="print-page-break" style={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #94a3b8', 
                  marginBottom: '30px',
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridGap: '15px',
                  borderRadius: '8px',
                  maxWidth: '750px',
                  margin: '0 auto 30px auto'
                }}>
                  {pageStudents.map(student => {
                    const studentQrString = encodeURIComponent(JSON.stringify({ userId: student.user_id, offeringId: currentOfferingId }));
                    return (
                      <div key={student.user_id} className="print-card-box" style={{
                        border: '1px dashed #cbd5e1',
                        padding: '15px',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '260px',
                        backgroundColor: '#fff'
                      }}>
                        {/* 頂部班級名稱 */}
                        <div style={{ textAlign: 'center', width: '100%' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#e67e22', letterSpacing: '1px' }}>{currentCourseTitle}</div>
                          <div style={{ fontSize: '0.65rem', color: '#7f8c8d', margin: '1px 0' }}>Health & Happiness Retreat</div>
                          <div style={{ borderBottom: '1px solid #f1f5f9', width: '100%', marginTop: '4px' }}></div>
                        </div>

                        {/* 中間學生名字 */}
                        <div style={{ textAlign: 'center', margin: '5px 0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>學員姓名</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b' }}>
                            {formatStudentName(student.name)}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>ID: {student.user_id}</div>
                        </div>

                        {/* 二維碼區塊 */}
                        <div style={{ padding: '4px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                          <img 
                            src={`https://quickchart.io/qr?text=${studentQrString}&size=90&margin=1&ecLevel=H`} 
                            alt="QR" 
                            style={{ width: '90px', height: '90px', display: 'block' }} 
                          />
                        </div>

                        {/* 底部禪堂資訊 */}
                        <div style={{ textAlign: 'center', width: '100%' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#334155' }}>洛杉磯菩提禪堂</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Los Angeles Bodhi Meditation Center</div>
                          <div style={{ fontSize: '0.65rem', color: '#e67e22', fontWeight: 'bold' }}>626-457-5316</div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* 空白格子補齊 */}
                  {pageStudents.length < 6 && Array.from({ length: 6 - pageStudents.length }).map((_, emptyIdx) => (
                    <div key={`empty-${emptyIdx}`} className="print-card-box" style={{ border: '1px dashed #e2e8f0', visibility: 'hidden' }}></div>
                  ))}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceAdmin;