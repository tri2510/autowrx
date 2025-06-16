import { Requirement } from '@/types/model.type'

export const mockRequirements: Requirement[] = [
  // Functional Requirements
  {
    id: 'REQ-PROX-001',
    title: 'Vehicle Proximity Detection System',
    description:
      'System must detect authorized users approaching the vehicle within a configurable range of 2-5 meters using key fob signals or mobile device recognition.',
    type: 'Functional Requirement',
    source: {
      type: 'internal',
      link: 'https://company-wiki/proximity-detection-spec',
    },
    rating: {
      priority: 5,
      relevance: 5,
      impact: 4,
    },
    creatorUserId: 'engineer_schmidt',
    childRequirements: ['REQ-PROX-001-1'],
  },
  {
    id: 'REQ-PROX-001-1',
    title: 'Multiple User Recognition',
    description:
      'Proximity system must differentiate between multiple authorized users and identify the specific approaching user to enable personalized welcome sequence.',
    type: 'Functional Requirement',
    source: {
      type: 'internal',
      link: 'https://company-wiki/multi-user-detection',
    },
    rating: {
      priority: 3,
      relevance: 5,
      impact: 5,
    },
    creatorUserId: 'engineer_johnson',
  },
  {
    id: 'REQ-WELCOME-001',
    title: 'Welcome Sequence Orchestration',
    description:
      'System must coordinate a personalized welcome sequence including exterior lighting, door unlock/open, seat adjustment, and climate control activation based on user profile.',
    type: 'Functional Requirement',
    source: {
      type: 'internal',
      link: 'https://company-wiki/welcome-sequence',
    },
    rating: {
      priority: 2,
      relevance: 5,
      impact: 3,
    },
    creatorUserId: 'ux_andersson',
    childRequirements: [],
  },

  {
    id: 'REQ-INT-SEAT-001',
    title: 'Seat Position Control Integration',
    description:
      'Seat system must support automated adjustment to user-specific stored positions as part of the welcome sequence using standardized COVESA VSS signals.',
    type: 'System Integration Requirement',
    source: {
      type: 'external',
      link: 'https://covesa.github.io/vehicle_signal_specification/vehicle/seat/',
    },
    rating: {
      priority: 5,
      relevance: 5,
      impact: 5,
    },
    creatorUserId: 'integration_wong',
    childRequirements: ['REQ-INT-SEAT-001-1'],
  },
  // Safety & Security Requirements
  {
    id: 'REQ-SEC-AUTH-001',
    title: 'User Authentication Security',
    description:
      'Welcome system must authenticate user identity using cryptographically secure methods with rolling codes and/or challenge-response mechanisms to prevent replay attacks.',
    type: 'Safety & Security Requirement',
    source: {
      type: 'internal',
      link: 'https://company-wiki/authentication-security',
    },
    rating: {
      priority: 5,
      relevance: 5,
      impact: 5,
    },
    creatorUserId: 'security_dubois',
    childRequirements: [],
  },
  {
    id: 'REQ-SEC-DOOR-001',
    title: 'Automated Door Operation Safety',
    description:
      'Automated door opening must include obstacle detection with minimum 15N force sensitivity and immediate stop/reverse function if obstruction is detected.',
    type: 'Safety & Security Requirement',
    source: {
      type: 'external',
      link: 'https://unece.org/transport/vehicle-regulations-wp29/standards/addenda-1958-agreement-regulations-11-20',
    },
    rating: {
      priority: 5,
      relevance: 3,
      impact: 5,
    },
    creatorUserId: 'safety_mueller',
    childRequirements: [],
  },

  {
    id: 'REQ-UX-001',
    title: 'Personalized Welcome Experience',
    description:
      'System must provide a personalized welcome experience including ambient lighting color schemes, preferred climate settings, and seat position based on stored user profiles.',
    type: 'User Experience Requirement',
    source: {
      type: 'internal',
      link: 'https://company-wiki/welcome-experience',
    },
    rating: {
      priority: 4,
      relevance: 3,
      impact: 5,
    },
    creatorUserId: 'ux_andersson',
    childRequirements: ['REQ-UX-001-1'],
  },
  // Regulatory & Homologation Requirements
  {
    id: 'REQ-REG-001',
    title: 'Automated Door System Compliance',
    description:
      'Automated door system must comply with UNECE R11 regulations for door latches and retention components, including specific requirements for powered operation.',
    type: 'Regulatory & Homologation Requirement',
    source: {
      type: 'external',
      link: 'https://unece.org/transport/vehicle-regulations-wp29/standards/addenda-1958-agreement-regulations-11-20',
    },
    rating: {
      priority: 1,
      relevance: 1,
      impact: 5,
    },
    creatorUserId: 'homologation_petrov',
    childRequirements: [],
  },

  // Operational Requirements
  {
    id: 'REQ-OPS-001',
    title: 'Environmental Operating Conditions',
    description:
      'Welcome system including proximity detection must function reliably in temperature range -30°C to +70°C and under all lighting conditions from direct sunlight to complete darkness.',
    type: 'Operational Requirement',
    source: {
      type: 'internal',
      link: 'https://company-wiki/environmental-specifications',
    },
    rating: {
      priority: 4,
      relevance: 2,
      impact: 4,
    },
    creatorUserId: 'engineer_schmidt',
    childRequirements: [],
  },

  // Deployment & Ecosystem Requirements
  {
    id: 'REQ-DEP-001',
    title: 'OTA Update Capability',
    description:
      'Welcome system must support secure over-the-air updates for all configurable parameters and software components without requiring dealership visits.',
    type: 'Deployment & Ecosystem Requirement',
    source: {
      type: 'internal',
      link: 'https://company-wiki/ota-requirements',
    },
    rating: {
      priority: 3,
      relevance: 2,
      impact: 4,
    },
    creatorUserId: 'security_nguyen',
    childRequirements: [],
  },
]

export default mockRequirements
