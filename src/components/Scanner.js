import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('準備掃描...');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(onScanSuccess, onScanError);

    async function onScanSuccess(decodedText) {
      if (isProcessing) return; // 防止重複觸發
      
      setIsProcessing(true);
      setScanResult(decodedText);
      setStatus('正在驗證簽到...');

      try {
        // 發送到你的 Railway 後端
        const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${decodedText}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (response.ok) {
          setStatus(`✅ 簽到成功：${data.name} (${data.user_type === 'guest' ? '來賓' : '工作人員'})`);
          // 3秒後恢復掃描狀態
          setTimeout(() => {
            setIsProcessing(false);
            setStatus('準備掃描下一個...');
          }, 3000);
        } else {
          setStatus(`❌ 錯誤：${data.error || '簽到失敗'}`);
          setIsProcessing(false);
        }
      } catch (error) {
        console.error(error);
        setStatus('❌ 連線後端失敗');
        setIsProcessing(false);
      }
    }

    function onScanError(err) {
      // 掃描中的正常噴錯（沒對準時），通常忽略
    }

    return () => scanner.clear();
  }, [isProcessing]);

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', textAlign: 'center', padding: '20px' }}>
      <h2>🔍 簽到掃描器</h2>
      <div id="reader" style={{ width: '100%' }}></div>
      
      <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #ddd' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>狀態：{status}</p>
        {scanResult && <p>最後掃描 ID: {scanResult}</p>}
      </div>

      <button 
        onClick={() => window.location.reload()} 
        style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
      >
        重置掃描器
      </button>
    </div>
  );
};

export default Scanner;