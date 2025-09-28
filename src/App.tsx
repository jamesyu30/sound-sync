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

      <div className="relative z-10 w-full m-0 px-2 flex flex-col min-h-screen">
        <header className="pt-12 text-center pb-80">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg">
            SoundSync
          </h1>
          <p className="text-white/90 mt-2">
          Discover and share music with SoundSync!
          Explore the latest releases from Spotify, see what the community is talking about, and get song recommendations.
          Click on any song or artist to dive deeper into their profiles and explore related music. Create an account to share your own posts, rate tracks, and join the conversation.
          </p>
        </header>

        <div className="flex-1 flex items-end">
          <div className="w-[90%] bg-gradient-to-b from-purple-100 via-pink-100 to-yellow-100 rounded-xl shadow-2xl p-8 mx-auto min-h-[120vh]">
            <h2 className="text-4xl font-bold text-purple-900 mb-8 text-center">
              Explore
            </h2>
            <section className="flex flex-row justify-around items-start flex-wrap">
              <div className="flex flex-col w-9/20 bg-white rounded-lg p-4 m-2">
                <h3 className="text-xl font-bold text-purple-900 text-center">New Releases</h3>

                {newReleases.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-4 text-center">No new releases available.</p>
                ) : (
                  newReleases.map((data) => (
                    <a key={data.spotify_url ?? data.album_name} href={data.spotify_url ?? ""} target="_blank" rel="noopener noreferrer" className="block">
                    <div className='flex flex-row mt-8 p-4 bg-white/20 backdrop-blur-md border border-black/60 rounded-lg hover:scale-105 transition-transform duration-200 cursor-pointer'>
                      <img src={data.image_url} alt="New Releases" className="w-12 h-12 rounded-lg" />
                      <div className='flex flex-col ml-4'>
                        <span className="text-large text-black font-bold">{data.album_name}</span>
                        <span className="text-base text-gray-400 font-semibold">{data.artist_name}</span>
                      </div>
                      <div className="ml-auto">
                        <span className="text-sm text-black">{data.release_date}</span>
                      </div>
                    </div>
                    </a>
                  )
                  ))
                }

              </div>
              <div className="flex flex-col w-9/20 bg-white rounded-lg p-4 m-2">
                <h3 className="text-xl font-bold text-purple-900 text-center">User Picks</h3>

                {userPicks.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-4 text-center">No user picks available.</p>
                ) : (
                  userPicks.map((pick, index) => (
                    <div key={index} className='flex flex-row mt-8 p-4 bg-white/20 backdrop-blur-md border border-black/60 rounded-lg hover:scale-105 transition-transform duration-200 cursor-pointer'>
                      <div className={`w-12 h-12 flex items-center justify-center rounded-lg outline-1 text-black text-lg font-bold ${ratingBg(pick.avg_rating)}`}>{pick.avg_rating}</div>
                      <div className='flex flex-col ml-4'>
                        <span className="text-large text-black font-bold">
                          <Link to={`/songs/${pick.song_id}`} className='hover:underline'>{pick.song_name}</Link>
                        </span>
                        <span className="text-base text-gray-400 font-semibold">
                          <Link to={`/artists/${pick.artist_id}`} className='hover:underline'>{pick.artist_name}</Link>
                          </span>
                      </div>
                    </div>
                  ))
                )}

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
