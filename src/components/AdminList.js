import React, { useEffect, useState } from 'react';
import ExportButton from './ExportButton'; // 確保檔案路徑正確

const AdminList = () => {
  const [list, setList] = useState([]); // 這裡原本是 list
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/checkins?t=${Date.now()}`);
      const data = await res.json();
      setList(data); // 更新 list
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h2>📋 簽到名單管理</h2>
        {/* 在這裡放入匯出按鈕，並加上一個重整按鈕讓體驗更好 */}
        <div>
          <button onClick={fetchList} style={{ marginRight: '10px' }}>🔄 重整</button>
          <ExportButton />
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>姓名</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>電話</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>簽到時間</th>
          </tr>
        </thead>
        <tbody>
          {/* 修正：這裡改成 list.map */}
          {list.map(item => (
            <tr key={item.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.phone}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {new Date(item.checkin_time).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminList;