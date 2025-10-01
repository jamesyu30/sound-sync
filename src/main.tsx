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
import ErrorPage from './Components/Error.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />
  },
  {
    path: '/songs',
    element: <SongPage />,
    errorElement: <ErrorPage />
  },
  {
    path: '/songs/:id',
    element: <SongProfile />,
    errorElement: <ErrorPage />
  },
  {
    path: '/artists/:artistId',
    element: <ArtistProfile />,
    errorElement: <ErrorPage />
  },
  {
    path: '/discuss',
    element: <Forum />,
    errorElement: <ErrorPage />
  },
  {
    path: '/login',
    element: <Register />,
    errorElement: <ErrorPage />
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

