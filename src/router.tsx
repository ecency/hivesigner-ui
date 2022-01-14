import { useRoutes } from "react-router-dom";
import Home from "./components/Index/Home";
import Import from "./pages/import";
import Apps from "./components/Apps";
import Accounts from "./components/Accounts";
import About from "./components/About";
import Sign from "./components/Sign";
const AppRouter = () => {
  let routes = useRoutes([
    { path: "/", element: <Home /> },
    { path: "/import", element: <Import /> },
    { path: "/apps", element: <Apps /> },
    { path: "/accounts", element: <Accounts /> },
    { path: "/about", element: <About /> },
    { path: "/sign", element: <Sign /> },
    // ...
  ]);
  return routes;
};

export default AppRouter;
