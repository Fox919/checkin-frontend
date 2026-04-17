import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner'; // 確保你有安裝這個套件

function Checkin() {
  const [message, setMessage] = useState('等待掃描...');

  const handleScan = async (result) => {
    if (result) {
      const userId = result[0].symbol.value; // 取得二維碼內容
      try {
        const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${userId}`, {
          method: 'POST'
        });
        const data = await response.json();
        setMessage(data.success ? `簽到成功：${data.name}` : `錯誤：${data.error}`);
      } catch (err) {
        setMessage('連線失敗，請檢查網路');
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>管理員掃碼簽到</h2>
      <div style={{ width: '300px', margin: '0 auto' }}>
        <Scanner onScan={handleScan} />
      </div>
      <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
        {message}
      </p>
    </div>
  );
}

export default Checkin;