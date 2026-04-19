// ExportButton.js
import React, { useState } from 'react';

const ExportButton = ({ selectedDate }) => { // 接收從父元件傳來的日期
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // 在網址後面加上 ?date=YYYY-MM-DD
      const url = selectedDate 
        ? `https://checkin-system-production-2a74.up.railway.app/admin/export-excel?date=${selectedDate}`
        : `https://checkin-system-production-2a74.up.railway.app/admin/export-excel`;

      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = selectedDate ? `checkin_${selectedDate}.xlsx` : 'checkin_all.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("匯出失敗");
      }
    } catch (err) {
      alert("伺服器連線錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading} style={{ /* ...你的樣式... */ }}>
      {loading ? '產生中...' : '📥 匯出 Excel'}
    </button>
  );
};

export default ExportButton;