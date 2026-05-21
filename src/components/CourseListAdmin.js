import React, { useState, useEffect } from 'react';

const CourseListAdmin = () => {
  const [courses, setCourses] = useState([]);
  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        // 嚴格過濾，只留下密集班課程
        const onlyCourses = data.filter(item => item.type === 'course');
        setCourses(onlyCourses);
      })
      .catch(err => console.error("撈取課程失敗:", err));
  }, []);

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '10px' }}>
      <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>📅 課程與期次總覽看板</h3>
      <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>提示：將訪客轉為學員時，請填寫下方對應的【課程 ID】。</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f6f7', textAlign: 'left', borderBottom: '2px solid #bdc3c7' }}>
            <th style={{ padding: '12px' }}>課程 ID</th>
            <th style={{ padding: '12px' }}>課程名稱/期次</th>
            <th style={{ padding: '12px' }}>天數</th>
            <th style={{ padding: '12px' }}>班別型態</th>
            <th style={{ padding: '12px' }}>當期打卡時間區間</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>總要求次數</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(c => {
            // 1. 智慧解析 JSON
            let cfg = {};
            let rawConfigString = '';
            try {
              rawConfigString = typeof c.config === 'string' ? c.config : JSON.stringify(c.config || {});
              cfg = JSON.parse(rawConfigString);
            } catch (e) {
              cfg = {};
            }

            // 2. 提取實際的配置區塊 (相容陣列與物件格式)
            const actualConfig = cfg.sessions && !Array.isArray(cfg.sessions) ? cfg.sessions : cfg;
            
            // 3. 智慧多重交叉比對機制
            const style = actualConfig.course_style || '';
            const allTextContext = (
              (c.title || '') + 
              (c.schedule_desc || '') + 
              (c.duration_desc || '') + 
              rawConfigString
            ).toLowerCase();

            let styleLabel = '☀️🌙 全天班'; // 預設
            let isHalfDay = false;

            if (style === 'morning_only' || style === 'afternoon_only') {
              isHalfDay = true;
              styleLabel = style === 'morning_only' ? '🌅 上午班' : '🌆 下午/晚班';
            } 
            else if (
              allTextContext.includes('半天') || 
              allTextContext.includes('下午') || 
              allTextContext.includes('減壓') || 
              allTextContext.includes('evening') || 
              allTextContext.includes('afternoon')
            ) {
              isHalfDay = true;
              styleLabel = allTextContext.includes('上午') || allTextContext.includes('morning') 
                ? '🌅 上午班' 
                : '🌆 下午/晚班';
            }

            // 4. ✨ ✨ ✨ 修正點：精準提取天數
            // 優先檢查資料庫是否有傳 duration_desc，並從中提取數字（例如 "7天" -> 7）
            let totalDays = 8; // 最終兜底
            if (c.duration_desc) {
              const match = c.duration_desc.match(/\d+/);
              if (match) {
                totalDays = parseInt(match[0], 10);
              }
            } else if (actualConfig.sessions && Array.isArray(actualConfig.sessions)) {
              // 如果沒填欄位，就用產生的流水帳天數陣列長度來當作天數
              totalDays = actualConfig.sessions.length || 8;
            }

            // 5. ✨ 智慧計算總要求次數（不再讓 24 次蓋掉半天班的設定）
            let totalCheckins = actualConfig.total_checkins_required;
            
            // 如果資料庫沒提供次數，或者次數是預設的 24 且目前其實是半天班，就強制重新動態計算
            if (!totalCheckins || (totalCheckins === 24 && isHalfDay)) {
              if (isHalfDay) {
                totalCheckins = styleLabel === '🌅 上午班' ? totalDays * 1 : totalDays * 2;
              } else {
                totalCheckins = totalDays * 3; // 全天班
              }
            }

            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#e67e22' }}>{c.id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.title}</td>
                {/* ✨ 畫面上直接顯示資料庫的原始精準描述（例如：7天 (每週一期)） */}
                <td style={{ padding: '12px', color: '#34495e', fontWeight: 'bold' }}>
                  {c.duration_desc || `${totalDays}天`}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    background: isHalfDay ? '#fef9e7' : '#e8f8f5', 
                    color: isHalfDay ? '#b7950b' : '#117a65', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold' 
                  }}>
                    {styleLabel}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '0.85rem', color: '#555' }}>
                  {styleLabel === '☀️🌙 全天班' ? (
                    <>
                      <div>時段一 (簽到): {actualConfig.slot_1_start || '08:00:00'} ~ {actualConfig.slot_1_end || '11:00:00'}</div>
                      <div>時段二 (午簽): {actualConfig.slot_2_start || '13:00:00'} ~ {actualConfig.slot_2_end || '15:00:00'}</div>
                      <div>時段三 (簽退): {actualConfig.slot_3_start || '17:00:00'} ~ {actualConfig.slot_3_end || '19:00:00'}</div>
                    </>
                  ) : styleLabel === '🌅 上午班' ? (
                    <div>時段一 (上午簽到): {actualConfig.slot_1_start || '08:00:00'} ~ {actualConfig.slot_1_end || '11:00:00'}</div>
                  ) : (
                    <>
                      <div>時段一 (下午簽到): {actualConfig.slot_1_start || '13:00:00'} ~ {actualConfig.slot_1_end || '15:00:00'}</div>
                      <div>時段三 (傍晚簽退): {actualConfig.slot_3_start || '17:00:00'} ~ {actualConfig.slot_3_end || '19:00:00'}</div>
                    </>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#c0392b' }}>
                  {totalCheckins} 次
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CourseListAdmin;