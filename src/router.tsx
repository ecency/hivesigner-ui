import { Routes, Route } from "react-router-dom";
import Home from "./components/Index/Home";
import Import from "./pages/import";
import Apps from "./components/Apps";
import Accounts from "./components/Accounts";
import About from "./components/About";
import Sign from "./components/Sign";
const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/import" element={<Import />} />
      <Route path="/apps" element={<Apps />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/about" element={<About />} />
      <Route path="/sign" element={<Sign />} />
    </Routes>
  );
};

export default AppRouter;
