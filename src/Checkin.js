import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

function Checkin() {
  const [message, setMessage] = useState('等待操作...');
  const [phoneLastFour, setPhoneLastFour] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 1. 抽離簽到執行邏輯 (增加對 undefined 的防禦)
  const executeCheckin = async (userId) => {
    try {
      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${userId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ 簽到成功：${data.name}`);
      } else {
        // --- 這裡是最關鍵的修改 ---
        // 你的後端回傳的是 { success: false, message: "..." }
        // 所以這裡必須讀取 data.message
        const errorText = data.message || data.error || "簽到失敗";
        setMessage(`❌ 錯誤：${errorText}`);
      }
    } catch (err) {
      setMessage('⚠️ 簽到請求失敗');
    }
  };

  // 2. 處理電話搜尋
  const handlePhoneSearch = async (e) => {
    if (e) e.preventDefault();
    if (phoneLastFour.length !== 4) return;

    setIsSearching(true);
    setMessage('搜尋中...');

    try {
      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/search-by-phone/${phoneLastFour}`);
      const data = await response.json();

      if (response.ok && data.id) {
        // 搜尋成功，接著執行簽到
        await executeCheckin(data.id);
      } else {
        // --- 關鍵修正：相容 error 或 message ---
        const errorText = data.error || data.message || "找不到該筆紀錄";
        setMessage(`❌ 錯誤：${errorText}`);
      }
    } catch (err) {
      console.error("Search API Error:", err);
      setMessage('⚠️ 搜尋請求失敗');
    } finally {
      setIsSearching(false);
      setPhoneLastFour('');
    }
  };

  // 3. 處理掃碼
  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const userId = detectedCodes[0].rawValue || detectedCodes[0].value;
      if (userId) executeCheckin(userId);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#333' }}>現場簽到系統</h2>
      
      {/* 掃碼區 */}
      <div style={{ width: '100%', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
        <Scanner onScan={handleScan} />
      </div>

      {/* 手動輸入區 */}
      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>快速簽到：請輸入電話後四位</p>
        <form onSubmit={handlePhoneSearch} style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <input 
            type="tel" 
            value={phoneLastFour}
            onChange={(e) => setPhoneLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="5678"
            style={{ padding: '10px', width: '80px', textAlign: 'center', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button 
            type="submit" 
            disabled={isSearching || phoneLastFour.length !== 4}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isSearching ? '...' : '確認'}
          </button>
        </form>
      </div>

      {/* 訊息顯示區 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        borderRadius: '8px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        backgroundColor: message.includes('✅') ? '#d4edda' : (message.includes('❌') || message.includes('⚠️')) ? '#f8d7da' : '#e9ecef',
        color: message.includes('✅') ? '#155724' : (message.includes('❌') || message.includes('⚠️')) ? '#721c24' : '#495057'
      }}>
        {message}
      </div>
    </div>
  );
}

export default Checkin;