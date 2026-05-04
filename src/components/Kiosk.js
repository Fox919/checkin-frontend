import React, { useState, useEffect } from 'react';

// 1. 在組件外部定義深色函數
const getDarkerColor = (hex) => {
  const darkenMap = {
    '#FF9800': '#E68900', // Volunteer
    '#4CAF50': '#388E3C', // Student
    '#2196F3': '#1976D2', // Hall
    '#9C27B0': '#7B1FA2', // Expo
    '#757575': '#616161', // Visitor
    '#607D8B': '#455A64'  // Default
  };
  return darkenMap[hex] || '#333';
};

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
        // 1.5秒後重置，讓下一個人可以簽到
        setTimeout(() => {
          setPhoneQuery('');
          setMessage('請輸入電話後 4 碼進行簽到');
          setIsProcessing(false); 
          window.history.replaceState({}, '', window.location.pathname);
        }, 1500); 
      } else {
        setMessage(`❌ 對不起: ${data.message || '請洽工作人員'}`);
        setIsProcessing(false);
      }
    } catch (err) {
      setMessage('⚠️ 連線失敗，請重試');
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
      
      {/* 這裡修正了 onChange 的語法錯誤 */}
      {!isProcessing && (
        <div style={{ position: 'relative', marginTop: '25px' }}>
          <input 
            type="tel" 
            inputMode="numeric" 
            placeholder="請輸入" 
            value={phoneQuery}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPhoneQuery(val);
              // 如果手動輸入新號碼，確保提示文字恢復正常
              if (message.includes('成功') || message.includes('失敗')) {
                setMessage('請輸入電話後 4 碼進行簽到');
              }
            }}
            style={{ 
              width: '80%', 
              padding: '15px 10px', 
              fontSize: '1.4rem', 
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
          <p style={{ marginTop: '10px', color: '#999', fontSize: '1.2rem' }}>
            請輸入您電話號碼後 4 位
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
          const darker = getDarkerColor(style.bg);

          return (
            <button 
              key={item.id} 
              onClick={() => handleCheckin(item.id, item.name)}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '90%', 
                maxWidth: '400px', 
                margin: '25px auto', 
                padding: '20px', 
                backgroundColor: style.bg, 
                color: 'white', 
                border: 'none', 
                borderRadius: '20px', 
                cursor: 'pointer',
                position: 'relative',
                boxShadow: `0 8px 0 ${darker}`, 
                transform: 'translateY(-4px)',   
                transition: 'all 0.1s ease',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = `0 2px 0 ${darker}`;
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 0 ${darker}`;
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = `0 2px 0 ${darker}`;
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 0 ${darker}`;
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {style.icon} 我是 {item.name}
              </div>
              <div style={{ 
                marginTop: '8px', 
                fontSize: '1.1rem', 
                padding: '4px 15px', 
                backgroundColor: 'rgba(0,0,0,0.15)', 
                borderRadius: '20px' 
              }}>
                {style.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Kiosk;