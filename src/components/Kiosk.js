import React, { useState, useEffect } from 'react';

const Kiosk = () => {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [list, setList] = useState([]);
  const [message, setMessage] = useState('請輸入電話後 4 碼進行簽到');
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlType, setUrlType] = useState(''); 

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  const typeStyles = {
    'volunteer': { bg: '#FF9800', label: '義工', icon: '🧡' },
    'student': { bg: '#4CAF50', label: '學員', icon: '🌿' },
    'hall-newcomer': { bg: '#2196F3', label: '禪堂新人', icon: '🏠' },
    'expo-newcomer': { bg: '#9C27B0', label: '展會新人', icon: '🎪' },
    'visitor': { bg: '#757575', label: '訪客', icon: '👤' },
    'default': { bg: '#607D8B', label: '朋友', icon: '😊' }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setUrlType(type.trim().toLowerCase());

    const query = params.get('query');
    if (query) {
      setPhoneQuery(query.replace(/\D/g, '').slice(0, 4));
    }

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
          window.history.replaceState({}, '', window.location.pathname);
        }, 3000);
      }
    } catch (err) {
      setMessage('⚠️ 連線失敗');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.2rem', color: '#2c3e50', marginBottom: '10px' }}>🙏 禪堂自助簽到</h1>
      
      <div style={{ 
        fontSize: '1.2rem', minHeight: '50px', margin: '15px 0', padding: '10px 20px', borderRadius: '15px',
        backgroundColor: message.includes('✅') ? '#d4edda' : '#f8f9fa',
        color: message.includes('✅') ? '#155724' : '#666',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee',
        transition: 'all 0.3s ease'
      }}>
        {message}
      </div>
      
      {!isProcessing && (
        <div style={{ position: 'relative', marginTop: '25px' }}>
          <input 
            type="tel" 
            inputMode="numeric" 
            placeholder="請輸入電話後 4 碼" 
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={{ 
              width: '90%', 
              padding: '15px 10px', 
              fontSize: '1.8rem', // 從 3.5 降到 2.2，確保 placeholder 不會被裁切
              textAlign: 'center', 
              borderRadius: '16px', 
              border: '2px solid #007bff', 
              outline: 'none', 
              letterSpacing: '8px', 
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,123,255,0.1)',
              backgroundColor: '#fff',
              transition: 'border-color 0.2s'
            }}
            autoFocus
          />
          <p style={{ marginTop: '10px', color: '#999', fontSize: '0.9rem' }}>
            請輸入您登記時使用的電話號碼末 4 位
          </p>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        {filtered.map(item => {
          const rawTypeFromDB = item.user_type || item.usertype || item.type || item.role || "";
          const finalType = (urlType || rawTypeFromDB).toString().trim().toLowerCase();

          let styleKey = 'default';
          if (finalType.includes('volunteer') || finalType.includes('guest')) styleKey = 'volunteer';
          else if (finalType.includes('student')) styleKey = 'student';
          else if (finalType.includes('hall')) styleKey = 'hall-newcomer';
          else if (finalType.includes('expo')) styleKey = 'expo-newcomer';
          else if (finalType.includes('visitor')) styleKey = 'visitor';

          const style = typeStyles[styleKey] || typeStyles['default'];

          return (
            <button 
              key={item.id} 
              onClick={() => handleCheckin(item.id, item.name)}
              style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', 
                padding: '18px', margin: '12px 0', backgroundColor: style.bg, color: 'white', 
                border: 'none', borderRadius: '18px', cursor: 'pointer', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.12)',
                transition: 'transform 0.1s active'
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                {style.icon} 我是 {item.name}
              </div>
              <div style={{ 
                marginTop: '6px', fontSize: '0.9rem', padding: '3px 12px', 
                backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px' 
              }}>
                {style.label} · {item.phone?.slice(-4)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Kiosk;