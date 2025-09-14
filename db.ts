import dotenv from 'dotenv';
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

async function initializeDatabase() {
  try {
    await createSongTable();
    await createPlaylistTable();
    await createPairTable();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

async function insertSong(songId: string): Promise<number | null> {
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

async function insertPlaylistSongs(playlistId: string): Promise<void> {
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

async function getSongId(id: string): Promise<number | null> {
    try{
        const res = await pool.query('SELECT song_id FROM songs WHERE id = $1', [id]);
        return res.rows && res.rows[0] ? (res.rows[0].song_id as number) : null;
    } catch (error) {
        console.error('Error fetching song ID:', error);
        return null;
    }
}

async function getIdFromSong(songId: string): Promise<number | null> {
    try{
        const res = await pool.query('SELECT id FROM songs WHERE song_id = $1', [songId]);
        return res.rows && res.rows[0] ? (res.rows[0].id as number) : null;
    } catch (error) {
        console.error('Error fetching ID from song:', error);
        return null;
    }
}

async function insertPlaylist(playlistName: string, playlistId: string, trackIds: string[]): Promise<number | null> {
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

async function addPairs(songIds: number[]): Promise<void> {
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

async function getCooccurrences(songId: number): Promise<any> {
    try{
        const res = await pool.query(`SELECT count FROM song_pairs WHERE song1_id = $1 OR song2_id = $1`, [songId]);
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

//dropPlaylist();
//initializeDatabase();
//listTables();
//checkPlaylists();
//getPlaylistsLength();
//insertIntoSongs();
getNumberOfSongs();

export { insertSong, getSongId, getIdFromSong, insertPlaylist, addPairs, getCooccurrences };
