export interface TeamMember {
  name: string;
  position: string;
  image: string;
  description: string;
  socialType?: string;
  socialUrl?: string;
}

export function getTeamMembers(): TeamMember[] {
  // Check if we're in a Node.js environment (server-side)
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const csvPath = path.join(process.cwd(), 'data', 'team-members.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');

      const lines = csvContent.trim().split('\n');
      // Skip header line

      const teamMembers: TeamMember[] = lines.slice(1).map((line: string) => {
        // Parse CSV line handling commas within quoted fields
        const values = parseCSVLine(line);

        const member: TeamMember = {
          name: values[0] || '',
          position: values[1] || '',
          image: values[2] || '',
          description: values[3] || '',
          socialType: values[4] || undefined,
          socialUrl: values[5] || undefined
        };

        // Clean up empty strings to undefined for optional fields
        if (!member.socialType) member.socialType = undefined;
        if (!member.socialUrl) member.socialUrl = undefined;

        return member;
      });

      return teamMembers;
    } catch (error) {
      console.error('Error reading team CSV file:', error);
      return getStaticTeamMembers();
    }
  }

  // Fallback for client-side or build errors
  return getStaticTeamMembers();
}

// Static fallback data matching the CSV content
function getStaticTeamMembers(): TeamMember[] {
  return [
    {
      name: "Basel Kelzia",
      position: "Owner & CEO",
      image: "/images/team-photos/image00001.webp",
      description: "Passionate automotive expert with 15+ years leading MBR Auto Services. Committed to quality service and customer satisfaction.",
      socialType: "instagram",
      socialUrl: "https://www.instagram.com/dr.abu.adam/"
    },
    {
      name: "Michael Touma",
      position: "Workshop Manager",
      image: "/images/team-photos/image00002.webp",
      description: "Experienced workshop manager ensuring smooth operations and quality control across all automotive services.",
      socialType: "instagram",
      socialUrl: "https://www.instagram.com/michael_touma/"
    },
    {
      name: "Ahmad Hassan",
      position: "Senior Mechanic",
      image: "/images/team-photos/image00003.webp",
      description: "Master technician specializing in engine diagnostics and complex automotive repairs with 10+ years experience.",
      socialType: "linkedin"
    },
    {
      name: "Khalil Mansour",
      position: "Electrical Specialist",
      image: "/images/team-photos/image00004.webp",
      description: "Expert in automotive electrical systems and computer diagnostics for all vehicle makes and models."
    },
    {
      name: "Omar Farah",
      position: "Suspension Expert",
      image: "/images/team-photos/image00005.webp",
      description: "Specialist in suspension systems and steering components with precision alignment expertise."
    },
    {
      name: "Mahmoud Ali",
      position: "Service Advisor",
      image: "/images/team-photos/image00006.webp",
      description: "Customer service specialist helping clients understand their vehicle needs and service recommendations.",
      socialType: "linkedin"
    },
    {
      name: "Yussef Khalil",
      position: "Brake Specialist",
      image: "/images/team-photos/image00007.webp",
      description: "Certified brake system expert ensuring your safety with professional brake service and repairs."
    },
    {
      name: "Tariq Nasser",
      position: "Maintenance Technician",
      image: "/images/team-photos/image00008.webp",
      description: "Skilled in routine maintenance services including oil changes, tune-ups and preventive care."
    }
  ];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}