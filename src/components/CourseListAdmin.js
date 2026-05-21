import React, { useState, useEffect } from 'react';

const CourseListAdmin = () => {
  const [courses, setCourses] = useState([]);
  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => setCourses(data))
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
            <th style={{ padding: '12px' }}>類型</th>
            <th style={{ padding: '12px' }}>打卡時段預覽</th>
            <th style={{ padding: '12px' }}>要求打卡次數</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(c => {
            // 解析資料庫傳來的 config JSON
            const cfg = typeof c.config === 'string' ? JSON.parse(c.config || '{}') : (c.config || {});
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#e67e22' }}>{c.id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.title}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#e8f8f5', color: '#117a65', fontSize: '0.85rem' }}>
                    {cfg.course_style === 'full_day' ? '☀️🌙 全天班' : (cfg.course_style === 'morning_only' ? '🌅 上午班' : '🌆 下午/晚班')}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '0.85rem', color: '#555' }}>
                  {cfg.slot_1_start && <div>時段一: {cfg.slot_1_start}~{cfg.slot_1_end}</div>}
                  {cfg.slot_2_start && <div>時段二: {cfg.slot_2_start}~{cfg.slot_2_end}</div>}
                  {cfg.slot_3_start && <div>時段三: {cfg.slot_3_start}~{cfg.slot_3_end}</div>}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                  {cfg.total_checkins_required || 24} 次
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