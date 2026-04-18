import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('準備掃描...');
  
  const isProcessing = useRef(false);
  const audio = useMemo(() => new Audio('/beep.mp3'), []);

  useEffect(() => {
    const config = {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      facingMode: "environment"
    };

    const scanner = new Html5QrcodeScanner('reader', config, false);

    async function onScanSuccess(decodedText) {
      if (isProcessing.current) return;
      
      isProcessing.current = true;
      setScanResult(decodedText);
      setStatus('正在驗證...');

      audio.play().catch(e => console.log("需點擊頁面以播放聲音"));
      if (navigator.vibrate) navigator.vibrate(200);

      try {
        const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${decodedText}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (response.ok) {
          // 這裡顯示清楚的姓名與狀態
          setStatus(`✅ ${data.name} 簽到成功！`);
          setTimeout(() => {
            isProcessing.current = false;
            setStatus('準備掃描下一個...');
          }, 3000);
        } else {
          setStatus(`❌ ${data.error || '簽到失敗'}`);
          isProcessing.current = false;
        }
      } catch (error) {
        setStatus('❌ 連線後端失敗');
        isProcessing.current = false;
      }
    }

    function onScanError(err) { /* 忽略 */ }

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(e => console.error("清理鏡頭失敗", e));
    };
  }, [audio]);

  // 判斷狀態顏色，方便視覺識別
  const getStatusStyle = () => {
    if (status.includes('✅')) return { backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb' };
    if (status.includes('❌')) return { backgroundColor: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' };
    return { backgroundColor: '#f8f9fa', color: '#333', borderColor: '#ddd' };
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', textAlign: 'center', padding: '20px' }}>
      <h2>🔍 簽到掃描器</h2>
      <div id="reader" style={{ width: '100%' }}></div>
      
      {/* 這裡是放大後的顯示區域 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '30px', 
        borderRadius: '15px', 
        border: '3px solid',
        transition: 'all 0.3s ease',
        ...getStatusStyle() 
      }}>
        <p style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0' }}>{status}</p>
      </div>
    </div>
  );
};

export default Scanner;;