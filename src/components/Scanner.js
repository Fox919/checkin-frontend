import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = () => {
  const [status, setStatus] = useState('準備掃描...');
  
  // 🌟 同步管理端的動態特徵
  const [dayNumber, setDayNumber] = useState(1);
  const [slotType, setSlotType] = useState('slot_1'); // 預設對應管理端的 slot_1 (上午簽到)

  const isProcessing = useRef(false);
  const html5QrcodeRef = useRef(null); 
  const audio = useMemo(() => new Audio('/beep.mp3'), []);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode("reader");
    html5QrcodeRef.current = html5Qrcode;

    const config = {
      fps: 15,
      qrbox: { width: 250, height: 250 }
    };

    async function onScanSuccess(decodedText) {
      if (isProcessing.current) return;
      
      isProcessing.current = true;
      setStatus('正在驗證...');

      audio.play().catch(e => console.log("需點擊頁面以播放聲音"));
      if (navigator.vibrate) navigator.vibrate(200);

      try {
        let payload = {};
        
        // 提取基礎學員資料
        if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
          const parsed = JSON.parse(decodedText);
          payload = {
            userId: parsed.userId,
            offeringId: parsed.offeringId
          };
        } else {
          payload = {
            userId: decodedText,
            offeringId: null
          };
        }

        // 🌟 核心修正：採用「雙相容命名」與「標準代碼」，確保百分之百對齊後端
        const finalPayload = {
          ...payload,
          // 駝峰式命名 (手動打卡端常用)
          dayNumber: Number(dayNumber),
          slotType: slotType,
          // 底線式命名 (部分後端 API 常用)
          day_number: Number(dayNumber),
          slot_type: slotType
        };

        // 🚀 發送請求給後端
        const response = await fetch(`${API_BASE}/api/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload)
        });

        const data = await response.json();

        if (response.ok) {
          setStatus(`✅ ${data.name || '學員'} 簽到成功！`);
          setTimeout(() => {
            isProcessing.current = false;
            setStatus('準備掃描下一個...');
          }, 3000);
        } else {
          // 顯示後端回傳的具體錯誤，方便精準定位
          setStatus(`❌ ${data.error || data.message || '簽到失敗'}`);
          setTimeout(() => { isProcessing.current = false; }, 3000);
        }
      } catch (error) {
        console.error("連線錯誤:", error);
        setStatus('❌ 二維碼格式錯誤或連線失敗');
        setTimeout(() => { isProcessing.current = false; }, 2000);
      }
    }

    html5Qrcode.start(
      { facingMode: "environment" }, 
      config,
      onScanSuccess,
      () => { /* 忽略幀錯誤 */ }
    ).catch(err => {
      console.error("啟動相機失敗:", err);
      setStatus("❌ 無法啟動相機鏡頭");
    });

    return () => {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop()
          .then(() => console.log("鏡頭已安全關閉"))
          .catch(err => console.error("停止相機失敗", err));
      }
    };
  }, [audio, dayNumber, slotType]); 

  const getStatusStyle = () => {
    if (status.includes('✅')) return { backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb' };
    if (status.includes('❌')) return { backgroundColor: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' };
    return { backgroundColor: '#f8f9fa', color: '#333', borderColor: '#ddd' };
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', textAlign: 'center', padding: '20px' }}>
      <h2>🔍 簽到掃描器</h2>
      
      {/* 時段設定區域 */}
      <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '10px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
        <label style={{ fontWeight: 'bold' }}>
          天數：
          <select value={dayNumber} onChange={(e) => setDayNumber(e.target.value)} style={{ padding: '5px', fontSize: '1rem', borderRadius: '4px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(d => (
              <option key={d} value={d}>第 {d} 天</option>
            ))}
          </select>
        </label>

        <label style={{ fontWeight: 'bold' }}>
          時段：
          <select value={slotType} onChange={(e) => setSlotType(e.target.value)} style={{ padding: '5px', fontSize: '1rem', borderRadius: '4px' }}>
            {/* 🌟 這裡的 value 直接與管理後台的資料庫代碼對齊 */}
            <option value="slot_1">上午簽到</option>
            <option value="slot_2">下午簽到</option>
            <option value="slot_3">下課簽退</option>
          </select>
        </label>
      </div>
      
      {/* 狀態提示框 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        borderRadius: '15px', 
        border: '3px solid',
        transition: 'all 0.3s ease',
        ...getStatusStyle() 
      }}>
        <p style={{ fontSize: '1.3rem', fontWeight: '900', margin: '0', whiteSpace: 'pre-wrap' }}>{status}</p>
      </div>

      {/* 攝影機鏡頭容器 */}
      <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '10px' }}></div>
    </div>
  );
};

export default Scanner;