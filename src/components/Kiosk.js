import React, { useState, useEffect } from 'react';

const Kiosk = () => {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [list, setList] = useState([]);
  const [message, setMessage] = useState('請輸入電話後 4 碼進行簽到');
  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  const typeStyles = {
    'Volunteer': { bg: '#FF9800', label: '義工', icon: '🧡' },
    'Student': { bg: '#4CAF50', label: '學員', icon: '🌿' },
    'Hall-Newcomer': { bg: '#2196F3', label: '禪堂新人', icon: '🏠' },
    'Expo-Newcomer': { bg: '#9C27B0', label: '展會新人', icon: '🎪' },
    'Visitor': { bg: '#757575', label: '訪客', icon: '👤' },
    'default': { bg: '#607D8B', label: '朋友', icon: '😊' }
  };

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => setList(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("無法載入名單", err);
        setMessage('⚠️ 系統載入失敗，請檢查網路');
      });
  }, []);

  const filtered = phoneQuery.length >= 3 
    ? list.filter(item => {
        if (!item.phone) return false;
        const cleanPhone = item.phone.replace(/\D/g, '');
        return cleanPhone.endsWith(phoneQuery);
      })
    : [];

  const handleCheckin = async (id, name) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setMessage(`⌛ 正在幫 ${name} 辦理簽到...`);
    
    try {
      const response = await fetch(`${API_BASE}/checkin/${id}`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ 簽到成功！歡迎 ${data.name || name}`);
        setTimeout(() => {
          setPhoneQuery('');
          setMessage('請輸入電話後 4 碼進行簽到');
          setIsProcessing(false);
        }, 3000);
      } else {
        setMessage(`❌ 錯誤：${data.message || "簽到失敗"}`);
        setTimeout(() => setIsProcessing(false), 3000);
      }
    } catch (err) {
      setMessage('⚠️ 連線伺服器失敗，請洽工作人員');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' }}>🙏 禪堂自助簽到</h1>
      
      {/* 狀態提示 */}
      <div style={{ 
        fontSize: '1.4rem', minHeight: '60px', margin: '20px 0', padding: '10px', borderRadius: '12px',
        backgroundColor: message.includes('✅') ? '#d4edda' : (message.includes('❌') || message.includes('⚠️')) ? '#f8d7da' : '#f8f9fa',
        color: message.includes('✅') ? '#155724' : (message.includes('❌') || message.includes('⚠️')) ? '#721c24' : '#666',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee'
      }}>
        {message}
      </div>
      
      {/* 數字輸入 */}
      {!isProcessing && (
        <input 
          type="tel" inputMode="numeric" placeholder="在此輸入 4 位數..." 
          value={phoneQuery}
          onChange={(e) => setPhoneQuery(e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{ 
            width: '100%', padding: '20px', fontSize: '3.5rem', textAlign: 'center', borderRadius: '20px', 
            border: '3px solid #007bff', boxShadow: '0 8px 16px rgba(0,123,255,0.15)', outline: 'none', letterSpacing: '10px', fontWeight: 'bold'
          }}
          autoFocus
        />
      )}

      {/* 搜尋結果 */}
      <div style={{ marginTop: '30px' }}>
        {filtered.length > 0 && !isProcessing ? (
          <div>
            <p style={{ color: '#888', marginBottom: '15px', fontSize: '1.1rem' }}>找到以下成員，請點擊姓名簽到：</p>
            {filtered.map(item => {
              // --- 強化版身分樣式邏輯 ---
              const rawType = (item.user_type || item.type || item.role || 'Visitor').toString().toLowerCase().trim();
              
              let styleKey = 'default';
              if (rawType.includes('volunteer')) styleKey = 'Volunteer';
              else if (rawType.includes('student')) styleKey = 'Student';
              else if (rawType.includes('hall')) styleKey = 'Hall-Newcomer';
              else if (rawType.includes('expo')) styleKey = 'Expo-Newcomer';
              else if (rawType.includes('visitor')) styleKey = 'Visitor';

              const style = typeStyles[styleKey] || typeStyles['default'];

              return (
                <button 
                  key={item.id} 
                  onClick={() => handleCheckin(item.id, item.name)}
                  style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', 
                    padding: '20px', margin: '15px 0', backgroundColor: style.bg, color: 'white', 
                    border: 'none', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 6px 12px rgba(0,0,0,0.15)', transition: 'all 0.2s ease'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {style.icon} 我是 {item.name}
                  </div>
                  <div style={{ 
                    marginTop: '8px', padding: '4px 15px', backgroundColor: 'rgba(255,255,255,0.25)', 
                    borderRadius: '25px', fontSize: '1rem', fontWeight: '500', display: 'flex', gap: '10px' 
                  }}>
                    <span>類別: {style.label}</span>
                    <span>|</span>
                    <span>電話末碼: {item.phone ? item.phone.slice(-4) : '無'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          phoneQuery.length === 4 && filtered.length === 0 && !isProcessing && (
            <div style={{ padding: '30px', backgroundColor: '#fff5f5', borderRadius: '20px', border: '1px solid #feb2b2' }}>
              <p style={{ color: '#e74c3c', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '10px' }}>🔍 找不到您的資料</p>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>請確認號碼是否正確，或點擊下方登記。</p>
            </div>
          )
        )}
      </div>

      {/* 底部引導 */}
      <div style={{ marginTop: '60px', borderTop: '2px dashed #ddd', paddingTop: '30px' }}>
        <button 
          onClick={() => window.location.href = '/register'}
          style={{
            padding: '15px 40px', fontSize: '1.2rem', backgroundColor: '#f8f9fa', 
            border: '2px solid #ddd', borderRadius: '30px', cursor: 'pointer', color: '#333', fontWeight: 'bold'
          }}
        >
          📝 前往登記
        </button>
      </div>
    </div>
  );
};

export default Kiosk;