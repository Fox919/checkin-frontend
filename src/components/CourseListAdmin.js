import React, { useState, useEffect } from 'react';

const CourseListAdmin = () => {
  const [courses, setCourses] = useState([]);
  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        // ✨ 修正點 1：嚴格過濾！只留下 type 是 'course' 的項目，剔除一對一加持與問事服務
        const onlyCourses = data.filter(item => item.type === 'course');
        setCourses(onlyCourses);
      })
      .catch(err => console.error("撈取課程失敗:", err));
  }, []);

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '10px' }}>
      <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>📅 課程與期次總覽看板</h3>
      <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>提示：將訪客轉為學員時，請填寫下方對應的【課程 ID】。此表格已自動過濾常規預約服務。</p>
      
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
            // 🧠 智慧解析資料庫複雜的 config 欄位
            let cfg = {};
            try {
              cfg = typeof c.config === 'string' ? JSON.parse(c.config || '{}') : (c.config || {});
            } catch (e) {
              cfg = {};
            }

            // 🌟 修正點 2：動態相容新舊結構！優先讀取 sessions 內層的新設定，如果沒有就找外層
            const actualConfig = cfg.sessions && !Array.isArray(cfg.sessions) ? cfg.sessions : cfg;
            
            // 判斷班別樣式
            const style = actualConfig.course_style || 'full_day';
            let styleLabel = '☀️🌙 全天班';
            if (style === 'morning_only') styleLabel = '🌅 上午班';
            if (style === 'afternoon_only' || c.schedule_desc?.includes('半天')) styleLabel = '🌆 半天班';

            // 動態判斷打卡次數：如果資料庫寫死24次但實際上是半天班，前端進行智慧校正修正顯示
            let totalCheckins = actualConfig.total_checkins_required || 24;
            if (styleLabel !== '☀️🌙 全天班' && totalCheckins === 24) {
              // 假設 7 或 8 天半天班，次數應該是天數 * 1 或 2，這裡做智慧防呆
              const days = c.duration_desc?.includes('7') ? 7 : 8;
              totalCheckins = style === 'morning_only' ? days * 1 : days * 2;
            }

            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#e67e22' }}>{c.id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.title}</td>
                <td style={{ padding: '12px', color: '#34495e' }}>{c.duration_desc || '8天'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', background: styleLabel.includes('全天') ? '#e8f8f5' : '#fef9e7', color: styleLabel.includes('全天') ? '#117a65' : '#b7950b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {styleLabel}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '0.85rem', color: '#555' }}>
                  {/* 依據全天或半天，動態過濾顯示的時段 */}
                  {styleLabel === '☀️🌙 全天班' ? (
                    <>
                      <div>時段一 (簽到): {actualConfig.slot_1_start || '08:00:00'} ~ {actualConfig.slot_1_end || '11:00:00'}</div>
                      <div>時段二 (午簽): {actualConfig.slot_2_start || '13:00:00'} ~ {actualConfig.slot_2_end || '15:00:00'}</div>
                      <div>時段三 (簽退): {actualConfig.slot_3_start || '17:00:00'} ~ {actualConfig.slot_3_end || '19:00:00'}</div>
                    </>
                  ) : style === 'morning_only' ? (
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