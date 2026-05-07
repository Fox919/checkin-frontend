import React, { useState, useEffect, useMemo } from 'react';

const BookingPage = () => {
  const [users, setUsers] = useState([]);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [offerings, setOfferings] = useState([]);
  
  const [step, setStep] = useState(1); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSession, setSelectedSession] = useState(''); // ✨ 新增：選擇的期次日期

  const API_BASE = "https://checkin-system-production-2a74.up.railway.app";

  useEffect(() => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(data => setUsers(data));
    
    // ✨ 模擬後端傳回的動態資料：每個項目都有自己的「期次 (sessions)」
    setOfferings([
      { 
        id: 1, type: 'course', title: '8天禪修健身班', icon: '🌿', info: '補充生命能量',
        // 下拉選單的選項
        sessions: [
          { id: '20260523', date: '2026-05-23', label: '5月23日開辦 (連續8天)' },
          { id: '20260620', date: '2026-06-20', label: '6月20日開辦 (連續8天)' },
          { id: '20260718', date: '2026-07-18', label: '7月18日開辦 (連續8天)' }
        ]
      },
      { 
        id: 2, type: 'service', title: '一對一能量加持', icon: '✨', info: '深度能量調整',
        sessions: [
          { id: 'wed', date: '每週三', label: '每週三預約' },
          { id: 'sat_sun', date: '每週六、日', label: '每週六、日預約' }
        ]
      },
      { 
        id: 3, type: 'service', title: '求簽問事', icon: '🏮', info: '指點迷津',
        sessions: [
          { id: 'daily', date: '每日', label: '每日皆可預約' }
        ]
      }
    ]);
  }, [API_BASE]);

  // 辨認身分邏輯
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

  const submitBooking = async () => {
    if (!selectedUser || !selectedItem || !selectedSession) return;
    
    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          itemId: selectedItem.id,
          bookingDate: selectedSession, // 這裡傳送選中的期次日期
          bookingTime: "全天" // 取消時段選擇，統一標註
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 預約成功！\n項目：${selectedItem.title}\n期次：${selectedSession}\n預約人：${selectedUser.name}`);
        setStep(1);
        setSelectedItem(null);
        setSelectedSession('');
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

      {/* --- Step 1: 項目清單 --- */}
      {step === 1 && (
        <section>
          <h3 style={{ textAlign: 'center', color: '#7f8c8d' }}>請選擇預約項目</h3>
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

      {/* --- Step 2: 預約詳情 --- */}
      {step === 2 && selectedItem && (
        <section>
          <button onClick={() => { setStep(1); setSelectedSession(''); setSelectedUser(null); }} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
            ← 返回重選項目
          </button>

          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3.5rem' }}>{selectedItem.icon}</div>
              <h3 style={{ margin: '10px 0', fontSize: '1.5rem' }}>{selectedItem.title}</h3>
              <p style={{ color: '#7f8c8d' }}>{selectedItem.info}</p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '25px 0' }} />

            {/* 1. 下拉菜單選擇期次 */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '12px', fontSize: '1.1rem' }}>
                1. 選擇班次 / 日期
              </label>
              <select 
                value={selectedSession} 
                onChange={(e) => setSelectedSession(e.target.value)}
                style={{ 
                  width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #3498db', 
                  fontSize: '1rem', outline: 'none', appearance: 'none', background: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- 請點擊選擇可用期次 --</option>
                {selectedItem.sessions.map(s => (
                  <option key={s.id} value={s.date}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. 身分確認 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '12px', fontSize: '1.1rem' }}>
                2. 您的身分
              </label>
              <input 
                type="tel" 
                placeholder="請輸入電話後 4 碼" 
                value={phoneQuery} 
                onChange={(e) => setPhoneQuery(e.target.value)} 
                style={{ width: '100%', padding: '15px', boxSizing: 'border-box', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }} 
              />
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {matchedUsers.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} 
                    style={{ 
                      padding: '10px 20px', borderRadius: '25px', border: 'none', 
                      backgroundColor: selectedUser?.id === u.id ? '#2ecc71' : '#f1f2f6', 
                      color: selectedUser?.id === u.id ? 'white' : '#2c3e50', 
                      cursor: 'pointer', fontWeight: 'bold' 
                    }}>
                    我是 {u.name}
                  </button>
                ))}
              </div>
              {selectedUser && (
                <p style={{ color: '#2e7d32', fontSize: '0.95rem', marginTop: '8px', fontWeight: 'bold' }}>
                  ✓ 辨認成功：{selectedUser.name}
                </p>
              )}
            </div>

            <button 
              onClick={submitBooking} 
              disabled={!selectedUser || !selectedSession}
              style={{ 
                width: '100%', padding: '18px', borderRadius: '15px', border: 'none', 
                backgroundColor: (selectedUser && selectedSession) ? '#3498db' : '#ecf0f1', 
                color: 'white', fontSize: '1.2rem', fontWeight: 'bold', 
                cursor: (selectedUser && selectedSession) ? 'pointer' : 'not-allowed', 
                transition: 'all 0.3s' 
              }}
            >
              {(selectedUser && selectedSession) ? `確認預約期次` : '請完成選擇'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default BookingPage;