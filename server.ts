import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import { searchSong } from "./db.ts";

const app = express()
const PORT = process.env.PORT || 4000
dotenv.config(); 
app.use(cors());

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
    const q:string = "pinkpantheress"; //String(req.query.q || "");
    const token = await getSpotifyToken();
    const r = await fetch(`https://api.spotify.com/v1/search?${new URLSearchParams({ q, type: "playlist", limit: "50" })}`, {
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
    console.log("Category ID:", categoryId); // Debugging line
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

app.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Server is running!' });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})