import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

function Checkin() {
  const [message, setMessage] = useState('請掃描您的 QR Code 進行簽到');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. 核心簽到執行邏輯 (與 Kiosk 共用同樣的後端 API)
  const executeCheckin = async (userId) => {
    if (isProcessing) return; // 防止重複觸發

    try {
      setIsProcessing(true);
      setMessage('⌛ 正在驗證簽到資訊...');

      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${userId}`, {
        method: 'POST'
      });
      
      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        setMessage(`❌ 伺服器錯誤：回傳格式異常`);
        setIsProcessing(false);
        return;
      }

      if (data.success === true) {
        setMessage(`✅ 簽到成功：${data.name || "已完成"}`);
        // 3秒後恢復初始狀態，準備下一位簽到
        setTimeout(() => {
          setMessage('請掃描您的 QR Code 進行簽到');
          setIsProcessing(false);
        }, 3000);
      } else {
        const errorDetail = data.message || data.error || "簽到失敗";
        setMessage(`❌ 對不起：${errorDetail}`);
        // 失敗時給予較長的顯示時間，手動恢復處理狀態
        setTimeout(() => setIsProcessing(false), 2000);
      }
    } catch (err) {
      console.error("連線發生異常:", err);
      setMessage('⚠️ 無法連線至伺服器，請檢查網路');
      setIsProcessing(false);
    }
  };

  // 2. 處理掃碼事件
  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0 && !isProcessing) {
      // 取得掃描結果的值
      const userId = detectedCodes[0].rawValue || detectedCodes[0].value;
      if (userId) {
        executeCheckin(userId);
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>📷 掃碼簽到頁面</h2>

      {/* 掃碼區域 */}
      <div style={{ 
        width: '100%', 
        aspectRatio: '1/1',
        marginBottom: '20px', 
        border: '2px solid #007bff', 
        borderRadius: '16px', 
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000'
      }}>
        {/* 如果正在處理中，可以加一個透明遮罩防止重複掃描 */}
        {isProcessing && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold'
          }}>
            處理中...
          </div>
        )}
        <Scanner onScan={handleScan} />
      </div>

      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
        請將登記後的 QR Code 對準攝影機
      </p>

      {/* 訊息顯示區 */}
      <div style={{ 
        padding: '20px', 
        borderRadius: '12px',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: message.includes('✅') ? '#d4edda' : (message.includes('❌') || message.includes('⚠️')) ? '#f8d7da' : '#f8f9fa',
        color: message.includes('✅') ? '#155724' : (message.includes('❌') || message.includes('⚠️')) ? '#721c24' : '#495057',
        border: '1px solid #eee',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        {message}
      </div>

      {/* 頁面引導備註 */}
      <div style={{ marginTop: '30px', fontSize: '0.85rem', color: '#999' }}>
        提示：若無法掃描，請點擊上方導航的「快速簽到」使用電話號碼
      </div>
    </div>
  );
}

export default Checkin;