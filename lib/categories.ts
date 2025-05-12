// Map of arXiv CS category codes to human-readable names
const CATEGORY_MAP: Record<string, string> = {
    "cs.AI": "Artificial Intelligence",
    "cs.AR": "Hardware Architecture",
    "cs.CC": "Computational Complexity",
    "cs.CE": "Computational Engineering",
    "cs.CG": "Computational Geometry",
    "cs.CL": "Computation & Language",
    "cs.CR": "Cryptography & Security",
    "cs.CV": "Computer Vision",
    "cs.CY": "Computers & Society",
    "cs.DB": "Databases",
    "cs.DC": "Distributed Computing",
    "cs.DL": "Digital Libraries",
    "cs.DM": "Discrete Mathematics",
    "cs.DS": "Data Structures & Algorithms",
    "cs.ET": "Emerging Technologies",
    "cs.FL": "Formal Languages",
    "cs.GL": "General Literature",
    "cs.GR": "Graphics",
    "cs.GT": "Game Theory",
    "cs.HC": "Human-Computer Interaction",
    "cs.IR": "Information Retrieval",
    "cs.IT": "Information Theory",
    "cs.LG": "Machine Learning",
    "cs.LO": "Logic in Computer Science",
    "cs.MA": "Multiagent Systems",
    "cs.MM": "Multimedia",
    "cs.MS": "Mathematical Software",
    "cs.NA": "Numerical Analysis",
    "cs.NE": "Neural & Evolutionary Computing",
    "cs.NI": "Networking & Internet Architecture",
    "cs.OH": "Other Computer Science",
    "cs.OS": "Operating Systems",
    "cs.PF": "Performance",
    "cs.PL": "Programming Languages",
    "cs.RO": "Robotics",
    "cs.SC": "Symbolic Computation",
    "cs.SD": "Sound",
    "cs.SE": "Software Engineering",
    "cs.SI": "Social & Information Networks",
    "cs.SY": "Systems & Control",
  }
  
  /**
   * Get a human-readable name for an arXiv category code
   * @param categoryId The arXiv category code (e.g., "cs.LG")
   * @returns The human-readable name or the original code if not found
   */
  export function getCategoryName(categoryId: string): string {
    return CATEGORY_MAP[categoryId] || categoryId
  }
  
  /**
   * Get the full category map
   * @returns Record of category codes to human-readable names
   */
  export function getCategoryMap(): Record<string, string> {
    return { ...CATEGORY_MAP }
  }
  