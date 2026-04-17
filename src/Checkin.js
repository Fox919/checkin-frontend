import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

function Checkin() {
  const [message, setMessage] = useState('等待掃描...');

  const handleScan = async (detectedCodes) => {
    // 1. 檢查是否有偵測到代碼
    if (detectedCodes && detectedCodes.length > 0) {
      
      // 2. 取得二維碼內容 (優先使用 rawValue)
      const userId = detectedCodes[0].rawValue || 
                     detectedCodes[0].value || 
                     (detectedCodes[0].symbol && detectedCodes[0].symbol.value);

      if (!userId) {
        console.log("偵測到了，但抓不到數值:", detectedCodes);
        return;
      }

      console.log("成功抓到 ID:", userId);

      try {
        // 3. 發送簽到請求到 Railway
        const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${userId}`, {
          method: 'POST'
        });
        
        const data = await response.json();
        if (data.success) {
          setMessage(`✅ 簽到成功：${data.name}`);
        } else {
          setMessage(`❌ 錯誤：${data.error || '找不到此用戶'}`);
        }
      } catch (err) {
        console.error("API 錯誤:", err);
        setMessage('⚠️ 連線失敗，請檢查網路');
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>管理員掃碼簽到</h2>
      <div style={{ width: '300px', margin: '0 auto' }}>
        {/* 這裡確保組件接收的是 handleScan 函數 */}
        <Scanner onScan={handleScan} />
      </div>
      <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
        {message}
      </p>
    </div>
  );
}

export default Checkin;