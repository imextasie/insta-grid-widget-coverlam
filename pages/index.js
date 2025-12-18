// pages/index.js
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [client, setClient] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const videoRefs = useRef({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("client") || "coverlam";
    setClient(c.toLowerCase());
    loadPosts(c.toLowerCase());
  }, []);

  async function loadPosts(targetClient) {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts?client=${targetClient}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleVideo = (id) => {
    const vid = videoRefs.current[id];
    if (playingId === id) {
      vid.pause();
      setPlayingId(null);
    } else {
      Object.values(videoRefs.current).forEach(v => v?.pause());
      vid.play();
      setPlayingId(id);
    }
  };

  if (loading) return <div style={{background: "#000", color: "#fff", height: "100vh", padding: "20px"}}>Carregando...</div>;

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "24px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "0 auto 30px" }}>
        <h1 style={{ fontSize: "22px" }}>Insta Widget {client}</h1>
        <button onClick={() => loadPosts(client)} style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: "8px 15px", borderRadius: "20px", cursor: "pointer" }}>refresh</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        {posts.map((post) => (
          <div key={post.id} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "20px", overflow: "hidden", border: "1px solid #222" }}>
            {post.mediaType === "video" ? (
              <>
                <video ref={el => videoRefs.current[post.id] = el} src={post.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline loop />
                <button onClick={() => toggleVideo(post.id)} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", width: "50px", height: "50px", borderRadius: "50%", cursor: "pointer" }}>
                  {playingId === post.id ? "❚❚" : "▶"}
                </button>
              </>
            ) : (
              <img src={post.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            {post.format && (
              <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.7)", padding: "4px 10px", borderRadius: "10px", fontSize: "10px" }}>{post.format}</span>
            )}
          </div>
        ))}
      </div>
      <footer style={{ textAlign: "center", marginTop: "50px", opacity: 0.5, fontSize: "10px" }}>POWERED BY STUDIO2HIGH</footer>
    </div>
  );
}