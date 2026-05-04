import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useSearchParams } from 'react-router-dom';

const t = {
  'zh-TW': {
    title: "活動人員登記",
    checkinTitle: "現場登記與簽到",
    lastName: "姓", firstName: "名",
    phone: "電話", email: "電子郵件",
    contactPref: "您願意以何種形式收到訊息？(可多選)",
    call: "電話", text: "簡訊", emailPref: "電郵",
    source: "您如何得知菩提禪修？",
    google: "谷歌 / YouTube", facebook: "臉書 / Instagram",
    friend: "朋友 / 親戚", magazine: "雜誌", website: "官方網站", other: "其他",
    referrer: "介紹人姓名",
    otherSource: "請註明來源",
    submit: "提交登記並生成碼",
    success: "登記成功！請截圖保存下方的二維碼。",
    retry: "重新登記", error: "失敗"
  },
  'zh-CN': {
    title: "活动人员登记",
    checkinTitle: "现场登记与签到",
    lastName: "姓", firstName: "名",
    phone: "电话", email: "电子邮件",
    contactPref: "您愿意以何种形式收到信息？(可多选)",
    call: "电话", text: "短信", emailPref: "电邮",
    source: "您如何得知菩提禅修？",
    google: "谷歌 / YouTube", facebook: "脸书 / Instagram",
    friend: "朋友 / 亲戚", magazine: "杂志", website: "官方网站", other: "其他",
    referrer: "介绍人姓名",
    otherSource: "请注明来源",
    submit: "提交登记并生成码",
    success: "登记成功！请截图保存下方的二维码。",
    retry: "重新登记", error: "失败"
  },
  'en-US': {
    title: "Registration",
    checkinTitle: "On-site Registration",
    lastName: "Last Name", firstName: "First Name",
    phone: "Phone", email: "Email",
    contactPref: "How would you like to receive updates? (Multiple)",
    call: "Call", text: "Text", emailPref: "E-mail",
    source: "How did you hear about Bodhi Meditation?",
    google: "Google / YouTube", facebook: "Facebook / Instagram",
    friend: "Friend / Relative", magazine: "Magazine", website: "Official Website", other: "Other",
    referrer: "Referrer Name",
    otherSource: "Please specify",
    submit: "Submit & Generate QR",
    success: "Successful! Please screenshot your QR code.",
    retry: "Register Again", error: "Error"
  }
};

const Register = ({ autoCheckin }) => {
  const [searchParams] = useSearchParams();
  const [lang, setLang] = useState(localStorage.getItem('userLang') || 'zh-TW');
  
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', 
    gender: '', // UI 已移除，預設傳空值
    phone: '', email: '', 
    contact_method: [], 
    discovery_source: '', referrer_name: '', other_source_text: '',
    user_type: 'Visitor'
  });
  
  const [qrValue, setQrValue] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 確保翻譯始終能讀取到目前語言
  const translations = t[lang];

  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          if (window.confirm(`Reminder: ${lastName}${firstName} is already registered.\nGo to check-in page?`)) {
            window.location.href = '/checkin';
          }
        }
      } catch (error) { console.error(error); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.contact_method.length === 0) {
      alert(lang === 'en-US' ? "Please select a contact method" : "請選擇聯絡方式");
      return;
    }

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
        setMessage(data.error || 'Failed');
      }
    } catch (error) {
      setMessage('Connection Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeaderColor = () => {
    if (formData.user_type === 'Expo-Newcomer') return '#9c27b0'; 
    if (formData.user_type === 'Hall-Newcomer') return '#2196f3';
    return '#2c3e50';
  };

  const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      
      {/* 語言切換按鈕 */}
      <div style={{ marginBottom: '20px' }}>
        {['zh-TW', 'zh-CN', 'en-US'].map((l) => (
          <button key={l} onClick={() => handleLangChange(l)} style={{ margin: '0 5px', padding: '8px 15px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: lang === l ? '#007bff' : '#fff', color: lang === l ? '#fff' : '#333', fontWeight: 'bold' }}>
            {l === 'zh-TW' ? '繁體' : l === 'zh-CN' ? '简体' : 'EN'}
          </button>
        ))}
      </div>

      <h2 style={{ color: getHeaderColor(), marginBottom: '10px' }}>
        {autoCheckin ? translations.checkinTitle : translations.title}
      </h2>
      
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '20px' }}>
        ({formData.user_type === 'Visitor' ? 'Bodhi Meditation' : `Channel: ${formData.user_type}`})
      </p>

      {!qrValue ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input name="lastName" placeholder={translations.lastName} value={formData.lastName} onChange={handleChange} onBlur={checkUserExists} required style={inputStyle} />
            <input name="firstName" placeholder={translations.firstName} value={formData.firstName} onChange={handleChange} onBlur={checkUserExists} required style={inputStyle} />
          </div>

          <input name="phone" type="tel" placeholder={translations.phone} value={formData.phone} onChange={handleChange} required style={inputStyle} />
          <input name="email" type="email" placeholder={translations.email} value={formData.email} onChange={handleChange} style={inputStyle} />

          <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: '#fdfdfd' }}>
            <label style={{ fontSize: '0.9rem', color: '#666', display: 'block', marginBottom: '8px' }}>{translations.contactPref}</label>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label><input type="checkbox" value="Call" onChange={handleContactChange} /> {translations.call}</label>
              <label><input type="checkbox" value="Text" onChange={handleContactChange} /> {translations.text}</label>
              <label><input type="checkbox" value="Email" onChange={handleContactChange} /> {translations.emailPref}</label>
            </div>
          </div>

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
          {formData.discovery_source === 'Other' && (
            <input name="other_source_text" placeholder={translations.otherSource} value={formData.other_source_text} onChange={handleChange} required style={inputStyle} />
          )}

          <input type="hidden" name="user_type" value={formData.user_type} />

          <button type="submit" disabled={isSubmitting} style={{ padding: '15px', background: getHeaderColor(), color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '10px' }}>
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

      {message && <p style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', backgroundColor: message.includes('成功') || message.includes('Success') ? '#d4edda' : '#f8d7da', color: message.includes('成功') || message.includes('Success') ? '#155724' : '#721c24', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
};

export default Register;