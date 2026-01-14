import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);
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
      setNotConfigured(false);
      const res = await fetch(`/api/posts?client=${targetClient}`);
      const data = await res.json();

      if (data.notConfigured) {
        setNotConfigured(true);
      } else {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error(err);
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

  if (loading && posts.length === 0) {
    return <div style={{ background: "#000", color: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>Carregando...</div>;
  }

  if (notConfigured) {
    return (
      <div style={{ 
        background: "#000", color: "#fff", height: "100vh", display: "flex", 
        flexDirection: "column", alignItems: "center", justifyContent: "center", 
        fontFamily: "sans-serif", textAlign: "center", padding: "40px" 
      }}>
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Widget não configurado 🎨</h2>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "30px", maxWidth: "300px" }}>
          O calendário para <strong>"{client}"</strong> ainda não foi ativado ou o link está incorreto.
        </p>
        <a href="https://wa.me/554884450938?text=Olá! Gostaria de configurar meu widget do Notion." 
           target="_blank" rel="noreferrer" 
           style={{ 
             background: "#fff", color: "#000", padding: "12px 24px", 
             borderRadius: "25px", fontSize: "13px", fontWeight: "bold", textDecoration: "none" 
           }}>
          Contratar este Widget
        </a>
        <footer style={{ marginTop: "60px", opacity: 0.2, fontSize: "8px", letterSpacing: "2px" }}>STUDIO2HIGH</footer>
      </div>
    );
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "2px", fontFamily: "sans-serif", width: "100vw", overflowX: "hidden" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "8px auto 12px", padding: "0 8px" }}>
        <h1 style={{ fontSize: "16px", textTransform: "capitalize", margin: 0, fontWeight: "500" }}>{client}</h1>
        <button onClick={() => loadPosts(client)} style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: "4px 12px", borderRadius: "15px", fontSize: "11px", cursor: "pointer" }}>refresh</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1px", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
        {posts.map((post) => (
          <div key={post.id} style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#111" }}>
            {post.mediaType === "video" ? (
              <>
                <video ref={el => videoRefs.current[post.id] = el} src={post.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline loop />
                <button onClick={() => toggleVideo(post.id)} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.4)", color: "#fff", border: "none", width: "30px", height: "30px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  {playingId === post.id ? "❚❚" : "▶"}
                </button>
              </>
            ) : (
              <img src={post.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            )}
            {post.format && (
              <span style={{ position: "absolute", top: "5px", right: "5px", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: "4px", fontSize: "8px", fontWeight: "bold" }}>{post.format}</span>
            )}
          </div>
        ))}
      </div>
      <footer style={{ textAlign: "center", marginTop: "40px", opacity: 0.3, fontSize: "8px", paddingBottom: "20px", letterSpacing: "1px" }}>POWERED BY STUDIO2HIGH</footer>
    </div>
  );
}