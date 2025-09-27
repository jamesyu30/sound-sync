import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const item = "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150";
  const active = "bg-white/20 text-white backdrop-blur-sm shadow-sm";
  const inactive = "text-white/90 hover:bg-white/10";

  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
      const fetchUser = async () => {
        try {
          setAuthLoading(true);
          const res = await fetch(`/user`, { credentials: "include" });
          const body = await res.json();
          setUser(body?.user ?? null);
        } catch {
          setUser(null);
        } finally {
          setAuthLoading(false);
        }
      };
      fetchUser();
    }, []);

  const handleLogout = async () => {
    try {
      await fetch(`/logout`, {
        method: "POST",
        credentials: "include"
      });
      setUser(null);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="w-full bg-gradient-to-r from-purple-600 to-pink-500">
      <div className="w-full mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center text-white font-extrabold">
            S-S
          </div>
          <div className="text-white">
            <div className="text-lg font-extrabold leading-none">SoundSync</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavLink to="/"
            end
            className={({ isActive }) =>
              `${item} ${isActive ? active : inactive}`
            }
          >
            Home
          </NavLink>

          <NavLink to="/songs"
            className={({ isActive }) =>
              `${item} ${isActive ? active : inactive}`
            }
          >
            Songs
          </NavLink>

          <NavLink to="/discuss"
            className={({ isActive }) =>
              `${item} ${isActive ? active : inactive}`
            }
          >
            Discuss
          </NavLink>
            {user && !authLoading ? (
              <button onClick={handleLogout} className="bg-red-700 text-white px-4 py-2 rounded-md">Logout</button>
            )
            :
            (<NavLink to="/login"
              className="bg-blue-500 text-white px-4 py-2 ml-4 rounded-md hover:bg-blue-600 transition"
            >
              Login
            </NavLink>)
          }
        </div>
      </div>
    </nav>
  );
}