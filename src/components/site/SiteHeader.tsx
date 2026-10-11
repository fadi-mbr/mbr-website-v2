'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CONTACT } from '@/lib/site-content';
import styles from './site.module.css';

const links = [ ['Services', '/#services'], ['Our workshop', '/#workshop'], ['Reviews', '/#reviews'], ['Find us', '/#contact'] ] as const;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className={styles.header} onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus();
    }
  }}>
    <div className={styles.headerInner}>
      <Link href="/" aria-label="MBR Auto Services home" className={styles.logo} onClick={() => setOpen(false)}>
        <Image src="/images/MBR_Logo_horizontal.svg" alt="MBR Auto Services" width={220} height={60} priority />
      </Link>
      <button type="button" className={styles.menuButton} aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'} <span aria-hidden="true">{open ? '−' : '+'}</span></button>
      <nav id="site-navigation" aria-label="Main navigation" className={`${styles.navigation} ${open ? styles.navigationOpen : ''}`}>
        {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <a href={CONTACT.whatsapp} className={styles.headerCta}>Talk to our team <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
  </header>;
}
