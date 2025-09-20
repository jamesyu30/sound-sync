import Select from 'react-select'
import { useState, useEffect, useRef } from 'react';
import music_background from '../assets/music_background.jpg';

export default function SongPage() {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [query, setQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [spotifyId, setSpotifyId] = useState<string | null>(null);
  const [songId, setSongId] = useState<string | null>(null);
  const [recData, setRecData] = useState<any | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  let count: number = 0;

  useEffect(() => {
    const getSongs = async () => {
        if (query){
            setIsLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/searchsongs?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            const searchResults = data.result.map((song: any) => ({ value: [song.song_id, song.spotify_id], label: song.artist_name + " - " + song.song_name }));
            setOptions(searchResults);
            setIsLoading(false);
        }
    }
    getSongs();
  }, [query]);

  useEffect(() => {
    const fetchCooccurrences = async () => {
      if (songId) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/cooccurrences?songId=${encodeURIComponent(songId)}`);
          const data = await response.json();
          console.log("Co-occurrences data:", data);
          setRecData(data.cooccurrences);
        } catch (error) {
          console.error("Error fetching co-occurrences:", error);
        }
      }
    };
    fetchCooccurrences();
  }, [songId]);

  useEffect(() => {
    if (recData && Array.isArray(recData) && recData.length > 0) {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [recData]);

  const handleInputChange = (inputValue: string) => {
    setQuery(inputValue);
  };

  const handleChange = (selectedOption: any) => {
    // console.log("handleChange called with:", selectedOption.value);
    const valid = selectedOption && selectedOption.value;
    setSongId(valid ? selectedOption.value[0] : null);
    setSpotifyId(valid ? selectedOption.value[1] : null);
    setSelectedSong(valid ? selectedOption : null);
    // console.log("Selected option:", valid ? selectedOption : "invalid/cleared");
  }

  return (
    <>
      <section className="flex flex-col items-center">
        {/* background hero — 100% of viewport height */}
        <div
          className="relative w-full h-[100vh] bg-center bg-cover flex items-center justify-start flex-col pt-20 md:pt-28"
          style={{ backgroundImage: `url(${music_background})` }}
        >
         
          <h1 className="relative z-10 text-7xl md:text-7xl font-extrabold text-center leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-500 drop-shadow-lg drop-shadow-purple-600/40">
            Search for a song
          </h1>

          <p className="relative z-10 mt-4 text-sm md:text-lg text-white/90 max-w-2xl text-center pt-8">
            Try "Artist - Song" or just a song name 
          </p>

          <div className="w-full max-w-2xl mt-6 px-4">
          <Select
            className="rounded-lg shadow-lg"
            isSearchable={true}
            options={options}
            onInputChange={handleInputChange}
            onChange={handleChange}
            isLoading={isLoading}
            backspaceRemovesValue={true}
            tabSelectsValue={true}
            loadingMessage={() => "Loading songs..."}
            placeholder="The Weeknd - Blinding Lights"
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "white",
                borderColor: "#ccc",
                color: "black",
                boxShadow: "none",
                padding: ".5rem", 
                "&:hover": { borderColor: "#888" },
                borderRadius: "10px",
              }),
              placeholder: (base) => ({ ...base, color: "#a2a2a2ff", fontSize: "1.2rem" }),
              menu: (base) => ({ ...base, backgroundColor: "white", border: "1px solid #ccc", zIndex: 20 }),
              option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? "#E6F0FF" : "white", color: "black", cursor: "pointer" }),
              singleValue: (base) => ({ ...base, color: "black" }),
            }}
          />

          <div className="mt-3 text-center">
            <button
              className="px-6 py-3 my-8 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 disabled:opacity-60 text-lg font-semibold shadow-lg w-full md:w-auto transition-transform transform active:scale-95"
              onClick={() => { /* submit handler */ }}
              disabled={isLoading || !selectedSong?.value}
            >
              {isLoading ? "Searching..." : "Get Recommendations"}
            </button>
          </div>

        </div>

        </div>

      </section>
  
      <section className="bg-gradient-to-b from-pink-200 via-purple-300 to-indigo-300 py-12 pt-0">
      <div ref={tableRef} className="max-w-5xl mx-auto p-4">  
      {recData && recData.length > 0 ? (
        <>
          <h2 className="text-4xl font-extrabold mb-4 text-center text-purple-700 pb-8">Songs often played with {selectedSong?.label}</h2>

          <div className="overflow-hidden rounded-lg shadow-lg bg-gradient-to-b from-purple-100 via-pink-100 to-indigo-100">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-200 text-purple-900">
                  <th className="py-3 px-4 text-left">#</th>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Artist</th>
                  <th className="py-3 px-4 text-left">Album</th>
                </tr>
              </thead>

              <tbody>
                {recData.map((data: any, idx: number) => (
                  <tr
                    key={data.song_id}
                    className="odd:bg-purple-50 even:bg-pink-50 hover:bg-indigo-50 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 align-middle">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold">
                        {idx + 1}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle text-purple-800 font-medium">{data.song_name}</td>
                    <td className="py-3 px-4 align-middle text-purple-600">{data.artist_name}</td>
                    <td className="py-3 px-4 align-middle text-purple-500">{data.album_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        songId && <p className="text-center text-gray-600">No co-occurrence data found for this song.</p>
      )}
      </div>
    </section>
    </>
  )
}

