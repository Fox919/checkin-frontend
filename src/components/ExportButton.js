import React, { useState } from 'react';

const ExportButton = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://checkin-system-production-2a74.up.railway.app/admin/export-excel');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'checkin_list.xlsx';
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
    <button 
      onClick={handleExport}
      disabled={loading}
      style={{
        padding: '10px 20px',
        backgroundColor: loading ? '#ccc' : '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      {loading ? '處理中...' : '📥 匯出 Excel'}
    </button>
  );
};

export default ExportButton;