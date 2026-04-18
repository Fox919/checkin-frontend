import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    user_type: 'guest'
  });
  const [qrValue, setQrValue] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('處理中...');

    try {
      const response = await fetch('https://checkin-system-production-2a74.up.railway.app/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 成功取得後端傳回的新用戶 ID，並將其設為二維碼內容
        if (data.id) {
          setQrValue(String(data.id));
          setMessage('登記成功！請截圖保存下方的二維碼。');
        } else {
          setMessage('登記成功，但未收到用戶 ID，請聯繫管理員。');
        }
      } else {
        // 顯示後端傳回的錯誤訊息 (例如：電話已存在)
        setMessage(`失敗: ${data.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage('連線錯誤，請檢查網路或後端網址是否正確。');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#333' }}>活動人員登記</h2>
      
      {!qrValue ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            name="name"
            placeholder="姓名"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
          />
          <input
            name="phone"
            type="tel"
            placeholder="電話"
            value={formData.phone}
            onChange={handleChange}
            required
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
          />
          <select 
            name="user_type" 
            value={formData.user_type} 
            onChange={handleChange} 
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', background: 'white' }}
          >
            <option value="guest">來賓</option>
            <option value="volunteer">義工</option>
            <option value="student">學員</option>
          </select>
          <button 
            type="submit" 
            style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            提交登記並生成碼
          </button>
        </form>
      ) : (
        <div style={{ marginTop: '20px', padding: '20px', border: '2px dashed #28a745', borderRadius: '10px', background: '#f9f9f9' }}>
          <QRCodeCanvas value={qrValue} size={200} />
          <h3 style={{ marginTop: '15px', color: '#28a745' }}>{formData.name}</h3>
          <p style={{ margin: '5px 0' }}>身份：{formData.user_type === 'guest' ? '來賓' : formData.user_type === 'volunteer' ? '義工' : '學員'}</p>
          <p style={{ color: '#d9534f', fontSize: '0.85rem', fontWeight: 'bold' }}>※ 請截圖此畫面保存以便簽到</p>
          <button 
            onClick={() => setQrValue('')} 
            style={{ marginTop: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            重新登記
          </button>
        </div>
      )}

      {message && (
        <p style={{ 
          marginTop: '15px', 
          padding: '10px', 
          borderRadius: '4px', 
          backgroundColor: message.includes('失敗') || message.includes('錯誤') ? '#f8d7da' : '#e2e3e5',
          color: message.includes('失敗') || message.includes('錯誤') ? '#721c24' : '#383d41' 
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Register;
