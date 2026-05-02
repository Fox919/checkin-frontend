import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const t = {
  'zh-TW': {
    title: "活動人員登記",
    checkinTitle: "現場登記與簽到",
    lastName: "姓", firstName: "名",
    gender: "性別", male: "男", female: "女",
    phone: "電話", email: "電子郵件",
    contactPref: "您願意以何種形式收到訊息？(可多選)",
    call: "電話", text: "簡訊", emailPref: "電郵",
    city: "居住城市",
    source: "您如何得知菩提禪修？",
    google: "谷歌 / YouTube", facebook: "臉書 / Instagram",
    friend: "朋友 / 親戚", magazine: "雜誌", website: "官方網站", other: "其他",
    referrer: "介紹人姓名",
    otherSource: "請註明來源",
    subscribe: "訂閱金菩提宗師 YouTube 頻道",
    type: "身分", guest: "來賓", volunteer: "義工", student: "學員",
    submit: "提交登記並生成碼",
    success: "登記成功！請截圖保存下方的二維碼。",
    retry: "重新登記", error: "失敗"
  },
  'zh-CN': {
    title: "活动人员登记",
    checkinTitle: "现场登记与签到",
    lastName: "姓", firstName: "名",
    gender: "性别", male: "男", female: "女",
    phone: "电话", email: "电子邮件",
    contactPref: "您愿意以何种形式收到信息？(可多选)",
    call: "电话", text: "短信", emailPref: "电邮",
    city: "居住城市",
    source: "您如何得知菩提禅修？",
    google: "谷歌 / YouTube", facebook: "脸书 / Instagram",
    friend: "朋友 / 亲戚", magazine: "杂志", website: "官方网站", other: "其他",
    referrer: "介绍人姓名",
    otherSource: "请注明来源",
    subscribe: "订阅金菩提宗师 YouTube 频道",
    type: "身分", guest: "来宾", volunteer: "义工", student: "学员",
    submit: "提交登记并生成码",
    success: "登记成功！请截图保存下方的二维码。",
    retry: "重新登记", error: "失败"
  },
  'en-US': {
    title: "Registration",
    checkinTitle: "On-site Registration",
    lastName: "Last Name", firstName: "First Name",
    gender: "Gender", male: "Male", female: "Female",
    phone: "Phone", email: "Email",
    contactPref: "How would you like to receive updates? (Multiple)",
    call: "Call", text: "Text", emailPref: "E-mail",
    city: "City",
    source: "How did you hear about Bodhi Meditation?",
    google: "Google / YouTube", facebook: "Facebook / Instagram",
    friend: "Friend / Relative", magazine: "Magazine", website: "Official Website", other: "Other",
    referrer: "Referrer Name",
    otherSource: "Please specify",
    subscribe: "Subscribe to Grandmaster JinBodhi's YouTube",
    type: "Role", guest: "Guest", volunteer: "Volunteer", student: "Student",
    submit: "Submit & Generate QR",
    success: "Successful! Please screenshot your QR code.",
    retry: "Register Again", error: "Error"
  }
};

const Register = ({ autoCheckin }) => {
  const [lang, setLang] = useState(localStorage.getItem('userLang') || 'zh-TW');
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', gender: '', 
    phone: '', email: '', 
    contact_method: [], // 修改為陣列
    city: '', discovery_source: '', referrer_name: '', other_source_text: '',
    youtube_subscribed: false, user_type: 'guest'
  });
  const [qrValue, setQrValue] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translations = t[lang];

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

  // 專門處理聯絡偏好的多選邏輯
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 如果沒有選任何聯絡方式，給個提示（可選）
    if (formData.contact_method.length === 0) {
      alert("請至少選擇一種聯絡方式 / Please select at least one contact method.");
      return;
    }

    setQrValue('');
    setMessage('Processing...');
    setIsSubmitting(true);

    try {
      const response = await fetch('https://checkin-system-production-2a74.up.railway.app/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lang, autoCheckin }),
      });

      const data = await response.json();

      if (response.status === 409) {
        setIsSubmitting(false);
        const fullName = `${formData.lastName}${formData.firstName}`;
        if (window.confirm(`提醒：${fullName} 已登記過。是否前往簽到頁？`)) {
          window.location.href = '/checkin';
        }
        return;
      }

      if (response.ok) {
        setQrValue(String(data.id));
        setMessage(translations.success);
      } else {
        setMessage(`${translations.error}: ${data.error || 'Unknown'}`);
      }
    } catch (error) {
      setMessage('Connection Error');
    } finally {
      setIsSubmitting(false);
    }
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

      <h2 style={{ color: '#2c3e50', marginBottom: '25px' }}>{autoCheckin ? translations.checkinTitle : translations.title}</h2>

      {!qrValue ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input name="lastName" placeholder={translations.lastName} value={formData.lastName} onChange={handleChange} required style={inputStyle} />
            <input name="firstName" placeholder={translations.firstName} value={formData.firstName} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={{ padding: '5px' }}>
            <span style={{ marginRight: '15px' }}>{translations.gender}:</span>
            <label style={{ cursor: 'pointer' }}><input type="radio" name="gender" value="Male" onChange={handleChange} required /> {translations.male}</label>
            <label style={{ marginLeft: '15px', cursor: 'pointer' }}><input type="radio" name="gender" value="Female" onChange={handleChange} /> {translations.female}</label>
          </div>

          <input name="phone" type="tel" placeholder={translations.phone} value={formData.phone} onChange={handleChange} required style={inputStyle} />
          <input name="email" type="email" placeholder={translations.email} value={formData.email} onChange={handleChange} style={inputStyle} />

          {/* 聯絡偏好多選區區塊 */}
          <div style={{ padding: '5px', border: '1px solid #eee', borderRadius: '6px', padding: '10px' }}>
            <label style={{ fontSize: '0.9rem', color: '#666', display: 'block', marginBottom: '8px' }}>{translations.contactPref}</label>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                <input type="checkbox" value="Call" checked={formData.contact_method.includes('Call')} onChange={handleContactChange} /> {translations.call}
              </label>
              <label style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                <input type="checkbox" value="Text" checked={formData.contact_method.includes('Text')} onChange={handleContactChange} /> {translations.text}
              </label>
              <label style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                <input type="checkbox" value="Email" checked={formData.contact_method.includes('Email')} onChange={handleContactChange} /> {translations.emailPref}
              </label>
            </div>
          </div>

          <input name="city" placeholder={translations.city} value={formData.city} onChange={handleChange} required style={inputStyle} />

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px' }}>
            <input type="checkbox" name="youtube_subscribed" checked={formData.youtube_subscribed} onChange={handleChange} id="yt" />
            <label htmlFor="yt" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>{translations.subscribe}</label>
          </div>

          <button type="submit" disabled={isSubmitting} style={{ padding: '15px', background: isSubmitting ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '10px' }}>
            {isSubmitting ? '...' : translations.submit}
          </button>
        </form>
      ) : (
        <div style={{ marginTop: '10px', padding: '20px', border: '2px dashed #28a745', borderRadius: '15px', background: '#f8fff8' }}>
          <QRCodeCanvas value={qrValue} size={220} />
          <h3 style={{ marginTop: '20px', color: '#2c3e50' }}>{formData.lastName}{formData.firstName}</h3>
          <p style={{ color: '#666' }}>{translations.success}</p>
          <button onClick={() => setQrValue('')} style={{ marginTop: '20px', padding: '12px', width: '100%', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {translations.retry}
          </button>
        </div>
      )}

      {message && <p style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', backgroundColor: message.includes('✅') || message.includes('success') || message.includes('成功') ? '#d4edda' : '#f8d7da', color: message.includes('✅') || message.includes('success') || message.includes('成功') ? '#155724' : '#721c24', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
};

export default Register;