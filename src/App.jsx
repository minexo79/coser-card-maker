import CardMaker from './components/CardMaker'
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  // return (
  //   <div className="min-h-screen bg-gray-200">
  //     <CardMaker />
  //   </div>
  // )
  return (
    <div className="min-h-screen bg-gray-200">
      <BrowserRouter>
        <Routes>
          {/* 蜂格子 */}
          <Route path="/:eventName" element={<CardMaker />} />
          {/* 預設 */}
          <Route index element={<CardMaker />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App