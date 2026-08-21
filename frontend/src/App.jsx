import CardMaker from './components/CardMaker';
import Heartbeat from './components/Heartbeat';
import UploadPage from './components/UploadPage';
import NavBar from './components/NavBar';
import CardMakerProvider from './contexts/CardMakerProvider';
import { BrowserRouter, Routes, Route, Outlet, useParams } from "react-router-dom";

const DiyLayout = () => {
  return (
    <CardMakerProvider>
      <Outlet />
    </CardMakerProvider>
  );
};

const OemLayout = () => {
  const { eventId } = useParams();
  return (
    <CardMakerProvider eventName={eventId}>
      <CardMaker />
    </CardMakerProvider>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-gray-200">
      <BrowserRouter>
        <NavBar />
        <Routes>
          {/* 心跳偵測頁 */}
          <Route path="/heartbeat" element={<Heartbeat />} />
          {/* 客製化模板 */}
          <Route path="/:eventId" element={<OemLayout />} />
          {/* 一般製圖（首頁 / 上傳 / 分享連結）共用同一份狀態 */}
          <Route element={<DiyLayout />}>
            {/* 預設 */}
            <Route index element={<CardMaker />} />
            {/* 圖片上傳 + 雲端儲存 */}
            <Route path="/upload" element={<UploadPage />} />
            {/* 載入已儲存的圖卡 */}
            <Route path="/card/:cardId" element={<CardMaker />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App