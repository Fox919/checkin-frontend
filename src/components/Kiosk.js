import React, { useState, useEffect } from 'react';

// 1. 在組件外部定義深色函數（保持不變）
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
  const [isProcessing, setIsProcessing] = useState(false); // 這裡對應你原本控制輸入框隱藏的狀態
  const [urlType, setUrlType] = useState(''); 
  
  // 🌟 新增：記錄勾選哪些用戶 ID 的狀態
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  const typeStyles = {
    'volunteer': { bg: '#FF9800', label: '義工', icon: '🧡' },
    'student': { bg: '#4CAF50', label: '學員', icon: '🌿' },
    'hall-newcomer': { bg: '#2196F3', label: '禪堂新人', icon: '🏠' },
    'expo-newcomer': { bg: '#9C27B0', label: '展會新人', icon: '🎪' },
    'visitor': { bg: '#757575', label: '訪客', icon: '👤' },
    'default': { bg: '#607D8B', label: '朋友', icon: '😊' }
  };

  // 載入初始名單
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

  // 根據輸入動態篩選出的一家人名單
  const filtered = phoneQuery.length >= 3 
    ? list.filter(item => item.phone?.replace(/\D/g, '').endsWith(phoneQuery))
    : [];

  // 🌟 自動預選：當查出新的一家人時，預設幫所有人打勾
  useEffect(() => {
    if (filtered.length > 0) {
      setSelectedUserIds(filtered.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  }, [phoneQuery, list]); // 當輸入字數改變或大名單更新時觸發

  // 切換單個成員的勾選狀態
  const handleToggleSelect = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  // 🌟 核心：一鍵批量簽到函數
  const handleBatchCheckin = async () => {
    if (selectedUserIds.length === 0) {
      alert("請至少勾選一位到場的成員！");
      return;
    }

    setIsProcessing(true); // 進入提交狀態，隱藏輸入框
    setMessage(`⌛ 正在辦理批量簽到中...`);
    
    try {
      // 同時發送多筆簽到請求給後端
      const checkinPromises = selectedUserIds.map(userId =>
        fetch(`${API_BASE}/checkin/${userId}`, { method: 'POST' })
          .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
          })
          .catch(err => {
            console.error(`用戶 ${userId} 簽到錯誤:`, err);
            return { success: false, name: '未知成員' };
          })
      );

      const results = await Promise.all(checkinPromises);
      
      const successList = results.filter(res => res.success);
      const failedList = results.filter(res => !res.success);

      if (successList.length > 0) {
        const successNames = successList.map(res => res.name).join(', ');
        setMessage(`✅ 簽到成功！歡迎：${successNames}`);
      }

      if (failedList.length > 0) {
        alert(`⚠️ 有 ${failedList.length} 位成員簽到失敗，請再試一次。`);
        setIsProcessing(false); // 讓義工可以重新操作
        return; 
      }
      
      // 全數成功後，清空輸入框與狀態
      setPhoneQuery('');
      setSelectedUserIds([]);
      
    } catch (error) {
      console.error("批量簽到致命失敗:", error);
      setMessage("⚠️ 系統連線錯誤，請稍後再試。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.2rem', color: '#2c3e50', marginBottom: '10px' }}>🙏 禪堂自助簽到</h1>
      
      {/* 訊息狀態提示欄 */}
      <div style={{ 
        fontSize: '1.2rem', minHeight: '50px', margin: '15px 0', padding: '10px 20px', borderRadius: '15px',
        backgroundColor: message.includes('✅') ? '#d4edda' : 
                         message.includes('⚠️') ? '#fff3cd' : '#f8f9fa',
        color: message.includes('✅') ? '#155724' : 
               message.includes('⚠️') ? '#856404' : '#666',
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        border: message.includes('⚠️') ? '1px solid #ffeeba' : '1px solid #eee',
        transition: 'all 0.3s ease'
      }}>
        {message}
      </div>
      
      {/* 後 4 碼輸入框 */}
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
              if (message.includes('成功') || message.includes('失敗') || message.includes('⚠️')) {
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

      {/* 搜尋名單渲染區 */}
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
          const isChecked = selectedUserIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleToggleSelect(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '90%',
                maxWidth: '400px',
                margin: '15px auto',
                padding: '20px',
                backgroundColor: isChecked ? style.bg : '#a0a0a0',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isChecked ? `0 8px 0 ${darker}` : '0 8px 0 #787878',
                transform: 'translateY(-4px)',
                transition: 'all 0.1s ease',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = isChecked ? `0 2px 0 ${darker}` : '0 2px 0 #787878';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = isChecked ? `0 8px 0 ${darker}` : '0 8px 0 #787878';
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = isChecked ? `0 2px 0 ${darker}` : '0 2px 0 #787878';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = isChecked ? `0 8px 0 ${darker}` : '0 8px 0 #787878';
              }}
            >
              {/* 左側複選框 */}
              <div style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // 點擊整塊 Div 觸發，此處防止 React 報錯
                  style={{ width: '28px', height: '28px', cursor: 'pointer', accentColor: '#ffffff' }}
                />
              </div>

              {/* 右側文字資訊 */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {style.icon} {item.name}
                </div>
                <div style={{
                  marginTop: '8px',
                  fontSize: '1.1rem',
                  display: 'inline-block',
                  padding: '4px 15px',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  borderRadius: '20px'
                }}>
                  {style.label}
                </div>
              </div>
            </div>
          );
        })}

        {/* 🌟 修正：一鍵批量簽到按鈕，必須放在 map 迴圈的外面 */}
        {filtered.length > 0 && (
          <button
            onClick={handleBatchCheckin}
            disabled={isProcessing || selectedUserIds.length === 0}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '90%',
              maxWidth: '400px',
              margin: '40px auto 25px auto',
              padding: '20px',
              backgroundColor: selectedUserIds.length > 0 ? '#4caf50' : '#cccccc', 
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: selectedUserIds.length > 0 ? 'pointer' : 'not-allowed',
              position: 'relative',
              boxShadow: selectedUserIds.length > 0 ? '0 8px 0 #388e3c' : '0 8px 0 #9e9e9e',
              transform: 'translateY(-4px)',
              transition: 'all 0.1s ease',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseDown={(e) => {
              if (selectedUserIds.length === 0) return;
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.boxShadow = '0 2px 0 #388e3c';
            }}
            onMouseUp={(e) => {
              if (selectedUserIds.length === 0) return;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 0 #388e3c';
            }}
            onTouchStart={(e) => {
              if (selectedUserIds.length === 0) return;
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.boxShadow = '0 2px 0 #388e3c';
            }}
            onTouchEnd={(e) => {
              if (selectedUserIds.length === 0) return;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 0 #388e3c';
            }}
          >
            {isProcessing ? (
              '正在辦理簽到中...'
            ) : selectedUserIds.length > 0 ? (
              `確認 ${selectedUserIds.length} 人到場簽到 🏃`
            ) : (
              '請勾選到場成員'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Kiosk;