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

  // 1. 初始化資料 (包含從後端讀取 config)
  useEffect(() => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));
    
    // 這裡模擬從後端抓取的數據，包含你剛在資料庫設定的 config
    // 實際開發時，建議 fetch(`${API_BASE}/offerings`) 並在後端 JSON.parse(config)
    setOfferings([
      { 
        id: 1, type: 'course', title: '8天禪修健身班', icon: '🌿', info: '補充生命能量', 
        availableDays: 'all',
        config: { start_date: "2026-05-23" }, // 假設開班日期
        getTimeSlots: () => ['09:30'] 
      },
      { 
        id: 2, type: 'service', title: '一對一能量加持', icon: '✨', info: '周三 10,2,3,4點 | 周六日 2,3,4點', 
        availableDays: [0, 3, 6],
        getTimeSlots: (dateString) => {
          const [y, m, d] = dateString.split('-').map(Number);
          const day = new Date(y, m - 1, d).getDay();
          if (day === 3) return ['10:00', '14:00', '15:00', '16:00'];
          if (day === 6 || day === 0) return ['14:00', '15:00', '16:00'];
          return [];
        }
      },
      { 
        id: 3, type: 'service', title: '求签问事', icon: '🏮', info: '每日皆可', 
        availableDays: 'all',
        getTimeSlots: () => ['10:00', '11:00', '14:00', '15:00', '16:00']
      }
    ]);
  }, [API_BASE]);

  // 2. 身份搜尋與自動帶出
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

  // 3. 判定是否截止報名 (重要修正：放在 return 之前)
  const isRegistrationClosed = useMemo(() => {
    if (selectedItem?.id === 1 && selectedItem.config?.start_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [y, m, d] = selectedItem.config.start_date.split('-').map(Number);
      const startDate = new Date(y, m - 1, d);
      return today >= startDate; 
    }
    return false;
  }, [selectedItem]);

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
        alert(`✅ 預約成功！\n項目：${selectedItem.title}\n時間：${bookingDate} ${selectedTime}`);
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
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#2c3e50' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>🏛️ 禪修預約系統</h2>

      {/* --- Step 1: 項目列表 --- */}
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

      {/* --- Step 2: 詳細預約介面 --- */}
      {step === 2 && selectedItem && (
        <section>
          <button onClick={() => { setStep(1); setSelectedUser(null); setPhoneQuery(''); }} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
            ← 返回重選項目
          </button>

          {isRegistrationClosed ? (
            /* 截止狀態 UI */
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🚫</div>
              <h3 style={{ color: '#e74c3c' }}>抱歉，該班次已截止預約</h3>
              <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                本期課程已於 <strong>{selectedItem.config.start_date}</strong> 正式開辦。<br/>
                請留意下一期開班時間。
              </p>
              <button onClick={() => setStep(1)} style={{ marginTop: '20px', padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#3498db', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>查看其他項目</button>
            </div>
          ) : (
            /* 正常預約流程 UI */
            <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              {selectedItem.id === 1 && (
                <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem', color: '#e65100', border: '1px solid #ffe0b2' }}>
                  ⚠️ <strong>預約提醒：</strong><br/>
                  本課程將於 {selectedItem.config.start_date} 正式開班，請務必於當天報到。
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '3rem' }}>{selectedItem.icon}</div>
                <h3 style={{ margin: '5px 0' }}>{selectedItem.title}</h3>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>{selectedItem.info}</p>
              </div>

              {/* 1. 日期選擇 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. 選擇預約日期</label>
                <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px' }}>
                  {[...Array(14)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    const dString = d.toISOString().split('T')[0];
                    const [y, m, dayVal] = dString.split('-').map(Number);
                    const dayOfWeek = new Date(y, m - 1, dayVal).getDay();
                    const isAllowed = selectedItem.availableDays === 'all' || selectedItem.availableDays.includes(dayOfWeek);
                    const isSelected = bookingDate === dString;

                    return (
                      <div key={dString} onClick={() => isAllowed && setBookingDate(dString)} 
                        style={{ flex: '0 0 65px', padding: '10px 5px', borderRadius: '12px', textAlign: 'center', cursor: isAllowed ? 'pointer' : 'not-allowed', background: isSelected ? '#3498db' : (isAllowed ? '#fff' : '#f8f9fa'), color: isSelected ? 'white' : (isAllowed ? '#333' : '#ccc'), border: isSelected ? '2px solid #3498db' : '1px solid #eee' }}>
                        <div style={{ fontSize: '0.7rem' }}>{d.getMonth()+1}月</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{d.getDate()}</div>
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
                  {currentSlots.map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)}
                      style={{ padding: '12px', borderRadius: '10px', border: '1px solid #eee', backgroundColor: selectedTime === time ? '#e67e22' : '#fff', color: selectedTime === time ? 'white' : '#333', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
                      {time}
                    </button>
                  ))}
                  {currentSlots.length === 0 && <p style={{ gridColumn: 'span 3', textAlign: 'center', color: '#e74c3c' }}>當日無時段</p>}
                </div>
              </div>

              {/* 3. 身分確認 */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>3. 您的身分</label>
                <input type="tel" placeholder="輸入電話後 4 碼" value={phoneQuery} onChange={(e) => setPhoneQuery(e.target.value)} 
                  style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem' }} />
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {matchedUsers.map(u => (
                    <button key={u.id} onClick={() => setSelectedUser(u)} 
                      style={{ padding: '10px 18px', borderRadius: '25px', border: 'none', backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', color: selectedUser?.id === u.id ? 'white' : '#2c3e50', cursor: 'pointer', fontWeight: 'bold' }}>
                      我是 {u.name}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={submitBooking} disabled={!selectedUser || !selectedTime}
                style={{ width: '100%', padding: '18px', borderRadius: '15px', border: 'none', backgroundColor: (selectedUser && selectedTime) ? '#3498db' : '#ecf0f1', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: (selectedUser && selectedTime) ? 'pointer' : 'not-allowed', transition: '0.3s' }}>
                {(selectedUser && selectedTime) ? `確認預約` : '請完成選擇'}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default BookingPage;