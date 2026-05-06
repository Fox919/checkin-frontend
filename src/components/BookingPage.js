import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker'; // 匯入日曆組件
import "react-datepicker/dist/react-datepicker.css"; // 匯入樣式
import { registerLocale } from  "react-datepicker";
import zhTW from 'date-fns/locale/zh-TW'; // 繁體中文語系 (若要簡體可用 zh-CN)
registerLocale('zh-TW', zhTW);

const BookingPage = () => {
  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [message, setMessage] = useState('');
  
  // 新增狀態：存放目前正在預約的日期
  const [startDate, setStartDate] = useState(new Date());

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));
    setOfferings([
      { id: 1, type: 'service', title: '一對一能量加持', info: '每週三、六、日', icon: '✨' },
      { id: 2, type: 'service', title: '藥師靈籤 | 抽籤問事', info: '引領人生方向', icon: '🏮' },
      { id: 3, type: 'course', title: '8天禪修健身班', info: '補充生命能量', icon: '🌿' },
      { id: 4, type: 'course', title: '7天禪修減壓班', info: '快速放鬆身心', icon: '🧘' }
    ]);
  }, []);

  const matchedUsers = useMemo(() => {
    return phoneQuery.length >= 3 
      ? users.filter(u => u.phone?.replace(/\D/g, '').endsWith(phoneQuery))
      : [];
  }, [phoneQuery, users]);

  useEffect(() => {
    if (matchedUsers.length === 1) setSelectedUser(matchedUsers[0]);
    else if (phoneQuery.length === 0) setSelectedUser(null);
  }, [phoneQuery, matchedUsers]);

  // ✨ 提交預約的函數
  const submitBooking = async (item, date) => {
    const dateString = date.toISOString().split('T')[0];
    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          itemId: item.id,
          bookingDate: dateString
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 預約成功！\n日期：${dateString}\n項目：${item.title}\n預約人：${selectedUser.name}`);
        setPhoneQuery('');
        setSelectedUser(null);
      }
    } catch (err) {
      alert("⚠️ 預約失敗，請洽詢義工");
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>🙏 課程與服務預約</h2>

      {/* Step 1 保持不變... */}
      <section style={{ background: selectedUser ? '#e8f5e9' : '#f8f9fa', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: selectedUser ? '2px solid #4caf50' : '2px solid transparent' }}>
        <h3>Step 1: 確認身分</h3>
        <input type="tel" placeholder="輸入電話後 4 碼" value={phoneQuery} onChange={(e) => setPhoneQuery(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid #ddd' }} />
        {selectedUser && <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ 預約人：{selectedUser.name}</p>}
      </section>

      {/* ✨ 新增 Step 2: 選擇日期 (讓用戶先選好日子) */}
      <section style={{ marginBottom: '30px', textAlign: 'center', opacity: selectedUser ? 1 : 0.5 }}>
        <h3>Step 2: 選擇預約日期</h3>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          minDate={new Date()} // 🚫 禁止選擇過去的日期
          inline // 直接顯示日曆，而不是點擊後彈出
          locale="zh-TW"
        />
      </section>

      {/* Step 3: 選擇項目 (最後點擊即可完成提交) */}
      <section>
        <h3 style={{ borderLeft: '5px solid #ff9800', paddingLeft: '10px' }}>Step 3: 點擊項目完成預約</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {offerings.map(item => (
            <div 
              key={item.id}
              onClick={() => selectedUser && submitBooking(item, startDate)}
              style={{ 
                padding: '15px', borderRadius: '12px', border: '1px solid #eee',
                background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                cursor: selectedUser ? 'pointer' : 'not-allowed',
                opacity: selectedUser ? 1 : 0.5,
                filter: selectedUser ? 'none' : 'grayscale(100%)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.8rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 'bold' }}>{item.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>{item.info}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BookingPage;