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

  // 🔢 controla quantos posts aparecem no widget
  // troca 9 por 12 se quiser 4 linhas, por exemplo
  const postsToShow = posts.slice(0, 9);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        padding: "16px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* topo */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          widget instagram s2h
        </h1>

        <button
          onClick={fetchPosts}
          disabled={loading}
          style={{
            padding: "6px 14px",
            borderRadius: "999px",
            border: "1px solid #444",
            background: loading ? "#222" : "#111",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            fontSize: "12px",
            transition: "background 0.2s, transform 0.1s",
          }}
        >
          {loading ? "carregando..." : "refresh"}
        </button>
      </header>

      {error && (
        <p
          style={{
            marginBottom: "10px",
            color: "#ff8080",
            fontSize: "12px",
          }}
        >
          {error}
        </p>
      )}

      {postsToShow.length === 0 && !loading && !error && (
        <p style={{ opacity: 0.8, fontSize: "12px" }}>
          nenhum post encontrado 😶
        </p>
      )}

      {/* 🔳 grade tipo feed */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
          maxWidth: "520px", // controla a largura dentro do embed
        }}
      >
        {postsToShow.map((post) => (
          <article
            key={post.id}
            style={{
              background:
                "radial-gradient(circle at top, #181818 0, #050505 40%, #000 80%)",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #222",
              position: "relative",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5", // proporção IG
                overflow: "hidden",
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

                    {/* play/pause central */}
                    <button
                      type="button"
                      onClick={() => toggleVideo(post.id)}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background:
                          playingId === post.id
                            ? "rgba(0,0,0,0.25)"
                            : "linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0.05))",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "22px",
                      }}
                    >
                      {playingId === post.id ? "❚❚" : "▶"}
                    </button>

                    {/* badge REELS */}
                    <span
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        fontSize: "9px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "3px 7px",
                        borderRadius: "999px",
                        background: "rgba(0,0,0,0.7)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      reels
                    </span>
                  </>
                ) : (
                  <>
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

                    {/* badge feed/carrossel */}
                    {post.format && (
                      <span
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          padding: "3px 7px",
                          borderRadius: "999px",
                          background: "rgba(0,0,0,0.7)",
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        {post.format}
                      </span>
                    )}
                  </>
                )
              ) : (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    opacity: 0.6,
                  }}
                >
                  sem mídia
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
