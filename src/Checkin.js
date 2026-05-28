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

  // 核心簽到執行邏輯 (智慧多格式適配版)
  const executeCheckin = async (qrRawText) => {
    if (isProcessing) return;
    
    // 安全防呆：修剪前後空白
    const rawData = String(qrRawText).trim();
    if (!rawData) return;

    try {
      setIsProcessing(true);
      setMessage(`⌛ 正在智慧解析二維碼並驗證中...`);

      // 🌟 在前端就先智慧判定並解析 JSON 格式
      let payload = {};
      
      if (rawData.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawData);
          payload = {
            userId: parsed.userId || parsed.user_id,
            offeringId: parsed.offeringId || parsed.offering_id || selectedOfferingId
          };
        } catch (e) {
          // 如果明明是 { 開頭卻解析 JSON 失敗，當作純文字降級處理
          payload = { userId: rawData, offeringId: selectedOfferingId };
        }
      } else {
        // 代表是舊版文字二維碼 (例如 "QR_39" 或 "39")
        payload = {
          userId: rawData,
          offeringId: selectedOfferingId
        };
      }

      // 🌟 改打 /api/course-checkin 新路由，並且用 Body 把 JSON 發過去
      const response = await fetch(`${API_BASE}/api/course-checkin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload) // 正確封裝發送
      });
      
      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        setMessage(`❌ 伺服器錯誤：回傳格式異常`);
        setTimeout(() => setIsProcessing(false), 1500);
        return;
      }

      if (response.ok && data.success === true) {
        // ✨ 點名成功
        setMessage(data.message || `✅ 點名成功！`);

        // 🌟 向全域發送打卡成功廣播，通知考勤看板即時刷新數據
        window.dispatchEvent(new CustomEvent('student-checked-in'));

        // ⏱️ 1.5 秒後解除鎖定，準備掃下一個學員
        setTimeout(() => {
          setMessage('請對準學員的二維碼進行掃描點名');
          setIsProcessing(false); 
        }, 1500);
      } else {
        // ❌ 點名失敗 (重複簽到、非本班學員、時間不對等)
        const errorDetail = data.message || data.error || "簽到失敗";
        setMessage(errorDetail); // 直接顯示後端精心編寫的中文提示！
        
        // 失敗時停頓 2.5 秒，讓管理員看清楚原因
        setTimeout(() => {
          setMessage('請對準學員的二維碼進行掃描點名');
          setIsProcessing(false);
        }, 2500);
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
      const qrRawContent = detectedCodes[0].rawValue || detectedCodes[0].value;
      if (qrRawContent) {
        executeCheckin(qrRawContent);
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