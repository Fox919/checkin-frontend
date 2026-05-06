import React, { useState, useEffect } from 'react';

const BookingPage = () => {
  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [message, setMessage] = useState('');

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 1. 初始化資料
  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => setMessage('⚠️ 無法載入用戶名單'));

    const mockOfferings = [
      { id: 1, type: 'service', title: '一對一能量加持', info: '每週三、六、日', icon: '✨' },
      { id: 2, type: 'service', title: '藥師靈籤 | 抽籤問事', info: '引領人生方向', icon: '🏮' },
      { id: 3, type: 'course', title: '8天禪修健身班', info: '補充生命能量', icon: '🌿' },
      { id: 4, type: 'course', title: '7天禪修減壓班', info: '快速放鬆身心', icon: '🧘' }
    ];
    setOfferings(mockOfferings);
  }, []);

  // 過濾電話匹配的用戶
  const matchedUsers = phoneQuery.length >= 3 
    ? users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery))
    : [];

  // ✨ 優化 1：自動選取邏輯
  // 當匹配結果剛好只有 1 個人的時候，自動幫用戶選定
  useEffect(() => {
    if (matchedUsers.length === 1) {
      setSelectedUser(matchedUsers[0]);
    } else if (phoneQuery.length === 0) {
      setSelectedUser(null);
    }
  }, [phoneQuery, matchedUsers]);

// 2. ✨ 使用 useMemo 優化 matchedUsers
  const matchedUsers = useMemo(() => {
    return phoneQuery.length >= 3 
      ? users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery))
      : [];
  }, [phoneQuery, users]); // 只有當電話輸入或總用戶名單改變時才重新計算

  // 3. ✨ 自動選取邏輯的 useEffect
  useEffect(() => {
    if (matchedUsers.length === 1) {
      setSelectedUser(matchedUsers[0]);
    } else if (phoneQuery.length === 0) {
      setSelectedUser(null);
    }
  }, [phoneQuery, matchedUsers]); // 現在這裡的 matchedUsers 是穩定的了



  // 2. 處理預約提交
  const handleBook = async (item) => {
    if (!selectedUser) {
      alert("⚠️ 請先在上方輸入電話並確認您的姓名（解鎖項目）");
      window.scrollTo({ top: 0, behavior: 'smooth' }); // 自動捲回上方提醒用戶
      return;
    }

    const bookingDate = prompt(`您好 ${selectedUser.name}，請輸入預約「${item.title}」的日期 (YYYY-MM-DD)`, new Date().toISOString().split('T')[0]);
    if (!bookingDate) return;

    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          itemId: item.id,
          bookingDate: bookingDate
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 預約成功！\n項目：${item.title}\n預約人：${selectedUser.name}`);
        setPhoneQuery('');
        setSelectedUser(null);
      }
    } catch (err) {
      alert("⚠️ 預約失敗，請洽詢義工");
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>🙏 課程與服務預約</h2>
      {message && <p style={{ color: 'red', textAlign: 'center' }}>{message}</p>}

      {/* 第一步：確認身分 */}
      <section style={{ 
        background: selectedUser ? '#e8f5e9' : '#f8f9fa', 
        padding: '20px', 
        borderRadius: '15px', 
        marginBottom: '30px',
        border: selectedUser ? '2px solid #4caf50' : '2px solid transparent',
        transition: 'all 0.3s'
      }}>
        <h3 style={{ marginTop: 0 }}>Step 1: 誰要預約？</h3>
        <input 
          type="tel"
          placeholder="輸入電話後 4 碼"
          value={phoneQuery}
          onChange={(e) => setPhoneQuery(e.target.value)}
          style={{ width: '100%', padding: '12px', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <div style={{ marginTop: '10px' }}>
          {matchedUsers.map(u => (
            <button 
              key={u.id}
              onClick={() => { setSelectedUser(u); setPhoneQuery(''); }}
              style={{ 
                margin: '5px', padding: '10px 20px', borderRadius: '20px', border: 'none',
                backgroundColor: selectedUser?.id === u.id ? '#4caf50' : '#e9ecef',
                color: selectedUser?.id === u.id ? 'white' : 'black',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              我是 {u.name}
            </button>
          ))}
        </div>
        {selectedUser && <p style={{ color: '#2e7d32', fontWeight: 'bold', marginTop: '10px' }}>✓ 已選定預約人：{selectedUser.name}</p>}
      </section>

      {/* 第二步：選擇項目 */}
      <section style={{ position: 'relative' }}>
        <h3 style={{ borderLeft: '5px solid #ff9800', paddingLeft: '10px' }}>Step 2: 選擇預約項目</h3>
        
        {['service', 'course'].map(category => (
          <div key={category} style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#666', textTransform: 'uppercase' }}>
              {category === 'service' ? '✨ 諮詢服務' : '🧘 禪修課程'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {offerings.filter(o => o.type === category).map(item => (
                <div 
                  key={item.id}
                  onClick={() => handleBook(item)}
                  style={{ 
                    padding: '20px', borderRadius: '12px', border: '1px solid #eee',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)', 
                    cursor: selectedUser ? 'pointer' : 'not-allowed', // ✨ 優化 2: 沒選人時顯示禁止符號
                    opacity: selectedUser ? 1 : 0.5,                  // ✨ 優化 2: 沒選人時變半透明
                    filter: selectedUser ? 'none' : 'grayscale(100%)', // ✨ 優化 2: 沒選人時變黑白
                    backgroundColor: 'white',
                    transition: 'all 0.3s',
                    transform: 'scale(1)'
                  }}
                  onMouseOver={(e) => {
                    if(selectedUser) e.currentTarget.style.transform = 'scale(1.03)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{item.icon}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: selectedUser ? '#333' : '#999' }}>{item.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '5px' }}>{item.info}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* 如果沒選人，顯示一個輕微的提示浮層（可選） */}
        {!selectedUser && (
          <p style={{ textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
            — 請先完成 Step 1 以解鎖預約項目 —
          </p>
        )}
      </section>
    </div>
  );
};

export default BookingPage;