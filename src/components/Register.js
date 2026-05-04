import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useSearchParams } from 'react-router-dom'; // 引入 Hook 抓取網址參數

const t = {
  'zh-TW': {
    title: "活動人員登記",
    checkinTitle: "現場登記與簽到",
    lastName: "姓", firstName: "名",
    gender: "性別", male: "男", female: "女", otherGender: "不便透露",
    phone: "電話", email: "電子郵件",
    contactPref: "您願意以何種形式收到訊息？(可多選)",
    call: "電話", text: "簡訊", emailPref: "電郵",
    source: "您如何得知菩提禪修？",
    google: "谷歌 / YouTube", facebook: "臉書 / Instagram",
    friend: "朋友 / 親戚", magazine: "雜誌", website: "官方網站", other: "其他",
    referrer: "介紹人姓名",
    otherSource: "請註明來源",
    type: "身分", visitor: "一般訪客", volunteer: "義工", student: "學員", expo: "展會新人", hall: "禪堂新人",
    submit: "提交登記並生成碼",
    success: "登記成功！請截圖保存下方的二維碼。",
    retry: "重新登記", error: "失敗"
  },
  // ... zh-CN 與 en-US 保持不變 ...
};

const Register = ({ autoCheckin }) => {
  const [searchParams] = useSearchParams();
  const [lang, setLang] = useState(localStorage.getItem('userLang') || 'zh-TW');
  
  // 1. 初始化 formData，增加預設值
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', gender: '', 
    phone: '', email: '', 
    contact_method: [], 
    discovery_source: '', referrer_name: '', other_source_text: '',
    user_type: 'Visitor' // 預設身分
  });
  
  const [qrValue, setQrValue] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translations = t[lang] || t['zh-TW'];

  // 2. 自動監聽 URL 中的 type 參數
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    // 定義你設定的五類身份
    const validTypes = ['Hall-Newcomer', 'Expo-Newcomer', 'Volunteer', 'Student', 'Visitor'];
    
    if (typeFromUrl && validTypes.includes(typeFromUrl)) {
      setFormData(prev => ({ ...prev, user_type: typeFromUrl }));
    }
  }, [searchParams]);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('userLang', newLang);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContactChange = (e) => {
    const { value, checked } = e.target;
    let updatedMethods = [...formData.contact_method];
    if (checked) {
      updatedMethods.push(value);
    } else {
      updatedMethods = updatedMethods.filter(m => m !== value);
    }
    setFormData(prev => ({ ...prev, contact_method: updatedMethods }));
  };

  // 預檢邏輯保持不變
  const checkUserExists = async () => {
    const { lastName, firstName, phone } = formData;
    if (lastName.trim() && firstName.trim() && phone.trim().length >= 8) {
      try {
        const response = await fetch('https://checkin-system-production-2a74.up.railway.app/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastName, firstName, phone }),
        });
        const data = await response.json();
        if (data.isDuplicate) {
          if (window.confirm(`提醒：${lastName}${firstName} 已經登記過。\n是否直接前往簽到？`)) {
            window.location.href = '/checkin';
          }
        }
      } catch (error) { console.error(error); }
    }
  };

  const validateForm = () => {
    if (formData.contact_method.length === 0) {
      alert("請選擇至少一種聯絡方式");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('https://checkin-system-production-2a74.up.railway.app/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lang, autoCheckin }),
      });

      const data = await response.json();
      if (response.ok) {
        setQrValue(String(data.id));
        setMessage(translations.success);
        window.scrollTo(0, 0);
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (error) {
      setMessage('Connection Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 動態顏色標題 (根據 type 變換顏色，增加內部辨識度)
  const getHeaderColor = () => {
    if (formData.user_type === 'Expo-Newcomer') return '#9c27b0'; // 紫色
    if (formData.user_type === 'Hall-Newcomer') return '#2196f3'; // 藍色
    return '#2c3e50';
  };

  const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      {/* 語言切換 */}
      <div style={{ marginBottom: '20px' }}>
        {['zh-TW', 'zh-CN', 'en-US'].map((l) => (
          <button key={l} onClick={() => handleLangChange(l)} style={{ margin: '0 5px', padding: '8px 15px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: lang === l ? '#007bff' : '#fff', color: lang === l ? '#fff' : '#333' }}>
            {l === 'zh-TW' ? '繁' : l === 'zh-CN' ? '简' : 'EN'}
          </button>
        ))}
      </div>

      <h2 style={{ color: getHeaderColor(), marginBottom: '10px' }}>
        {autoCheckin ? translations.checkinTitle : translations.title}
      </h2>
      
      {/* 顯示當前身分（提示用，可隱藏） */}
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '20px' }}>
        ({formData.user_type === 'Visitor' ? '一般登記' : `專屬通道: ${formData.user_type}`})
      </p>

      {!qrValue ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input name="lastName" placeholder={translations.lastName} value={formData.lastName} onChange={handleChange} onBlur={checkUserExists} required style={inputStyle} />
            <input name="firstName" placeholder={translations.firstName} value={formData.firstName} onChange={handleChange} onBlur={checkUserExists} required style={inputStyle} />
          </div>

          <div style={{ padding: '5px' }}>
            <span style={{ marginRight: '10px' }}>{translations.gender}:</span>
            <label><input type="radio" name="gender" value="Male" onChange={handleChange} required /> {translations.male}</label>
            <label style={{ marginLeft: '10px' }}><input type="radio" name="gender" value="Female" onChange={handleChange} /> {translations.female}</label>
          </div>

          <input name="phone" type="tel" placeholder={translations.phone} value={formData.phone} onChange={handleChange} required style={inputStyle} />
          <input name="email" type="email" placeholder={translations.email} value={formData.email} onChange={handleChange} style={inputStyle} />

          {/* 聯絡方式多選區 */}
          <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
            <label style={{ fontSize: '0.9rem', color: '#666', display: 'block', marginBottom: '8px' }}>{translations.contactPref}</label>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label><input type="checkbox" value="Call" onChange={handleContactChange} /> {translations.call}</label>
              <label><input type="checkbox" value="Text" onChange={handleContactChange} /> {translations.text}</label>
              <label><input type="checkbox" value="Email" onChange={handleContactChange} /> {translations.emailPref}</label>
            </div>
          </div>

          {/* 來源選擇 */}
          <label style={{ fontSize: '0.9rem', color: '#666' }}>{translations.source}</label>
          <select name="discovery_source" value={formData.discovery_source} onChange={handleChange} required style={inputStyle}>
            <option value="">-- Select --</option>
            <option value="Google/YouTube">{translations.google}</option>
            <option value="Facebook/IG">{translations.facebook}</option>
            <option value="Friend">{translations.friend}</option>
            <option value="Magazine">{translations.magazine}</option>
            <option value="Website">{translations.website}</option>
            <option value="Other">{translations.other}</option>
          </select>

          {formData.discovery_source === 'Friend' && (
            <input name="referrer_name" placeholder={translations.referrer} value={formData.referrer_name} onChange={handleChange} required style={inputStyle} />
          )}

          {/* 隱藏的身分欄位，會自動送出 */}
          <input type="hidden" name="user_type" value={formData.user_type} />

          <button type="submit" disabled={isSubmitting} style={{ padding: '15px', background: getHeaderColor(), color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
            {isSubmitting ? '...' : translations.submit}
          </button>
        </form>
      ) : (
        <div style={{ marginTop: '10px', padding: '20px', border: '2px dashed #28a745', borderRadius: '15px', background: '#f8fff8' }}>
          <QRCodeCanvas value={qrValue} size={220} />
          <h3 style={{ marginTop: '20px' }}>{formData.lastName}{formData.firstName}</h3>
          <p>{translations.success}</p>
          <button onClick={() => { setQrValue(''); setMessage(''); }} style={{ marginTop: '20px', padding: '12px', width: '100%', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px' }}>
            {translations.retry}
          </button>
        </div>
      )}

      {message && <p style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', backgroundColor: message.includes('成功') ? '#d4edda' : '#f8d7da', color: message.includes('成功') ? '#155724' : '#721c24' }}>{message}</p>}
    </div>
  );
};

export default Register;