import React, { useState, useEffect, useMemo } from 'react';

const BookingPage = () => {
  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  
  // 狀態管理：目前進行到哪一步
  const [step, setStep] = useState(1); // 1:選服務, 2:選日期
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));
    setOfferings([
      { id: 1, type: 'service', title: '一對一能量加持', icon: '✨', info: '每週三、六、日', availableDays: [0, 3, 6] }, // 0是週日
      { id: 2, type: 'service', title: '藥師靈籤', icon: '🏮', info: '每日皆可', availableDays: 'all' },
      { id: 3, type: 'course', title: '8天禪修健身班', icon: '🌿', info: '固定班期', availableDays: 'all' },
      { id: 4, type: 'course', title: '7天禪修減壓班', icon: '🧘', info: '需提前預約', availableDays: 'all' }
    ]);
  }, [API_BASE]);

  const matchedUsers = useMemo(() => {
    if (phoneQuery.length < 3) return [];
    return users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery));
  }, [phoneQuery, users]);

  useEffect(() => {
    if (matchedUsers.length === 1) setSelectedUser(matchedUsers[0]);
    else if (phoneQuery.length === 0) setSelectedUser(null);
  }, [phoneQuery, matchedUsers]);

  // 處理選擇服務
  const handleSelectService = (item) => {
    setSelectedItem(item);
    setStep(2); // 跳轉到第二步：選日期
  };

  const submitBooking = async () => {
    if (!selectedUser || !selectedItem) return;
    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          itemId: selectedItem.id,
          bookingDate: bookingDate
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 預約成功！\n項目：${selectedItem.title}\n日期：${bookingDate}`);
        setStep(1);
        setSelectedItem(null);
        setPhoneQuery('');
        setSelectedUser(null);
      }
    } catch (err) {
      alert("⚠️ 預約失敗");
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>🏛️ 禪修預約系統</h2>

      {/* --- Step 1: 選擇服務 --- */}
      {step === 1 && (
        <section>
          <h3 style={{ textAlign: 'center', color: '#7f8c8d' }}>請選擇預約項目</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            {offerings.map(item => (
              <div 
                key={item.id}
                onClick={() => handleSelectService(item)}
                style={{ 
                  padding: '20px', borderRadius: '15px', border: '1px solid #eee',
                  display: 'flex', alignItems: 'center', cursor: 'pointer',
                  background: 'white', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#3498db'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#eee'}
              >
                <div style={{ fontSize: '2.5rem', marginRight: '20px' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.9rem', color: '#888' }}>{item.info}</div>
                </div>
                <div style={{ color: '#3498db' }}>▶</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- Step 2: 確認身分與日期 --- */}
      {step === 2 && selectedItem && (
        <section>
          {/* 頂部導覽 */}
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px' }}>
            ← 返回重選項目
          </button>
          
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3rem' }}>{selectedItem.icon}</div>
              <h3 style={{ margin: '10px 0' }}>{selectedItem.title}</h3>
              <p style={{ color: '#888' }}>{selectedItem.info}</p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

            {/* 確認身分 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>1. 誰要預約？</label>
              <input 
                type="tel" 
                placeholder="輸入電話後 4 碼" 
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ddd' }}
              />
              <div style={{ marginTop: '10px' }}>
                {matchedUsers.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} style={{ margin: '3px', padding: '8px 15px', borderRadius: '20px', border: 'none', backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', color: selectedUser?.id === u.id ? 'white' : 'black', cursor: 'pointer' }}>
                    我是 {u.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 選擇日期 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>2. 選擇日期</label>
              <input 
                type="date" 
                value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>

            {/* 提交按鈕 */}
            <button 
              onClick={submitBooking}
              disabled={!selectedUser}
              style={{ 
                width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
                backgroundColor: selectedUser ? '#3498db' : '#bdc3c7',
                color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: selectedUser ? 'pointer' : 'not-allowed'
              }}
            >
              確認預約
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default BookingPage;