"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaInstagram } from 'react-icons/fa';
import { getTeamMembers, type TeamMember } from '@/lib/team-data';
import SectionMarker from './SectionMarker';

/**
 * Team — owner + workshop manager.
 *
 * Pulls from the existing `team-data.ts` source so the names, photos
 * and roles stay in one place. Editorial 2-card layout: portrait photo
 * on top, Fraunces serif name below, sans-bronze role caps, then a
 * short bio paragraph and an optional Instagram link.
 */
const TEAM: TeamMember[] = getTeamMembers();

export default function TeamSection() {
  if (!TEAM.length) return null;

  return (
    <section
      id="team"
      className="relative py-24 md:py-32 bg-black overflow-hidden"
    >
      {/* Subtle bronze bloom from the top-right — picks up the Why MBR
          end-of-section feel without becoming a full background wash. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 100% 0%, rgba(165,120,66,0.07) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-luxury">
        <SectionMarker
          number="05"
          eyebrow="Team"
          headline="The people behind the workshop."
          body="A small, hands-on team. The owner is on the floor most days; the workshop manager runs the bays. Owners deal with the same faces every visit."
        />

        <div className="mt-20 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 max-w-5xl mx-auto">
          {TEAM.map((member, i) => {
            const isOwner = member.position.toLowerCase().includes('owner');
            const isInstagram = member.socialType === 'instagram' && member.socialUrl;

            // Split position at " - " or " — " so the long secondary text
            // ("Owner & CEO - MBR Leader") renders on a second softer line.
            const [primaryRole, ...secondaryParts] = member.position.split(/\s+[-—]\s+/);
            const secondary = secondaryParts.join(' — ');

            return (
              <motion.article
                key={member.name}
                className="group flex flex-col"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
              >
                {/* Portrait — 3:4 aspect, bronze hairline on hover */}
                <div className="relative overflow-hidden rounded-2xl border border-white/8 group-hover:border-[var(--accent-bronze)]/45 transition-colors duration-500 bg-[var(--surface-2)]">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={member.image}
                      alt={`${member.name} — ${member.position}, MBR Auto Services`}
                      fill
                      sizes="(min-width: 768px) 40vw, 90vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    {/* Bottom gradient for caption legibility */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)',
                      }}
                    />
                    {/* Owner badge */}
                    {isOwner && (
                      <div
                        className="absolute top-5 left-5 px-3 py-1 rounded-full text-eyebrow"
                        style={{
                          background: 'rgba(165,120,66,0.18)',
                          border: '1px solid rgba(165,120,66,0.55)',
                          color: 'var(--accent-bronze)',
                        }}
                      >
                        Founder
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity */}
                <div className="pt-7 md:pt-8">
                  <h3 className="font-display text-3xl md:text-4xl font-light text-white leading-[1.1] tracking-[-0.02em] mb-2">
                    {member.name}
                  </h3>
                  <p className="text-eyebrow mb-1">{primaryRole}</p>
                  {secondary && (
                    <p className="text-xs md:text-sm text-[var(--text-subtle)] tracking-wide italic mb-4">
                      {secondary}
                    </p>
                  )}

                  <p className="text-body text-[var(--text-body)] leading-relaxed mt-4 max-w-md">
                    {member.description}
                  </p>

                  {isInstagram && (
                    <a
                      href={member.socialUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-eyebrow text-[var(--text-muted)] hover:text-[var(--accent-bronze)] transition-colors"
                      aria-label={`${member.name} on Instagram`}
                    >
                      <FaInstagram className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{member.socialUrl!.split('/').filter(Boolean).pop()}</span>
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
