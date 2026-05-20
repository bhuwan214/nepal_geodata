import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Home from './pages/Home.jsx'
import Map_page from './pages/Map_page.jsx'
import DirectoryPage from './pages/DirectoryPage.jsx'
import ResourcesPage from './pages/ResourcesPage.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "directory", element: <DirectoryPage /> },
      { path: "map", element: <Map_page /> },
      { path: "resources", element: <ResourcesPage /> },
    ],
  },

]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)


