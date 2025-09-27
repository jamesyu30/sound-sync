import { useState } from "react";
import Navbar from "./Navbar.tsx";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const [isLogin, setIsLogin] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const tabClass = (active: boolean) =>
      `w-full bg-white text-black font-semibold py-2 relative transition-all duration-200
       focus:outline-none focus-visible:outline-none
       border-b-4 ${active ? "border-b-purple-700" : "border-transparent"}
       ${active ? "shadow-[0_8px_24px_-12px_rgba(124,58,237,0.45)]" : "hover:bg-gray-50"}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const username = (formData.get("username") as string)?.trim() ?? "";
        const password = (formData.get("password") as string) ?? "";
        if (!username || !password) {
          alert("Please provide username and password.");
          return;
        }

        setIsSubmitting(true);
        try {
          const url = `${isLogin ? "/login" : `${import.meta.env.VITE_API_URL}/register`}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password }),
          });
          const body = await res.json().catch(() => ({}));
          if (res.ok) {
            if (isLogin) {
              navigate("/", { replace: true });
            } else {
              setIsLogin(true);
              alert("Registration successful — please log in.");
            }
          } else {
            alert(body?.error ?? "Authentication failed");
          }
        } catch (err) {
          console.error("Auth error:", err);
          alert("Network/server error");
        } finally {
          setIsSubmitting(false);
        }
    };

    return (
        <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-400 via-yellow-300 to-purple-600 p-4">
            <div className="flex flex-col max-w-[40%] w-[40%] max-h-[60%] h-[60%] mx-auto bg-white p-8 rounded-lg shadow-md">

             <div className="flex flex-row mb-6 pt-0 justify-center">
                <button
                  className={tabClass(isLogin)}
                  onClick={() => setIsLogin(true)}
                  title="Login tab"
                >
                  Login
                </button>
                <button
                  className={tabClass(!isLogin)}
                  onClick={() => setIsLogin(false)}
                  title="Register tab"
                >
                  Register
                  </button>
             </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="username" className="block text-sm font-semibold text-black">Username</label>
                    <input name="username" type="text" id="username" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-semibold text-black">Password</label>
                    <input name="password" type="password" id="password" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 text-white font-semibold py-2 rounded-md hover:bg-purple-700 disabled:opacity-60">
                  {isSubmitting ? "Please wait…" : (isLogin ? "Login" : "Register")}
                </button>
            </form>
            </div>
        </div>
        </>
    );
}