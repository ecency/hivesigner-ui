import React, { Suspense } from 'react';
import AppRouter from './router'
import './App.css';

function App() {
  return (
    <React.Fragment>
      <Suspense fallback={null}>
        <AppRouter />
      </Suspense>
    </React.Fragment>
  );
}

export default App;
