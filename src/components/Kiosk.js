import React, { useState, useEffect } from 'react';

const Kiosk = () => {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [list, setList] = useState([]);
  const [message, setMessage] = useState('請輸入電話後 4 碼進行簽到');
  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 1. 頁面載入時先抓取所有用戶清單
  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => {
        setList(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("無法載入名單", err);
        setMessage('⚠️ 系統載入失敗，請檢查網路');
      });
  }, []);

  // 2. 優化後的篩選邏輯：移除電話中的非數字字元再進行比對
  const filtered = phoneQuery.length >= 3 
    ? list.filter(item => {
        if (!item.phone) return false;
        // 先將電話中的空格、橫線等全部去掉，只留數字
        const cleanPhone = item.phone.replace(/\D/g, '');
        return cleanPhone.endsWith(phoneQuery);
      })
    : [];

  // 3. 簽到執行邏輯
  const handleCheckin = async (id, name) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setMessage(`⌛ 正在幫 ${name} 辦理簽到...`);
    
    try {
      const response = await fetch(`${API_BASE}/checkin/${id}`, {
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
        const errorText = data.message || data.error || "簽到失敗";
        setMessage(`❌ 錯誤：${errorText}`);
        setTimeout(() => setIsProcessing(false), 3000);
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
      
      <div style={{ 
        fontSize: '1.4rem', 
        minHeight: '60px', 
        margin: '20px 0', 
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: message.includes('✅') ? '#d4edda' : (message.includes('❌') || message.includes('⚠️')) ? '#f8d7da' : '#f8f9fa',
        color: message.includes('✅') ? '#155724' : (message.includes('❌') || message.includes('⚠️')) ? '#721c24' : '#666',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #eee'
      }}>
        {message}
      </div>
      
      {!isProcessing && (
        <input 
          type="tel" 
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
            border: '2px solid #007bff',
            boxShadow: '0 4px 12px rgba(0,123,255,0.1)',
            outline: 'none'
          }}
          autoFocus
        />
      )}

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
                  padding: '20px', 
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
                我是 {item.name} <span style={{fontSize: '1.2rem', opacity: 0.8}}>({item.phone?.slice(-4)})</span>
              </button>
            ))}
          </div>
        ) : (
          phoneQuery.length === 4 && filtered.length === 0 && !isProcessing && (
            <div style={{ padding: '20px', backgroundColor: '#fff5f5', borderRadius: '10px' }}>
              <p style={{ color: '#e74c3c', fontSize: '1.2rem', fontWeight: 'bold' }}>找不到符合的資料</p>
              <p style={{ color: '#666' }}>請確認輸入是否正確，或洽詢接待人員登記。</p>
            </div>
          )
        )}
      </div>

      <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <p style={{ fontSize: '0.9rem', color: '#999' }}>
          若是初次參與，請先點擊上方「登記」按鈕
        </p>
      </div>
    </div>
  );
};

export default Kiosk;