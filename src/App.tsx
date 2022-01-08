import React, { Suspense } from "react";
import AppRouter from "./router";
import "./App.css";
import i18n from "./i18n";
function App() {
  document.body.dir = i18n.dir();
  return (
    <React.Fragment>
      <Suspense fallback={null}>
        <AppRouter />
      </Suspense>
    </React.Fragment>
  );
}

export default App;
