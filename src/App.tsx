import { useState, useEffect } from 'react'
import Navbar from './Components/Navbar.tsx'
import { Link } from 'react-router-dom'

function App() {
  const [newReleases, setNewReleases] = useState<{album_name: string, artist_name: string, release_date: string, spotify_url: string, image_url: string}[]>([])
  const [userPicks, setUserPicks] = useState<{song_id: number, avg_rating: number, song_name: string, artist_name: string, artist_id: string}[]>([])

  

useEffect(() => {
  const fetchNewReleases = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/newreleases`)
    const data = await response.json()
    setNewReleases(data.filtered || [])
  }
  fetchNewReleases()
}, [])

  useEffect(() => {
    const fetchUserPicks = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/getuserpicks`)
      const data = await response.json()
      //console.log("User Picks:", data)
      setUserPicks(data.songData || [])
    }

    fetchUserPicks()
  }, [])

  const redBackground = "bg-red-200 opacity-95";
  const orangeBackground = "bg-orange-200 opacity-95";
  const yellowBackground = "bg-yellow-200 opacity-95";
  const greenBackground = "bg-green-200 opacity-95";
  const blueBackground = "bg-blue-200 opacity-95";

  const ratingBg = (r: number) : string => {
    if (r <= 2.5) return redBackground;
    if (r <= 4) return orangeBackground;
    if (r <= 6.5) return yellowBackground;
    if (r <= 9) return greenBackground;
    return blueBackground;
  };

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-yellow-300 to-purple-600 z-0" />

      <div className="relative z-10 w-full m-0 px-4 flex flex-col min-h-screen">
        <header className="pt-12 text-center pb-60">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg">
            SoundSync
          </h1>
          <p className="mt-4 mx-auto max-w-3xl text-center px-4 py-3 text-white/90 leading-relaxed md:leading-8 text-sm md:text-base lg:text-lg tracking-wide font-medium">
          Discover and share music with SoundSync!
          Explore the latest releases from Spotify, see what the community is talking about, and get song recommendations.
          Click on any song or artist to dive deeper into their profiles and explore related music. Create an account to share your own posts, rate tracks, and join the conversation.
          </p>
        </header>

        <div className="flex-1 flex items-start pb-10">
          <div className="w-full max-w-5xl bg-gradient-to-b from-purple-100 via-pink-100 to-yellow-100 rounded-xl shadow-2xl p-6 md:p-8 mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-6 text-center">
              Explore
            </h2>
            <section className="flex flex-col md:flex-row md:justify-between gap-6">
              <div className="w-full md:w-[48%] bg-white rounded-lg p-4">
                <h3 className="text-lg md:text-xl font-bold text-purple-900 text-center">New Releases</h3>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-auto pr-2">
                  {newReleases.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-4 text-center">No new releases available.</p>
                  ) : newReleases.map((data) => (
                    <a key={data.spotify_url ?? data.album_name} href={data.spotify_url ?? ""} target="_blank" rel="noopener noreferrer" className="block">
                      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3 p-3 bg-white/20 backdrop-blur-md border border-black/10 rounded-lg hover:scale-101 transition-transform duration-150'>
                        <img src={data.image_url} alt="New Releases" className="w-14 h-14 sm:w-12 sm:h-12 rounded-lg flex-shrink-0 object-cover" />
                        <div className='flex-1 min-w-0'>
                          <div className="text-sm md:text-base text-black font-bold truncate">{data.album_name}</div>
                          <div className="text-xs md:text-sm text-gray-500 truncate mt-1">{data.artist_name}</div>
                        </div>
                        <div className="text-xs text-gray-600 hidden sm:block">{data.release_date}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-[48%] bg-white rounded-lg p-4">
                <h3 className="text-lg md:text-xl font-bold text-purple-900 text-center">User Picks</h3>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-auto pr-2">
                  {userPicks.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-4 text-center">No user picks available.</p>
                  ) : userPicks.map((pick, index) => (
                    <Link key={index} to={`/songs/${pick.song_id}`} className="block" >
                      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3 p-3 bg-white/20 backdrop-blur-md border border-black/10 rounded-lg hover:scale-101 transition-transform duration-150'>
                        <div className={`w-12 h-12 flex items-center justify-center rounded-lg text-black text-sm font-bold ${ratingBg(pick.avg_rating)}`}>{pick.avg_rating}</div>
                        <div className='flex-1 min-w-0'>
                          <div className="text-sm md:text-base text-black font-bold truncate">{pick.song_name}</div>
                          <div className="text-xs md:text-sm text-gray-500 truncate mt-1">
                            <Link to={`/artists/${pick.artist_id}`} className='hover:underline text-gray-500'>{pick.artist_name}</Link>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default App
