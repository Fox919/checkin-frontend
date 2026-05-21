import React, { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

function Checkin() {
  const [message, setMessage] = useState('請對準學員的二維碼進行掃描點名');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 課程切換狀態
  const [offerings, setOfferings] = useState([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 頁面加載時，載入所有可打卡的課程
  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        // 過濾出密集班課程 (course)
        const onlyCourses = data.filter(item => item.type === 'course');
        setOfferings(onlyCourses);
        if (onlyCourses.length > 0) {
          setSelectedOfferingId(onlyCourses[0].id); // 預設選中第一個課程
        }
      })
      .catch(err => console.error("載入點名課程失敗:", err));
  }, []);

  // 核心簽到執行邏輯 (管理員端發送)
  const executeCheckin = async (userId) => {
    if (isProcessing) return;
    if (!selectedOfferingId) {
      setMessage('❌ 錯誤：請管理員先選擇當前點名的班別！');
      return;
    }

    try {
      setIsProcessing(true);
      setMessage(`⌛ 正在驗證學員 [ID: ${userId}]...`);

      // 🔗 帶上管理員選定的課程 ID 送往後端
      const response = await fetch(`${API_BASE}/checkin/${userId}?offeringId=${selectedOfferingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        setMessage(`❌ 伺服器錯誤：回傳格式異常`);
        // 1.5秒後解除鎖定，讓管理員可以繼續掃下一個，不卡關
        setTimeout(() => setIsProcessing(false), 1500);
        return;
      }

      if (data.success === true) {
        // ✨ 點名成功：清楚顯示學員姓名，方便管理員口頭確認（例：王小明，好，請進！）
        setMessage(`✅ 點名成功：${data.name || "已完成"}`);
        
        // ⏱️ 縮短等待時間至 1.5 秒，提升管理員連續點名效率
        setTimeout(() => {
          setMessage('請對準學員的二維碼進行掃描點名');
          setIsProcessing(false); // 解除鎖定，準備掃下一個學員
        }, 1500);
      } else {
        const errorDetail = data.message || data.error || "簽到失敗";
        setMessage(`❌ 失敗：${errorDetail}`);
        // 失敗時停頓 2 秒，讓管理員看清錯誤原因（例如：重複打卡、非該班學員）
        setTimeout(() => {
          setMessage('請對準學員的二維碼進行掃描點名');
          setIsProcessing(false);
        }, 2000);
      }
    } catch (err) {
      console.error("連線發生異常:", err);
      setMessage('⚠️ 無法連線至伺服器，請檢查網路');
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  // 處理鏡頭掃描事件
  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0 && !isProcessing) {
      const userId = detectedCodes[0].rawValue || detectedCodes[0].value;
      if (userId) {
        executeCheckin(userId);
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '15px', maxWidth: '450px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '5px' }}>📷 行動點名掃描器</h2>
      <p style={{ color: '#95a5a6', fontSize: '0.85rem', marginBottom: '15px' }}>（專供管理員、值班人員點名使用）</p>

      {/* 頂部班別控制條 */}
      <div style={{ marginBottom: '15px', background: '#ebf5fb', padding: '12px', borderRadius: '8px', border: '1px solid #aec6cf', textAlign: 'left' }}>
        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#2980b9', display: 'block', marginBottom: '6px' }}>
          🎯 當前正在點名的班級：
        </label>
        <select
          value={selectedOfferingId}
          onChange={(e) => setSelectedOfferingId(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3498db', fontSize: '1rem', fontWeight: 'bold', color: '#2980b9', backgroundColor: '#fff', cursor: 'pointer' }}
        >
          {offerings.map(o => (
            <option key={o.id} value={o.id}>
              【ID: {o.id}】{o.title}
            </option>
          ))}
        </select>
      </div>

      {/* 相機掃描視窗 */}
      <div style={{ 
        width: '100%', 
        aspectRatio: '1/1',
        marginBottom: '15px', 
        border: '3px solid #3498db', 
        borderRadius: '16px', 
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        {isProcessing && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10,
            backgroundColor: 'rgba(44, 62, 80, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            🔄 處理中，請稍候...
          </div>
        )}
        <Scanner onScan={handleScan} />
      </div>

      {/* 提示與動態狀態顯示區 */}
      <div style={{ 
        padding: '15px 20px', 
        borderRadius: '12px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        minHeight: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: message.includes('✅') ? '#d4edda' : (message.includes('❌') || message.includes('⚠️')) ? '#f8d7da' : '#f4f6f7',
        color: message.includes('✅') ? '#155724' : (message.includes('❌') || message.includes('⚠️')) ? '#721c24' : '#7f8c8d',
        border: '1px solid #e2e8f0',
      }}>
        {message}
      </div>

      <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#bdc3c7' }}>
        ⚙️ 點名提示：若二維碼損壞，請改用後台【學員考勤看板】手動點擊方塊補簽。
      </div>
    </div>
  );
}

export default Checkin;