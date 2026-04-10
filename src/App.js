import { useState } from "react";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";


const API = "https://checkin-system-production-2a74.up.railway.app";
export default function App() {
  const [page, setPage] = useState("home");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [qr, setQr] = useState("");

  // 註冊函數
  const register = async () => {
    if (!name || !phone) return alert("請填寫姓名和電話");
    try {
      // 這裡確保 API 網址正確
      const res = await axios.post(`${API}/register`, { name, phone });
      setQr(res.data.qrImage);
      alert("登記成功！");
    } catch (err) {
      console.error(err);
      alert("登記失敗，請檢查後端連線或查看主控台錯誤");
    }
  };

  // 掃碼函數
  const startScan = async () => {
    const scanner = new Html5Qrcode("reader");
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (text) => {
          await scanner.stop();
          try {
            const res = await axios.post(`${API}/checkin`, { qr_code: text });
            alert(res.data.message || "簽到成功");
            setPage("home");
          } catch (checkinErr) {
            alert("簽到失敗：" + (checkinErr.response?.data?.error || "伺服器錯誤"));
          }
        }
      );
    } catch (err) {
      console.error(err);
      alert("無法啟動相機");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: 20, fontFamily: "sans-serif" }}>
      <h1>禪堂簽到系統</h1>

      {page === "home" && (
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => setPage("register")} style={btnStyle}>學員登記</button>
          <button onClick={() => setPage("scan")} style={btnStyle}>掃碼簽到</button>
        </div>
      )}

      {page === "register" && (
        <div>
          <h2>資料登記</h2>
          <input 
            placeholder="姓名" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            style={inputStyle}
          />
          <br /><br />
          <input 
            placeholder="電話" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            style={inputStyle}
          />
          <br /><br />
          <button onClick={register} style={btnStyle}>提交並生成 QR Code</button>
          <br /><br />
          {qr && (
            <div>
              <p>請截圖保存此 QR Code：</p>
              <img src={qr} alt="QR Code" width="200" style={{ border: "1px solid #ccc" }} />
            </div>
          )}
          <br />
          <button onClick={() => setPage("home")} style={backBtnStyle}>返回首頁</button>
        </div>
      )}

      {page === "scan" && (
        <div>
          <h2>掃碼簽到</h2>
          <div id="reader" style={{ width: "300px", margin: "auto", border: "1px solid #ddd" }}></div>
          <br />
          <button onClick={startScan} style={btnStyle}>開啟攝像頭</button>
          <br /><br />
          <button onClick={() => setPage("home")} style={backBtnStyle}>返回首頁</button>
        </div>
      )}
    </div>
  );
}

// 簡單的樣式
const btnStyle = { padding: "10px 20px", fontSize: "16px", cursor: "pointer", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px" };
const backBtnStyle = { ...btnStyle, backgroundColor: "#666" };
const inputStyle = { padding: "10px", fontSize: "16px", width: "200px" };
