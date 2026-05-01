import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

function Checkin() {
  const [message, setMessage] = useState('等待操作...');
  const [phoneLastFour, setPhoneLastFour] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 1. 抽離簽到執行邏輯 (增加對 undefined 的防禦)
  const executeCheckin = async (userId) => {
    try {
      console.log("正在發送簽到請求，ID 為:", userId);
      
      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${userId}`, {
        method: 'POST'
      });
      
      // 先取得原始文字，防止後端回傳 HTML 導致解析 JSON 失敗
      const text = await response.text();
      console.log("後端原始回傳:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setMessage(`❌ 伺服器錯誤：回傳格式不是 JSON (請檢查後端日誌)`);
        return;
      }

      if (data.success === true || response.ok) {
        // 如果 response.ok 是 true 且沒給 name，就顯示 "OK"
        const displayName = data.name || (data.success ? "成功" : "");
        setMessage(`✅ 簽到成功：${displayName}`);
      } else {
        // 這裡會把所有可能的 Key 都跑一遍
        const errorDetail = data.message || data.error || data.msg || text || "未知原因";
        setMessage(`❌ 錯誤：${errorDetail}`);
      }
    } catch (err) {
      console.error("連線發生異常:", err);
      setMessage('⚠️ 無法連線至伺服器，請確認網路或後端狀態');
    }
  };

  // 2. 處理電話搜尋
 // 2. 處理電話搜尋
 // 2. 處理電話搜尋
  const handlePhoneSearch = async (e) => {
    if (e) e.preventDefault();
    if (phoneLastFour.length !== 4) return;

    setIsSearching(true);
    setMessage('搜尋中...');

    try {
      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/search-by-phone/${phoneLastFour}`);
      
      // 1. 先看後端到底傳回什麼「文字」
      const rawText = await response.text();
      console.log("後端原始回傳內容:", rawText);

      // 2. 嘗試解析成 JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        setMessage(`❌ 伺服器錯誤：回傳內容不是 JSON。內容為：${rawText.substring(0, 20)}...`);
        return;
      }

      // 3. 根據解析後的 data 進行條件判斷
      if (data && data.success === true && data.id) {
        // 如果搜尋成功，拿到 ID，去跑簽到邏輯
        await executeCheckin(data.id);
      } else {
        // ❌ 這裡就是產生 undefined 的元兇 ❌
        // 我們強制把所有可能的 Key 都列出來，最後加上 String() 保險
        const finalError = data.error || data.message || data.msg || "找不到資料或格式錯誤";
        setMessage(`❌ 錯誤：${String(finalError)}`);
      }
    } catch (err) {
      console.error("發生錯誤:", err);
      setMessage('⚠️ 搜尋連線失敗');
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