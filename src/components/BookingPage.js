import React, { useState, useEffect, useMemo } from 'react';

const BookingPage = () => {
  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  
  // 預設日期為今天 (格式: YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(today);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('載入用戶失敗:', err));

    setOfferings([
      { id: 1, type: 'service', title: '一對一能量加持', icon: '✨', info: '每週三、六、日' },
      { id: 2, type: 'service', title: '藥師靈籤', icon: '🏮', info: '引領人生方向' },
      { id: 3, type: 'course', title: '8天禪修健身班', icon: '🌿', info: '補充生命能量' },
      { id: 4, type: 'course', title: '7天禪修減壓班', icon: '🧘', info: '快速放鬆身心' }
    ]);
  }, [API_BASE]);

  const matchedUsers = useMemo(() => {
    if (phoneQuery.length < 3) return [];
    return users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery));
  }, [phoneQuery, users]);

  useEffect(() => {
    if (matchedUsers.length === 1) {
      setSelectedUser(matchedUsers[0]);
    } else if (phoneQuery.length === 0) {
      setSelectedUser(null);
    }
  }, [phoneQuery, matchedUsers]);

  const submitBooking = async (item) => {
    if (!selectedUser) return;

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
        alert(`✅ 預約成功！\n日期：${bookingDate}\n項目：${item.title}\n預約人：${selectedUser.name}`);
        setPhoneQuery('');
        setSelectedUser(null);
      }
    } catch (err) {
      alert("⚠️ 預約失敗，請洽詢義工");
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>🙏 課程與服務預約</h2>

      {/* Step 1: 確認身分 */}
      <section style={{ 
        background: selectedUser ? '#e8f5e9' : '#f8f9fa', 
        padding: '20px', borderRadius: '15px', marginBottom: '20px', 
        border: selectedUser ? '2px solid #4caf50' : '1px solid transparent',
        transition: 'all 0.3s'
      }}>
        <h3 style={{ marginTop: 0 }}>Step 1: 確認身分</h3>
        <input 
          type="tel" 
          placeholder="輸入電話後 4 碼" 
          value={phoneQuery} 
          onChange={(e) => setPhoneQuery(e.target.value)} 
          style={{ width: '100%', padding: '12px', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid #ddd' }} 
        />
        <div style={{ marginTop: '10px' }}>
          {matchedUsers.map(u => (
            <button key={u.id} onClick={() => { setSelectedUser(u); setPhoneQuery(''); }} style={{ margin: '5px', padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: selectedUser?.id === u.id ? '#4caf50' : '#e9ecef', color: selectedUser?.id === u.id ? 'white' : 'black', cursor: 'pointer', fontWeight: 'bold' }}>
              我是 {u.name}
            </button>
          ))}
        </div>
        {selectedUser && <p style={{ color: '#2e7d32', fontWeight: 'bold', marginTop: '10px' }}>✓ 預約人：{selectedUser.name}</p>}
      </section>

      {/* Step 2: 選擇日期 (原生 HTML5 日期選擇器) */}
      <section style={{ marginBottom: '30px', opacity: selectedUser ? 1 : 0.5 }}>
        <h3 style={{ borderLeft: '5px solid #2196f3', paddingLeft: '10px' }}>Step 2: 選擇預約日期</h3>
        <input 
          type="date" 
          value={bookingDate}
          min={today}
          onChange={(e) => setBookingDate(e.target.value)}
          style={{ 
            width: '100%', padding: '15px', fontSize: '1.2rem', 
            borderRadius: '10px', border: '2px solid #2196f3',
            outline: 'none', background: 'white'
          }}
        />
      </section>

      {/* Step 3: 點擊項目 */}
      <section>
        <h3 style={{ borderLeft: '5px solid #ff9800', paddingLeft: '10px' }}>Step 3: 點擊項目完成預約</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {offerings.map(item => (
            <div 
              key={item.id}
              onClick={() => submitBooking(item)}
              style={{ 
                padding: '20px', borderRadius: '12px', border: '1px solid #eee',
                background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                cursor: selectedUser ? 'pointer' : 'not-allowed',
                opacity: selectedUser ? 1 : 0.5,
                filter: selectedUser ? 'none' : 'grayscale(100%)',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{item.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '5px' }}>{item.info}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BookingPage;