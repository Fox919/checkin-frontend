import React, { useEffect, useState } from 'react';
import ExportButton from './ExportButton';

const AdminList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  // 新增狀態：篩選日期，預設為「今天」
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/checkins?t=${Date.now()}`);
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error("讀取失敗", err);
      alert("無法讀取簽到名單");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // --- 篩選邏輯 ---
  // 如果有選擇日期，就篩選符合該日期的記錄；若清空日期，則顯示全部
  const filteredList = filterDate 
    ? list.filter(item => item.checkin_time.startsWith(filterDate)) 
    : list;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>📋 簽到名單管理</h2>
        
        {/* 新增：篩選區塊 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label>篩選日期：</label>
          <input 
            type="date" 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ padding: '8px' }}
          />
          <button onClick={() => setFilterDate('')} style={{ padding: '8px' }}>顯示全部</button>
        </div>

        <div>
          <button onClick={fetchList} style={{ marginRight: '10px' }}>🔄 重整</button>
          <ExportButton selectedDate={filterDate} />
        </div>
      </div>

      {loading ? <p>載入中...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>姓名</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>電話</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>簽到時間</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map(item => (
              <tr key={item.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.phone}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {new Date(item.checkin_time).toLocaleString()}
                </td>
              </tr>
            ))}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: '20px', textAlign: 'center' }}>查無資料</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminList;