import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const item = "px-2 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-150";
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
        <div className="w-full px-0 py-2 sm:py-3 flex items-center">
          <div className="flex items-center gap-3 pl-3 sm:pl-4">
           <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-white/10 flex items-center justify-center text-white font-extrabold text-sm sm:text-base">
             S-S
           </div>
           <div className="text-white">
             <div className="text-base sm:text-lg font-extrabold leading-none">SoundSync</div>
           </div>
         </div>

         <div className="ml-auto flex items-center gap-2 pr-3 sm:pr-4">
           <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? active : inactive}`}>Home</NavLink>
           <NavLink to="/songs" className={({ isActive }) => `${item} ${isActive ? active : inactive}`}>Songs</NavLink>
           <NavLink to="/discuss" className={({ isActive }) => `${item} ${isActive ? active : inactive}`}>Discuss</NavLink>

           {user && !authLoading ? (
             <button onClick={handleLogout} className="bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm">Logout</button>
           ) : (
             <NavLink to="/login" className="bg-blue-500 text-white px-3 py-1 sm:px-4 sm:py-2 ml-2 sm:ml-4 rounded-md hover:bg-blue-600 transition text-sm">Login</NavLink>
           )}
         </div>
       </div>
     </nav>
  );
}