import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { searchSong, getCooccurrencesBySongId, getSongDataBySongId, getSongId, getSongNameFromId, createPost, getPosts, addCommentToPost, getCommentsFromPost, getSongRatings, updateUserPicks, createUser, validateLogin } from "./db.js";
dotenv.config();

const app = express()
const PORT = process.env.PORT || 4000

const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)
  .map(u => {
    try { return new URL(u).origin; } catch { return u.replace(/\/$/, ""); }
  });

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    let requestOrigin: string;
    try { requestOrigin = new URL(origin).origin; } catch { requestOrigin = origin.replace(/\/$/, ""); }
    if (ALLOWED_ORIGINS.includes(requestOrigin)) return callback(null, true);
    console.warn("Blocked CORS origin:", origin, "normalized:", requestOrigin);
    return callback(new Error(`CORS origin '${origin}' not allowed`), false);
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","Accept"],
}));

app.use((req, res, next) => {
   if (req.method === "OPTIONS") return res.sendStatus(204);
   next();
});

app.use((req, res, next) => {
  //console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} Origin:${req.headers.origin || "-"}`);
  next();
});

app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error("FATAL: JWT_SECRET is not set in production");
  process.exit(1);
}

async function getSpotifyToken(): Promise<string> {
  const id = process.env.CLIENT_ID!;
  const secret = process.env.CLIENT_SECRET!;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ` + btoa(`${id}:${secret}`),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

// search for playlists to get playlist ID
async function searchPlaylists(query: string): Promise<any> {
  const token:string = await getSpotifyToken();
  const res = await fetch(`https://api.spotify.com/v1/search?${new URLSearchParams({ q: query, type: "playlist", limit: "50" })}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Search request failed: ${res.status}`);
  const data = await res.json();
  const playlistIds:string[] = data.playlists.items.map((item: any) => item.id);
  return playlistIds;
}


app.get("/spotify-search", async (req: Request, res: Response) => {
  try {
    //const q:string = "pinkpantheress";
    const q = String(req.query.q || "");
    const token = await getSpotifyToken();
    const r = await fetch(`https://api.spotify.com/v1/search?${new URLSearchParams({ q, type: "playlist", limit: "5" })}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    const parsed = data.playlists.items[0].id;
    return res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/categories", async (req: Request, res: Response) => {
  try{
    const url:string = 'https://api.spotify.com/v1/browse/categories';
    const token = await getSpotifyToken();
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    res.json(data);
  }catch(err){
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/playlists", async (req: Request, res: Response) => { //ADD :categoryId later
  try{
    //const categoryId = req.params.categoryId;
    const link:string = "https://open.spotify.com/playlist/2mkonkcRXJWDvg2IfnKUne" //PLAYLIST HAS TO BE PUBLIC + NOT OWNED BY SPOTIFY
    let categoryId:string = link.split("/")[4].split("?")[0] || ""; 
    //console.log("Category ID:", categoryId); 
    const url:string = `https://api.spotify.com/v1/playlists/${categoryId}`;
    const token = await getSpotifyToken();
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    res.json({ data });
  }catch(err){
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/searchsongs", async (req: Request, res: Response) => {
const q = String(req.query.q ?? "").trim();
  if (!q) return res.status(400).json({ error: "missing query param q" });
  try {
    const result = await searchSong(q);
    res.json({ result });
  } catch (err: any) {
    console.error("/api/search error:", err);
  }
});

app.get('/getSongName', async (req: Request, res: Response) => {
  const songId = Number(req.query.songId);
  if (!songId) return res.status(400).json({ error: "missing query param songId" });
  try {
    const songName = await getSongNameFromId(songId);
    res.json({ songNames: songName });
  } catch (err: any) {
    console.error("/getSongName error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/makepost", async (req, res) => {
  //console.log("Received /makepost request with body:", req.body);

  const { title, content, author, rating } = req.body;
  const authorId = req.body.author_id ?? null;
  const songId = req.body.songId ?? null;
  const songName = req.body.song_name ?? null;
  const artistName = req.body.artist_name ?? null;

  if (!title || !content || !author || typeof authorId !== "number" || songId != null && (!songName || !artistName)) {
    return res.status(400).json({ error: "missing required fields: title, content, author, or authorId" });
  }

  try {
    await createPost(title, content, author, authorId, Number(rating ?? 0), songId, songName, artistName);
    if (songId != null) {
      await updateUserPicks(songId, Number(rating ?? 0));
    }
    return res.status(201).json({ ok: true, id: null });
  } catch (err: any) {
    console.error("/makepost error:", err);
    return res.status(500).json({ error: String(err?.message ?? "server error") });
  }
});

app.get("/getposts", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  try {
    const posts = await getPosts(q || undefined);
    //console.log("Fetched posts:", posts);
    res.json({ posts });
  } catch (err: any) {
    console.error("/getposts error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/addcomment', async (req, res) => {
  const { postId, author, content, author_id } = req.body;
  if (typeof postId !== "number" || !author || !content || typeof author_id !== "number") {
    return res.status(400).json({ error: "missing required fields: postId, author, content, or authorId" });
  }
  try {
    await addCommentToPost(postId, content, author, author_id);
    return res.status(201).json({ ok: true });
  } catch (err: any) {
    console.error("/addcomment error:", err);
    return res.status(500).json({ error: String(err?.message ?? "server error") });
  }
});

app.get("/getcomments", async (req: Request, res: Response) => {
  const postId = Number(req.query.postId);
  if (isNaN(postId)) return res.status(400).json({ error: "missing or invalid query param postId" });
  try {
    const comments = await getCommentsFromPost(postId);
    res.json({ comments });
  } catch (err: any) {
    console.error("/getcomments error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/cooccurrences", async (req: Request, res: Response) => {
  const songId = String(req.query.songId ?? "").trim();
  //const songId = "3Dv1eDb0MEgF93GpLXlucZ"; //TESTING
  const cooccurrences = await getCooccurrencesBySongId(songId, 15);
  res.json({ cooccurrences });
});

app.get("/api/lyrics", async (req: Request, res: Response) => {
  //console.log("Received /api/lyrics request with query:", req.query);
  const sanitizeSongTitle = (title?: string | null) => {
    if (!title) return title;
    // remove parenthetical featuring info e.g. "Song Title (feat. Artist)" or "(ft Artist)"
    let out = title.replace(/\s*\([^)]*(?:\bfeat\b|\bft\b|\bfeaturing\b)[^)]*\)/gi, "");
    // remove trailing "feat" outside parentheses e.g. "Song Title feat. Artist" or "Song Title ft Artist"
    out = out.replace(/\s*(?:[-–—]\s*)?(?:\bfeat\b|\bft\b|\bfeaturing\b)\.?\s*.*$/i, "");
    // collapse whitespace and trim
    return out.replace(/\s{2,}/g, " ").trim();
  };

  const songId = Number(req.query.songId);
  //console.log("Parsed songId:", songId);
  //const songId = 4877;
  const songData = await getSongDataBySongId(songId);
  //console.log("Song data for lyrics:", songData);
  const song = sanitizeSongTitle(songData?.song_name);
  const artist = songData?.artist_name;
  //console.log(`Fetching lyrics for: ${artist} - ${song}`);
  //const song = "Say So"; 
  //const artist = "Doja Cat"; 
  if (!song || !artist) return res.status(400).json({ error: "missing query params song and/or artist" });
  try {
    const response = await fetch(`https://api.lyrics.ovh/v1/${artist}/${song}`);
    const data = await response.json();
    //console.log("Fetched lyrics data:", data);
    res.json({ lyrics: data.lyrics });
  } catch (err: any) {
    console.error("/api/lyrics error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/songdata", async (req: Request, res: Response) => {
  const token = await getSpotifyToken();
  const songId = Number(req.query.songId);
  //const songId = 4877; //TESTING
  const id = await getSongId(songId);
  //console.log("Mapped songId to Spotify ID:", id);
  if (!songId) return res.status(400).json({ error: "missing query param songId" });
  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    //console.log("Fetched song data:", data);
    const filtered = {
      song_name: data.name,
      artist_name: data.artists.map((artist: any) => artist.name).join(", "),
      album_name: data.album.name,
      release_date: data.album.release_date.split("-")[0],
      spotify_url: data.external_urls.spotify,
      image_url: data.album.images[0]?.url || null,
      duration_ms: data.duration_ms,
      popularity: data.popularity,
    };
    //console.log("Filtered song data:", filtered);
    res.json({ data: filtered });
  } catch (err: any) {
    console.error("/api/songdata error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/artistdata', async (req: Request, res: Response) => {
  const artistId = req.query.artistId;
  if (!artistId) return res.status(400).json({ error: "missing query param artistId" });
  try {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    const filtered = {
      name: data.name,
      genres: data.genres,
      followers: data.followers.total.toLocaleString(`en-US`),
      image_url: data.images[0]?.url || null,
      spotify_url: data.external_urls.spotify,
      popularity: data.popularity,
      id: data.id,
    };

    res.json({ data: filtered });
  } catch (err: any) {
    console.error("/api/artistdata error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/toptracks', async (req: Request, res: Response) => {
  const artistId = req.query.artistId;
  if (!artistId) return res.status(400).json({ error: "missing query param artistId" });
  try {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    const filtered = data.tracks.map((track: any) => ({
      song_name: track.name,
      album_name: track.album.name,
      release_date: track.album.release_date.split("-")[0],
      spotify_url: track.external_urls.spotify,
      image_url: track.album.images[0]?.url || null,
      duration_ms: track.duration_ms,
      artists: track.artists.map((artist: any) => artist.name).join(", "),
    }));
    res.json({ filtered });
  } catch (err: any) {
    console.error("/api/toptracks error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/newreleases', async (req: Request, res: Response) => {
  try{
    const url:string = 'https://api.spotify.com/v1/browse/new-releases?limit=5';
    const token = await getSpotifyToken();
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    const filtered = data.albums.items.map((item: any) => ({
      album_name: item.name,
      artist_name: item.artists.map((artist: any) => artist.name).join(", "),
      release_date: item.release_date,
      spotify_url: item.external_urls.spotify,
      image_url: item.images[0]?.url || null
    }));
    //console.log("New Releases:", filtered);
    res.json({ filtered });
  }catch(err){
    console.error("/api/newreleases error:", err);
  }
});

app.get('/getuserpicks', async (req: Request, res: Response) => {
  const top = 5;
  try {
    const ratings = await getSongRatings(top); 
    const songDetails = await Promise.all(
      ratings.map(async (r: any) => {
        const data = await getSongNameFromId(r.song_id);
        return {
          ...r,
          song_name: data?.song_name ?? "Unknown",
          artist_name: data?.artist_name ?? "Unknown",
          avg_rating: typeof r.avg_rating === "string" ? parseFloat(r.avg_rating) : r.avg_rating,
        };
      })
    );
    res.json({ songData: songDetails });
  } catch (err: any) {
    console.error("/getUserPicks error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'missing username or password' });

  try {
    const id = await createUser(username, password);
    if (id == null) {
      return res.status(409).json({ error: 'username already taken' });
    }
    return res.status(201).json({ id });
  } catch (err: any) {
    console.error('/register error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'missing username or password' });

  try {
    const user = await validateLogin(username, password);
    if (!user) {
      return res.status(401).json({ error: 'invalid username or password' });
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'server misconfigured' });
    }

     const secure = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure,
      sameSite: secure ? "none" as const : "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("session", token, cookieOptions);

    res.json({ ok: true });
  } catch (err: any) {
    console.error('/login error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});

app.get("/user", (req, res) => {
  try {
    const token = req.cookies?.session;
    if (!token) return res.json({ user: null });
    const data = jwt.verify(token, JWT_SECRET!) as any;

    res.json({ user: { id: data.id, username: data.username } });
  } catch (err) {
    return res.json({ user: null });
  }
});

app.post("/logout", (req, res) => {
  const secure = process.env.NODE_ENV === "production";
  res.clearCookie("session", { httpOnly: true, secure, sameSite: secure ? "none" : "lax" });
  res.json({ ok: true });
});

app.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Server is running!' });
});

// serve client build
app.use(express.static(path.join(process.cwd(), "dist", "client")));
app.use((req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "client", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})