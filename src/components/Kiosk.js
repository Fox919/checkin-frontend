import React, { useState, useEffect } from 'react';

const Kiosk = () => {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [list, setList] = useState([]);
  const [message, setMessage] = useState('請輸入電話後 4 碼進行簽到');
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlType, setUrlType] = useState(''); 

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 建議將 Key 全部改為小寫，避免匹配失敗
  const typeStyles = {
    'volunteer': { bg: '#FF9800', label: '義工', icon: '🧡' },
    'student': { bg: '#4CAF50', label: '學員', icon: '🌿' },
    'hall-newcomer': { bg: '#2196F3', label: '禪堂新人', icon: '🏠' },
    'expo-newcomer': { bg: '#9C27B0', label: '展會新人', icon: '🎪' },
    'visitor': { bg: '#757575', label: '訪客', icon: '👤' },
    'default': { bg: '#607D8B', label: '朋友', icon: '😊' }
  };

  useEffect(() => {
    // 優先獲取網址參數
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setUrlType(type.trim().toLowerCase());

    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => setList(Array.isArray(data) ? data : []))
      .catch(err => setMessage('⚠️ 系統載入失敗'));
  }, []);

  const filtered = phoneQuery.length >= 3 
    ? list.filter(item => item.phone?.replace(/\D/g, '').endsWith(phoneQuery))
    : [];

  const handleCheckin = async (id, name) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setMessage(`⌛ 正在幫 ${name} 辦理簽到...`);
    
    try {
      const response = await fetch(`${API_BASE}/checkin/${id}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessage(`✅ 簽到成功！歡迎 ${name}`);
        setTimeout(() => {
          setPhoneQuery('');
          setMessage('請輸入電話後 4 碼進行簽到');
          setIsProcessing(false);
        }, 3000);
      }
    } catch (err) {
      setMessage('⚠️ 連線失敗');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#2c3e50' }}>🙏 禪堂自助簽到</h1>
      
      <div style={{ 
        fontSize: '1.4rem', minHeight: '60px', margin: '20px 0', padding: '10px', borderRadius: '12px',
        backgroundColor: message.includes('✅') ? '#d4edda' : '#f8f9fa',
        color: message.includes('✅') ? '#155724' : '#666',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee'
      }}>
        {message}
      </div>
      
      {!isProcessing && (
        <input 
          type="tel" inputMode="numeric" placeholder="在此輸入 4 位數..." 
          value={phoneQuery}
          onChange={(e) => setPhoneQuery(e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{ 
            width: '100%', padding: '20px', fontSize: '3.5rem', textAlign: 'center', borderRadius: '20px', 
            border: '3px solid #007bff', outline: 'none', letterSpacing: '10px', fontWeight: 'bold'
          }}
          autoFocus
        />
      )}

      <div style={{ marginTop: '30px' }}>

       {filtered.map(item => {
    const rawTypeFromDB = item.user_type || item.usertype || item.type || item.role || "";
    const finalType = (urlType || rawTypeFromDB).toString().trim().toLowerCase();

    let styleKey = 'default';

    // 邏輯判斷賦值也用小寫
    if (finalType.includes('volunteer') || finalType.includes('guest')) {
      styleKey = 'volunteer';
    } else if (finalType.includes('student')) {
      styleKey = 'student';
    } else if (finalType.includes('hall')) {
      styleKey = 'hall-newcomer';
    } else if (finalType.includes('expo')) {
      styleKey = 'expo-newcomer';
    } else if (finalType.includes('visitor')) {
      styleKey = 'visitor';
    }

    const style = typeStyles[styleKey] || typeStyles['default'];

    return (
    <button 
      key={item.id} 
      onClick={() => handleCheckin(item.id, item.name)}
      style={{ backgroundColor: style.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', 
        padding: '20px', margin: '15px 0', backgroundColor: style.bg, color: 'white', 
        border: 'none', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
      }}
    >
      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
        {style.icon} 我是 {item.name}
      </div>
      
      {/* --- 這裡非常關鍵：幫你抓出到底是哪個字對不上 --- */}
      <div style={{ marginTop: '8px', padding: '4px 15px', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '25px' }}>
        顯示類別: {style.label} | DB實際值: "{rawTypeFromDB || '空值'}"
      </div>
    </button>
  );
})}
      </div>
    </div>
  );
};

export default Kiosk;