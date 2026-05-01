import React, { useState, useEffect } from 'react';

const Kiosk = () => {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [list, setList] = useState([]);
  const [message, setMessage] = useState('請輸入電話後 4 碼進行簽到');
  const [isProcessing, setIsProcessing] = useState(false);

  // 頁面載入時先抓取所有用戶清單，加速搜尋反應
  useEffect(() => {
    fetch(`https://checkin-system-production-2a74.up.railway.app/users`)
      .then(res => res.json())
      .then(data => {
        // 確保 data 是陣列
        setList(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("無法載入名單", err);
        setMessage('⚠️ 系統載入失敗，請檢查網路');
      });
  }, []);

  // 篩選邏輯：當輸入 3 碼或 4 碼時自動篩選符合的姓名
  const filtered = phoneQuery.length >= 3 
    ? list.filter(item => item.phone && item.phone.endsWith(phoneQuery))
    : [];

  // 簽到執行邏輯
  const handleCheckin = async (id, name) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setMessage(`⌛ 正在幫 ${name} 辦理簽到...`);
    
    try {
      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${id}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ 簽到成功！歡迎 ${data.name || name}`);
        // 成功後倒數 3 秒重置畫面
        setTimeout(() => {
          setPhoneQuery('');
          setMessage('請輸入電話後 4 碼進行簽到');
          setIsProcessing(false);
        }, 3000);
      } else {
        // 這裡承接後端的 message，解決之前的 undefined 問題
        const errorText = data.message || data.error || "簽到失敗";
        setMessage(`❌ 錯誤：${errorText}`);
        
        // 失敗時不自動清空，讓使用者看清楚錯誤訊息，5 秒後才重置按鈕狀態
        setTimeout(() => setIsProcessing(false), 5000);
      }
    } catch (err) {
      console.error("簽到請求失敗:", err);
      setMessage('⚠️ 連線伺服器失敗，請洽工作人員');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ 
      padding: '40px 20px', 
      textAlign: 'center', 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <h1 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' }}>🙏 禪堂自助簽到</h1>
      
      {/* 狀態訊息顯示區 */}
      <div style={{ 
        fontSize: '1.4rem', 
        minHeight: '60px', 
        margin: '20px 0', 
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('❌') ? '#f8d7da' : '#f8f9fa',
        color: message.includes('✅') ? '#155724' : message.includes('❌') ? '#721c24' : '#666',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {message}
      </div>
      
      {/* 數字輸入框 */}
      {!isProcessing && (
        <input 
          type="tel" // 使用 tel 可以在手機/平板彈出數字鍵盤
          pattern="[0-9]*"
          inputMode="numeric"
          placeholder="在此輸入 4 位數..." 
          value={phoneQuery}
          onChange={(e) => setPhoneQuery(e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{ 
            width: '100%', 
            padding: '25px', 
            fontSize: '3rem', 
            textAlign: 'center', 
            borderRadius: '15px', 
            border: '2px solid #ddd',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
            outline: 'none'
          }}
          autoFocus
        />
      )}

      {/* 搜尋結果列表：當輸入內容時顯示匹配的按鈕 */}
      <div style={{ marginTop: '30px' }}>
        {filtered.length > 0 && !isProcessing ? (
          <div>
            <p style={{ color: '#888', marginBottom: '10px' }}>請點擊您的姓名完成簽到：</p>
            {filtered.map(item => (
              <button 
                key={item.id} 
                onClick={() => handleCheckin(item.id, item.name)}
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  padding: '25px', 
                  margin: '15px 0', 
                  fontSize: '1.8rem', 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                我是 {item.name}
              </button>
            ))}
          </div>
        ) : (
          phoneQuery.length === 4 && filtered.length === 0 && !isProcessing && (
            <p style={{ color: '#e74c3c', fontSize: '1.2rem' }}>找不到符合的資料，請重新輸入</p>
          )
        )}
      </div>

      {/* 回到首頁或導覽的按鈕（可選） */}
      <div style={{ marginTop: '50px' }}>
        <p style={{ fontSize: '0.9rem', color: '#999' }}>
          若是初次參與，請先點擊上方「登記」按鈕
        </p>
      </div>
    </div>
  );
};

export default Kiosk;