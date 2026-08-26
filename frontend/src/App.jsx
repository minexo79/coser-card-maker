import CardMaker from './components/CardMaker';
import Heartbeat from './components/Heartbeat';
import Login from './components/Login';
import NavBar from './components/NavBar';
import AdminDashboard from './components/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import TemplateEditor from './components/templateEditor/TemplateEditor';
import AuthProvider from './contexts/AuthProvider';
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
        <AuthProvider>
          <NavBar />
          <Routes>
            {/* 公開路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/heartbeat" element={<Heartbeat />} />
            {/* 保留舊的 /template-editor 路徑，導向管理面板 */}
            <Route path="/template-editor" element={<Navigate to="/admin?tab=templates" replace />} />
            {/* 管理頁（需登入） */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            {/* 客製化模板 */}
            <Route path="/:eventId" element={<OemLayout />} />
            {/* 一般製圖（首頁 / 上傳 / 分享連結）共用同一份狀態 */}
            <Route element={<DiyLayout />}>
              {/* 預設 */}
              <Route index element={<CardMaker />} />
              {/* 舊的 /upload 已合併進 /template-editor?tab=assets，保留轉址 */}
              <Route path="/upload" element={<Navigate to="/admin?tab=templates" replace />} />
              {/* 載入已儲存的圖卡 */}
              <Route path="/card/:cardId" element={<CardMaker />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App
