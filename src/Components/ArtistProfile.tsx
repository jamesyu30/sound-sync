import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./Navbar.tsx";

export default function ArtistProfile() {
  const { artistId } = useParams();
  const [artistData, setArtistData] = useState<{name: string, genres: string[], followers: string, image_url: string | null, spotify_url: string | null, popularity: number | null, id: string | null} | null>(null);
  const [topTracks, setTopTracks] = useState<{song_name: string, album_name: string, release_date: string, image_url:string, artists: string, duration_ms: number, spotify_url: string}[] | null>(null);

  useEffect(() => {
    const fetchArtistData = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/artistdata?artistId=${artistId}`);
      const data = await response.json();
      console.log("Fetched artist data:", data);
      setArtistData(data.data);
    };

    fetchArtistData();
  }, [artistId]);

  useEffect(() => {
    const fetchTopTracks = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/toptracks?artistId=${artistId}`);
      const data = await response.json();
      console.log("Fetched top tracks:", data);
      setTopTracks(data.filtered);
    };

    fetchTopTracks();
  }, [artistId]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-yellow-300 to-purple-600 opacity-85 z-0" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
          <header className="mb-6">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">Artist Profile</h1>
            <p className="text-white/90 mt-1">Overview and top tracks</p>
          </header>

          <div className="flex flex-col md:flex-row gap-6">
            <aside className="md:w-1/3 bg-white/10 backdrop-blur-md rounded-xl p-6 text-white shadow-lg">
              <div className="flex flex-col items-center">

                {artistData?.image_url ? (
                  <img src={artistData?.image_url} alt="Artist" className="w-40 h-40 rounded-lg mb-4" />
                ) : ( 
                  <div className="w-40 h-40 rounded-lg bg-white/20 mb-4 flex items-center justify-center">
                    <span className="text-sm text-white/80">Artist Image</span>
                  </div>
                )}

                <h2 className="text-xl font-bold text-white text-center">{artistData?.name}</h2>
                <div className="text-sm text-white/80 mt-2">{artistData?.followers || "—"} followers</div>

                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {artistData?.genres.map((genre) => (
                    <span key={genre} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-sm text-white/80">
                <h3 className="font-semibold mb-2">ID</h3>
                <p className="">{artistData?.id || "No ID available."}</p>
              </div>

              <a href={artistData?.spotify_url || "#"} className="block mt-4 text-base text-white/80 hover:underline font-bold" target="_blank" rel="noopener noreferrer">
                Open in Spotify
              </a>
            </aside>

            <main className="md:w-2/3 bg-white/10 backdrop-blur-md rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold">Top Tracks</h3>
                <div className="text-sm text-white/80">{topTracks?.length || 0} tracks</div>
              </div>

              <div className="mt-4 space-y-3">
                {topTracks?.map((track) => (
                  <a key={track.spotify_url ?? track.album_name} href={track.spotify_url ?? ""} target="_blank" rel="noopener noreferrer" className="block">
                  <div
                    key={track.spotify_url}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor:pointer"
                  >
                    {track.image_url ? (
                      <img src={track.image_url} alt={track.song_name} className="w-14 h-14 rounded-md" />
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-white/20" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-white">{track.song_name}</div>
                      <div className="text-sm text-white/80 truncate mt-1">{track.album_name} • {track.artists}</div>
                    </div>
                    <div className="ml-4 text-sm text-white/80">{Math.floor(track.duration_ms / 60000)} : {String(Math.floor((track.duration_ms / 1000) % 60)).padStart(2, '0')}</div>
                  </div>
                  </a>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}