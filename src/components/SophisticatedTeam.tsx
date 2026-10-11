import { getTeamMembers } from '@/lib/team-data';
import TeamSection from './TeamSection';
export default function SophisticatedTeam() { return <TeamSection teamMembers={getTeamMembers()} />; }
