import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // 1. 確保匯入了這個套件
import ExportButton from './ExportButton';

const AdminList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 2. 新增狀態：用來儲存當前點選要顯示 QR 的用戶 ID
  const [selectedQrId, setSelectedQrId] = useState(null); 

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

  const filteredList = filterDate 
    ? list.filter(item => {
        const dateObj = new Date(item.checkin_time);
        const itemDateString = dateObj.toLocaleDateString('en-CA'); 
        return itemDateString === filterDate;
      })
    : list;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>📋 簽到名單管理</h2>
        
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
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>操作</th> {/* 3. 新增標題 */}
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
                {/* 4. 新增按鈕 */}
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button onClick={() => setSelectedQrId(item.id)}>顯示 QR</button>
                </td>
              </tr>
            ))}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>查無資料</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* 5. 彈出視窗 Modal */}
      {selectedQrId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000
        }} onClick={() => setSelectedQrId(null)}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center' }}
               onClick={(e) => e.stopPropagation()}>
            <h3>{list.find(i => i.id === selectedQrId)?.name} 的 QR Code</h3>
            <QRCodeCanvas value={String(selectedQrId)} size={200} />
            <br /><br />
            <button onClick={() => setSelectedQrId(null)} style={{ padding: '10px 20px', cursor: 'pointer' }}>關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;