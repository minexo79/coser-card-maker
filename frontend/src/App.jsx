import CardMaker from './components/CardMaker';
import Heartbeat from './components/Heartbeat';
import NavBar from './components/NavBar';
import TemplateEditor from './components/templateEditor/TemplateEditor';
import CardMakerProvider from './contexts/CardMakerProvider';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useParams } from "react-router-dom";

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
          {/* 模板視覺化編輯器（獨立管理頁） */}
          <Route path="/template-editor" element={<TemplateEditor />} />
          {/* 客製化模板 */}
          <Route path="/:eventId" element={<OemLayout />} />
          {/* 一般製圖（首頁 / 上傳 / 分享連結）共用同一份狀態 */}
          <Route element={<DiyLayout />}>
            {/* 預設 */}
            <Route index element={<CardMaker />} />
            {/* P1：舊的 /upload 已合併進 /template-editor?tab=upload，保留轉址 */}
            <Route path="/upload" element={<Navigate to="/template-editor?tab=upload" replace />} />
            {/* 載入已儲存的圖卡 */}
            <Route path="/card/:cardId" element={<CardMaker />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App