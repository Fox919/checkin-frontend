import React, { useState, useEffect, useMemo } from 'react';

const BookingPage = () => {
  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  
  const [step, setStep] = useState(1); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));
    setOfferings([
      { id: 1, type: 'service', title: '一對一能量加持', icon: '✨', info: '每週三、六、日', availableDays: [0, 3, 6] },
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

  const handleSelectService = (item) => {
    setSelectedItem(item);
    setStep(2);
    // 重置日期為下一個可用的日期
    const d = new Date();
    setBookingDate(d.toISOString().split('T')[0]);
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
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
            ← 返回重選項目
          </button>
          
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3rem' }}>{selectedItem.icon}</div>
              <h3 style={{ margin: '10px 0' }}>{selectedItem.title}</h3>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>{selectedItem.info}</p>
            </div>

            {/* --- 優化後的日期選擇列表 --- */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#34495e' }}>1. 選擇預約日期</label>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                {[...Array(14)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dString = d.toISOString().split('T')[0];
                  const isAllowed = selectedItem.availableDays === 'all' || selectedItem.availableDays.includes(d.getDay());
                  const isSelected = bookingDate === dString;

                  return (
                    <div 
                      key={dString}
                      onClick={() => isAllowed && setBookingDate(dString)}
                      style={{
                        flex: '0 0 65px', padding: '12px 8px', borderRadius: '12px', textAlign: 'center',
                        cursor: isAllowed ? 'pointer' : 'not-allowed',
                        background: isSelected ? '#3498db' : (isAllowed ? '#fff' : '#f8f9fa'),
                        color: isSelected ? 'white' : (isAllowed ? '#333' : '#ccc'),
                        border: isSelected ? '2px solid #3498db' : '1px solid #eee',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 10px rgba(52,152,219,0.3)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', marginBottom: '4px' }}>{d.getMonth()+1}月</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{d.getDate()}</div>
                      <div style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                        {['週日','週一','週二','週三','週四','週五','週六'][d.getDay()]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

            {/* 確認身分 */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#34495e' }}>2. 您的身分</label>
              <input 
                type="tel" 
                placeholder="請輸入電話後 4 碼" 
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem' }}
              />
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {matchedUsers.map(u => (
                  <button 
                    key={u.id} 
                    onClick={() => setSelectedUser(u)} 
                    style={{ 
                      padding: '10px 18px', borderRadius: '25px', border: 'none', 
                      backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', 
                      color: selectedUser?.id === u.id ? 'white' : '#2c3e50', 
                      cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                    }}
                  >
                    我是 {u.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 提交按鈕 */}
            <button 
              onClick={submitBooking}
              disabled={!selectedUser}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                backgroundColor: selectedUser ? '#3498db' : '#ecf0f1',
                color: selectedUser ? 'white' : '#bdc3c7', 
                fontSize: '1.1rem', fontWeight: 'bold', cursor: selectedUser ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s'
              }}
            >
              {selectedUser ? `確認為 ${selectedUser.name} 預約` : '請先確認身分'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default BookingPage;