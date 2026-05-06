import React, { useState, useEffect } from 'react';

const BookingPage = () => {
  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [message, setMessage] = useState('');

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 1. 初始化資料：讀取用戶名單與服務項目
  useEffect(() => {
    // 獲取用戶 (用於身分核對)
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => setMessage('⚠️ 無法載入用戶名單'));

    // 獲取服務項目 (這部分你可以先用 Mock Data，等後端寫好再對接)
    const mockOfferings = [
      { id: 1, type: 'service', title: '一對一能量加持', info: '每週三、六、日', icon: '✨' },
      { id: 2, type: 'service', title: '藥師靈籤 | 抽籤問事', info: '引領人生方向', icon: '🏮' },
      { id: 3, type: 'course', title: '8天禪修健身班', info: '補充生命能量', icon: '🌿' },
      { id: 4, type: 'course', title: '7天禪修減壓班', info: '快速放鬆身心', icon: '🧘' }
    ];
    setOfferings(mockOfferings);
  }, []);

  // 2. 處理預約提交
  const handleBook = async (item) => {
    if (!selectedUser) {
      alert("請先輸入電話並選擇您的姓名");
      return;
    }

    const bookingDate = prompt("請輸入預約日期 (格式: YYYY-MM-DD)", new Date().toISOString().split('T')[0]);
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

  // 過濾電話匹配的用戶
  const matchedUsers = phoneQuery.length >= 3 
    ? users.filter(u => u.phone?.endsWith(phoneQuery))
    : [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>🙏 課程與服務預約</h2>

      {/* 第一步：確認身分 */}
      <section style={{ background: '#f8f9fa', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
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
                backgroundColor: selectedUser?.id === u.id ? '#007bff' : '#e9ecef',
                color: selectedUser?.id === u.id ? 'white' : 'black',
                cursor: 'pointer'
              }}
            >
              我是 {u.name}
            </button>
          ))}
        </div>
        {selectedUser && <p style={{ color: '#28a745', fontWeight: 'bold' }}>✓ 已選定：{selectedUser.name}</p>}
      </section>

      {/* 第二步：選擇項目 */}
      <section>
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
                    padding: '15px', borderRadius: '12px', border: '1px solid #eee',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{item.icon}</div>
                  <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>{item.info}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default BookingPage;