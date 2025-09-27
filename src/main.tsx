import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import './index.css'
import App from './App.tsx'
import SongPage from './Components/SongPage.tsx';
import SongProfile from './Components/SongProfile.tsx';
import ArtistProfile from './Components/ArtistProfile.tsx';
import Forum from './Components/Forum.tsx';
import Register from './Components/Register.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/songs',
    element: <SongPage />,
  },
  {
    path: '/songs/:id',
    element: <SongProfile />,
  },
  {
    path: '/artists/:artistId',
    element: <ArtistProfile />,
  },
  {
    path: '/discuss',
    element: <Forum />,
  },
  {
    path: '/login',
    element: <Register />
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

