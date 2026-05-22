import React, { useState, useEffect } from 'react';

const CourseListAdmin = () => {
  const [courses, setCourses] = useState([]);
  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        // 1. 🔍 在瀏覽器的主控台（Console）把後端傳來的所有原始資料印出來
        console.log("後端回傳的所有原始資料:", data);

        // 2. 🌟 暫時完全不做任何 filter 過濾，強迫所有東西都進來
        setCourses(data);
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
            try {
              cfg = typeof c.config === 'string' ? JSON.parse(c.config || '{}') : (c.config || {});
            } catch (e) {
              cfg = {};
            }

            const actualConfig = cfg.sessions && !Array.isArray(cfg.sessions) ? cfg.sessions : cfg;
            
            // 2. 建立全面的內文比對字串
            const courseTitle = c.title || '';
            const allTextContext = (
              courseTitle + 
              (c.schedule_desc || '') + 
              (c.duration_desc || '')
            ).toLowerCase();

            // 3. 🌟 【核心主導】直接依據課程種類給予絕對設定，防止被錯誤欄位綁架
            let totalDays = 8;
            let styleLabel = '☀️🌙 全天班';
            let isHalfDay = false;
            let totalCheckins = 24;

            // 🧘‍♂️ 減壓班特判：只要名字有「減壓」，強制修正為 7天 下午班 14次
            if (courseTitle.includes('減壓')) {
              totalDays = 7;
              isHalfDay = true;
              styleLabel = '🌆 下午/晚班';
              totalCheckins = 14;
            } 
            // 🏋️‍♂️ 健身班或其他常規班：預設 8天 全天班 24次 (或依資料庫微調)
            else {
              const style = actualConfig.course_style || '';
              if (style === 'morning_only' || allTextContext.includes('上午')) {
                isHalfDay = true;
                styleLabel = '🌅 上午班';
                totalCheckins = totalDays * 1; // 8次
              } else if (style === 'afternoon_only' || allTextContext.includes('下午') || allTextContext.includes('半天')) {
                isHalfDay = true;
                styleLabel = '🌆 下午/晚班';
                totalCheckins = totalDays * 2; // 16次
              } else {
                // 全天班
                totalCheckins = actualConfig.total_checkins_required || 24;
              }
            }

            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#e67e22' }}>{c.id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{courseTitle}</td>
                {/* 顯示修正後的天數 */}
                <td style={{ padding: '12px', color: '#34495e', fontWeight: 'bold' }}>
                  {courseTitle.includes('減壓') ? '7天' : (c.duration_desc || `${totalDays}天`)}
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
                      <div>時段一 (下午簽到): {actualConfig.slot_1_start || '14:00:00'} ~ {actualConfig.slot_1_end || '16:00:00'}</div>
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