import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // 記得先執行 npm install qrcode.react
import ExportButton from './ExportButton';

const AdminList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 新增狀態：搜尋關鍵字 與 點選顯示的 QR ID
  const [searchTerm, setSearchTerm] = useState('');
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

  // 結合「日期」與「關鍵字搜尋」的過濾邏輯
  const filteredList = list.filter(item => {
    const dateObj = new Date(item.checkin_time);
    const itemDateString = dateObj.toLocaleDateString('en-CA');
    
    const matchesDate = filterDate ? itemDateString === filterDate : true;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.phone && item.phone.includes(searchTerm));
    
    return matchesDate && matchesSearch;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h2>📋 簽到名單管理</h2>
          <div>
            <button onClick={fetchList} style={{ marginRight: '10px' }}>🔄 重整</button>
            <ExportButton selectedDate={filterDate} />
          </div>
        </div>

        {/* 搜尋與篩選區塊 */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="date" 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ padding: '8px' }}
          />
          <input 
            type="text" 
            placeholder="🔍 搜尋姓名或電話..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px', flexGrow: 1 }}
          />
          <button onClick={() => { setFilterDate(''); setSearchTerm(''); }} style={{ padding: '8px' }}>清除篩選</button>
        </div>
      </div>

      {loading ? <p>載入中...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>姓名</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>電話</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>簽到時間</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map(item => (
              <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedQrId(item.id)}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.phone}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {new Date(item.checkin_time).toLocaleString()}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button>顯示 QR</button>
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

      {/* 彈出視窗 (Modal) */}
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