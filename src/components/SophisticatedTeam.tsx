import React from 'react';
import { getTeamMembers } from '@/lib/team-data';
import TeamSection from './TeamSection';

export default function SophisticatedTeam() {
  const teamMembers = getTeamMembers();

  return <TeamSection teamMembers={teamMembers} />;
}