import Image from 'next/image';
import Link from 'next/link';
import { BUSINESS_HOURS } from '@/lib/business-hours';
import { CONTACT, SERVICES } from '@/lib/site-content';
import SiteHeader from './SiteHeader';
import CustomerReviews from './CustomerReviews';
import styles from './site.module.css';

export default function HomePage() {
  return <div className={styles.site}>
    <a href="#main-content" className={styles.skipLink}>Skip to content</a>
    <SiteHeader />
    <main id="main-content" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span className={styles.redDot} /> Independent car care · Dubai</p>
          <h1 id="hero-heading">For the love<br />of the <em>drive.</em></h1>
          <p className={styles.heroDescription}>Exceptional cars deserve thoughtful care. Specialist servicing, diagnostics and repair, right here in Al Quoz.</p>
          <div className={styles.actions}><a href={CONTACT.whatsapp} className={styles.primaryButton}>Tell us about your car <span aria-hidden="true">↗</span></a><a href="#services" className={styles.textLink}>Explore our services <span aria-hidden="true">↓</span></a></div>
          <div className={styles.heroNote}><span>MBR AUTO SERVICES</span><span>Making Better Rides.</span></div>
        </div>
        <div className={styles.heroVisual}>
          <Image src="/images/hero-poster.jpg" alt="The MBR Auto Services workshop exterior in Al Quoz" fill preload sizes="(max-width: 800px) 100vw, 55vw" className={styles.coverImage} />
          <div className={styles.imageCaption}><span>Precision. Passion. People.</span><span>AL QUOZ, DUBAI ↗</span></div>
        </div>
      </section>
      <div className={styles.marques} aria-label="Some of the brands we service"><p>Extraordinary cars.<br /><strong>Everyday commitment.</strong></p><div>{[['mercedes-benz','Mercedes-Benz'],['porsche','Porsche'],['bmw','BMW'],['audi','Audi'],['land-rover','Land Rover'],['mclaren-dark','McLaren']].map(([file, name]) => <Image key={file} src={`/images/brands/${file}.svg`} alt={name} width={110} height={48} />)}</div></div>
      <section id="services" className={`${styles.section} ${styles.services}`} aria-labelledby="services-heading">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>01 / What we do</p><h2 id="services-heading">Care for every<br />part of the journey.</h2></div><p>One workshop. A considered approach to keeping your car performing at its best.</p></div>
        <div className={styles.serviceGrid}>{SERVICES.map(service => <article key={service.number} className={styles.serviceCard}>
          <div className={styles.serviceImage}><Image src={service.image} alt={service.alt} fill sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 23vw" className={styles.coverImage} /><span>{service.number}</span></div>
          <h3>{service.title}</h3><p>{service.detail}</p><a href={`${CONTACT.whatsapp}?text=${encodeURIComponent(`Hello MBR, I would like to discuss ${service.title.toLowerCase()} for my car.`)}`} className={styles.textLink}>Discuss {service.title.toLowerCase()} <span aria-hidden="true">↗</span></a>
        </article>)}</div>
      </section>
      <section id="workshop" className={styles.workshop} aria-labelledby="workshop-heading">
        <div className={styles.workshopImage}><Image src="/images/mbr_mechanic.webp" alt="A closer look at mechanical work in the MBR workshop" fill sizes="(max-width: 800px) 100vw, 50vw" className={styles.coverImage} /></div>
        <div className={styles.workshopCopy}><p className={styles.eyebrow}>02 / The workshop</p><h2 id="workshop-heading">Behind every<br />better ride.<br /><em>People who care.</em></h2><p>Bring us the car you love, the sound you can’t explain, or the service you’ve been putting off. We’ll help you understand the next step.</p><ol className={styles.process}><li><span>01</span><div><h3>Tell us what you need</h3><p>Share your car’s details and what you’ve noticed.</p></div></li><li><span>02</span><div><h3>Understand the work</h3><p>Discuss the diagnosis and proposed service with our team.</p></div></li><li><span>03</span><div><h3>Get back to your drive</h3><p>Leave with a clearer picture of your car’s care.</p></div></li></ol><a href={CONTACT.maps} className={styles.textLink}>Visit the workshop <span aria-hidden="true">↗</span></a></div>
      </section>
      <CustomerReviews />
      <section id="contact" className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-heading"><div><p className={styles.eyebrow}>03 / Let’s talk cars</p><h2 id="contact-heading">Your next<br /><em>better ride</em><br />starts here.</h2><div className={styles.actions}><a href={CONTACT.whatsapp} className={styles.primaryButton}>Chat on WhatsApp <span aria-hidden="true">↗</span></a><a href={CONTACT.phone} className={styles.textLink}>Call {CONTACT.phoneLabel}</a></div></div><div className={styles.contactDetails}><div><h3>Find the workshop</h3><address>{CONTACT.address}</address><a href={CONTACT.maps} className={styles.textLink}>Get directions <span aria-hidden="true">↗</span></a></div><div><h3>Opening hours</h3><p>{BUSINESS_HOURS.displayDayRange}<br />{BUSINESS_HOURS.displayHours} · Dubai time<br />{BUSINESS_HOURS.closedNote}</p></div></div></section>
    </main>
    <footer className={styles.footer}><Link href="/" aria-label="MBR home"><Image src="/images/MBR_Logo_horizontal.svg" alt="MBR Auto Services" width={190} height={55} /></Link><p>Making Better Rides. Dubai, UAE.</p><nav aria-label="Legal"><Link href="/privacy-policy">Privacy</Link><Link href="/cookie-policy">Cookies</Link></nav></footer>
  </div>;
}
