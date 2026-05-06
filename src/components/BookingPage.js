import React, { useState, useEffect, useMemo } from 'react';

const BookingPage = () => {
  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  
  const [step, setStep] = useState(1); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(''); // ✨ 新增：選中的時間

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));
    setOfferings([
      { 
        id: 1, title: '一對一能量加持', icon: '✨', info: '周三 10,2,3,4點 | 周六日 2,3,4點', 
        availableDays: [0, 3, 6],
        // 定義特定日期的時段邏輯
        getTimeSlots: (dateString) => {
          const day = new Date(dateString).getDay();
          if (day === 3) return ['10:00', '14:00', '15:00', '16:00']; // 周三
          if (day === 6 || day === 0) return ['14:00', '15:00', '16:00']; // 周六日
          return [];
        }
      },
      { 
        id: 2, title: '藥師靈籤', icon: '🏮', info: '每日皆可', availableDays: 'all',
        getTimeSlots: () => ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      },
      // ...其他項目
    ]);
  }, [API_BASE]);

  // 當日期改變時，自動重選時間（避免殘留上個日期的時段）
  useEffect(() => {
    setSelectedTime('');
  }, [bookingDate]);

  const matchedUsers = useMemo(() => {
    if (phoneQuery.length < 3) return [];
    return users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery));
  }, [phoneQuery, users]);

  const submitBooking = async () => {
    if (!selectedUser || !selectedItem || !selectedTime) {
        alert("請確認已選擇時間與身分");
        return;
    }
    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          itemId: selectedItem.id,
          bookingDate: bookingDate,
          bookingTime: selectedTime // ✨ 傳送選中的時間
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 預約成功！\n項目：${selectedItem.title}\n時間：${bookingDate} ${selectedTime}`);
        setStep(1);
        setSelectedItem(null);
        setSelectedTime('');
        setSelectedUser(null);
      }
    } catch (err) {
      alert("⚠️ 預約失敗");
    }
  };

  // 獲取當前可選的時段
  const currentSlots = useMemo(() => {
    if (!selectedItem || !selectedItem.getTimeSlots) return [];
    return selectedItem.getTimeSlots(bookingDate);
  }, [selectedItem, bookingDate]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>🏛️ 禪修預約系統</h2>

      {/* Step 1: 選服務 (保持不變) */}
      {step === 1 && (
        <section>
          <h3 style={{ textAlign: 'center', color: '#7f8c8d' }}>請選擇預約項目</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            {offerings.map(item => (
              <div key={item.id} onClick={() => { setSelectedItem(item); setStep(2); }} style={{ padding: '20px', borderRadius: '15px', border: '1px solid #eee', display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'white' }}>
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

      {/* Step 2: 確認身分、日期與時間 */}
      {step === 2 && selectedItem && (
        <section>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
            ← 返回重選項目
          </button>
          
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ textAlign: 'center' }}>{selectedItem.icon} {selectedItem.title}</h3>

            {/* 1. 選擇預約日期 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. 選擇日期</label>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px' }}>
                {[...Array(14)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dString = d.toISOString().split('T')[0];
                  const isAllowed = selectedItem.availableDays === 'all' || selectedItem.availableDays.includes(d.getDay());
                  const isSelected = bookingDate === dString;
                  return (
                    <div key={dString} onClick={() => isAllowed && setBookingDate(dString)} style={{ flex: '0 0 65px', padding: '10px 5px', borderRadius: '12px', textAlign: 'center', cursor: isAllowed ? 'pointer' : 'not-allowed', background: isSelected ? '#3498db' : (isAllowed ? '#fff' : '#f8f9fa'), color: isSelected ? 'white' : (isAllowed ? '#333' : '#ccc'), border: '1px solid #eee' }}>
                      <div style={{ fontSize: '0.7rem' }}>{d.getMonth()+1}月</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{d.getDate()}</div>
                      <div style={{ fontSize: '0.6rem' }}>{['週日','週一','週二','週三','週四','週五','週六'][d.getDay()]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. 選擇具體時間 ✨ */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>2. 選擇時段</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {currentSlots.length > 0 ? (
                  currentSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      style={{
                        padding: '10px', borderRadius: '8px', border: '1px solid #eee',
                        backgroundColor: selectedTime === time ? '#e67e22' : '#fff',
                        color: selectedTime === time ? 'white' : '#333',
                        cursor: 'pointer', fontWeight: 'bold', transition: '0.2s'
                      }}
                    >
                      {time}
                    </button>
                  ))
                ) : (
                  <p style={{ color: '#e74c3c', fontSize: '0.9rem', gridColumn: 'span 3' }}>抱歉，當日無可預約時段</p>
                )}
              </div>
            </div>

            {/* 3. 確認身分 (電話查詢) */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>3. 您的身分</label>
              <input type="tel" placeholder="輸入電話後 4 碼" value={phoneQuery} onChange={(e) => setPhoneQuery(e.target.value)} style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ddd' }} />
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {matchedUsers.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', color: selectedUser?.id === u.id ? 'white' : 'black', cursor: 'pointer' }}>
                    我是 {u.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 提交 */}
            <button 
              onClick={submitBooking}
              disabled={!selectedUser || !selectedTime}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: (selectedUser && selectedTime) ? '#3498db' : '#ecf0f1', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: (selectedUser && selectedTime) ? 'pointer' : 'not-allowed' }}
            >
              {(selectedUser && selectedTime) ? `預約 ${bookingDate} ${selectedTime}` : '請選擇時間與確認身分'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default BookingPage;