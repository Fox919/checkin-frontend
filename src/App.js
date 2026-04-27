import AdminList from './components/AdminList';
import Kiosk from './components/Kiosk';
import Checkin from './Checkin'; 

function App() {
  return (
    <BrowserRouter>
      {/* 導航列 */}
      <nav style={{ padding: '15px', borderBottom: '1px solid #ccc', textAlign: 'center' }}>
        
        {/* 現場登記頁面 */}
        <Link to="/on-site" style={{ marginRight: '10px' }}>
          <button>活動登記簽到</button>
        </Link>

        {/* 登記頁面 (使用 NavLink，點擊後會有樣式變化) */}
        <NavLink 
          to="/register" 
          style={({ isActive }) => ({ 
            marginRight: '10px', 
            fontWeight: isActive ? 'bold' : 'normal',
            color: isActive ? 'red' : 'black' 
          })}
        >
          <button>登記</button>
        </NavLink>

        <Link to="/checkin" style={{ marginRight: '10px' }}>
          <button>掃碼簽到</button>
        </Link>
        
        <Link to="/kiosk" style={{ marginRight: '10px' }}>
          <button>快速簽到</button>
        </Link>

        <Link to="/admin">
          <button>簽到管理</button>
        </Link>
      </nav>

      {/* 頁面路由區 */}
      <Routes>
        <Route path="/" element={<Register autoCheckin={true} />} />
        <Route path="/register" element={<Register autoCheckin={false} />} />
        <Route path="/on-site" element={<Register autoCheckin={true} />} />
        <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/admin" element={<AdminList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;