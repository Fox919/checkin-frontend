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
  const [myBookings, setMyBookings] = useState([]);

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  // --- 1. 時段計算邏輯 ---
  const currentSlots = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'service' || !selectedItem.config?.regular_schedule) {
      return [];
    }
    const parts = bookingDate.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayKey = d.getDay().toString();
    const allSlots = selectedItem.config.regular_schedule[dayKey] || [];
    
    const now = new Date();
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
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

  // 2. 修改後的 useEffect
useEffect(() => {
  fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));
  fetch(`${API_BASE}/api/offerings`)
    .then(res => res.json())
    .then(data => {
      const dynamicOfferings = data.map(item => {
        const config = typeof item.config === 'string' ? JSON.parse(item.config || '{}') : item.config;
        
        // ✨ 精準提取天數邏輯：
        // 優先從 config.duration_days 抓，次之從 item.duration 字串中抓數字，最後預設 7
        const extractedDuration = 
          config.duration_days || 
          (item.duration ? parseInt(item.duration) : 7);

        const processedItem = {
          ...item,
          icon: item.icon || '🌿',
          config: { ...config, duration: extractedDuration }, // 統一塞入 duration 屬性
        };

        if (item.type === 'service') {
          processedItem.availableDays = Object.keys(config.regular_schedule || {}).map(Number);
        }
        return processedItem;
      });
      setOfferings(dynamicOfferings);
    });
}, []);
  // --- 3. 身分匹配與管理邏輯 ---
  const matchedUsers = useMemo(() => {
    if (phoneQuery.length < 3) return [];
    return users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery));
  }, [phoneQuery, users]);

  useEffect(() => {
    if (matchedUsers.length === 1) setSelectedUser(matchedUsers[0]);
    else if (phoneQuery.length === 0) setSelectedUser(null);
  }, [matchedUsers, phoneQuery]);

  const fetchMyBookings = async (userId) => {
  try {
    const res = await fetch(`${API_BASE}/api/bookings?userId=${userId}`);
    const data = await res.json();
    
    // 如果後端回傳的是錯誤物件而非陣列
    if (res.ok && Array.isArray(data)) {
      setMyBookings(data);
      setStep(3); 
    } else {
      console.error("後端回傳格式錯誤:", data);
      alert("讀取失敗：" + (data.error || "未知錯誤"));
    }
  } catch (err) {
    console.error("網路請求失敗:", err);
    alert("無法連線到伺服器");
  }
};

  const handleCancel = async (bookingId) => {
    if (!window.confirm("確定要取消這筆預約嗎？")) return;
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert("✅ 預約已成功取消");
        fetchMyBookings(selectedUser.id);
      }
    } catch (err) {
      alert("❌ 取消失敗");
    }
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
      alert(`✅ ${selectedUser.name}，預約成功！`);
      
      // --- 優化點：保留使用者，只清空項目與時間 ---
      setStep(1);           // 回到項目列表
      setSelectedItem(null); // 清空目前選中的項目
      setSelectedTime('');  // 清空選中的時間
      // 不清空 phoneQuery 和 selectedUser，讓使用者可以連續預約
          setBookingDate(new Date().toISOString().split('T')[0]);
      
    }
  } catch (err) { 
    alert("⚠️ 預約失敗"); 
  }
};

  // 排序預約記錄 (由新到舊)
  const sortedBookings = useMemo(() => {
  if (!Array.isArray(myBookings)) return []; // 如果不是陣列，回傳空陣列，防止崩潰
  return [...myBookings].sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));
}, [myBookings]);
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#2c3e50' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>🏛️ 禪修預約系統</h2>

      {/* 第一步：項目列表 */}
      {step === 1 && (
        <section>
    {selectedUser && (
      <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>👤 當前預約人：{selectedUser.name}</span>
        <button onClick={() => { setSelectedUser(null); setPhoneQuery(''); }} 
                style={{ fontSize: '0.8rem', color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          切換身分
        </button>
      </div>
    )}

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

      {/* 第二步：填寫詳情 */}
      {step === 2 && selectedItem && (
        <section>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}> ← 返回 </button>
          
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{selectedItem.icon} {selectedItem.title}</h3>

           {/* A. 課程模式預覽區 */}
{selectedItem.type === 'course' && (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. 選擇班次日期</label>
    <select value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} 
      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}>
      <option value="">-- 請選擇開始日期 --</option>
      {selectedItem.config.sessions?.map((s, idx) => (
        <option key={idx} value={s.date}>{s.date} {s.label || '正式班'}</option>
      ))}
    </select>
    
    {bookingDate && (
      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f7ff', borderRadius: '12px', border: '1px dashed #3498db' }}>
        <div style={{ fontSize: '0.9rem', color: '#2980b9', marginBottom: '12px', fontWeight: 'bold' }}>
          📅 課程安排預覽 (連續 {selectedItem.config.duration} 天)：
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[...Array(selectedItem.config.duration)].map((_, i) => {
            const start = bookingDate.split('-');
            const d = new Date(start[0], start[1] - 1, start[2]);
            d.setDate(d.getDate() + i);
            return (
              <div key={i} style={{ background: i === 0 ? '#3498db' : '#fff', color: i === 0 ? '#fff' : '#333', padding: '8px 4px', borderRadius: '8px', border: '1px solid #dcecf9', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem' }}>{i === 0 ? '首日' : `第 ${i+1} 天`}</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{d.getMonth()+1}/{d.getDate()}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{weekDays[d.getDay()]}</div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
)}

            {/* B. 服務模式 */}
            {selectedItem.type === 'service' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>1. 選擇預約日期</label>
                  <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px' }}>
                    {[...Array(14)].map((_, i) => {
                      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + i);
                      const dString = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                      const isAllowed = selectedItem.availableDays?.includes(d.getDay());
                      const isSelected = bookingDate === dString;
                      return (
                        <div key={dString} onClick={() => isAllowed && setBookingDate(dString)}
                          style={{ flex: '0 0 65px', padding: '12px 5px', borderRadius: '12px', textAlign: 'center', background: isSelected ? '#3498db' : (isAllowed ? '#fff' : '#f8f9fa'), color: isSelected ? '#fff' : (isAllowed ? '#333' : '#ccc'), border: '1px solid #eee', cursor: isAllowed ? 'pointer' : 'not-allowed' }}>
                          <div style={{ fontSize: '0.7rem' }}>{d.getMonth()+1}月</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{d.getDate()}</div>
                          <div style={{ fontSize: '0.7rem' }}>週{weekDays[d.getDay()]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>2. 選擇具體時段</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {currentSlots.map(time => (
                      <button key={time} onClick={() => setSelectedTime(time)}
                        style={{ padding: '12px 5px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: selectedTime === time ? '#e67e22' : '#fff', color: selectedTime === time ? 'white' : '#333' }}>
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 身份確認區 */}
            <div style={{ borderTop: '2px solid #f5f5f5', paddingTop: '20px', marginTop: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>身份確認</label>
              <input type="tel" placeholder="輸入電話後 4 碼" value={phoneQuery} onChange={(e) => setPhoneQuery(e.target.value)} 
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              
              {matchedUsers.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {matchedUsers.map(u => (
                    <button key={u.id} onClick={() => setSelectedUser(u)} 
                      style={{ padding: '10px 18px', borderRadius: '25px', border: 'none', backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', color: selectedUser?.id === u.id ? 'white' : 'black', fontWeight: 'bold' }}>
                      我是 {u.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <button onClick={() => fetchMyBookings(selectedUser.id)} 
                    style={{ background: 'none', border: 'none', color: '#e67e22', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    🔍 查看/管理 {selectedUser.name} 的預約記錄
                  </button>
                </div>
              )}
            </div>

            <button onClick={submitBooking} 
              disabled={!selectedUser || (selectedItem.type === 'service' && !selectedTime) || (selectedItem.type === 'course' && !bookingDate)}
              style={{ width: '100%', padding: '18px', marginTop: '25px', borderRadius: '15px', border: 'none', backgroundColor: (selectedUser && (selectedTime || selectedItem.type==='course')) ? '#2c3e50' : '#ccc', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>
              確認提交預約
            </button>
          </div>
        </section>
      )}

{/* 第三步：預約管理清單 */}
{step === 3 && (
  <section>
    <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '15px', fontWeight: 'bold' }}> ← 返回 </button>
    <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>📋 {selectedUser?.name} 的預約清單</h3>
      <div style={{ display: 'grid', gap: '15px' }}>
        {sortedBookings.length > 0 ? sortedBookings.map(bk => {
          const isValid = bk.status === 'active' || bk.status === 'pending';
          
          return (
            <div key={bk.id} style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', borderLeft: `5px solid ${bk.type === 'course' ? '#3498db' : '#e67e22'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                    {bk.icon || '📅'} {bk.title}
                  </div>
                  {/* ✨ 日期顯示優化點 */}
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
  {/* 只顯示日期並動態顯示天數 */}
  日期：{bk.booking_date ? bk.booking_date.split('T')[0] : ''} 
  {bk.type === 'course' && ` (${bk.config?.duration || 7}天課程)`}
</div>
                  {bk.type === 'service' && <div style={{ fontSize: '0.85rem', color: '#666' }}>時間：{bk.booking_time}</div>}
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: isValid ? '#2ecc71' : '#e74c3c', 
                    fontWeight: 'bold' 
                  }}>
                    {bk.status === 'active' ? '● 預約成功' : bk.status === 'pending' ? '● 審核中' : '已取消'}
                  </div>

                  {isValid && (
                    <button 
                      onClick={() => handleCancel(bk.id)} 
                      style={{ 
                        marginTop: '10px', 
                        padding: '5px 10px', 
                        borderRadius: '5px', 
                        border: '1px solid #e74c3c', 
                        color: '#e74c3c', 
                        background: 'none', 
                        fontSize: '0.8rem', 
                        cursor: 'pointer' 
                      }}
                    >
                      取消預約
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }) : <p style={{ textAlign: 'center', color: '#999' }}>查無預約記錄</p>}
      </div>
    </div>
  </section>
)}
    </div>
  );
};

export default BookingPage;