import React, { useState, useEffect, useMemo } from 'react';

// 定義星期名稱對照表
const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

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

  // --- 1. 時段計算邏輯 (含：星期檢查 + 今天過期時段過濾) ---
  const currentSlots = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'service' || !selectedItem.config?.regular_schedule) {
      return [];
    }
    
    const parts = bookingDate.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayKey = d.getDay().toString();
    
    // 原始設定的所有時段
    const allSlots = selectedItem.config.regular_schedule[dayKey] || [];
    
    // 過濾邏輯：如果是今天，隱藏過去的時間
    const now = new Date();
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    if (bookingDate === todayString) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      return allSlots.filter(time => {
        const [h, m] = time.split(':').map(Number);
        // 留 15 分鐘前置量，否則使用者剛選完時間就過期了
        return h > currentHour || (h === currentHour && m > currentMinute + 15);
      });
    }
    
    return allSlots;
  }, [selectedItem, bookingDate]);

  // --- 2. 初始資料獲取 ---
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
              availableDays: Object.keys(config.regular_schedule || {}).map(Number)
            };
          }
          return { ...item, config };
        });
        setOfferings(dynamicOfferings);
      });
  }, []);

  // --- 3. 身分匹配 ---
  const matchedUsers = useMemo(() => {
    if (phoneQuery.length < 3) return [];
    return users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery));
  }, [phoneQuery, users]);

  useEffect(() => {
    if (matchedUsers.length === 1) setSelectedUser(matchedUsers[0]);
    else if (phoneQuery.length === 0) setSelectedUser(null);
  }, [matchedUsers, phoneQuery]);

  // 當時段因為過濾而消失時，清空已選中的時間
  useEffect(() => {
    if (selectedTime && !currentSlots.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [currentSlots, selectedTime]);

  // --- 4. 提交預約 ---
  const submitBooking = async () => {
    if (!selectedUser || !selectedItem) return;
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
              <div key={item.id} onClick={() => { setSelectedItem(item); setStep(2); }} 
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

            {selectedItem.type === 'course' ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. 選擇班次</label>
                <select value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <option value="">-- 請選擇日期 --</option>
                  {selectedItem.config.sessions?.map((s, idx) => (
                    <option key={idx} value={s.date}>{s.date} {s.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. 選擇日期</label>
                  <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px' }}>
                    {[...Array(14)].map((_, i) => {
                      const d = new Date();
                      d.setHours(0, 0, 0, 0);
                      d.setDate(d.getDate() + i);
                      const dString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      
                      const dayIndex = d.getDay();
                      const isAllowed = selectedItem.availableDays?.includes(dayIndex);
                      const isSelected = bookingDate === dString;

                      return (
                        <div 
                          key={dString} 
                          onClick={() => isAllowed && setBookingDate(dString)}
                          style={{ 
                            flex: '0 0 65px', padding: '12px 5px', borderRadius: '12px', textAlign: 'center', 
                            background: isSelected ? '#3498db' : (isAllowed ? '#fff' : '#f8f9fa'), 
                            color: isSelected ? '#fff' : (isAllowed ? '#333' : '#ccc'),
                            border: '1px solid #eee', cursor: isAllowed ? 'pointer' : 'not-allowed',
                            boxShadow: isSelected ? '0 4px 8px rgba(52,152,219,0.3)' : 'none'
                          }}
                        >
                          <div style={{ fontSize: '0.7rem' }}>{d.getMonth() + 1}月</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{d.getDate()}</div>
                          <div style={{ fontSize: '0.7rem' }}>週{weekDays[dayIndex]}</div>
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
                        style={{ 
                          padding: '10px', borderRadius: '8px', border: '1px solid #eee', 
                          backgroundColor: selectedTime === time ? '#e67e22' : '#fff', color: selectedTime === time ? 'white' : '#333' 
                        }}>
                        {time}
                      </button>
                    )) : <p style={{ color: '#999', gridColumn: 'span 3', textAlign: 'center' }}>當日無可用時段</p>}
                  </div>
                </div>
              </>
            )}

            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>身份確認</label>
              <input type="tel" placeholder="輸入電話後 4 碼" value={phoneQuery} onChange={(e) => setPhoneQuery(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {matchedUsers.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} 
                    style={{ 
                      padding: '8px 15px', borderRadius: '20px', border: 'none', 
                      backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', color: selectedUser?.id === u.id ? 'white' : 'black', fontWeight: 'bold' 
                    }}>
                    我是 {u.name}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={submitBooking} 
              disabled={!selectedUser || (selectedItem.type === 'service' && !selectedTime) || (selectedItem.type === 'course' && !bookingDate)}
              style={{ 
                width: '100%', padding: '16px', marginTop: '20px', borderRadius: '12px', border: 'none', 
                backgroundColor: (selectedUser && (selectedTime || selectedItem.type==='course')) ? '#3498db' : '#ccc', 
                color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' 
              }}>
              確認提交預約
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default BookingPage;