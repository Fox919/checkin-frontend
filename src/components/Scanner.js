import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = () => {
  const [status, setStatus] = useState('準備掃描...');
  
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
        
        // 解析二維碼格式
        if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
          const parsed = JSON.parse(decodedText);
          payload = {
            userId: parsed.userId,
            offeringId: parsed.offeringId || 1 // 若無帶入課程 ID，預設為 1
          };
        } else {
          // 相容舊格式或純 ID 字串
          payload = {
            userId: decodedText,
            offeringId: 1 // 預設課程 ID 為 1
          };
        }

        // 🚀 關鍵修正：對齊後端現有的自動簽到路由 /api/course-checkin
        const response = await fetch(`${API_BASE}/api/course-checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // 後端成功會回傳如：`✅ [第一節簽到] 成功！`
          setStatus(data.message || '✅ 簽到成功！');
          setTimeout(() => {
            isProcessing.current = false;
            setStatus('準備掃描下一個...');
          }, 3000);
        } else {
          // 顯示後端拒絕的原因（例如：目前非本課程規定的打卡時間！）
          setStatus(data.message || `❌ 簽到失敗`);
          setTimeout(() => { isProcessing.current = false; }, 3000);
        }
      } catch (error) {
        console.error("連線錯誤:", error);
        setStatus('❌ 連線失敗或伺服器無回應');
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
  }, [audio]); 

  const getStatusStyle = () => {
    if (status.includes('✅')) return { backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb' };
    if (status.includes('❌')) return { backgroundColor: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' };
    return { backgroundColor: '#f8f9fa', color: '#333', borderColor: '#ddd' };
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', textAlign: 'center', padding: '20px' }}>
      <h2>🔍 簽到自動掃描器</h2>
      
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