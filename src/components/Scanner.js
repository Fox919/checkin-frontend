import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('準備掃描...');
  
  // 使用 useRef 來追蹤是否正在處理，避免重新渲染導致的鏡頭中斷
  const isProcessing = useRef(false);

  useEffect(() => {
    // 1. 設定掃描器參數
    const config = {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      facingMode: "environment" // 強制優先使用後鏡頭
    };

    // 2. 初始化掃描器 (只在掛載時執行一次)
    const scanner = new Html5QrcodeScanner('reader', config, false);

    // 3. 定義成功回調函數
    async function onScanSuccess(decodedText) {
      if (isProcessing.current) return; // 使用 .current 檢查
      
      isProcessing.current = true; // 鎖定狀態，防止重複發送請求
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
          // 3秒後解除鎖定，允許再次掃描
          setTimeout(() => {
            isProcessing.current = false;
            setStatus('準備掃描下一個...');
          }, 3000);
        } else {
          setStatus(`❌ 錯誤：${data.error || '簽到失敗'}`);
          isProcessing.current = false;
        }
      } catch (error) {
        console.error(error);
        setStatus('❌ 連線後端失敗');
        isProcessing.current = false;
      }
    }

    // 4. 定義錯誤回調 (通常保持空值，忽略掃描過程中的雜訊)
    function onScanError(err) {
      // 掃描過程的警告不需顯示在畫面上
    }

    // 5. 渲染掃描器
    scanner.render(onScanSuccess, onScanError);

    // 6. 清理函數：組件卸載時必須徹底關閉鏡頭，否則手機會無法釋放權限
    return () => {
      scanner.clear().catch(e => console.error("清理鏡頭失敗", e));
    };
  }, []); // 確保這裡陣列為空，只執行一次

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', textAlign: 'center', padding: '20px' }}>
      <h2>🔍 簽到掃描器</h2>
      {/* 掃描器渲染區域 */}
      <div id="reader" style={{ width: '100%' }}></div>
      
      <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #ddd' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>狀態：{status}</p>
        {scanResult && <p>最後掃描 ID: {scanResult}</p>}
      </div>
    </div>
  );
};

export default Scanner;