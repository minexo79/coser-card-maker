import CardMaker from './components/CardMaker';
import HomePage from './components/HomePage';
import Login from './components/Login';
import NavBar from './components/NavBar';
import Copyright from './components/Copyright';
import ErrorBoundary from './components/ErrorBoundary';
import AdminDashboard from './components/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import TemplateEditor from './components/templateEditor/TemplateEditor';
import AuthProvider from './contexts/AuthProvider';
import CardMakerProvider from './contexts/CardMakerProvider';
import ErrorProvider from './contexts/ErrorProvider';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useParams, useSearchParams } from "react-router-dom";

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

// /make => DIY 預訂製作器；/make?id=xxx => XML（OEM）預訂頁
const MakeLayout = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  return (
    <CardMakerProvider eventName={eventId}>
      <CardMaker />
    </CardMakerProvider>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-amber-50 honeycomb-bg">
      <ErrorProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <NavBar />
              <Routes>
                {/* 公開路由 */}
                <Route path="/login" element={<Login />} />
                {/* 保留舊的 /template-editor 路徑，導向管理面板 */}
                <Route path="/template-editor" element={<Navigate to="/admin?tab=templates" replace />} />
                {/* 舊的 /upload 已合併進 /template-editor?tab=assets，保留轉址 */}
                <Route path="/upload" element={<Navigate to="/admin?tab=templates" replace />} />
                {/* 管理頁（需登入） */}
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                {/* 客製化模板 */}
                <Route path="/:eventId" element={<OemLayout />} />
                {/* 一般製圖（預訂製作器 / 分享連結）共用同一份狀態 */}
                <Route element={<DiyLayout />}>
                  {/* 預訂製作器（DIY 自訂版型） */}
                  <Route path="/make" element={<MakeLayout />} />
                  {/* 載入已儲存的圖卡 */}
                  <Route path="/card/:cardId" element={<CardMaker />} />
                </Route>
                {/* 預設首頁：本週場次 */}
                <Route index element={<HomePage />} />
              </Routes>
              {/* 版權聲明：每個頁面都顯示 */}
              <Copyright />
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </ErrorProvider>
    </div>
  );
}

export default App
