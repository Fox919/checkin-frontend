import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = () => {
  const [status, setStatus] = useState('準備掃描...');
  const [offerings, setOfferings] = useState([]); // 🌟 儲存班級清單
  const [selectedOffering, setSelectedOffering] = useState('1'); // 🌟 預設選中 ID 1
  
  const isProcessing = useRef(false);
  const html5QrcodeRef = useRef(null); 
  const audio = useMemo(() => new Audio('/beep.mp3'), []);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 🌟 獲取最新班級列表，讓點名畫面可以選「基礎健身班」
  useEffect(() => {
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOfferings(data);
      })
      .catch(err => console.error("載入班級失敗:", err));
  }, []);

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
        
        if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
          const parsed = JSON.parse(decodedText);
          const cleanUserId = String(parsed.userId).replace(/\D/g, "");
          
          payload = {
            userId: cleanUserId ? parseInt(cleanUserId, 10) : null,
            // 優先使用二維碼內帶的班級，若無則使用下拉選單當前選中的班級
            offeringId: parsed.offeringId || parseInt(selectedOffering, 10) 
          };
        } else {
          const cleanUserId = decodedText.replace(/\D/g, "");
          
          payload = {
            userId: cleanUserId ? parseInt(cleanUserId, 10) : null,
            offeringId: parseInt(selectedOffering, 10) // 🌟 改為動態讀取下拉選單的值！
          };
        }

        if (!payload.userId) {
          setStatus('❌ 簽到失敗：無法從二維碼中辨識學員數字 ID');
          setTimeout(() => { isProcessing.current = false; }, 3000);
          return;
        }

        const response = await fetch(`${API_BASE}/api/course-checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus(data.message || '✅ 簽到成功！');
          setTimeout(() => {
            isProcessing.current = false;
            setStatus('準備掃描下一個...');
          }, 3000);
        } else {
          setStatus(data.message || `❌ 簽到失敗`);
          setTimeout(() => { isProcessing.current = false; }, 3000);
        }
      } catch (error) {
        console.error("連線錯誤:", error);
        setStatus('❌ 連線失敗或伺服器無回應');
        setTimeout(() => { isProcessing.current = false; }, 2000);
      }
    }

    // 🌟 注意：將 selectedOffering 加入依賴陣列，確保鏡頭回呼能拿到最新的選中班級
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
  }, [audio, selectedOffering]); // 🌟 監聽選擇的班級變更

  const getStatusStyle = () => {
    if (status.includes('✅')) return { backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb' };
    if (status.includes('❌')) return { backgroundColor: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' };
    return { backgroundColor: '#f8f9fa', color: '#333', borderColor: '#ddd' };
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', textAlign: 'center', padding: '20px' }}>
      <h2>🔍 簽到自動掃描器</h2>

      {/* 🌟 新增：班級切換下拉選單UI */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>當前點名班級：</label>
        <select 
          value={selectedOffering} 
          onChange={(e) => setSelectedOffering(e.target.value)}
          style={{ padding: '8px', borderRadius: '5px', fontSize: '1rem', width: '60%' }}
        >
          {offerings.map(o => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>
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