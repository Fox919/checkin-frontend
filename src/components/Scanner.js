import React, { useEffect, useRef, useState, useMemo } from 'react';
// 🌟 核心修改：在 React 19 建議直接引用 Html5Qrcode，手動控制生命週期最穩健
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = () => {
  const [status, setStatus] = useState('準備掃描...');
  
  const isProcessing = useRef(false);
  const html5QrcodeRef = useRef(null); // 用來暫存掃描器實例
  const audio = useMemo(() => new Audio('/beep.mp3'), []);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    // 建立掃描器實例，綁定到 id="reader" 的 div
    const html5Qrcode = new Html5Qrcode("reader");
    html5QrcodeRef.current = html5Qrcode;

    const config = {
      fps: 15,
      qrbox: { width: 250, height: 250 }
    };

    // 成功解碼的回呼函數
    async function onScanSuccess(decodedText) {
      if (isProcessing.current) return;
      
      isProcessing.current = true;
      setStatus('正在驗證...');

      // 播放提示音與震動
      audio.play().catch(e => console.log("需點擊頁面以播放聲音"));
      if (navigator.vibrate) navigator.vibrate(200);

      try {
        let payload = {};
        
        // 🧠 智慧解析：判斷二維碼是否為學員證的 JSON 格式
        if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
          const parsed = JSON.parse(decodedText);
          payload = {
            userId: parsed.userId,
            offeringId: parsed.offeringId
          };
        } else {
          // 相容舊格式：如果掃到純學員 ID 字串
          payload = {
            userId: decodedText,
            offeringId: null // 或根據需求填入預設值
          };
        }

        // 🚀 發送請求給後端：改用更安全的 POST Body 傳參，避免網址帶有特殊字元
        const response = await fetch(`${API_BASE}/api/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          setStatus(`✅ ${data.name || '學員'} 簽到成功！`);
          setTimeout(() => {
            isProcessing.current = false;
            setStatus('準備掃描下一個...');
          }, 3000);
        } else {
          setStatus(`❌ ${data.error || '簽到失敗'}`);
          setTimeout(() => { isProcessing.current = false; }, 2000);
        }
      } catch (error) {
        console.error("連線錯誤:", error);
        setStatus('❌ 二維碼格式錯誤或連線失敗');
        setTimeout(() => { isProcessing.current = false; }, 2000);
      }
    }

    // 啟動相機鏡頭
    html5Qrcode.start(
      { facingMode: "environment" }, // 強制調用後鏡頭
      config,
      onScanSuccess,
      () => { /* 忽略幀錯誤 */ }
    ).catch(err => {
      console.error("啟動相機失敗:", err);
      setStatus("❌ 無法啟動相機鏡頭");
    });

    // 元件卸載時，安全關閉鏡頭與清理節點
    return () => {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop()
          .then(() => {
            console.log("鏡頭已安全關閉");
          })
          .catch(err => console.error("停止相機失敗", err));
      }
    };
  }, [audio]);

  const getStatusStyle = () => {
    if (status.includes('✅')) return { backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb' };
    if (status.includes('❌')) return { backgroundColor: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' };
    return { backgroundColor: '#f8f9fa', color: '#333', borderColor: '#ddd' };
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', textAlign: 'center', padding: '20px' }}>
      <h2>🔍 簽到掃描器</h2>
      
      {/* 狀態提示框 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        borderRadius: '15px', 
        border: '3px solid',
        transition: 'all 0.3s ease',
        ...getStatusStyle() 
      }}>
        <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0' }}>{status}</p>
      </div>

      {/* 攝影機鏡頭容器 */}
      <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '10px' }}></div>
    </div>
  );
};

export default Scanner;