import React, { useState, useEffect, useMemo } from 'react';

const BookingPage = () => {
  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  
  const [step, setStep] = useState(1); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // 1. 初始化資料 (補回課程)
  useEffect(() => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));
    setOfferings([
      { 
        id: 1, type: 'service', title: '一對一能量加持', icon: '✨', info: '周三 10,2,3,4點 | 周六日 2,3,4點', 
        availableDays: [0, 3, 6], // 0:日, 3:三, 6:六
        getTimeSlots: (dateString) => {
          // 修正：使用更穩定的日期解析方式，避免時區導致日期偏差
          const [y, m, d] = dateString.split('-').map(Number);
          const day = new Date(y, m - 1, d).getDay();
          if (day === 3) return ['10:00', '14:00', '15:00', '16:00'];
          if (day === 6 || day === 0) return ['14:00', '15:00', '16:00'];
          return [];
        }
      },
      { 
        id: 2, type: 'service', title: '藥師靈籤', icon: '🏮', info: '每日皆可', 
        availableDays: 'all',
        getTimeSlots: () => ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      },
      { 
        id: 3, type: 'course', title: '8天禪修健身班', icon: '🌿', info: '補充生命能量', 
        availableDays: 'all',
        getTimeSlots: () => ['09:00'] 
      },
      { 
        id: 4, type: 'course', title: '7天禪修減壓班', icon: '🧘', info: '快速放鬆身心', 
        availableDays: 'all',
        getTimeSlots: () => ['19:00'] 
      }
    ]);
  }, [API_BASE]);

  // 2. 身份搜尋與自動帶出邏輯 (修復點：輸入後自動選取)
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

  // 3. 獲取當前時段 (加入調適 Log 方便偵錯)
  const currentSlots = useMemo(() => {
    if (!selectedItem || !selectedItem.getTimeSlots) return [];
    return selectedItem.getTimeSlots(bookingDate);
  }, [selectedItem, bookingDate]);

  const submitBooking = async () => {
    if (!selectedUser || !selectedItem || !selectedTime) return;
    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          itemId: selectedItem.id,
          bookingDate: bookingDate,
          bookingTime: selectedTime
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 預約成功！\n項目：${selectedItem.title}\n時間：${bookingDate} ${selectedTime}\n預約人：${selectedUser.name}`);
        setStep(1);
        setSelectedItem(null);
        setSelectedTime('');
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

      {/* Step 1: 選擇服務與課程 */}
      {step === 1 && (
        <section>
          <h3 style={{ textAlign: 'center', color: '#7f8c8d' }}>請選擇預約項目</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            {offerings.map(item => (
              <div key={item.id} onClick={() => { setSelectedItem(item); setStep(2); }} 
                style={{ padding: '20px', borderRadius: '15px', border: '1px solid #eee', display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '2.5rem', marginRight: '20px' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>{item.info}</div>
                </div>
                <div style={{ color: '#3498db' }}>▶</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Step 2: 詳細預約介面 */}
      {step === 2 && selectedItem && (
        <section>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
            ← 返回重選項目
          </button>
          
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3rem' }}>{selectedItem.icon}</div>
              <h3 style={{ margin: '5px 0' }}>{selectedItem.title}</h3>
              <p style={{ color: '#e67e22', fontSize: '0.9rem', fontWeight: 'bold' }}>{selectedItem.info}</p>
            </div>

            {/* 1. 日期選擇 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. 選擇日期</label>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px' }}>
                {[...Array(14)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dString = d.toISOString().split('T')[0];
                  
                  // 檢查該日期是否可選
                  const [y, m, dayVal] = dString.split('-').map(Number);
                  const dayOfWeek = new Date(y, m - 1, dayVal).getDay();
                  const isAllowed = selectedItem.availableDays === 'all' || selectedItem.availableDays.includes(dayOfWeek);
                  const isSelected = bookingDate === dString;

                  return (
                    <div key={dString} onClick={() => isAllowed && setBookingDate(dString)} 
                      style={{ flex: '0 0 65px', padding: '10px 5px', borderRadius: '12px', textAlign: 'center', 
                      cursor: isAllowed ? 'pointer' : 'not-allowed', 
                      background: isSelected ? '#3498db' : (isAllowed ? '#fff' : '#f8f9fa'), 
                      color: isSelected ? 'white' : (isAllowed ? '#333' : '#ccc'), 
                      border: isSelected ? '1px solid #3498db' : '1px solid #eee' }}>
                      <div style={{ fontSize: '0.7rem' }}>{d.getMonth()+1}月</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{d.getDate()}</div>
                      <div style={{ fontSize: '0.6rem' }}>{['週日','週一','週二','週三','週四','週五','週六'][dayOfWeek]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. 時段選擇 */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>2. 選擇時段</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {currentSlots.length > 0 ? (
                  currentSlots.map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #eee',
                        backgroundColor: selectedTime === time ? '#e67e22' : '#fff',
                        color: selectedTime === time ? 'white' : '#333',
                        cursor: 'pointer', fontWeight: 'bold' }}>
                      {time}
                    </button>
                  ))
                ) : (
                  <p style={{ color: '#e74c3c', fontSize: '0.9rem', gridColumn: 'span 3', textAlign: 'center', padding: '10px', background: '#fff5f5', borderRadius: '8px' }}>
                    抱歉，該日期無可預約時段
                  </p>
                )}
              </div>
            </div>

            {/* 3. 身分確認 (補回自動帶出) */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>3. 您的身分</label>
              <input type="tel" placeholder="輸入電話後 4 碼" value={phoneQuery} onChange={(e) => setPhoneQuery(e.target.value)} 
                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ddd' }} />
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {matchedUsers.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} 
                    style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', 
                    backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', 
                    color: selectedUser?.id === u.id ? 'white' : 'black', cursor: 'pointer', fontWeight: 'bold' }}>
                    我是 {u.name}
                  </button>
                ))}
              </div>
              {selectedUser && <p style={{ color: '#2e7d32', fontSize: '0.9rem', marginTop: '5px', fontWeight: 'bold' }}>✓ 已辨認身分：{selectedUser.name}</p>}
            </div>

            <button onClick={submitBooking} disabled={!selectedUser || !selectedTime}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', 
              backgroundColor: (selectedUser && selectedTime) ? '#3498db' : '#ecf0f1', 
              color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: (selectedUser && selectedTime) ? 'pointer' : 'not-allowed' }}>
              {(selectedUser && selectedTime) ? `確認預約` : '請完成上方步驟'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default BookingPage;