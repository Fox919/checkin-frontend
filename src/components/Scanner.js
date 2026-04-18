import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('準備掃描...');
  
  // 使用 useRef 來追蹤是否正在處理，避免重複掃描
  const isProcessing = useRef(false);

  // 1. 預先建立音效物件，只會執行一次
  const audio = useMemo(() => new Audio('/beep.mp3'), []);

  useEffect(() => {
    // 2. 設定掃描器參數
    const config = {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      facingMode: "environment" // 強制優先使用後鏡頭
    };

    // 3. 初始化掃描器
    const scanner = new Html5QrcodeScanner('reader', config, false);

    // 4. 定義成功回調函數
    async function onScanSuccess(decodedText) {
      if (isProcessing.current) return;
      
      isProcessing.current = true;
      setScanResult(decodedText);
      setStatus('正在驗證簽到...');

      // 播放音效與震動
      audio.play().catch(e => console.log("聲音播放需先點擊頁面"));
      if (navigator.vibrate) navigator.vibrate(200);

      try {
        const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${decodedText}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (response.ok) {
          setStatus(`✅ 簽到成功：${data.name}`);
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

    // 5. 定義錯誤回調
    function onScanError(err) {
      // 忽略掃描過程的警告
    }

    // 6. 渲染掃描器
    scanner.render(onScanSuccess, onScanError);

    // 7. 清理函數
    return () => {
      scanner.clear().catch(e => console.error("清理鏡頭失敗", e));
    };
  }, [audio]); // 將 audio 加入依賴，雖然它不會變，但這是 React 規範

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