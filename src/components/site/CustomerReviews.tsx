'use client';

import { useGoogleReviews } from '@/components/GoogleReviewsHook';
import { CONTACT } from '@/lib/site-content';
import styles from './site.module.css';

export default function CustomerReviews() {
  const { data, loading, error } = useGoogleReviews();
  const available = !error && data && Number.isFinite(data.overallRating) && data.totalReviews > 0;
  return <section id="reviews" aria-labelledby="reviews-heading" className={`${styles.section} ${styles.reviews}`}>
    <div className={styles.sectionHeading}>
      <div><p className={styles.eyebrow}>The owner experience</p><h2 id="reviews-heading">Good care.<br />In their words.</h2></div>
      <div className={styles.rating}>
        {available ? <><strong>{data.overallRating.toFixed(1)}<span> / 5</span></strong><p>Google · {data.totalReviews.toLocaleString('en-US')} reviews</p></> : <p>{loading ? 'Loading Google reviews…' : 'Read our latest reviews on Google.'}</p>}
        <a href={CONTACT.maps} className={styles.textLink}>View on Google <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    {available && <div className={styles.reviewGrid}>{data.reviews.slice(0, 3).map(review => <figure key={`${review.author_name}-${review.time}`} className={styles.reviewCard}>
      <p className={styles.reviewStars} aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}</p>
      <blockquote>{review.text}</blockquote>
      <figcaption><strong>{review.author_name}</strong><span>{review.relative_time_description}</span></figcaption>
    </figure>)}</div>}
  </section>;
}
