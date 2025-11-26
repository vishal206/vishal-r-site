import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import BlogReader from './Components/BlogReader.tsx'
import WeekNoteReader from './Components/WeekNoteReader.tsx'
import DevLogReader from './Components/DevLogReader.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/blog/:slug" element={<BlogReader />} />
        <Route path="/weeknote/:slug" element={<WeekNoteReader />} />
        <Route path="/devlog/:project/:slug" element={<DevLogReader />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
