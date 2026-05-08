import React, { useState, useEffect, useMemo } from 'react';
import { translations } from './translations'; 

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

const BookingPage = () => {
  // --- 1. 狀態管理 ---
  const [lang, setLang] = useState('zh-TW');
  const t = (key) => translations[lang][key] || key;

  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  
  const [step, setStep] = useState(1); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [myBookings, setMyBookings] = useState([]);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // --- 2. 時段計算與身分匹配 ---
  const currentSlots = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'service' || !selectedItem.config?.regular_schedule) return [];
    const parts = bookingDate.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayKey = d.getDay().toString();
    const allSlots = selectedItem.config.regular_schedule[dayKey] || [];
    
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];
    
    if (bookingDate === todayString) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      return allSlots.filter(time => {
        const [h, m] = time.split(':').map(Number);
        return h > currentHour || (h === currentHour && m > currentMinute + 15);
      });
    }
    return allSlots;
  }, [selectedItem, bookingDate]);

  const matchedUsers = useMemo(() => {
    if (phoneQuery.length < 3) return [];
    return users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery));
  }, [phoneQuery, users]);

  // --- 3. 數據抓取 ---
  useEffect(() => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));
    fetch(`${API_BASE}/api/offerings`)
      .then(res => res.json())
      .then(data => {
        const dynamicOfferings = data.map(item => {
          const config = typeof item.config === 'string' ? JSON.parse(item.config || '{}') : item.config;
          const processedItem = {
            ...item,
            icon: item.icon || '🌿',
            config: config,
          };
          if (item.type === 'service') {
            processedItem.availableDays = Object.keys(config.regular_schedule || {}).map(Number);
          }
          return processedItem;
        });
        setOfferings(dynamicOfferings);
      });
  }, []);

  useEffect(() => {
    if (matchedUsers.length === 1) setSelectedUser(matchedUsers[0]);
    else if (phoneQuery.length === 0) setSelectedUser(null);
  }, [matchedUsers, phoneQuery]);

  // --- 4. 操作邏輯 ---
  const fetchMyBookings = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings?userId=${userId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setMyBookings(data);
        setStep(3); 
      }
    } catch (err) { alert("Network Error"); }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm(t('cancel_confirm'))) return;
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      if (res.ok) {
        alert("✅ " + t('status_canceled'));
        fetchMyBookings(selectedUser.id);
      }
    } catch (err) { alert("❌ Failed"); }
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
          bookingDate: bookingDate,
          bookingTime: selectedItem.type === 'course' ? '全天' : selectedTime
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${selectedUser.name}, ${t('booking_success')}`);
        setStep(1);
        setSelectedItem(null);
        setSelectedTime('');
        setBookingDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) { alert("⚠️ Failed"); }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#2c3e50' }}>
      
      {/* 語言切換 */}
      <div style={{ textAlign: 'right', marginBottom: '15px', fontSize: '0.85rem' }}>
        <span onClick={() => setLang('zh-TW')} style={{ cursor: 'pointer', fontWeight: lang === 'zh-TW' ? 'bold' : 'normal', color: '#3498db' }}>繁中</span>
        <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
        <span onClick={() => setLang('en-US')} style={{ cursor: 'pointer', fontWeight: lang === 'en-US' ? 'bold' : 'normal', color: '#3498db' }}>EN</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>{t('system_title')}</h2>

      {/* Step 1: 項目列表 */}
      {step === 1 && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
    {offerings.map(item => (
      <div 
        key={item.id} 
        onClick={() => { 
          setSelectedItem(item); 
          // 預設選中該項目的第一個日期
          if(item.config?.sessions?.length > 0) {
            setBookingDate(item.config.sessions[0].date);
          }
          setStep(2); 
        }} 
        style={{ padding: '20px', background: '#fff', borderRadius: '18px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{item.icon}</div>
        <div style={{ fontWeight: 'bold' }}>{item.title}</div>
      </div>
    ))}
  </div>
)}

{/* Step 2: 填寫詳情 */}
{step === 2 && selectedItem && (
  <section>
    <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}> {t('back')} </button>
    
    <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{selectedItem.icon} {t(selectedItem.title)}</h3>

      {/* --- A. 班別選擇選單 (僅限 Course) --- */}
      {selectedItem.type === 'course' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>選擇班別 (月份)</label>
          <select 
            value={bookingDate} 
            onChange={(e) => setBookingDate(e.target.value)} 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', background: '#f9f9f9' }}
          >
            {selectedItem.config?.sessions?.filter((s, index, array) => {
              if (index === 0) return true;
              if (s.is_start) return true;
              const diffDays = Math.ceil(Math.abs(new Date(s.date.replace(/-/g, '/')) - new Date(array[index-1].date.replace(/-/g, '/'))) / (1000*60*60*24));
              const isNewBatchLabel = s.label && (s.label.includes('班') || s.label.includes('第1堂'));
              return diffDays > 1 || isNewBatchLabel;
            }).map((s, idx) => (
              <option key={idx} value={s.date}>
                {s.label && s.label.includes('班') ? s.label : `${new Date(s.date.replace(/-/g, '/')).getMonth() + 1}月班`} (開課日: {s.date})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* --- B. 橫向日曆：顯示日期卡片 --- */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>{t('select_date')}</label>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px' }}>
          
          {selectedItem.type === 'course' && (() => {
            const sessions = selectedItem.config?.sessions || [];
            const currentIndex = sessions.findIndex(s => s.date === bookingDate);
            if (currentIndex === -1) return null;

            // 計算當前連續區段
            let start = currentIndex;
            while (start > 0) {
              const s = sessions[start];
              const prev = sessions[start - 1];
              const diff = Math.ceil(Math.abs(new Date(s.date.replace(/-/g, '/')) - new Date(prev.date.replace(/-/g, '/'))) / (1000*60*60*24));
              if (s.is_start || diff > 1 || (s.label && s.label.includes('班'))) break;
              start--;
            }
            let end = currentIndex;
            while (end < sessions.length - 1) {
              const s = sessions[end];
              const next = sessions[end + 1];
              const diff = Math.ceil(Math.abs(new Date(next.date.replace(/-/g, '/')) - new Date(s.date.replace(/-/g, '/'))) / (1000*60*60*24));
              if (next.is_start || diff > 1 || (next.label && next.label.includes('班'))) break;
              end++;
            }

// 在 Step 2 的橫向日曆渲染處修改：
return sessions.slice(start, end + 1).map((s, idx) => {
  const isSelected = bookingDate === s.date;
  const d = new Date(s.date.replace(/-/g, '/'));
  return (
    <div key={idx} onClick={() => setBookingDate(s.date)} style={{ 
      flex: '0 0 70px', padding: '12px 5px', borderRadius: '12px', textAlign: 'center', 
      background: isSelected ? '#3498db' : '#fff', color: isSelected ? '#fff' : '#333', 
      border: '1px solid #eee', cursor: 'pointer'
    }}>
      {/* 這裡改為「第一天」、「第二天」... */}
      <div style={{ fontSize: '0.7rem' }}>第 {idx + 1} 天</div> 
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{s.date.split('-')[2]}</div>
      <div style={{ fontSize: '0.7rem' }}>{weekDays[d.getDay()]}</div>
    </div>
  );
});
          })()}

          {selectedItem.type === 'service' && [...Array(14)].map((_, i) => {
            const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + i);
            const dStr = d.toISOString().split('T')[0];
            const isAllowed = selectedItem.availableDays?.includes(d.getDay());
            const isSelected = bookingDate === dStr;
            return (
              <div key={dStr} onClick={() => isAllowed && setBookingDate(dStr)} style={{ 
                flex: '0 0 65px', padding: '12px 5px', borderRadius: '12px', textAlign: 'center', 
                background: isSelected ? '#3498db' : (isAllowed ? '#fff' : '#f8f9fa'), 
                color: isSelected ? '#fff' : (isAllowed ? '#333' : '#ccc'), 
                border: '1px solid #eee', cursor: isAllowed ? 'pointer' : 'not-allowed' 
              }}>
                <div style={{ fontSize: '0.7rem' }}>{d.getMonth()+1}月</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{d.getDate()}</div>
                <div style={{ fontSize: '0.7rem' }}>{weekDays[d.getDay()]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- C. 時段選擇 (僅限 Service) --- */}
      {selectedItem.type === 'service' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>{t('select_time')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {currentSlots.map(time => (
              <button key={time} onClick={() => setSelectedTime(time)} style={{ padding: '12px 5px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: selectedTime === time ? '#e67e22' : '#fff', color: selectedTime === time ? 'white' : '#333' }}>
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- D. 身分確認 (手機號與匹配) --- */}
      <div style={{ borderTop: '2px solid #f5f5f5', paddingTop: '20px' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>{t('id_confirm')}</label>
        <input type="tel" placeholder={t('phone_placeholder')} value={phoneQuery} onChange={(e) => setPhoneQuery(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {matchedUsers.map(u => (
            <button key={u.id} onClick={() => setSelectedUser(u)} style={{ padding: '10px 18px', borderRadius: '25px', border: 'none', backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', color: selectedUser?.id === u.id ? 'white' : 'black', fontWeight: 'bold' }}>
              {t('i_am')} {u.name}
            </button>
          ))}
        </div>
        {selectedUser && (
          <button onClick={() => fetchMyBookings(selectedUser.id)} style={{ width: '100%', background: 'none', border: 'none', color: '#e67e22', cursor: 'pointer', marginTop: '15px', textDecoration: 'underline', fontSize: '0.9rem' }}>
            {t('view_my_bookings')}
          </button>
        )}
      </div>

      <button onClick={submitBooking} disabled={!selectedUser || (selectedItem.type === 'service' && !selectedTime)} style={{ width: '100%', padding: '18px', marginTop: '25px', borderRadius: '15px', border: 'none', backgroundColor: (selectedUser && (selectedTime || selectedItem.type==='course')) ? '#2c3e50' : '#ccc', color: 'white', fontSize: '1.1rem', fontWeight: 'bold' }}>
        {t('submit')}
      </button>
    </div>
  </section>
)}

      {/* Step 3: 預約清單 */}
      {step === 3 && (
        <section>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '15px', fontWeight: 'bold' }}> {t('back')} </button>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>📋 {selectedUser?.name}</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {myBookings.length > 0 ? myBookings.map(bk => (
                <div key={bk.id} style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', borderLeft: `5px solid ${bk.type === 'course' ? '#3498db' : '#e67e22'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{bk.icon} {t(bk.title)}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{bk.booking_date?.split('T')[0]} {bk.booking_time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: bk.status === 'active' ? '#2ecc71' : '#e74c3c' }}>
                        {bk.status === 'active' ? t('status_active') : bk.status === 'pending' ? t('status_pending') : t('status_canceled')}
                      </div>
                      {(bk.status === 'active' || bk.status === 'pending') && (
                        <button onClick={() => handleCancel(bk.id)} style={{ marginTop: '8px', fontSize: '0.75rem', color: '#e74c3c', border: '1px solid #e74c3c', background: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          {t('cancel_btn')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) : <p>{t('no_records')}</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BookingPage;