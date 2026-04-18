import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('準備掃描...');
  
  // 使用 useRef 來追蹤是否正在處理，這樣就不會導致組件重新渲染
  const isProcessing = useRef(false);

  useEffect(() => {
    // 1. 初始化掃描器 (此區塊只會執行一次)
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    }, false);

    // 2. 定義掃描成功後的邏輯
    async function onScanSuccess(decodedText) {
      if (isProcessing.current) return; // 使用 .current 檢查
      
      isProcessing.current = true; // 鎖定掃描
      setScanResult(decodedText);
      setStatus('正在驗證簽到...');

      try {
        const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${decodedText}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (response.ok) {
          setStatus(`✅ 簽到成功：${data.name}`);
          // 3秒後解鎖
          setTimeout(() => {
            isProcessing.current = false;
            setStatus('準備掃描下一個...');
          }, 3000);
        } else {
          setStatus(`❌ 錯誤：${data.error || '簽到失敗'}`);
          isProcessing.current = false;
        }
      } catch (error) {
        setStatus('❌ 連線後端失敗');
        isProcessing.current = false;
      }
    }

    function onScanError(err) {
      // 忽略錯誤
    }

    scanner.render(onScanSuccess, onScanError);

    // 3. 清理函數：只在組件卸載時執行
    return () => {
      scanner.clear().catch(e => console.error("清理失敗", e));
    };
  }, []); // <--- 重點：這裡必須是空的陣列 []

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', textAlign: 'center', padding: '20px' }}>
      <h2>🔍 簽到掃描器</h2>
      <div id="reader" style={{ width: '100%' }}></div>
      
      <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #ddd' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>狀態：{status}</p>
        {scanResult && <p>最後掃描 ID: {scanResult}</p>}
      </div>
    </div>
  );
};

export default Scanner;