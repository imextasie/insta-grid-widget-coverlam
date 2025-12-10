// pages/index.js
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState(null); // qual vídeo está tocando
  const videoRefs = useRef({}); // refs dos <video> por id

  async function fetchPosts() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/posts");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Erro ao buscar posts");
      }

      const data = await res.json();
      setPosts(data.posts || []);
      setPlayingId(null);
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
      setError(err.message || "Erro inesperado ao carregar posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  // pausa todos os vídeos, opcionalmente exceto um
  function pauseAllVideos(exceptId = null) {
    Object.entries(videoRefs.current).forEach(([id, vid]) => {
      if (!vid) return;
      if (exceptId && id === exceptId) return;
      if (!vid.paused) vid.pause();
    });
  }

  async function toggleVideo(postId) {
    const vid = videoRefs.current[postId];
    if (!vid) return;

    if (!vid.paused) {
      // já está tocando -> pausa
      vid.pause();
      setPlayingId(null);
      return;
    }

    // pausa todos os outros
    pauseAllVideos(postId);

    try {
      await vid.play();
      setPlayingId(postId);
    } catch (err) {
      console.error("Erro ao dar play no vídeo:", err);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
          }}
        >
          widget instagram s2h
        </h1>

        <button
          onClick={fetchPosts}
          disabled={loading}
          style={{
            padding: "8px 18px",
            borderRadius: "999px",
            border: "1px solid #444",
            background: loading ? "#222" : "#111",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            fontSize: "14px",
            transition: "background 0.2s, transform 0.1s",
          }}
        >
          {loading ? "carregando..." : "refresh"}
        </button>
      </header>

      {error && (
        <p
          style={{
            marginBottom: "16px",
            color: "#ff8080",
            fontSize: "14px",
          }}
        >
          {error}
        </p>
      )}

      {posts.length === 0 && !loading && !error && (
        <p style={{ opacity: 0.8 }}>nenhum post encontrado 😶</p>
      )}

      <div
        style={{
          display: "flex",
          gap: "24px",
          flexWrap: "nowrap",
          overflowX: "auto",
          paddingBottom: "16px",
        }}
      >
        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              flex: "0 0 320px",
              height: "480px",
              background:
                "radial-gradient(circle at top, #222 0, #050505 40%, #000 80%)",
              borderRadius: "24px",
              overflow: "hidden",
              border: "1px solid #222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 18px 40px rgba(0,0,0,0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(0,0,0,0.5)";
            }}
          >
            {post.mediaUrl ? (
              post.mediaType === "video" ? (
                <>
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current[post.id] = el;
                    }}
                    src={post.mediaUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    muted
                    playsInline
                    controls={false}
                  />

                  {/* Botão play/pause */}
                  <button
                    type="button"
                    onClick={() => toggleVideo(post.id)}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "60px",
                      height: "60px",
                      borderRadius: "999px",
                      border: "none",
                      background:
                        playingId === post.id
                          ? "rgba(0,0,0,0.4)"
                          : "rgba(0,0,0,0.65)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backdropFilter: "blur(4px)",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.7)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "26px",
                        lineHeight: 1,
                      }}
                    >
                      {playingId === post.id ? "❚❚" : "▶"}
                    </span>
                  </button>
                </>
              ) : (
                <img
                  src={post.mediaUrl}
                  alt={post.title || "post"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )
            ) : (
              <span style={{ opacity: 0.5 }}>sem mídia</span>
            )}

            {/* badge de formato (feed / carrossel / reels) */}
            {post.format && (
              <span
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  background: "rgba(0, 0, 0, 0.65)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
              >
                {post.format}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
