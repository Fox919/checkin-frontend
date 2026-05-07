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

  useEffect(() => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));

    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        const dynamicOfferings = data.map(item => {
          const config = typeof item.config === 'string' ? JSON.parse(item.config || '{}') : item.config;
          if (item.type === 'service') {
            return {
              ...item,
              config,
              getTimeSlots: (dateString) => {
                const d = new Date(dateString.replace(/-/g, '/'));
                const day = d.getDay().toString();
                return config.regular_schedule?.[day] || [];
              },
              availableDays: Object.keys(config.regular_schedule || {}).map(Number)
            };
          }
          return { ...item, config };
        });
        setOfferings(dynamicOfferings);
      });
  }, []);

  const matchedUsers = useMemo(() => {
    if (phoneQuery.length < 3) return [];
    return users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery));
  }, [phoneQuery, users]);

  useEffect(() => {
    if (matchedUsers.length === 1) setSelectedUser(matchedUsers[0]);
    else if (phoneQuery.length === 0) setSelectedUser(null);
  }, [phoneQuery, matchedUsers]);

  const currentSlots = useMemo(() => {
    if (selectedItem?.type !== 'service' || !selectedItem.getTimeSlots) return [];
    return selectedItem.getTimeSlots(bookingDate);
  }, [selectedItem, bookingDate]);

  const submitBooking = async () => {
    if (!selectedUser || !selectedItem) return;
    if (selectedItem.type === 'service' && (!bookingDate || !selectedTime)) return;
    if (selectedItem.type === 'course' && !bookingDate) return;

    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          itemId: selectedItem.id,
          bookingDate: bookingDate,
          bookingTime: selectedItem.type === 'course' ? '全天' : selectedTime
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 預約成功！\n項目：${selectedItem.title}\n時間：${bookingDate} ${selectedItem.type === 'course' ? '' : selectedTime}`);
        setStep(1); setSelectedItem(null); setSelectedTime(''); setPhoneQuery(''); setSelectedUser(null);
      }
    } catch (err) { alert("⚠️ 預約失敗"); }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#2c3e50' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>🏛️ 禪修預約系統</h2>

      {step === 1 && (
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            {offerings.map(item => (
              <div key={item.id} onClick={() => { 
                setSelectedItem(item); 
                if (item.type === 'course') setBookingDate(''); 
                setStep(2); 
              }} 
                style={{ padding: '20px', borderRadius: '15px', border: '1px solid #eee', display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '2.5rem', marginRight: '20px' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>{item.info}</div>
                </div>
                <div style={{ color: '#3498db' }}>▶</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {step === 2 && selectedItem && (
        <section>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}> ← 返回 </button>

          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ textAlign: 'center' }}>{selectedItem.icon} {selectedItem.title}</h3>

            {/* --- 模式 A：班次下拉選單 (Course) --- */}
            {selectedItem.type === 'course' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. 選擇班次</label>
                <select 
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                >
                  <option value="">-- 請選擇日期 --</option>
                  {selectedItem.config.sessions && selectedItem.config.sessions.map((s, idx) => (
                    <option key={idx} value={s.date}>
                      {s.date} {s.label ? `(${s.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* --- 模式 B：日曆 + 時段 (Service) --- */}
            {selectedItem.type === 'service' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. 選擇日期</label>
                  <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px' }}>
                    {[...Array(14)].map((_, i) => {
                      const d = new Date(); d.setDate(d.getDate() + i);
                      const dString = d.toISOString().split('T')[0];
                      const dayOfWeek = d.getDay();
                      const isAllowed = selectedItem.availableDays?.includes(dayOfWeek);
                      const isSelected = bookingDate === dString;
                      return (
                        <div key={dString} onClick={() => isAllowed && setBookingDate(dString)} 
                          style={{ flex: '0 0 65px', padding: '10px 5px', borderRadius: '12px', textAlign: 'center', cursor: isAllowed ? 'pointer' : 'not-allowed', background: isSelected ? '#3498db' : (isAllowed ? '#fff' : '#f8f9fa'), color: isSelected ? 'white' : (isAllowed ? '#333' : '#ccc'), border: '1px solid #eee' }}>
                          <div style={{ fontSize: '0.7rem' }}>{d.getMonth()+1}月</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{d.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>2. 選擇時段</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {currentSlots.length > 0 ? currentSlots.map(time => (
                      <button key={time} onClick={() => setSelectedTime(time)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: selectedTime === time ? '#e67e22' : '#fff', color: selectedTime === time ? 'white' : '#333' }}>
                        {time}
                      </button>
                    )) : <p style={{ color: '#999', fontSize: '0.9rem' }}>當日無可用時段</p>}
                  </div>
                </div>
              </>
            )}

            {/* 3. 通用身分確認 */}
            <div style={{ marginBottom: '25px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>{selectedItem.type === 'course' ? '2. 確認身分' : '3. 確認身分'}</label>
              <input type="tel" placeholder="輸入電話後 4 碼" value={phoneQuery} onChange={(e) => setPhoneQuery(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {matchedUsers.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} 
                    style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', color: selectedUser?.id === u.id ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>
                    我是 {u.name}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={submitBooking} 
              disabled={!selectedUser || (selectedItem.type === 'service' && !selectedTime) || (selectedItem.type === 'course' && !bookingDate)}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: (selectedUser && (selectedTime || selectedItem.type==='course')) ? '#3498db' : '#ccc', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}>
              確認提交預約
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default BookingPage;