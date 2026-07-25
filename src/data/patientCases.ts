/**
 * Patient Cases Database - Serious Game Content
 *
 * Defines realistic patient scenarios for surgical training
 */

export enum KnospGrade {
  GRADE_0 = 0, // No cavernous sinus invasion
  GRADE_1 = 1, // Tumor reaches medial tangent
  GRADE_2 = 2, // Tumor extends beyond medial tangent but not lateral
  GRADE_3 = 3, // Tumor reaches lateral tangent (ICA encasement)
  GRADE_4 = 4, // Complete ICA encasement
}

export enum CaseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export interface SurgicalObjective {
  id: string;
  phase: number;
  title: string;
  description: string;
  completed: boolean;
  requiredActions: string[];
  successCriteria: string;
  timeLimit?: number; // seconds
}

export interface PatientCase {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';

  // Clinical presentation
  chiefComplaint: string;
  symptoms: string[];
  duration: string;

  // Diagnosis
  diagnosis: string;
  tumorType: string;
  tumorSize: number; // cm
  knospGrade: KnospGrade;

  // Imaging findings
  imagingFindings: string[];

  // Surgical planning
  difficulty: CaseDifficulty;
  objectives: SurgicalObjective[];
  timeLimit: number; // minutes

  // Educational context
  learningObjectives: string[];
  criticalStructures: string[];
  potentialComplications: string[];

  // Metadata
  unlockRequirement?: string; // Which case must be completed first
}

// ============================================================================
// BEGINNER CASES
// ============================================================================

export const CASE_BEGINNER_1: PatientCase = {
  id: 'case-001-beginner',
  name: 'Maria Santos',
  age: 45,
  gender: 'F',

  chiefComplaint: 'Headaches and visual changes',
  symptoms: [
    'Bi-temporal hemianopsia (peripheral vision loss)',
    'Persistent frontal headaches (6 months)',
    'Mild fatigue and cold intolerance',
  ],
  duration: '6 months progressive',

  diagnosis: 'Non-functioning pituitary macroadenoma',
  tumorType: 'Non-functioning adenoma',
  tumorSize: 2.1,
  knospGrade: KnospGrade.GRADE_1,

  imagingFindings: [
    'MRI: 2.1 cm sellar mass with suprasellar extension',
    'Optic chiasm displacement (no compression)',
    'Minimal cavernous sinus contact (Knosp 1)',
    'No ICA encasement',
    'Intact sellar floor',
  ],

  difficulty: CaseDifficulty.BEGINNER,
  timeLimit: 45,

  objectives: [
    {
      id: 'obj-001-phase1',
      phase: 1,
      title: 'Nasal Approach',
      description: 'Navigate through nasal cavity and identify sphenoid ostium',
      completed: false,
      requiredActions: [
        'Identify middle turbinate',
        'Locate sphenoid ostium',
        'Widen ostium to >8mm',
      ],
      successCriteria: 'Sphenoid ostium widened without significant bleeding',
      timeLimit: 300, // 5 minutes
    },
    {
      id: 'obj-001-phase2',
      phase: 2,
      title: 'Sellar Exposure',
      description: 'Expose and open the sella turcica',
      completed: false,
      requiredActions: [
        'Remove posterior nasal septum',
        'Identify sellar floor landmarks',
        'Drill sellar floor carefully',
        'Open dura in cruciate fashion',
      ],
      successCriteria: 'Dura opened without CSF leak, tumor visible',
      timeLimit: 600, // 10 minutes
    },
    {
      id: 'obj-001-phase3',
      phase: 3,
      title: 'Tumor Resection',
      description: 'Remove tumor while preserving critical structures',
      completed: false,
      requiredActions: [
        'Identify tumor pseudocapsule',
        'Debulk tumor centrally',
        'Dissect tumor from lateral walls',
        'Achieve >90% resection',
      ],
      successCriteria: '>90% tumor removed, no ICA injury, no CSF leak',
      timeLimit: 1200, // 20 minutes
    },
    {
      id: 'obj-001-phase4',
      phase: 4,
      title: 'Hemostasis & Closure',
      description: 'Ensure hemostasis and close surgical site',
      completed: false,
      requiredActions: [
        'Inspect for residual tumor',
        'Check for CSF leak',
        'Place fat graft if needed',
        'Apply hemostatic agents',
      ],
      successCriteria: 'Complete hemostasis, no CSF leak',
      timeLimit: 600, // 10 minutes
    },
  ],

  learningObjectives: [
    'Master endoscopic nasal anatomy navigation',
    'Identify sphenoid ostium reliably',
    'Understand sellar floor landmarks',
    'Practice safe dural opening technique',
    'Achieve gross total resection in favorable tumor',
  ],

  criticalStructures: [
    'Internal carotid arteries (bilateral)',
    'Optic nerves (bilateral)',
    'Cavernous sinus walls',
    'Pituitary stalk',
    'Arachnoid membrane',
  ],

  potentialComplications: [
    'CSF leak (if dura torn excessively)',
    'ICA injury (if dissection too lateral)',
    'Optic nerve injury (if superior dissection aggressive)',
    'Pituitary stalk damage (if central dissection excessive)',
    'Epistaxis (nasal mucosal injury)',
  ],
};

// ============================================================================
// INTERMEDIATE CASES
// ============================================================================

export const CASE_INTERMEDIATE_1: PatientCase = {
  id: 'case-002-intermediate',
  name: 'John Mitchell',
  age: 52,
  gender: 'M',

  chiefComplaint: 'Progressive vision loss and headaches',
  symptoms: [
    'Severe bi-temporal hemianopsia',
    'Decreased visual acuity (right eye)',
    'Daily frontal headaches',
    'Decreased libido and erectile dysfunction',
  ],
  duration: '18 months progressive',

  diagnosis: 'Large non-functioning pituitary macroadenoma with chiasmal compression',
  tumorType: 'Non-functioning adenoma',
  tumorSize: 3.2,
  knospGrade: KnospGrade.GRADE_2,

  imagingFindings: [
    'MRI: 3.2 cm sellar mass with significant suprasellar extension',
    'Optic chiasm compression and displacement',
    'Cavernous sinus invasion (Knosp 2) - bilateral',
    'ICA displacement but no encasement',
    'Thinned but intact sellar floor',
  ],

  difficulty: CaseDifficulty.INTERMEDIATE,
  timeLimit: 60,

  objectives: [
    {
      id: 'obj-002-phase1',
      phase: 1,
      title: 'Extended Nasal Approach',
      description: 'Create wide surgical corridor for large tumor',
      completed: false,
      requiredActions: [
        'Perform extended sphenoidotomy',
        'Remove posterior septum widely',
        'Create >15mm working space',
      ],
      successCriteria: 'Wide bilateral exposure without bleeding',
      timeLimit: 420, // 7 minutes
    },
    {
      id: 'obj-002-phase2',
      phase: 2,
      title: 'Sellar & Suprasellar Exposure',
      description: 'Expose large sellar and suprasellar tumor',
      completed: false,
      requiredActions: [
        'Remove sellar floor widely',
        'Identify carotid protuberances',
        'Open dura between ICAs',
        'Decompress optic chiasm',
      ],
      successCriteria: 'Wide dural opening, chiasm visualized',
      timeLimit: 720, // 12 minutes
    },
    {
      id: 'obj-002-phase3',
      phase: 3,
      title: 'Complex Tumor Resection',
      description: 'Remove large tumor with cavernous sinus involvement',
      completed: false,
      requiredActions: [
        'Debulk central tumor aggressively',
        'Dissect tumor from ICAs bilaterally',
        'Address Knosp 2 lateral extension',
        'Decompress optic apparatus',
      ],
      successCriteria: '>85% tumor removed, no vascular injury',
      timeLimit: 1800, // 30 minutes
    },
    {
      id: 'obj-002-phase4',
      phase: 4,
      title: 'CSF Leak Prevention & Closure',
      description: 'Prevent CSF leak in large defect',
      completed: false,
      requiredActions: [
        'Inspect arachnoid integrity',
        'Multilayer closure if CSF leak',
        'Fat graft + fascial graft',
        'Apply fibrin glue',
      ],
      successCriteria: 'No CSF leak, complete hemostasis',
      timeLimit: 720, // 12 minutes
    },
  ],

  learningObjectives: [
    'Manage large tumors with suprasellar extension',
    'Navigate Knosp 2 cavernous sinus invasion',
    'Protect ICAs during lateral dissection',
    'Decompress optic chiasm safely',
    'Prevent CSF leak in large defects',
  ],

  criticalStructures: [
    'Internal carotid arteries (bilateral, displaced)',
    'Optic nerves and chiasm (compressed)',
    'Cavernous sinus medial walls (invaded)',
    'Pituitary stalk',
    'Arachnoid membrane (at risk for tear)',
    'Superior hypophyseal arteries',
  ],

  potentialComplications: [
    'High-flow CSF leak (large arachnoid defect)',
    'ICA injury (lateral dissection in CS)',
    'Optic nerve injury (decompression)',
    'Pituitary stalk damage (residual tumor vs stalk)',
    'Cavernous sinus hemorrhage',
    'Postoperative panhypopituitarism',
  ],

  unlockRequirement: 'case-001-beginner',
};

// ============================================================================
// ADVANCED CASES
// ============================================================================

export const CASE_ADVANCED_1: PatientCase = {
  id: 'case-003-advanced',
  name: 'Sarah Chen',
  age: 38,
  gender: 'F',

  chiefComplaint: 'Severe headaches, vision loss, and hormonal symptoms',
  symptoms: [
    'Complete right eye blindness',
    'Left temporal hemianopsia',
    'Severe daily headaches',
    'Cushing disease symptoms (weight gain, moon facies)',
    'Hypertension and hyperglycemia',
  ],
  duration: '2 years progressive',

  diagnosis: 'Giant invasive ACTH-secreting pituitary adenoma (Cushing disease)',
  tumorType: 'ACTH-secreting adenoma (functioning)',
  tumorSize: 4.5,
  knospGrade: KnospGrade.GRADE_3,

  imagingFindings: [
    'MRI: 4.5 cm giant invasive adenoma',
    'Complete ICA encasement bilaterally (Knosp 3)',
    'Optic chiasm severe compression',
    'Right optic nerve atrophy',
    'Sphenoid sinus complete invasion',
    'Clivus erosion',
  ],

  difficulty: CaseDifficulty.ADVANCED,
  timeLimit: 90,

  objectives: [
    {
      id: 'obj-003-phase1',
      phase: 1,
      title: 'Complex Nasal & Sphenoid Approach',
      description: 'Navigate tumor-invaded sphenoid sinus',
      completed: false,
      requiredActions: [
        'Extended bilateral sphenoidotomy',
        'Remove tumor from sphenoid sinus',
        'Identify displaced anatomy landmarks',
      ],
      successCriteria: 'Sphenoid cleared, anatomy identified',
      timeLimit: 600, // 10 minutes
    },
    {
      id: 'obj-003-phase2',
      phase: 2,
      title: 'Sellar Exposure with ICA Management',
      description: 'Expose tumor while managing encased ICAs',
      completed: false,
      requiredActions: [
        'Identify ICA positions (encased)',
        'Remove sellar floor between ICAs',
        'Create maximal safe exposure',
        'Decompress optic apparatus',
      ],
      successCriteria: 'Wide exposure achieved, no ICA injury',
      timeLimit: 900, // 15 minutes
    },
    {
      id: 'obj-003-phase3',
      phase: 3,
      title: 'Maximal Safe Resection (Knosp 3)',
      description: 'Achieve maximal resection while protecting ICAs',
      completed: false,
      requiredActions: [
        'Central tumor debulking',
        'Medial-to-lateral dissection',
        'Leave tumor adherent to ICA',
        'Decompress optic chiasm completely',
      ],
      successCriteria: '>70% resection, ICA intact, vision preserved',
      timeLimit: 2400, // 40 minutes
    },
    {
      id: 'obj-003-phase4',
      phase: 4,
      title: 'Complex Reconstruction',
      description: 'Prevent CSF leak in giant defect with ICA exposure',
      completed: false,
      requiredActions: [
        'Manage high-flow CSF leak',
        'Multilayer closure (fat + fascia + bone)',
        'Protect exposed ICAs',
        'Lumbar drain placement',
      ],
      successCriteria: 'CSF leak controlled, hemostasis achieved',
      timeLimit: 900, // 15 minutes
    },
  ],

  learningObjectives: [
    'Manage giant invasive pituitary tumors',
    'Navigate Knosp 3 ICA encasement',
    'Balance maximal resection with safety',
    'Recognize when to leave residual tumor',
    'Complex CSF leak management',
    'Understand limitations in invasive tumors',
  ],

  criticalStructures: [
    'Internal carotid arteries (encased bilaterally)',
    'Optic nerves (atrophied, compressed)',
    'Optic chiasm (severely compressed)',
    'Cavernous sinus contents (invaded)',
    'Pituitary stalk (likely involved)',
    'Arachnoid membrane (large defect expected)',
    'Clivus and basilar artery',
  ],

  potentialComplications: [
    'ICA injury (dissection from encased artery) - CATASTROPHIC',
    'High-flow CSF leak (expected in >80%)',
    'Vision loss (optic nerve manipulation)',
    'Carotid-cavernous fistula',
    'Massive hemorrhage from cavernous sinus',
    'Postoperative panhypopituitarism (expected)',
    'Residual tumor requiring adjuvant therapy',
    'Diabetes insipidus',
  ],

  unlockRequirement: 'case-002-intermediate',
};

// ============================================================================
// CASE REGISTRY
// ============================================================================

export const ALL_CASES: PatientCase[] = [
  CASE_BEGINNER_1,
  CASE_INTERMEDIATE_1,
  CASE_ADVANCED_1,
];

export const getCaseById = (id: string): PatientCase | undefined => {
  return ALL_CASES.find(c => c.id === id);
};

export const getCasesByDifficulty = (difficulty: CaseDifficulty): PatientCase[] => {
  return ALL_CASES.filter(c => c.difficulty === difficulty);
};

export const getAvailableCases = (completedCaseIds: string[]): PatientCase[] => {
  return ALL_CASES.filter(c => {
    // First case is always available
    if (!c.unlockRequirement) return true;

    // Check if unlock requirement is met
    return completedCaseIds.includes(c.unlockRequirement);
  });
};
