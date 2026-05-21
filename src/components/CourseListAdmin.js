import React, { useState, useEffect } from 'react';

const CourseListAdmin = () => {
  const [courses, setCourses] = useState([]);
  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
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

            const actualConfig = cfg.sessions && !Array.isArray(cfg.sessions) ? cfg.sessions : cfg;
            
            // 2. 智慧多重交叉比對班別型態
            const style = actualConfig.course_style || '';
            const allTextContext = (
              (c.title || '') + 
              (c.schedule_desc || '') + 
              (c.duration_desc || '') + 
              rawConfigString
            ).toLowerCase();

            let styleLabel = '☀️🌙 全天班'; 
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

            // 3. 🎯 ✨ 【精準天數修正】安全拆解天數
            let totalDays = 8; // 預設底線值

            if (c.duration_desc) {
              // 🌟 改用更嚴格的正規表達式：只抓後面接著「天」字的數字 (例如 "7天" -> 抓成 7)
              const dayMatchWithUnit = c.duration_desc.match(/(\d+)\s*天/);
              if (dayMatchWithUnit && dayMatchWithUnit[1]) {
                totalDays = parseInt(dayMatchWithUnit[1], 10);
              } else {
                // 如果沒對到「天」字，再嘗試直接抓第一個數字
                const simpleMatch = c.duration_desc.match(/\d+/);
                if (simpleMatch) totalDays = parseInt(simpleMatch[0], 10);
              }
            } 
            
            // 防呆防卡：如果算出來天數小於等於 1（不合理的前端錯誤抓取），重新看資料庫是不是寫 7 或 8
            if (totalDays <= 1) {
              if (allTextContext.includes('7')) totalDays = 7;
              else if (allTextContext.includes('8')) totalDays = 8;
            }

            // 4. ✨ 智慧計算總要求次數 (防止被舊資料的 2 次或 24 次蓋掉)
            let totalCheckins = actualConfig.total_checkins_required;
            
            // 如果次數沒寫、或者小於合理值(例如只有2次、或者全天班寫成24次但目前是半天班)
            if (!totalCheckins || totalCheckins <= 2 || (totalCheckins === 24 && isHalfDay)) {
              if (isHalfDay) {
                totalCheckins = styleLabel === '🌅 上午班' ? totalDays * 1 : totalDays * 2;
              } else {
                totalCheckins = totalDays * 3; 
              }
            }

            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#e67e22' }}>{c.id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.title}</td>
                {/* 顯示乾淨的原始描述 */}
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