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
      setPosts([]); 
      const res = await fetch(`/api/posts?client=${targetClient}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro ao carregar");
      setPosts(data.posts || []);
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

  if (loading && posts.length === 0) return <div style={{background: "#000", color: "#fff", height: "100vh", padding: "20px"}}>Carregando...</div>;

  return (
    <div style={{ 
      background: "#000", 
      color: "#fff", 
      minHeight: "100vh", 
      padding: "2px", // Quase sem padding lateral para maximizar o grid
      fontFamily: "sans-serif",
      boxSizing: "border-box",
      width: "100vw",
      overflowX: "hidden"
    }}>
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        maxWidth: "1200px", 
        margin: "8px auto 12px",
        padding: "0 8px"
      }}>
        <h1 style={{ fontSize: "16px", textTransform: "capitalize", margin: 0 }}>{client}</h1>
        <button onClick={() => loadPosts(client)} style={{ 
          background: "#111", 
          color: "#fff", 
          border: "1px solid #333", 
          padding: "4px 10px", 
          borderRadius: "15px", 
          fontSize: "11px"
        }}>refresh</button>
      </header>

      {/* GRID INFALÍVEL PARA 3 COLUNAS */}
      <div style={{ 
        display: "grid", 
        // Força exatamente 3 colunas de mesma largura, sem tamanho mínimo
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))", 
        gap: "1px", // Espaçamento finíssimo como no Instagram
        width: "100%",
        maxWidth: "1200px", 
        margin: "0 auto" 
      }}>
        {posts.map((post) => (
          <div key={post.id} style={{ 
            position: "relative", 
            width: "100%",
            aspectRatio: "1/1", 
            overflow: "hidden", 
            background: "#111"
          }}>
            {post.mediaType === "video" ? (
              <>
                <video 
                  ref={el => videoRefs.current[post.id] = el} 
                  src={post.mediaUrl} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  muted playsInline loop 
                />
                <button onClick={() => toggleVideo(post.id)} style={{ 
                  position: "absolute", top: "50%", left: "50%", 
                  transform: "translate(-50%, -50%)", 
                  background: "rgba(0,0,0,0.4)", color: "#fff", border: "none", 
                  width: "20px", height: "20px", borderRadius: "50%", fontSize: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {playingId === post.id ? "❚❚" : "▶"}
                </button>
              </>
            ) : (
              <img src={post.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            )}
            
            {/* Formato super pequeno para mobile */}
            {post.format && (
              <span style={{ 
                position: "absolute", top: "2px", right: "2px", 
                background: "rgba(0,0,0,0.6)", padding: "1px 4px", 
                borderRadius: "2px", fontSize: "6px", fontWeight: "bold"
              }}>{post.format}</span>
            )}
          </div>
        ))}
      </div>

      <footer style={{ textAlign: "center", marginTop: "20px", opacity: 0.3, fontSize: "7px", paddingBottom: "10px" }}>
        POWERED BY STUDIO2HIGH
      </footer>
    </div>
  );
}