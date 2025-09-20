import dotenv from 'dotenv';
import { get } from 'http';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined,
});

pool.on('connect', () => {
  //console.log('Connected to the database');
});

async function createPairTable(){
    await pool.query(`CREATE TABLE IF NOT EXISTS song_pairs (
    song1_id INTEGER NOT NULL REFERENCES songs(id),
    song2_id INTEGER NOT NULL REFERENCES songs(id),
    count INT NOT NULL DEFAULT 1,
    PRIMARY KEY (song1_id, song2_id),
    CHECK (song1_id < song2_id)
)`)
}

async function createPlaylistTable(){
    await pool.query(`CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        playlist_name TEXT NOT NULL,
        playlist_id TEXT UNIQUE NOT NULL,
        track_ids TEXT[] NOT NULL
    )`)
}

async function createSongTable(){
    await pool.query(`CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        song_id TEXT UNIQUE NOT NULL
        )`)
}

async function createSpotifyTable(){
    await pool.query(`CREATE TABLE IF NOT EXISTS spotify_songs (
        song_name TEXT NOT NULL,
        song_id INTEGER NOT NULL UNIQUE REFERENCES songs(id),
        spotify_id TEXT UNIQUE NOT NULL,
        artist_name TEXT NOT NULL,
        artist_id TEXT NOT NULL,
        album_name TEXT NOT NULL
    )`)
}

async function initializeDatabase() {
  try {
    await createSongTable();
    await createPlaylistTable();
    await createPairTable();
    await createSpotifyTable();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export async function insertSong(songId: string): Promise<number | null> {
  try {
    const res = await pool.query(
      'INSERT INTO songs (song_id) VALUES ($1) ON CONFLICT (song_id) DO NOTHING RETURNING id',
      [songId]
    );
    if (res.rows && res.rows[0]) return res.rows[0].id as number;
    // already existed —> fetch id
    const r2 = await pool.query('SELECT id FROM songs WHERE song_id = $1', [songId]);
    return r2.rows && r2.rows[0] ? (r2.rows[0].id as number) : null;
  } catch (error) {
    console.error('Error inserting song:', error);
    return null;
  }
}

export async function insertPlaylistSongs(playlistId: string): Promise<void> {
    try {
        const res = await pool.query('SELECT track_ids FROM playlists WHERE playlist_id = $1', [playlistId]);
        //console.log("RES:", typeof res.rows[0].track_ids);

        if (!res.rows.length || res.rows[0].track_ids.length === 0) {
            console.log(`No tracks found for playlist ${playlistId}`);
            return;
        }

        const trackIds: string[] = res.rows[0].track_ids || [];
        const values = trackIds.map((t: any) => String(t).trim()).filter(Boolean);

        await pool.query(
            `INSERT INTO songs (song_id)
            SELECT unnest($1::text[])
            ON CONFLICT (song_id) DO NOTHING`,
            [values]
        );
    }catch (error) {
        console.error('Error fetching playlist songs:', error);
    }
}

//internal id to spotify song id
export async function getSongId(id: number): Promise<number | null> {
    try{
        const res = await pool.query('SELECT song_id FROM songs WHERE id = $1', [id]);
        return res.rows && res.rows[0] ? (res.rows[0].song_id as number) : null;
    } catch (error) {
        console.error('Error fetching song ID:', error);
        return null;
    }
}

//spotify song id to internal id
export async function getIdFromSong(songId: string): Promise<number | null> {
    try{
        const res = await pool.query('SELECT id FROM songs WHERE song_id = $1', [songId]);
        return res.rows && res.rows[0] ? (res.rows[0].id as number) : null;
    } catch (error) {
        console.error('Error fetching ID from song:', error);
        return null;
    }
}

export async function insertPlaylist(playlistName: string, playlistId: string, trackIds: string[]): Promise<number | null> {
    try{
        const res = await pool.query(
            'INSERT INTO playlists (playlist_name, playlist_id, track_ids) VALUES ($1, $2, $3) RETURNING id',
            [playlistName, playlistId, trackIds]
        );
        return res.rows && res.rows[0] ? (res.rows[0].id as number) : null;
    }catch(error){
        //console.error('Error inserting playlist:', error);
        return null;
    }
}

export async function addPairs(songIds: number[]): Promise<void> {
    if (songIds.length < 2) return; // need at least 2 songs to create a pair
    const pairs: number[][] = [];
    for (let i:number = 0; i < songIds.length; i++) {
        for (let j:number = i + 1; j < songIds.length; j++) {
        const [firstId, secondId] = songIds[i] < songIds[j]
            ? [songIds[i], songIds[j]]
            : [songIds[j], songIds[i]];
        pairs.push([firstId, secondId]);
        }
    }
    const params: string[] = []; //($1, $2), ($3, $4), ...
    const values: number[] = []; //song id values
    let paramIndex:number = 1;

    for (const [a, b] of pairs) {
        params.push(`($${paramIndex}, $${paramIndex + 1})`);
        values.push(a, b);
        paramIndex += 2;
    }

    try {
        const query = `
        INSERT INTO song_pairs (song1_id, song2_id)
        VALUES ${params.join(', ')}
        ON CONFLICT (song1_id, song2_id)
        DO UPDATE SET count = song_pairs.count + 1;
        `;
        await pool.query(query, values);
    } catch (error) {
        console.error('Error adding song pair:', error);
    }
}

 export async function getCooccurrences(songId: number, limit: number = 15): Promise<any> {
    try{
        const res = await pool.query(`SELECT song1_id, song2_id, count FROM song_pairs WHERE song1_id = $1 OR song2_id = $1 ORDER BY count DESC LIMIT $2`, [songId, limit]);
        return res.rows;
    } catch (error) {
        console.error('Error fetching co-occurrences:', error);
        return null;
    }
}

async function listTables() {
  const res = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public';
  `);
  console.log('Tables:', res.rows.map(r => r.table_name));
}

async function checkPlaylists() {
  const res = await pool.query('SELECT * FROM playlists WHERE playlist_id = $1', ['7bfyBCaVhnd8OywuUVKlhN']);
  console.log('Playlists:', res.rows);
}

async function getPlaylistsLength() {
  const res = await pool.query('SELECT * FROM playlists');
  console.log('Number of playlists:', res.rows.length);
  return res.rows.length;
}

async function dropPlaylist() {
    await pool.query('DROP TABLE IF EXISTS playlists');
}

async function dropSong() {
    await pool.query('DROP TABLE IF EXISTS songs');
}

async function dropPairs() {
    await pool.query('DROP TABLE IF EXISTS song_pairs');
}

async function dropSpotify() {
    await pool.query('DROP TABLE IF EXISTS spotify_songs');
}

async function getPlaylistIds(): Promise<string[]> {
    const res = await pool.query('SELECT playlist_id FROM playlists');
    return res.rows.map(row => row.playlist_id);
}

async function insertIntoSongs(): Promise<void> {
    const playlistIds = await getPlaylistIds();
    for (const pid of playlistIds) {
        await insertPlaylistSongs(pid);
    }
    console.log("Done inserting songs from playlists");
}

async function getNumberOfSongs(): Promise<void> {
    const res = await pool.query('SELECT COUNT(*) FROM songs');
    console.log("Number of songs in database:", res.rows[0].count);
}

async function createCooccurrence(){
    const res = await pool.query('SELECT track_ids FROM playlists');
    for(const t of res.rows){
        const trackIds: string[] = t.track_ids || [];
        const songIds: number[] = [];
        for(const tid of trackIds){
            const sid = await getIdFromSong(tid);
            if(sid) songIds.push(sid);
        }
        await addPairs(songIds);
    }
}

export async function getCooccurrencesBySongId(songId: string, limit: number): Promise<any> {
    const res = await getIdFromSong(String(songId)); // get internal DB id
    if(!res) {
        console.log(`Song ID ${songId} not found in database.`);
        return;
    }
    const cooccurrences = await getCooccurrences(res, limit);
    const playlistData = [];
    if(cooccurrences){
        for(const row of cooccurrences){
          if(row.song1_id === res){
            const songData = await pool.query('SELECT * FROM spotify_songs WHERE song_id = $1', [row.song2_id]);
            if(songData.rows && songData.rows[0]){
              playlistData.push({
                song_id: songData.rows[0].song_id,
                spotify_id: songData.rows[0].spotify_id,
                song_name: songData.rows[0].song_name,
                artist_name: songData.rows[0].artist_name,
                album_name: songData.rows[0].album_name,
                count: row.count
              });
            }
          }else{
            const songData = await pool.query('SELECT * FROM spotify_songs WHERE song_id = $1', [row.song1_id]);
            if(songData.rows && songData.rows[0]){
              playlistData.push({
                song_id: songData.rows[0].song_id,
                spotify_id: songData.rows[0].spotify_id,
                song_name: songData.rows[0].song_name,
                artist_name: songData.rows[0].artist_name,
                album_name: songData.rows[0].album_name,
                count: row.count
              });
            }
          }
        }
    }
    //console.log(`Co-occurrences for song ID ${songId}:`, cooccurrences);
    return playlistData;
}

async function songPairsLength(): Promise<void> {
    const res = await pool.query('SELECT count(*) FROM song_pairs');
    console.log("Number of song pairs in database:", res.rows[0].count);
}

async function checkSongs(){
    const res = await pool.query('SELECT * FROM songs WHERE id < $1 ORDER BY id DESC LIMIT 40', [100000000]);
    console.log('Songs:', res.rows);
}

export async function getSongsAfter(lastId: number | null, pageSize = 50) {
  if (lastId == null) {
    const res = await pool.query(
      'SELECT id, song_id FROM songs ORDER BY id ASC LIMIT $1',
      [pageSize]
    );
    return res.rows;
  } else {
    const res = await pool.query(
      'SELECT id, song_id FROM songs WHERE id > $1 ORDER BY id ASC LIMIT $2',
      [lastId, pageSize]
    );
    return res.rows;
  }
}

export async function insertSpotifySongs(records: {
  songName: string;
  songId: number;
  spotifyId: string;
  artistName: string;
  artistId: string;
  albumName: string;
}[]): Promise<void> {
  if (!records || records.length === 0) return;

  const songNames = records.map(r => r.songName);
  const songIds = records.map(r => r.songId);
  const spotifyIds = records.map(r => r.spotifyId);
  const artistNames = records.map(r => r.artistName);
  const artistIds = records.map(r => r.artistId);
  const albumNames = records.map(r => r.albumName);

  const query = `
    INSERT INTO spotify_songs (song_name, song_id, spotify_id, artist_name, artist_id, album_name)
    SELECT song_name, song_id, spotify_id, artist_name, artist_id, album_name
    FROM UNNEST($1::text[], $2::int[], $3::text[], $4::text[], $5::text[], $6::text[])
      AS t(song_name, song_id, spotify_id, artist_name, artist_id, album_name)
    ON CONFLICT (spotify_id) DO NOTHING
  `;

  try {
    await pool.query(query, [songNames, songIds, spotifyIds, artistNames, artistIds, albumNames]);
  } catch (error) {
    console.error('Error inserting spotify songs bulk:', error);
    throw error;
  }
}

async function checkSpotifySongs() {
    const res = await pool.query('SELECT * FROM spotify_songs WHERE song_id < $1 ORDER BY song_id DESC LIMIT 5', [100000000]);
    console.log('Spotify Songs:', res.rows);
}

async function spotifyLength() {
    const res = await pool.query('SELECT count(*) FROM spotify_songs');
    console.log("Number of spotify songs in database:", res.rows[0].count);
}

async function getPlaylistFromTrack(songId: string): Promise<string[]> {
    const res = await pool.query('SELECT playlist_name FROM playlists WHERE $1 = ANY(track_ids)', [songId]);
    return res.rows.map(row => row.playlist_name);
}

async function songsLength() {
  const res = await pool.query('SELECT count(*) FROM songs');
  console.log("Number of songs in database:", res.rows[0].count);
}

export async function findSongsMissingInSpotify(limit = 170) {
  const totalRes = await pool.query(`
    SELECT COUNT(*) AS cnt
    FROM songs s
    LEFT JOIN spotify_songs ss ON s.id = ss.song_id
    WHERE ss.song_id IS NULL
  `);
  const totalMissing = Number(totalRes.rows[0].cnt);

  const sampleRes = await pool.query(
    `SELECT s.id, s.song_id FROM songs s
     LEFT JOIN spotify_songs ss ON s.id = ss.song_id
     WHERE ss.song_id IS NULL
     ORDER BY s.id ASC
     LIMIT $1`,
    [limit]
  );

  console.log(`Missing spotify metadata: ${totalMissing} (returning sample ${sampleRes.rows.length})`);
  return { totalMissing, sample: sampleRes.rows };
}

export async function searchSong(query: string, limit = 15): Promise<any[]> {
  if (!query || !query.trim()) return [];

  const prefix = `${query}%`;
  const any = `%${query}%`;

  const res = await pool.query(
    `
    SELECT DISTINCT ON (lower(song_name))
      song_name,
      song_id,
      spotify_id,
      artist_name,
      artist_id,
      album_name,
      (artist_name || ' - ' || song_name) AS display,
      (
        (lower(artist_name || ' - ' || song_name) = lower($1))::int * 120 + 
        ((artist_name || ' - ' || song_name) ILIKE $2)::int * 80 +          
        (song_name ILIKE $2)::int * 50 +                                   
        (artist_name ILIKE $2)::int * 30 +                                
        (song_name ILIKE $3)::int * 20 +                                   
        (artist_name ILIKE $3)::int * 10 +                                  
        COALESCE(similarity(lower(artist_name || ' - ' || song_name), lower($1)), 0) * 5
      ) AS score
    FROM spotify_songs
    WHERE
      (artist_name || ' - ' || song_name) ILIKE $3
      OR song_name ILIKE $3
      OR artist_name ILIKE $3
    ORDER BY
      lower(song_name), 
      score DESC,
      artist_name,
      song_name
    LIMIT $4
    `,
    [query, prefix, any, limit]
  );

  return res.rows;
}

async function installExtensions() {
  try{
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  } catch (error) {
    console.error('Error installing extensions:', error);
  }
}

//installExtensions();
//checkSongs();
//findSongsMissingInSpotify().then(data => console.log(data.sample)).catch(console.error);
//console.log(await checkSongs());
//dropSpotify();
//spotifyLength();
//songsLength();
//checkSpotifySongs();
//getPlaylistFromTrack("6Z03HkKGowA3CgWZjuTDi6").then(data => console.log(data)).catch(console.error);
//console.log(await getSongId(220744));
//dropPlaylist();
//initializeDatabase();
//listTables();
//createSpotifyTable();
//checkPlaylists();
//getPlaylistsLength();
//insertIntoSongs();
//getNumberOfSongs(); //310431 unique songs
//createCooccurrence();
//songPairsLength(); //19761999 song pairs

// const data = await getCooccurrencesBySongId("3Dv1eDb0MEgF93GpLXlucZ", 50);
// if (!data || data.length === 0) {
//   console.log("No co-occurrences found");
// } else {
//   const row = data[0]; // data is an array of rows
//   // await getSongId since it returns a Promise
//   const songA = await getSongId(row.song1_id);
//   const songB = await getSongId(row.song2_id);
//   console.log("data:", songA, songB, row.count);
// }
