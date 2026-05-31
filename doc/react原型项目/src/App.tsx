import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { useState } from "react";
import HomePage from "./pages/HomePage";
import ExpressPage from "./pages/ExpressPage";
import FilesPage from "./pages/FilesPage";
import FileDetailPage from "./pages/FileDetailPage";
import MoveFilePage from "./pages/MoveFilePage";
import ProfilePage from "./pages/ProfilePage";
import UserDetailPage from "./pages/UserDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import TransferPage from "./pages/TransferPage";
import MessagePage from "./pages/MessagePage";
import DevicesPage from "./pages/DevicesPage";
import AcRemotePage from "./pages/AcRemotePage";
import { BottomNav } from "./components/BottomNav";

const HIDE_NAV_PATHS = ['/login', '/register', '/file-detail', '/move-file', '/user-detail', '/transfer', '/devices', '/ac-remote'];

function AppInner() {
  const { pathname } = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const showNav = isLoggedIn && !HIDE_NAV_PATHS.includes(pathname);

  return (
    <>
      <Routes>
        <Route path="/"           element={<HomePage />} />
        <Route path="/express"    element={<ExpressPage />} />
        <Route path="/cloud"      element={<FilesPage />} />
        <Route path="/file-detail" element={<FileDetailPage />} />
        <Route path="/move-file"   element={<MoveFilePage />} />
        <Route path="/profile"    element={<ProfilePage onLogout={() => setIsLoggedIn(false)} />} />
        <Route path="/user-detail" element={<UserDetailPage />} />
        <Route path="/login"      element={<LoginPage onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/register"   element={<RegisterPage />} />
        <Route path="/search"     element={<SearchPage />} />
        <Route path="/transfer"   element={<TransferPage />} />
        <Route path="/messages"   element={<MessagePage />} />
        <Route path="/devices"    element={<DevicesPage />} />
        <Route path="/ac-remote"  element={<AcRemotePage />} />
      </Routes>
      <div className={showNav ? `` : `hidden`}>
        <BottomNav />
      </div>
    </>
  );
}

const App = () => (
  <BrowserRouter>
    <Toaster position="top-center" richColors />
    <AppInner />
  </BrowserRouter>
);

export default App;
