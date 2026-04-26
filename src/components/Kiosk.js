import React, { useState, useEffect } from 'react';

const Kiosk = () => {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [list, setList] = useState([]);
  const [message, setMessage] = useState('請輸入電話後 4 碼進行簽到');
  const [isProcessing, setIsProcessing] = useState(false);

  // 初始化時讀取所有名單 (用於搜尋)
  useEffect(() => {
    fetch(`https://checkin-system-production-2a74.up.railway.app/admin/checkins`)
      .then(res => res.json())
      .then(data => setList(data))
      .catch(err => console.error("無法載入名單", err));
  }, []);

  // 篩選出符合電話後 4 碼的人
  const filtered = phoneQuery.length >= 3 
    ? list.filter(item => item.phone && item.phone.endsWith(phoneQuery))
    : [];

  const handleCheckin = async (id, name) => {
    setIsProcessing(true);
    setMessage(`正在幫 ${name} 簽到...`);
    
    try {
      const response = await fetch(`https://checkin-system-production-2a74.up.railway.app/checkin/${id}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ 簽到成功！歡迎 ${data.name}`);
        // 3秒後自動重置，給下一位使用
        setTimeout(() => {
          setPhoneQuery('');
          setMessage('請輸入電話後 4 碼進行簽到');
          setIsProcessing(false);
        }, 3000);
      } else {
        setMessage(`❌ 錯誤：${data.error}`);
        setIsProcessing(false);
      }
    } catch (err) {
      setMessage('⚠️ 連線失敗，請稍後再試');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem' }}>🙏 禪堂自助簽到</h1>
      <p style={{ fontSize: '1.5rem', margin: '20px 0' }}>{message}</p>
      
      {!isProcessing && (
        <input 
          type="number" 
          placeholder="輸入電話後 4 碼" 
          value={phoneQuery}
          onChange={(e) => setPhoneQuery(e.target.value)}
          style={{ width: '100%', padding: '20px', fontSize: '2rem', textAlign: 'center' }}
        />
      )}

      {/* 搜尋結果列表 */}
      {filtered.length > 0 && !isProcessing && (
        <div style={{ marginTop: '20px' }}>
          {filtered.map(item => (
            <button 
              key={item.id} 
              onClick={() => handleCheckin(item.id, item.name)}
              style={{ 
                display: 'block', width: '100%', padding: '20px', margin: '10px 0', 
                fontSize: '1.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px'
              }}
            >
              我是 {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Kiosk;