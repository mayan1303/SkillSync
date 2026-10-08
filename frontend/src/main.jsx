import React from 'react'; import ReactDOM from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion'; import App from './App.jsx'; import { AuthProvider } from './context/AuthContext.jsx'; import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter><MotionConfig reducedMotion="user"><AuthProvider><App/></AuthProvider></MotionConfig></BrowserRouter>);
