import React, { useEffect, useState } from 'react';

const AdminList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    setLoading(true);
    try {
      // 加上時間戳防止瀏覽器快取舊資料
      const res = await fetch(`https://checkin-system-production-2a74.up.railway.app/admin/checkins?t=${Date.now()}`);
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error("讀取失敗", err);
      alert("無法讀取簽到名單，請檢查後端連線");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleExport = () => {
    // 提醒使用者開始導出
    alert("正在生成 Excel，請稍候...");
    window.location.href = 'https://checkin-system-production-2a74.up.railway.app/admin/export-excel';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📊 管理後台 - 簽到名單</h2>
        <div>
          <button onClick={fetchList} style={{ marginRight: '10px', padding: '10px 15px', cursor: 'pointer' }}>
            🔄 刷新名單
          </button>
          <button onClick={handleExport} style={{ padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            📥 導出 Excel
          </button>
        </div>
      </div>

      {loading ? (
        <p>載入中...</p>
      ) : list.length === 0 ? (
        <p>目前尚無簽到紀錄</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f4f4f4' }}>
                <th>姓名</th>
                <th>電話</th>
                <th>身份</th>
                <th>簽到時間</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td>{item.name}</td>
                  <td>{item.phone}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      background: item.user_type === 'volunteer' ? '#d1ecf1' : '#e2e3e5' 
                    }}>
                      {item.user_type === 'guest' ? '來賓' : item.user_type === 'volunteer' ? '義工' : '學員'}
                    </span>
                  </td>
                  <td>{new Date(item.checkin_time).toLocaleString('zh-TW')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminList;