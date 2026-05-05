import CardMaker from './components/CardMaker'

function App() {
  return (
    <div className="min-h-screen bg-gray-200">
<<<<<<< HEAD
      <CardMaker />
=======
      <BrowserRouter>
        <Routes>
          {/* 客製化模板 */}
          <Route path="/:eventName" element={<CardMaker />} />
          {/* 預設 */}
          <Route index element={<CardMaker />} />
        </Routes>
      </BrowserRouter>
>>>>>>> c861ee7 (移除QRCode程式碼，調整圖片繪製邏輯減少流量耗損，整理沒用的程式碼)
    </div>
  )
}

export default App