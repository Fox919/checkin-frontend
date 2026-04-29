import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const t = {
  'zh-TW': { 
    title: "活動人員登記", 
    checkinTitle: "現場登記與簽到", 
    name: "姓名", phone: "電話", email: "電子郵件 (選填)", 
    type: "身分", submit: "提交登記並生成碼", 
    success: "登記成功！請截圖保存下方的二維碼。", 
    guest: "來賓", volunteer: "義工", student: "學員", 
    retry: "重新登記", error: "失敗" 
  },
  'zh-CN': { 
    title: "活动人员登记", 
    checkinTitle: "现场登记与签到", 
    name: "姓名", phone: "电话", email: "电子邮件 (选填)", 
    type: "身分", submit: "提交登记并生成码", 
    success: "登记成功！请截图保存下方的二维码。", 
    guest: "来宾", volunteer: "义工", student: "学员", 
    retry: "重新登记", error: "失败" 
  },
  'en-US': { 
    title: "Registration", 
    checkinTitle: "On-site Registration", 
    name: "Name", phone: "Phone", email: "Email (Optional)", 
    type: "Role", submit: "Submit & Generate QR", 
    success: "Registration successful! Please save the QR code below.", 
    guest: "Guest", volunteer: "Volunteer", student: "Student", 
    retry: "Register Again", error: "Error" 
  }
};

const Register = ({ autoCheckin }) => {
  const [lang, setLang] = useState(localStorage.getItem('userLang') || 'zh-TW');
  const [formData, setFormData] = useState({ name: '', phone: '', user_type: 'guest', email: '' });
  const [qrValue, setQrValue] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translations = t[lang];

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('userLang', newLang);
  };

  const handleReset = () => {
    setQrValue('');
    setMessage('');
    setFormData({ name: '', phone: '', user_type: 'guest', email: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      if (/^\d*$/.test(value)) setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setQrValue(''); 
    setMessage('處理中...');
    setIsSubmitting(true);

    try {
      const response = await fetch('https://checkin-system-production-2a74.up.railway.app/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lang, autoCheckin }), 
      });

      const data = await response.json();

      if (response.ok) {
        if (data.id) {
          setQrValue(String(data.id));
          setMessage(translations.success);
        }
      } else {
        // 判斷重複登記
        if (data.error === 'already_registered' || response.status === 409) {
          const confirmGo = window.confirm(
            `提醒：系統偵測到「${formData.name}」與「${formData.phone}」已經登記過了。\n\n是否直接前往「掃碼簽到」頁面？`
          );
          
          if (confirmGo) {
            window.location.href = '/checkin';
          } else {
            setMessage("該人員已登記，您可以直接使用原有的 QR Code。");
          }
        } else {
          setMessage(`${translations.error}: ${data.error || '未知錯誤'}`);
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage('連線錯誤。');
    } finally {
      setIsSubmitting(false); // 確保最後一定會關閉提交狀態
    }
  }; // <--- 補上原本漏掉的括號

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '15px' }}>
        {['zh-TW', 'zh-CN', 'en-US'].map((l) => (
          <button key={l} onClick={() => handleLangChange(l)} style={{ margin: '0 5px', padding: '5px 10px' }}>
            {l === 'zh-TW' ? '繁' : l === 'zh-CN' ? '简' : 'EN'}
          </button>
        ))}
      </div>

      <h2 style={{ color: '#333' }}>
        {autoCheckin ? translations.checkinTitle : translations.title}
      </h2>
      
      {!qrValue ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input name="name" placeholder={translations.name} value={formData.name} onChange={handleChange} required style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input name="phone" type="tel" placeholder={translations.phone} value={formData.phone} onChange={handleChange} required style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input name="email" type="email" placeholder={translations.email} value={formData.email} onChange={handleChange} style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />
          
          <select name="user_type" value={formData.user_type} onChange={handleChange} style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}>
            <option value="guest">{translations.guest}</option>
            <option value="volunteer" disabled>{translations.volunteer}</option>
            <option value="student" disabled>{translations.student}</option>
          </select>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              padding: '12px', 
              background: isSubmitting ? '#ccc' : '#28a745', 
              color: 'white', border: 'none', borderRadius: '4px', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' 
            }}
          >
            {isSubmitting ? '...' : translations.submit}
          </button>
        </form>
      ) : (
        <div style={{ marginTop: '20px', padding: '20px', border: '2px dashed #28a745', borderRadius: '10px', background: '#f9f9f9' }}>
          <QRCodeCanvas value={qrValue} size={200} />
          <h3 style={{ marginTop: '15px', color: '#28a745' }}>{formData.name}</h3>
          <p style={{ margin: '5px 0' }}>{translations.type}：{translations.guest}</p>
          <p style={{ color: '#d9534f', fontSize: '0.85rem', fontWeight: 'bold' }}>※ 請截圖此畫面保存</p>
          
          <button 
            type="button" 
            onClick={handleReset} 
            style={{ 
              marginTop: '15px', padding: '10px 20px', 
              backgroundColor: '#6c757d', color: 'white', 
              border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' 
            }}
          >
            {translations.retry}
          </button>
        </div>
      )}

      {message && (
        <p style={{ 
          marginTop: '15px', padding: '10px', borderRadius: '4px', 
          backgroundColor: message.includes('失敗') || message.includes('錯誤') || message.includes('登記過') ? '#f8d7da' : '#e2e3e5' 
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Register;