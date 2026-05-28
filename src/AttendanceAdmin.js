import React, { useState, useEffect } from 'react';

const AttendanceAdmin = () => {
  // --- 多班級動態切換狀態 ---
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

  // --- 學員證模組狀態 ---
  const [selectedStudent, setSelectedStudent] = useState(null); // 當前選中要單張列印的學員

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

  // --- 背景自動輪詢同步（移除干擾鎖，讓數據維持最新） ---
  useEffect(() => {
    const handleGlobalRefresh = () => {
      if (currentOfferingId) fetchAttendanceData(currentOfferingId);
    };
    window.addEventListener('student-checked-in', handleGlobalRefresh);
    
    const attendanceInterval = setInterval(() => {
      if (currentOfferingId) { 
        fetchAttendanceData(currentOfferingId, true); 
      }
    }, 4000); // 稍微拉長到 4 秒，減少修改時與後端寫入衝突的機率

    return () => {
      window.removeEventListener('student-checked-in', handleGlobalRefresh);
      clearInterval(attendanceInterval);
    };
  }, [currentOfferingId]);

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

  // ========================================================
  // ⚡ 優化版：管理員直接修改考勤紀錄（不再需要先刪除別人的紀錄） ⚡
  // ========================================================
  const handleToggleAttendance = async (userId, dayNumber, slotType, currentStatus) => {
    try {
      // 直接發送狀態切換請求，不設定複雜的前端阻擋鎖
      const res = await fetch(`${API_BASE}/admin/toggle-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          offeringId: currentOfferingId, 
          dayNumber, 
          slotType, 
          status: !currentStatus  // 如果原本是 false (未考勤)，點擊直接轉為 true (新增考勤)
        })
      });
      
      if (res.ok) {
        // 修改成功後，立即強制更新當前看板數據，確保畫面同步
        await fetchAttendanceData(currentOfferingId, true);
      } else {
        console.error("後端拒絕修改考勤");
      }
    } catch (err) {
      console.error("網路連線異常，無法修改考勤", err);
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

  // --- 將學員名單每 6 個切成一組 ---
  const chunkEnrollments = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const currentCourseTitle = offerings.find(o => String(o.id) === String(currentOfferingId))?.title || "健身班";

  // --- 批量新開分頁列印機制 ---
  const handlePrintBatchBadges = () => {
    if (enrollments.length === 0) return;
    const batchPages = chunkEnrollments(enrollments, 6);
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      alert("⚠️ 請允許此網站彈出視窗以完成列印！");
      return;
    }

    let htmlContent = `
      <html>
      <head>
        <title>列印學員證 - ${currentCourseTitle}</title>
        <style>
          body { margin: 0; padding: 0; font-family: sans-serif; background-color: #fff; }
          .a4-page { width: 210mm; height: 294mm; box-sizing: border-box; padding: 12mm 8mm; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); grid-gap: 5mm; page-break-after: always; break-after: page; background: #fff; }
          .card-box { width: 94mm; height: 88mm; border: 1px dashed #94a3b8; box-sizing: border-box; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; background: #fff; }
          @media print { body { background: #fff; } .a4-page { page-break-after: always !important; break-after: page !important; } .card-box { border: 1px dashed #94a3b8 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
        </style>
      </head>
      <body>
    `;

    batchPages.forEach((pageStudents) => {
      htmlContent += `<div class="a4-page">`;
      pageStudents.forEach((student) => {
        const studentName = formatStudentName(student.name);
        const qrDataString = encodeURIComponent(JSON.stringify({ userId: student.user_id, offeringId: currentOfferingId }));
        const qrImageUrl = `https://quickchart.io/qr?text=${qrDataString}&size=90&margin=1&ecLevel=H`;

        htmlContent += `
          <div class="card-box">
            <div style="text-align: center; width: 100%;">
              <div style="font-size: 14px; font-weight: bold; color: #e67e22; letter-spacing: 1px;">${currentCourseTitle}</div>
              <div style="font-size: 10px; color: #7f8c8d; margin: 1px 0;">Health & Happiness Retreat</div>
              <div style="border-bottom: 1px solid #f1f5f9; width: 100%; margin-top: 4px;"></div>
            </div>
            <div style="text-align: center; margin: 5px 0;">
              <div style="font-size: 11px; color: #94a3b8;">學員姓名</div>
              <div style="font-size: 20px; font-weight: bold; color: #1e293b;">${studentName}</div>
              <div style="font-size: 11px; color: #94a3b8;">ID: ${student.user_id}</div>
            </div>
            <div style="padding: 4px; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 6px;">
              <img src="${qrImageUrl}" style="width: 90px; height: 90px; display: block;" />
            </div>
            <div style="text-align: center; width: 100%;">
              <div style="font-size: 12px; font-weight: bold; color: #334155;">洛杉磯菩提禪堂</div>
              <div style="font-size: 9px; color: #94a3b8;">Los Angeles Bodhi Meditation Center</div>
              <div style="font-size: 10px; color: #e67e22; font-weight: bold;">626-457-5316</div>
            </div>
          </div>
        `;
      });
      if (pageStudents.length < 6) {
        const emptyCount = 6 - pageStudents.length;
        for (let i = 0; i < emptyCount; i++) {
          htmlContent += `<div class="card-box" style="visibility: hidden;"></div>`;
        }
      }
      htmlContent += `</div>`;
    });

    htmlContent += `
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- 單張列印機制 ---
  const handlePrintSingleBadge = (student) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const studentName = formatStudentName(student.name);
    const qrDataString = encodeURIComponent(JSON.stringify({ userId: student.user_id, offeringId: currentOfferingId }));
    const qrImageUrl = `https://quickchart.io/qr?text=${qrDataString}&size=110&margin=1&ecLevel=H`;

    const htmlContent = `
      <html>
      <head>
        <title>列印學員證 - ${studentName}</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; font-family: sans-serif; }
          .badge-box { width: 74mm; height: 105mm; border: 2px solid #2c3e50; border-radius: 12px; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; align-items: center; background: #fff; }
        </style>
      </head>
      <body>
        <div class="badge-box">
          <div style="text-align: center; width: 100%;">
            <div style="font-size: 14px; font-weight: bold; color: #e67e22;">${currentCourseTitle}</div>
            <div style="font-size: 10px; color: #7f8c8d; margin: 2px 0 6px 0;">Health & Happiness Retreat</div>
            <div style="border-bottom: 1px dashed #e67e22; width: 100%;"></div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 11px; color: #7f8c8d;">學員姓名</div>
            <div style="font-size: 22px; font-weight: bold; color: #1a252f; margin: 3px 0;">${studentName}</div>
            <div style="font-size: 11px; color: #95a5a6;">ID: ${student.user_id}</div>
          </div>
          <div style="padding: 6px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
            <img src="${qrImageUrl}" style="width: 110px; height: 110px; display: block;" />
          </div>
          <div style="text-align: center; width: 100%;">
            <div style="font-size: 12px; font-weight: bold; color: #2c3e50;">洛杉磯菩提禪堂</div>
            <div style="font-size: 9px; color: #95a5a6;">Los Angeles Bodhi Meditation Center</div>
            <div style="font-size: 10px; color: #e67e22; font-weight: bold; margin-top: 2px;">626-457-5316</div>
          </div>
        </div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 300); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const totalStudents = enrollments.length;
  const graduatedCount = enrollments.filter(s => s.certificate_no).length;
  const highAttendanceCount = enrollments.filter(s => parseFloat(s.attendance_rate || 0) >= 85.0).length;

  const tableHeaderStyle = { padding: '10px', border: '1px solid #ddd', backgroundColor: '#f4f6f7', fontSize: '0.8rem', textAlign: 'center' };
  const tableCellStyle = { padding: '8px', border: '1px solid #ddd', fontSize: '0.85rem', textAlign: 'center' };

  if (courseLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>正在初始化班級選單...</div>;

  return (
    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      
      {/* --- 頂部動態班級切換條 --- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
        <div>
          <label style={{ fontWeight: 'bold', marginRight: '10px', color: '#2c3e50', fontSize: '0.95rem' }}>🎯 切換考勤班級：</label>
          <select 
            value={currentOfferingId} 
            onChange={(e) => setCurrentOfferingId(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.95rem', borderRadius: '5px', border: '1px solid #cbd5e1', width: '280px', cursor: 'pointer', fontWeight: 'bold', color: '#e67e22' }}
          >
            {offerings.map(o => (
              <option key={o.id} value={o.id}>【ID: {o.id}】{o.title}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
          當前配置：<strong style={{ color: '#2980b9' }}>{totalDays}天班</strong> ｜ 每天要求 <strong style={{ color: '#2980b9' }}>{slots.length}次打卡</strong>
        </div>
      </div>

      {/* --- 人數統計看板 --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '150px', background: 'linear-gradient(135deg, #3498db, #2980b9)', color: '#fff', padding: '12px 15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>👥 班級總人數</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '2px' }}>{totalStudents} 人</div>
        </div>
        <div style={{ flex: '1', minWidth: '150px', background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: '#fff', padding: '12px 15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>🎓 已畢業人數</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '2px' }}>{graduatedCount} 人</div>
        </div>
        <div style={{ flex: '1', minWidth: '150px', background: 'linear-gradient(135deg, #e67e22, #d35400)', color: '#fff', padding: '12px 15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>📈 出勤達標率 (≥85%)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '2px' }}>
            {highAttendanceCount} 人 ({totalStudents ? Math.round((highAttendanceCount/totalStudents)*100) : 0}%)
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>📊 課程考勤動態看板</h3>
        
        {enrollments.length > 0 && (
          <button
            onClick={handlePrintBatchBadges}
            style={{ backgroundColor: '#e67e22', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
          >
            🖨️ 一鍵批量列印全班學員證 (A4 六宮格版)
          </button>
        )}
      </div>
      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>💡 提示：點擊任何考勤格子（例如：上簽、下簽），可以直接新增或取消該紀錄，無需再預先刪除其他儲存格。</p>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d', fontWeight: 'bold' }}>🔄 正在載入該班級考勤名單...</div>
      ) : enrollments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fafafa', borderRadius: '6px', color: '#e74c3c', border: '1px dashed #ecc', marginTop: '15px' }}>
          📭 目前此班級內尚無綁定學員。
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
                          onClick={() => handlePrintSingleBadge(student)}
                          style={{ padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                          🪪 列印單張
                        </button>
                      </div>
                    </td>
                    
                    <td style={{ ...tableCellStyle, fontWeight: 'bold', color: isEligible ? '#28a745' : '#dc3545' }}>
                      {rate}%
                    </td>

                    {Array.from({ length: totalDays }).map((_, dayIdx) => {
                      const dayNum = dayIdx + 1;
                      return (
                        <td key={dayIdx} style={{ ...tableCellStyle, backgroundColor: '#fdfdfd' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            {slots.map(slot => {
                              const hasAttended = student.records?.some(r => r.day_number === dayNum && r.slot_type === slot.id);
                              return (
                                <button
                                  key={slot.id}
                                  onClick={() => handleToggleAttendance(student.user_id, dayNum, slot.id, hasAttended)}
                                  style={{
                                    width: '95%', padding: '3px 4px', fontSize: '0.7rem', borderRadius: '3px', border: '1px solid', cursor: 'pointer',
                                    backgroundColor: hasAttended ? '#28a745' : '#fff', color: hasAttended ? '#fff' : '#666', borderColor: hasAttended ? '#28a745' : '#ccc'
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
                        <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '0.75rem' }}>🎓 {student.certificate_no}</span>
                      ) : isEligible ? (
                        <button 
                          onClick={() => handleGraduate(student.user_id, student.name)}
                          style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          🎓 點此畢業
                        </button>
                      ) : (
                        <span style={{ color: '#999', fontSize: '0.75rem' }}>未達門檻</span>
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