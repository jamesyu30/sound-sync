import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./Navbar.tsx";

export default function SongProfile() {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [songData, setSongData] = useState<any | null>(null);
  
  const params = useParams<Record<string, string | undefined>>();
  const paramId = params.id ?? params.songId ?? null;
  const qs = new URLSearchParams(window.location.search);
  const qsId = qs.get("id") ?? qs.get("songId");
  const lastSegment = window.location.pathname.split("/").filter(Boolean).pop() ?? null;
  const songId = paramId ?? qsId ?? (lastSegment && isNaN(Number(lastSegment)) ? lastSegment : lastSegment);

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!songId) return;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/lyrics?songId=${songId}`);
      const data = await response.json();
      setLyrics(data.lyrics);
    };
    fetchLyrics();
  }, [songId]);

  useEffect(() => {
    const fetchSongData = async () => {
      if (!songId) return;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/songdata?songId=${songId}`);
      const data = await response.json();
      console.log("Fetched song data:", data);
      setSongData(data.data);
    };
    fetchSongData();
  }, [songId]);

  return (
    <>
    <Navbar />
   <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-yellow-300 to-purple-600 opacity-65" />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="relative z-10 text-4xl font-extrabold text-white mb-6 tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 via-pink-50 to-yellow-50">
          Song Profile
        </h1>

         <div className="flex flex-col md:flex-row gap-6 items-start">
           <section className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white shadow-lg w-full md:w-1/4">
            <div className="flex flex-col items-center">
               {songData?.image_url ? (
                <img src={songData?.image_url} alt="Album art" className="w-28 h-28 md:w-36 md:h-36 rounded-lg mb-4" />
              ) : (
                <div className="w-36 h-36 rounded-lg bg-white/20 mb-4 flex items-center justify-center">
                  <span className="text-sm text-white/80">Album art</span>
                </div>
              )}

              <div className="text-center">
                <h2 className="text-lg font-bold">Song info</h2>
                <p className="text-sm text-white/80 mt-2">{songData?.song_name} · {songData?.album_name} · {songData?.release_date}</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="text-sm text-white/80">Artist</div>
              <div className="text-xs text-white/90">{songData?.artist_name ?? "—"}</div>
              <div className="text-sm text-white/80">Song ID</div>
              <div className="text-xs text-white/90">{songId ?? "—"}</div>
              <div className="text-sm text-white/80">Track Duration</div>
              <p className="text-xs text-white/90">{Math.floor(songData?.duration_ms / 60000) ?? "—"}:{(Math.floor(songData?.duration_ms / 1000) % 60).toString().padStart(2, "0") ?? "00"}</p>
              <a href={songData?.spotify_url} className="text-sm text-blue font-bold" target="_blank" rel="noopener noreferrer">Open in Spotify</a>
            </div>
          </section>

          <main className="w-full md:w-2/3 bg-white/10 backdrop-blur-md rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Lyrics</h2>
              <div className="text-sm text-white/80">{lyrics ? "Loaded" : "Loading..."}</div>
            </div>

            <div className="mt-4 max-h-[60vh] md:max-h-[70vh] overflow-auto pr-2">
              {lyrics ? (
                <pre className="whitespace-pre-wrap text-white text-sm">{lyrics}</pre>
              ) : (
                <div className="flex items-center justify-center h-64 text-white/80">
                  Loading lyrics...
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
    </>
  );
}