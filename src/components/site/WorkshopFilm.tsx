'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import styles from './site.module.css';

export default function WorkshopFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  async function toggle() {
    if (!video.current) return;
    if (playing) video.current.pause();
    else {
      setFailed(false);
      try { await video.current.play(); } catch { setFailed(true); }
    }
  }
  return <div className={styles.heroVisual}>
    <Image src="/images/hero-poster.jpg" alt="MBR Auto Services workshop in Al Quoz" fill preload sizes="100vw" className={styles.coverImage} />
    <video ref={video} className={styles.heroFilm} style={{ opacity: playing ? 1 : 0 }} muted playsInline loop preload="none" aria-label="A look inside the MBR workshop" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setFailed(true); }}>
      <source src="https://cdn.mbrme.com/video_1_714a98022b6341a8b723dc3105772546.mp4" type="video/mp4" />
    </video>
    <button type="button" className={styles.filmControl} onClick={toggle} aria-pressed={playing}>{playing ? 'Ⅱ Pause workshop film' : '▷ Watch workshop film'}</button>
    {failed && <p className={styles.filmStatus} role="status">Film unavailable. Please try again later.</p>}
  </div>;
}
