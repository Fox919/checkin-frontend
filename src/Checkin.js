import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

function Checkin() {
  const [message, setMessage] = useState('等待操作...');
  const [phoneLastFour, setPhoneLastFour] = useState(''); // 新增：存儲輸入的 4 碼
  const [isSearching, setIsSearching] = useState(false);  // 新增：搜尋讀取狀態

  // --- 原有的掃碼簽到邏輯 ---
  const handleScan = async (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const userId = detectedCodes[0].rawValue || 
                     detectedCodes[0].value;
      if (!userId) return;
      
      // 直接執行簽到
      executeCheckin(userId);
    }
  };

  // --- 新增：電話後四碼搜尋邏輯 ---
  const handlePhoneSearch = async (e) => {
    if (e) e.preventDefault(); // 阻止表單跳轉
    
    if (phoneLastFour.length !== 4) {
      alert("請輸入電話後四位數字");
      return;
    }

    setIsSearching(true);
    setMessage('搜尋中...');

    try {
      // 1. 先搜尋該電話對應的 ID
      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/search-by-phone/${phoneLastFour}`);
      const data = await response.json();

      if (response.ok && data.id) {
        // 2. 找到 ID 後，直接呼叫簽到函數
        executeCheckin(data.id);
      } else {
        // 這裡就是你之前會出現 undefined 的地方，現在後端有 error 欄位了
        setMessage(`❌ 錯誤：${data.error || '找不到資料'}`);
      }
    } catch (err) {
      setMessage('⚠️ 搜尋連線失敗');
    } finally {
      setIsSearching(false);
      setPhoneLastFour(''); // 清空輸入框
    }
  };

  // --- 抽離出的簽到執行邏輯 (掃碼跟電話搜尋共用) ---
  const executeCheckin = async (userId) => {
    try {
      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${userId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ 簽到成功：${data.name} (${data.user_type})`);
      } else {
        setMessage(`❌ 簽到失敗：${data.message || '未知錯誤'}`);
      }
    } catch (err) {
      setMessage('⚠️ 簽到連線失敗');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>管理員簽到系統</h2>
      
      {/* 掃描區 */}
      <div style={{ width: '100%', marginBottom: '30px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
        <Scanner onScan={handleScan} />
        <p style={{ backgroundColor: '#f8f9fa', margin: 0, padding: '10px', fontSize: '0.9rem', color: '#666' }}>
          將二維碼對準鏡頭
        </p>
      </div>

      <div style={{ margin: '20px 0', borderBottom: '1px solid #eee', pb: '20px' }}>
        <p>或</p>
      </div>

      {/* 手動輸入區 */}
      <div style={{ padding: '20px', backgroundColor: '#f0f4f8', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0 }}>手動輸入電話後四位</h4>
        <form onSubmit={handlePhoneSearch} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <input 
            type="tel" 
            placeholder="例如: 5678" 
            value={phoneLastFour}
            onChange={(e) => setPhoneLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={{ padding: '10px', width: '100px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1.1rem', textAlign: 'center' }}
          />
          <button 
            type="submit" 
            disabled={isSearching || phoneLastFour.length !== 4}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            {isSearching ? '...' : '確認'}
          </button>
        </form>
      </div>

      {/* 訊息顯示區 */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        borderRadius: '8px', 
        backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('❌') ? '#f8d7da' : '#e2e3e5',
        color: message.includes('✅') ? '#155724' : message.includes('❌') ? '#721c24' : '#383d41',
        fontWeight: 'bold',
        fontSize: '1.1rem'
      }}>
        {message}
      </div>
    </div>
  );
}

export default Checkin;