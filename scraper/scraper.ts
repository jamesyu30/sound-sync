import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { format } from "fast-csv";
import { fileURLToPath } from "url";

dotenv.config(); 
const app = express()
const PORT = process.env.PORT || 4000
app.use(cors());

let spotifyToken: string | null = null;
let tokenExpiry: number = 0;
const SCRAPE = true; //set to false to skip scraping and just run server

//top 250 spotify genres from https://everynoise.com/everynoise1d.html
const searchTerms: string[] = [
  // "pop",
  // "rap",
  // "rock",
  // "urbano latino",
  // "hip hop",
  // "trap latino",
  // "reggaeton",
  // "dance pop",
  // "pop rap",
  // "modern rock",
  // "pov: indie",
  // "musica mexicana",
  // "latin pop",
  // "classic rock",
  // "filmi",
  // "permanent wave",
  // "trap",
  // "alternative metal",
  // "k-pop",
  // "r&b",
  // "corrido",
  // "canadian pop",
  // "norteno",
  // "sierreno",
  // "album rock",
  // "soft rock",
  // "pop dance",
  // "sad sierreno",
  // "edm",
  // "hard rock",
  // "contemporary country",
  // "mellow gold",
  // "uk pop",
  // "melodic rap",
  // "modern bollywood",
  // "alternative rock",
  // "banda",
  // "post-grunge",
  // "corridos tumbados",
  // "sertanejo universitario",
  // "nu metal",
  // "country",
  // "art pop",
  // "atl hip hop",
  // "urban contemporary",
  // "sertanejo",
  // "southern hip hop",
  // "singer-songwriter",
  // "reggaeton colombiano",
  // "arrocha",
  // "french hip hop",
  // "colombian pop",
  // "alt z",
  // "country road",
  // "mexican pop",
  // "canadian hip hop",
  // "j-pop",
  // "indonesian pop",
  // "singer-songwriter pop",
  // "ranchera",
  // "new wave pop",
  // "indietronica",
  // "german hip hop",
  // "pop urbaine",
  // "rock en espanol",
  // "latin alternative",
  // "gangster rap",
  // "soul",
  // "k-pop boy group",
  // "latin arena pop",
  // "chicago rap",
  // "italian pop",
  // "heartland rock",
  // "k-pop girl group",
  // "agronejo",
  // "modern country pop",
  // "electro house",
  // "latin hip hop",
  // "canadian contemporary r&b",
  // "pop punk",
  // "neo mellow",
  // "pop rock",
  // "latin rock",
  // "punjabi pop",
  // "rap metal",
  // "trap argentino",
  // "new romantic",
  // "new wave",
  // "uk dance",
  // "slap house",
  // "modern alternative rock",
  // "indie pop",
  // "indie rock",
  // "house",
  // "conscious hip hop",
  // "modern country rock",
  // "east coast hip hop",
  // "folk rock",
  // "metal",
  // "turkish pop",
  // "bedroom pop",
  // "desi pop",
  // "italian hip hop",
  // "hoerspiel",
  // "afrobeats",
  // "adult standards",
  // "post-teen pop",
  // "neo soul",
  // "sped up",
  // "cloud rap",
  // "viral pop",
  // "talent show",
  // "spanish pop",
  // "punk",
  // "alternative r&b",
  // "grupera",
  // "west coast rap",
  // "opm",
  // "boy band",
  // "psychedelic rock",
  // "glam metal",
  // "stomp and holler",
  // "desi hip hop",
  // "ccm",
  // "rage rap",
  // "hip pop",
  // "puerto rican pop",
  // "german pop",
  // "miami hip hop",
  // "argentine rock",
  // "sertanejo pop",
  // "tropical",
  // "glam rock",
  // "funk carioca",
  // "nigerian pop",
  // "argentine hip hop",
  // "dark trap",
  // "latin viral pop",
  // "piano rock",
  // "detroit hip hop",
  // "italian adult pop",
  // "country rock",
  // "underground hip hop",
  // "mexican hip hop",
  // "progressive electro house",
  // "synthpop",
  // "metropopolis",
  // "garage rock",
  // "indie folk",
  // "vocal jazz",
  // "classical",
  // "europop",
  // "progressive house",
  // "art rock",
  // "yacht rock",
  // "mpb",
  // "pagode",
  // "tropical house",
  // "urbano espanol",
  // "chamber pop",
  // "rap francais",
  // "dance rock",
  // "j-rock",
  // "polish hip hop",
  // "sleep",
  // "folk",
  // "anime",
  // "trap brasileiro",
  // "disco",
  // "pluggnb",
  // "british soul",
  // "metalcore",
  // "australian pop",
  // "uk hip hop",
  // "christian music",
  // "gen z singer-songwriter",
  // "electropop",
  // "big room",
  // "forro",
  // "swedish pop",
  // "classic oklahoma country",
  // "reggaeton flow",
  // "pop nacional",
  // "british invasion",
  // "mexican rock",
  // "indie soul",
  // "contemporary r&b",
  // "folk-pop",
  // "white noise",
  // "pagode novo",
  // "soundtrack",
  // "funk metal",
  "grunge",
  "french pop",
  "emo rap",
  "salsa",
  "rain",
  "r&b francais",
  "lgbtq+ hip hop",
  "turkish rock",
  "memphis hip hop",
  "mariachi",
  "brostep",
  "classic soul",
  "funk mtg",
  "trap triste",
  "dirty south rap",
  "melodic metalcore",
  "blues rock",
  "alternative hip hop",
  "melancholia",
  "pop soul",
  "brazilian gospel",
  "outlaw country",
  "orchestral soundtrack",
  "dutch house",
  "turkish hip hop",
  "queens hip hop",
  "christian alternative rock",
  "mandopop",
  "lounge",
  "worship",
  "dfw rap",
  "electronica",
  "pixel",
  "trap italiana",
  "pop reggaeton",
  "new orleans rap",
  "otacore",
  "rock-and-roll",
  "funk",
  "quiet storm",
  "motown",
  "japanese teen pop",
  "brazilian hip hop",
  "gruperas inmortales",
  "kleine hoerspiel",
  "indie poptimism",
  "dream pop",
  "rap conscient",
  "neo-synthpop",
  "funk rock",
  "easy listening",
  "bolero",
  "g funk",
  "barbadian pop",
  "progressive rock",
  "eurodance",
  "hardcore hip hop",
  "bachata",
  // additional general genres
  "reggae",
  "jazz",
  "blues",
  "gospel",
  "techno",
  "trance",
  "drum and bass",
  "ambient",
  "chillout",
  "lo-fi",
  "grime",
  "drill",
  "synthwave",
  "vaporwave",
  "ska",
  "world",
  "video game",
  "new age",
  "dubstep", 
  // moods
  "chill",
  "happy",
  "sad",
  "energetic",
  "romantic",
  "motivational",
  "party",
  "focus",
  "sleep",
  "workout",
  "travel",
  "summer",
  "winter",
  "fall",
  "spring",
  "morning",
  "night",
  "rainy day",
  "road trip",
  "study",
  "meditation",
  "holiday",
  // time periods
  "60s",
  "70s",
  "80s",
  "90s",
  "2000s",
  "2010s",
  "2020s"
];

const searchTerms2:string[] = [
  "pop",
];

async function getSpotifyToken(): Promise<string | null> {
  const now = Date.now();
  if (spotifyToken && now < tokenExpiry) return spotifyToken;

  const id = process.env.CLIENT_ID!;
  const secret = process.env.CLIENT_SECRET!;
  const authString = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json();
  spotifyToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000; // refresh 1 min early
  return spotifyToken;
}

// search for playlists to get playlist ID
async function searchPlaylists(query: string): Promise<any> {
  const token = await getSpotifyToken();
  const res = await fetch(`https://api.spotify.com/v1/search?${new URLSearchParams({ q: query, type: "playlist", limit: "30" })}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Search request failed: ${res.status}`);
  const data = await res.json();
  const parsed = data?.playlists?.items;
  const playlistIds:string[] = parsed.map((it: any) => [it?.name, it?.id]).filter(Boolean);
  //console.log(playlistIds);
  return playlistIds;
}

// get tracks from a playlist by ID
async function getPlaylistTracks(playlistId: string): Promise<any> {
  const token = await getSpotifyToken();
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Tracks request failed: ${res.status}`);
  const data = await res.json();
  const parsed = Array.isArray(data?.tracks?.items) ? data.tracks.items : [];
  const trackIds: string[] = [];
  for (const it of parsed) {
    const id = it?.track?.id ?? "";
    if (typeof id === "string" && id.trim()) trackIds.push(id.trim());
  }
  return trackIds;
  //return data.tracks.items[0].track.name; //then index , track, name/id
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../data/playlists2.csv");
let totalSongs: number = 0;

async function getAllTracks() {
  const playlistMap = new Map<string, string>(); // id -> name
  for (const term of searchTerms2){
    const playlists = await searchPlaylists(term); // returns [name, id] pairs
    playlists.forEach((p: any) => {
      const [name, id] = p;
      if (id) playlistMap.set(id, name ?? "");
    });
    await sleep(600);
  }
  console.log(`Found ${playlistMap.size} unique playlists.`);
  const writeStream = fs.createWriteStream(filePath);
  const csvStream = format({ headers: ["playlistName", "playlistId", "trackIds"] });
  csvStream.pipe(writeStream);

  try {
    for (const [playlistId, playlistName] of playlistMap) {
      const trackIds = await getPlaylistTracks(playlistId);
      console.log(`Playlist ${playlistId} has ${trackIds.length} tracks.`);
      totalSongs += trackIds.length;
      const validIds = trackIds.filter((t:any) => t && typeof t === "string"); //check for null/undefined
      csvStream.write({ playlistName, playlistId, trackIds: validIds.join(";") });
      await sleep(600);
    }
  } finally {
    csvStream.end();
  }

  // wait until file is fully written
  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });

  console.log(`Wrote CSV to ${filePath}`);
  console.log(`Total songs across all playlists: ${totalSongs}`);
}

app.get("/playlists", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) return res.status(400).send("Missing query param q");

  try {
    const playlistIds = await searchPlaylists(query);
    res.json({ playlistIds });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching playlists");
  }
});

app.get("/playlists/tracks", async (req: Request, res: Response) => {
  const testId:string = "7jbNlZvovUBwW4W75lsl0V"; // example playlist ID
  try {
    const tracks = await getPlaylistTracks(testId);
    res.json({ tracks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching playlist tracks");
  }
});

//PROCESS FOR GETTING DATA
// searchplaylists with genres/other qualifiers to get playlist IDs
// call gettracks with each playlist ID to get track IDs
// ??? (maybe: flatten the array of track IDs and remove duplicates)
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

if(SCRAPE) getAllTracks().catch(err => console.error("getAllTracks error:", err));