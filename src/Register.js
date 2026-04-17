import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    user_type: 'guest' // 統一使用 user_type
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
      const response = await fetch('https://your-backend-url.railway.app/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setQrValue(data.qr_code);
        setMessage('登記成功！請截圖保存下方的二維碼以便簽到。');
      } else {
        setMessage(`失敗: ${data.error}`);
      }
    } catch (error) {
      setMessage('連線錯誤，請檢查後端網址');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
      <h2>活動人員登記</h2>
      
      {!qrValue ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            name="name"
            placeholder="姓名"
            onChange={handleChange}
            required
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            name="phone"
            placeholder="電話"
            onChange={handleChange}
            required
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <select 
            name="user_type" 
            value={formData.user_type} 
            onChange={handleChange} 
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="guest">來賓</option>
            <option value="volunteer">義工</option>
            <option value="student">學員</option>
          </select>
          <button type="submit" style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            提交登記並生成碼
          </button>
        </form>
      ) : (
        <div style={{ marginTop: '20px', padding: '20px', border: '2px dashed #28a745', borderRadius: '10px', background: '#f9f9f9' }}>
          <QRCodeCanvas value={qrValue} size={200} />
          <h3 style={{ marginTop: '15px' }}>{formData.name}</h3>
          <p>身份：{formData.user_type === 'guest' ? '來賓' : formData.user_type === 'volunteer' ? '義工' : '學員'}</p>
          <p style={{ color: '#d9534f', fontSize: '0.9rem' }}>※ 請截圖此畫面保存</p>
        </div>
      )}

      {message && <p style={{ marginTop: '15px', color: '#555' }}>{message}</p>}
    </div>
  );
};

export default Register;
