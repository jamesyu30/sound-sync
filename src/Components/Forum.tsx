import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import Select from 'react-select'
import { Link } from "react-router-dom"


export default function Forum() {
    const [query, setQuery] = useState("");
    const [songQuery, setSongQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [rating, setRating] = useState<number>(7.5);
    const [songOptions, setSongOptions] = useState<{ value: string; label: string }[]>([]);
    const [selectedSong, setSelectedSong] = useState<number | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [activePostId, setActivePostId] = useState<number | null>(null);
    const [showContent, setShowContent] = useState<boolean>(false);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState("");
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [postingComment, setPostingComment] = useState(false);
    const [newPost, setNewPost] = useState(false);
    
    const [user, setUser] = useState<{ id: number; username: string } | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setAuthLoading(true);
        const res = await fetch(`/user`, { credentials: "include" });
        const body = await res.json();
        setUser(body?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const getSongs = async () => {
      if(showModal && songQuery){
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/searchsongs?q=${encodeURIComponent(songQuery)}`);
            const data = await response.json();
            const searchResults = data.result.map((song: any) => ({ value: [song.song_id, song.spotify_id], label: song.artist_name + " - " + song.song_name }));
            setSongOptions(searchResults);
          } catch {
            setSongOptions([]);
          }
      }
  }
  getSongs();
  }, [songQuery, showModal]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        //console.log("Fetching posts with query:", query);
        setNewPost(false);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/getposts?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        //console.log("Fetched posts data:", data);
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      }
    };
    fetchPosts();
  }, [query, newPost]);

  useEffect(() => {
    const fetchComments = async () => {
      if (activePostId == null) return;
      setCommentsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/getcomments?postId=${encodeURIComponent(activePostId)}`);
        const data = await response.json();
        //console.log("Fetched comments data:", data.comments);
        setComments(data.comments || []);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [activePostId]);

  let color:string = "";
  const redBackground = "bg-red-200 opacity-95";
  const orangeBackground = "bg-orange-200 opacity-95";
  const yellowBackground = "bg-yellow-200 opacity-95";
  const greenBackground = "bg-green-200 opacity-95";
  const blueBackground = "bg-blue-200 opacity-95";

  if (rating <= 2.5) {
    color = redBackground;
  } else if (rating <= 4) {
    color = orangeBackground;
  } else if (rating <= 6.5) {
    color = yellowBackground;
  } else if (rating <= 9) {
    color = greenBackground;
  } else {
    color = blueBackground;
  }

  const openCreate = () => {
    setTitle("");
    setContent("");
    setShowModal(true);
  }; 

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nameResponse = await fetch(`${import.meta.env.VITE_API_URL}/getSongName?songId=${encodeURIComponent(Number(selectedSong))}`);
    const nameData = await nameResponse.json();
    const name = nameData.songNames || "Placeholder Song";
    if (!title.trim() || !content.trim()) return;
    const newPost = {
      title: title.trim(),
      content: content.trim(),
      songId: selectedSong,
      song_name: name.song_name,
      artist_name: name.artist_name,
      author: user?.username,
      author_id: user?.id,
      rating: rating,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/makepost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
        credentials: "include",
      });
      const text = await res.text();
      //console.log("Create post response:", text);
      const body = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(body?.error || "Failed to create post");
      setShowModal(false);
    }catch (err) {
      console.error("Create post failed:", err);
    }finally {
      setNewPost(true);
    }
  };

  const handleInputChange = (inputValue: string) => {
    setSongQuery(inputValue);
  };

   const formatTimeAgo = (iso?: string | null) => {
    if (!iso) return "now";
    const then = new Date(iso);
    const sec = Math.floor((Date.now() - then.getTime()) / 1000);
    if (isNaN(sec) || sec < 0) return "now";
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    const years = Math.floor(days / 365);
    return `${years}y`;
  };

  const ratingBg = (r: number) : string => {
    if (r <= 2.5) return redBackground;
    if (r <= 4) return orangeBackground;
    if (r <= 6.5) return yellowBackground;
    if (r <= 9) return greenBackground;
    return blueBackground;
  };

  const displayContent = (postId: number) => {
    const p = posts.find((x: any) => x.id === postId) ?? null;
    setSelectedPost(p);
    setActivePostId(postId);
    setShowContent(true);
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-yellow-50 to-purple-200 opacity-95 z-0" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
          <header className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900">Community Forum</h1>
            <p className="text-sm text-gray-600 mt-1">Discuss tracks, make recommendations, and share discoveries.</p>
          </header>

          <div className="flex flex-col md:flex-row gap-4 items-start mb-6">
            <div className="flex-1">
              <label className="sr-only">Search posts</label>
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="The Weeknd - Blinding Lights"
                  className="w-full text-black rounded-full border border-gray-200 bg-white/95 px-4 py-2 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                type="button"
                disabled={authLoading || !user}
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium shadow-sm hover:from-purple-700 hover:to-pink-600 transition"
              >
                + Create Post
              </button>
            </div>
          </div>

          <section className="bg-white/95 rounded-xl shadow-md p-4">
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="text-center py-12 text-gray-600">No posts match your search.</div>
              ) : (
                posts.map((post) => (
                  <article
                    key={post.id}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => displayContent(post.id)}
                  >
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-black font-semibold ${ratingBg(post.rating)}`}>
                      {post.rating}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 truncate">
                        <Link to={`/songs/${post.song_id}`} className="hover:underline cursor-pointer">
                          {post.artist_name} - {post.song_name}
                        </Link>
                      </h2>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{post.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">By: {post.author}</p>
                      <p></p>
                    </div>

                     <div className="flex flex-col items-end">
                      <div className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</div>
                      <div className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-200 text-gray-700 text-[1rem]">
                          💬
                        </span>
                        <span className="font-bold">{post.comments_count ?? 0}</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <form
            onSubmit={handleSubmit}
            className="relative z-10 flex flex-col w-[95%] max-w-[60%] h-full max-h-[80vh] bg-white rounded-xl shadow-xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 text-black">Create Post</h2>

            <div className="mt-2 mb-3">
              <label className="text-sm text-black font-medium">Attach song</label>
              <Select
                options={songOptions}
                onInputChange={handleInputChange}
                onChange={(opt: any) => setSelectedSong(opt ? Number(opt.value[0]) : null)}
                placeholder="The Weeknd - Blinding Lights"
                loadingMessage={() => "Loading songs..."}
                isClearable
                required
                styles={{
                  option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? "#E6F0FF" : "white", color: "black", cursor: "pointer" })
                }}
              />
            </div>

            <label className="text-sm text-black font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-black mt-1 mb-3 rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="Short descriptive title"
              autoFocus
              required
            />
            <div className="flex flex-row items-center gap-3">
              <label className="text-sm font-medium text-black">Rating</label>
              <span className={`flex p-1 justify-center items-center w-8 h-6 max-w-10% rounded-md border border-gray-200 text-black ${color}`}>{rating}</span>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={rating}
              onChange={(e) => setRating(parseFloat(e.target.value))}
            />

            <label className="text-sm font-medium text-black">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-black mt-1 mb-4 rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 flex-1 min-h-0 min-h-[160px] resize-none overflow-auto"
              placeholder="Share your thoughts..."
              required
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={authLoading || !user}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 text-white"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {showContent && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setShowContent(false); setSelectedPost(null); }}
          />

          <div className="relative z-10 w-[95%] max-w-4xl max-h-[85vh] bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 flex flex-col h-full">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPost.title ?? "Untitled"}</h2>
                  <div className="text-sm text-gray-600 mt-1">By {selectedPost.author ?? "Unknown"}</div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm text-black font-semibold outline-1 ${ratingBg(selectedPost.rating ?? rating)}`}>
                    { selectedPost.rating }
                  </div>
                </div>
              </header>

              <main className="flex-1 overflow-auto mt-4 pr-2">
                <div className="mb-4 text-sm text-gray-800 whitespace-pre-wrap">{selectedPost.content}</div>

                <section className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Comments</h3>

                  <div className="space-y-3 overflow-auto max-h-48 pr-1">
                    {commentsLoading ? (
                      <div className="text-sm text-gray-500">Loading comments…</div>
                    ) : comments.length === 0 ? (
                      <div className="text-sm text-gray-500">No comments yet — be the first.</div>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id ?? c.tempId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                          <div className="w-9 h-9 rounded-md bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                            { (c.author).charAt(0) }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900">{c.author ?? "Anonymous"}</div>
                              <div className="text-xs text-gray-500">{new Date(c.created_at ?? Date.now()).toLocaleString()}</div>
                            </div>
                            <div className="text-sm text-gray-700 mt-1">{c.content}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </main>

              <footer className="mt-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!commentText.trim()) return;
                    setPostingComment(true);

                    const temp = { tempId: Date.now(), content: commentText.trim(), author: user?.username, created_at: new Date().toISOString() };
                    setComments((c) => [temp, ...c]);
                    setCommentText("");

                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/addcomment`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ postId: selectedPost.id, content: commentText.trim(), author: user?.username, author_id: user?.id }),
                        credentials: "include",
                      });
                      const text = await res.text();
                      const body = text ? JSON.parse(text) : null;
                      if (!res.ok) {
                        console.warn("Add comment failed:", body);
                      } else {
                        if (body?.id) {
                          setComments((prev) => prev.map((it) => (it.tempId === temp.tempId ? { ...temp, id: body.id, created_at: body.created_at ?? temp.created_at } : it)));
                        }
                      }
                    } catch (err) {
                      console.error("add comment error", err);
                    } finally {
                      setPostingComment(false);
                    }
                  }}
                  className="flex gap-3 items-end"
                >
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 text-black rounded-md border border-gray-200 px-3 py-2 min-h-[56px] resize-y focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowContent(false); setSelectedPost(null); }}
                      className="px-4 py-2 rounded-md bg-gray-100 text-gray-700"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={postingComment || authLoading || !user}
                      className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                    >
                      {postingComment ? "Posting…" : "Comment"}
                    </button>
                  </div>
                </form>
              </footer>
            </div>
          </div>
        </div>
      )}

    </>
    );
}