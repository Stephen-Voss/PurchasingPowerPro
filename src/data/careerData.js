// src/data/careerData.js

export const CAREER_CATEGORIES = [
  "Technology",
  "Healthcare",
  "Construction & Trades",
  "Finance & Accounting",
  "Engineering",
  "Data, Science & Analytics",
  "Business, Sales & Marketing",
  "Education, Legal & Operations",
];

export const CAREER_PROFILES = [
  // Technology
  {
    id: "software-engineer",
    category: "Technology",
    title: "Software Engineer",
    socCode: "15-1252",
    adzunaCategory: "it-jobs",
    nationalBaseSalary: 128000,
    demandIndex: 1.24,
    growthRatePct: 17.9,
    skills: [
      "TypeScript",
      "React",
      "Python",
      "System Design",
      "SQL",
      "Distributed Systems",
    ],
    tools: [
      "Git",
      "VS Code",
      "Docker / Kubernetes",
      "AWS / GCP",
      "PostgreSQL",
      "CI/CD",
    ],
  },
  {
    id: "devops-cloud-engineer",
    category: "Technology",
    title: "DevOps & Cloud Infrastructure Engineer",
    socCode: "15-1244",
    adzunaCategory: "it-jobs",
    nationalBaseSalary: 132000,
    demandIndex: 1.22,
    growthRatePct: 15.0,
    skills: [
      "Infrastructure as Code",
      "Cloud Security",
      "Site Reliability",
      "Observability",
      "Networking",
    ],
    tools: [
      "Terraform",
      "Kubernetes",
      "AWS / Azure",
      "Prometheus / Grafana",
      "GitHub Actions",
    ],
  },
  {
    id: "cybersecurity-analyst",
    category: "Technology",
    title: "Information Security & SOC Analyst",
    socCode: "15-1212",
    adzunaCategory: "it-jobs",
    nationalBaseSalary: 118000,
    demandIndex: 1.3,
    growthRatePct: 32.7,
    skills: [
      "Threat Hunting",
      "Incident Response",
      "Vulnerability Mgmt",
      "IAM & Zero Trust",
      "SIEM Tuning",
    ],
    tools: [
      "Splunk / Sentinel",
      "CrowdStrike / Defender",
      "Wireshark",
      "Burp Suite",
      "OWASP",
    ],
  },
  {
    id: "product-manager-tech",
    category: "Technology",
    title: "Technical Product Manager",
    socCode: "15-1299",
    adzunaCategory: "it-jobs",
    nationalBaseSalary: 136000,
    demandIndex: 1.12,
    growthRatePct: 12.0,
    skills: [
      "Product Roadmap",
      "Agile / Scrum",
      "User Research",
      "SQL / Metrics",
      "Stakeholder Alignment",
    ],
    tools: [
      "Jira / Linear",
      "Figma",
      "Amplitude / Mixpanel",
      "Notion / Confluence",
      "SQL",
    ],
  },
  {
    id: "qa-automation-engineer",
    category: "Technology",
    title: "QA & Test Automation Engineer",
    socCode: "15-1253",
    adzunaCategory: "it-jobs",
    nationalBaseSalary: 102000,
    demandIndex: 1.05,
    growthRatePct: 10.5,
    skills: [
      "Test Automation",
      "API Testing",
      "Performance Testing",
      "Bug Triage",
      "Regression Strategy",
    ],
    tools: [
      "Playwright / Cypress",
      "Selenium",
      "Postman / k6",
      "Jenkins",
      "Git",
    ],
  },

  // Healthcare
  {
    id: "registered-nurse",
    category: "Healthcare",
    title: "Registered Nurse (RN)",
    socCode: "29-1141",
    adzunaCategory: "healthcare-nursing-jobs",
    nationalBaseSalary: 89000,
    demandIndex: 1.35,
    growthRatePct: 6.0,
    skills: [
      "Patient Care",
      "Triage & Assessment",
      "Medication Safety",
      "Care Coordination",
      "Critical Care",
    ],
    tools: [
      "Epic EHR",
      "Cerner / Oracle Health",
      "IV Infusion Pumps",
      "Patient Telemetry",
    ],
  },
  {
    id: "nurse-practitioner",
    category: "Healthcare",
    title: "Nurse Practitioner (NP)",
    socCode: "29-1171",
    adzunaCategory: "healthcare-nursing-jobs",
    nationalBaseSalary: 129000,
    demandIndex: 1.38,
    growthRatePct: 45.7,
    skills: [
      "Clinical Diagnosis",
      "Prescriptive Authority",
      "Preventive Care",
      "Chronic Disease Mgmt",
    ],
    tools: [
      "Epic EHR",
      "Clinical Diagnostics",
      "Telehealth Platforms",
      "UpToDate",
    ],
  },
  {
    id: "physical-therapist",
    category: "Healthcare",
    title: "Physical Therapist (DPT)",
    socCode: "29-1123",
    adzunaCategory: "healthcare-nursing-jobs",
    nationalBaseSalary: 99500,
    demandIndex: 1.18,
    growthRatePct: 14.0,
    skills: [
      "Musculoskeletal Rehab",
      "Mobility Assessment",
      "Therapeutic Exercise",
      "Pain Management",
    ],
    tools: [
      "WebPT / EHR",
      "Goniometry & Force Plates",
      "Electrotherapy / Ultrasound",
    ],
  },
  {
    id: "pharmacist",
    category: "Healthcare",
    title: "Clinical & Retail Pharmacist",
    socCode: "29-1051",
    adzunaCategory: "healthcare-nursing-jobs",
    nationalBaseSalary: 136000,
    demandIndex: 1.04,
    growthRatePct: 5.0,
    skills: [
      "Medication Therapy Mgmt",
      "Drug Interaction Review",
      "Immunizations",
      "Regulatory Compliance",
    ],
    tools: [
      "Connector / PDX",
      "Epic Willow",
      "Clinical Pharmacology Databases",
    ],
  },
  {
    id: "health-info-manager",
    category: "Healthcare",
    title: "Health Information & Clinical Systems Specialist",
    socCode: "29-9021",
    adzunaCategory: "healthcare-nursing-jobs",
    nationalBaseSalary: 78000,
    demandIndex: 1.14,
    growthRatePct: 16.0,
    skills: [
      "HIPAA Compliance",
      "Clinical Data Integrity",
      "ICD-10 / CPT Coding",
      "Workflow Optimization",
    ],
    tools: ["Epic / Cerner", "SQL / Excel", "HL7 / FHIR Standards"],
  },

  // Construction & Trades
  {
    id: "electrician",
    category: "Construction & Trades",
    title: "Commercial & Residential Electrician",
    socCode: "47-2111",
    adzunaCategory: "trade-construction-jobs",
    nationalBaseSalary: 68500,
    demandIndex: 1.31,
    growthRatePct: 11.0,
    skills: [
      "NEC Code Compliance",
      "Blueprint Reading",
      "Circuit Troubleshooting",
      "Panel Installation",
    ],
    tools: [
      "Multimeter / Fluke",
      "Conduit Bender",
      "Thermal Imaging",
      "Schematics",
    ],
  },
  {
    id: "plumber-pipefitter",
    category: "Construction & Trades",
    title: "Plumber & Steamfitter",
    socCode: "47-2152",
    adzunaCategory: "trade-construction-jobs",
    nationalBaseSalary: 66000,
    demandIndex: 1.2,
    growthRatePct: 6.0,
    skills: [
      "Hydronic & Sanitary Systems",
      "Pipefitting & Brazing",
      "Leak Diagnostics",
      "Code Inspections",
    ],
    tools: [
      "Press Tools",
      "Inspection Cameras",
      "Pipe Threaders",
      "CAD/Isometrics",
    ],
  },
  {
    id: "hvac-technician",
    category: "Construction & Trades",
    title: "HVACR Technician",
    socCode: "49-9021",
    adzunaCategory: "trade-construction-jobs",
    nationalBaseSalary: 62500,
    demandIndex: 1.25,
    growthRatePct: 9.0,
    skills: [
      "Refrigeration & EPA 608",
      "Heat Pump Diagnostics",
      "Airflow Balancing",
      "Control Wiring",
    ],
    tools: [
      "Manifold Gauges",
      "Digital Psychrometer",
      "BMS Controls",
      "Combustion Analyzer",
    ],
  },
  {
    id: "construction-manager",
    category: "Construction & Trades",
    title: "Construction Project Manager",
    socCode: "11-9021",
    adzunaCategory: "trade-construction-jobs",
    nationalBaseSalary: 106000,
    demandIndex: 1.16,
    growthRatePct: 8.7,
    skills: [
      "CPM Scheduling",
      "Cost Estimating & Bidding",
      "OSHA Safety Mgmt",
      "Subcontractor Contracting",
    ],
    tools: ["Procore", "Primavera P6 / MS Project", "Bluebeam Revu", "Excel"],
  },
  {
    id: "carpenter-millwright",
    category: "Construction & Trades",
    title: "Carpenter & Industrial Millwright",
    socCode: "47-2031",
    adzunaCategory: "trade-construction-jobs",
    nationalBaseSalary: 61000,
    demandIndex: 1.09,
    growthRatePct: 5.2,
    skills: [
      "Framing & Finish Carpentry",
      "Machinery Alignment",
      "Rigging & Leveling",
      "Blueprint Layout",
    ],
    tools: [
      "Laser Levels",
      "Precision Saws",
      "Dial Indicators",
      "Rigging Gear",
    ],
  },

  // Finance & Accounting
  {
    id: "financial-analyst",
    category: "Finance & Accounting",
    title: "Financial Analyst (FP&A)",
    socCode: "13-2051",
    adzunaCategory: "accounting-finance-jobs",
    nationalBaseSalary: 96000,
    demandIndex: 1.08,
    growthRatePct: 8.5,
    skills: [
      "3-Statement Financial Modeling",
      "Variance Analysis",
      "Forecasting",
      "DCF & Valuation",
    ],
    tools: [
      "Excel (XLOOKUP/PowerQuery)",
      "SQL",
      "PowerBI / Tableau",
      "NetSuite / SAP",
    ],
  },
  {
    id: "accountant-cpa",
    category: "Finance & Accounting",
    title: "Staff / Senior Accountant (CPA)",
    socCode: "13-2011",
    adzunaCategory: "accounting-finance-jobs",
    nationalBaseSalary: 86000,
    demandIndex: 1.14,
    growthRatePct: 6.4,
    skills: [
      "GAAP Reporting",
      "Month-End Close",
      "Account Reconciliations",
      "Audit Readiness",
    ],
    tools: [
      "NetSuite / SAP / QuickBooks",
      "Excel",
      "Workiva / FloQast",
      "CaseWare",
    ],
  },
  {
    id: "investment-wealth-advisor",
    category: "Finance & Accounting",
    title: "Financial & Wealth Advisor",
    socCode: "13-2052",
    adzunaCategory: "accounting-finance-jobs",
    nationalBaseSalary: 104000,
    demandIndex: 1.11,
    growthRatePct: 13.0,
    skills: [
      "Portfolio Construction",
      "Tax & Retirement Planning",
      "Client Advisory",
      "Risk Profiling",
    ],
    tools: [
      "eMoney / MoneyGuidePro",
      "Bloomberg / Morningstar",
      "CRM Platforms",
    ],
  },
  {
    id: "credit-risk-analyst",
    category: "Finance & Accounting",
    title: "Credit & Risk Management Analyst",
    socCode: "13-2099",
    adzunaCategory: "accounting-finance-jobs",
    nationalBaseSalary: 98000,
    demandIndex: 1.06,
    growthRatePct: 7.0,
    skills: [
      "Credit Underwriting",
      "Stress Testing",
      "Regulatory Capital",
      "Quantitative Risk",
    ],
    tools: ["SQL / Python", "SAS / R", "Excel", "Risk Reporting Suites"],
  },

  // Engineering
  {
    id: "civil-engineer",
    category: "Engineering",
    title: "Civil & Infrastructure Engineer",
    socCode: "17-2051",
    adzunaCategory: "engineering-jobs",
    nationalBaseSalary: 99500,
    demandIndex: 1.17,
    growthRatePct: 6.4,
    skills: [
      "Site & Grading Design",
      "Hydrology & Drainage",
      "Cost Estimation",
      "Municipal Permitting",
    ],
    tools: ["AutoCAD Civil 3D", "HEC-RAS", "MicroStation", "ArcGIS"],
  },
  {
    id: "mechanical-engineer",
    category: "Engineering",
    title: "Mechanical Design Engineer",
    socCode: "17-2141",
    adzunaCategory: "engineering-jobs",
    nationalBaseSalary: 102000,
    demandIndex: 1.12,
    growthRatePct: 10.5,
    skills: [
      "CAD / 3D Modeling",
      "GD&T & Tolerance Stackup",
      "FEA / Thermal Analysis",
      "DFM / DFA",
    ],
    tools: [
      "SolidWorks / Creo / NX",
      "ANSYS",
      "PLM Systems",
      "3D Printing / Prototyping",
    ],
  },
  {
    id: "electrical-engineer",
    category: "Engineering",
    title: "Electrical & Power Systems Engineer",
    socCode: "17-2071",
    adzunaCategory: "engineering-jobs",
    nationalBaseSalary: 112000,
    demandIndex: 1.2,
    growthRatePct: 8.8,
    skills: [
      "Power Distribution",
      "PCB & Circuit Design",
      "Arc Flash & Load Studies",
      "Grid Integration",
    ],
    tools: [
      "ETAP / SKM",
      "Altium Designer",
      "MATLAB / Simulink",
      "AutoCAD Electrical",
    ],
  },
  {
    id: "industrial-systems-engineer",
    category: "Engineering",
    title: "Industrial & Process Engineer",
    socCode: "17-2112",
    adzunaCategory: "engineering-jobs",
    nationalBaseSalary: 99000,
    demandIndex: 1.13,
    growthRatePct: 12.1,
    skills: [
      "Lean Six Sigma",
      "Value Stream Mapping",
      "Throughput Optimization",
      "Simulation",
    ],
    tools: ["Minitab", "Arena / FlexSim", "ERP / MES", "PowerBI"],
  },

  // Data, Science & Analytics
  {
    id: "data-scientist",
    category: "Data, Science & Analytics",
    title: "Data Scientist & ML Engineer",
    socCode: "15-2051",
    adzunaCategory: "it-jobs",
    nationalBaseSalary: 134000,
    demandIndex: 1.28,
    growthRatePct: 35.2,
    skills: [
      "Machine Learning",
      "Statistical Modeling",
      "Experimentation / A/B",
      "Feature Engineering",
    ],
    tools: [
      "Python",
      "PyTorch / scikit-learn",
      "SQL",
      "Snowflake / Databricks",
      "Jupyter",
    ],
  },
  {
    id: "data-analyst-bi",
    category: "Data, Science & Analytics",
    title: "Business Intelligence & Data Analyst",
    socCode: "15-2051",
    adzunaCategory: "it-jobs",
    nationalBaseSalary: 88000,
    demandIndex: 1.19,
    growthRatePct: 23.0,
    skills: [
      "Data Visualization",
      "KPI Design",
      "ETL / Data Cleaning",
      "Ad-Hoc SQL Querying",
    ],
    tools: ["SQL", "Tableau / PowerBI", "Python / Excel", "dbt"],
  },
  {
    id: "actuary",
    category: "Data, Science & Analytics",
    title: "Actuarial Analyst / Actuary",
    socCode: "15-2011",
    adzunaCategory: "accounting-finance-jobs",
    nationalBaseSalary: 122000,
    demandIndex: 1.1,
    growthRatePct: 22.8,
    skills: [
      "Stochastic Modeling",
      "Pricing & Reserving",
      "Survival & Risk Theory",
      "SOA/CAS Exams",
    ],
    tools: ["R / Python", "SQL", "Excel / VBA", "Prophet / AXIS"],
  },

  // Business, Sales & Marketing
  {
    id: "marketing-manager",
    category: "Business, Sales & Marketing",
    title: "Marketing & Growth Manager",
    socCode: "11-2021",
    adzunaCategory: "pr-advertising-marketing-jobs",
    nationalBaseSalary: 112000,
    demandIndex: 1.04,
    growthRatePct: 7.8,
    skills: [
      "Demand Generation",
      "Campaign Attribution",
      "Brand Strategy",
      "Conversion Optimization",
    ],
    tools: ["HubSpot / Marketo", "GA4", "Meta/Google Ads", "Figma", "CRM"],
  },
  {
    id: "account-executive-b2b",
    category: "Business, Sales & Marketing",
    title: "B2B Enterprise Account Executive",
    socCode: "41-3091",
    adzunaCategory: "sales-jobs",
    nationalBaseSalary: 115000,
    demandIndex: 1.15,
    growthRatePct: 5.0,
    skills: [
      "Enterprise Pipeline",
      "Solution Selling",
      "Contract Negotiation",
      "Account Expansion",
    ],
    tools: ["Salesforce", "Gong / Outreach", "LinkedIn Sales Nav", "Clari"],
  },
  {
    id: "hr-talent-partner",
    category: "Business, Sales & Marketing",
    title: "HR Business Partner & Talent Lead",
    socCode: "13-1071",
    adzunaCategory: "hr-jobs",
    nationalBaseSalary: 84000,
    demandIndex: 1.05,
    growthRatePct: 6.5,
    skills: [
      "Employee Relations",
      "Total Rewards & Comp",
      "Talent Acquisition",
      "HR Compliance",
    ],
    tools: ["Workday", "Greenhouse / Lever", "HRIS Analytics", "Excel"],
  },

  // Education, Legal & Operations
  {
    id: "operations-logistics-mgr",
    category: "Education, Legal & Operations",
    title: "Supply Chain & Operations Manager",
    socCode: "11-3071",
    adzunaCategory: "logistics-warehouse-jobs",
    nationalBaseSalary: 104000,
    demandIndex: 1.14,
    growthRatePct: 9.0,
    skills: [
      "Inventory & S&OP",
      "Vendor Management",
      "Warehouse & Fleet Ops",
      "Cost Reduction",
    ],
    tools: ["SAP / Oracle SCM", "WMS / TMS", "Excel", "PowerBI"],
  },
  {
    id: "paralegal-legal-specialist",
    category: "Education, Legal & Operations",
    title: "Corporate Paralegal & Legal Specialist",
    socCode: "23-2011",
    adzunaCategory: "legal-jobs",
    nationalBaseSalary: 66000,
    demandIndex: 1.03,
    growthRatePct: 4.0,
    skills: [
      "Contract Review",
      "Legal Research",
      "Discovery & Compliance",
      "Corporate Governance",
    ],
    tools: ["LexisNexis / Westlaw", "CLM Platforms", "iManage", "MS Office"],
  },
  {
    id: "school-teacher",
    category: "Education, Legal & Operations",
    title: "K–12 Teacher / Instructional Specialist",
    socCode: "25-2031",
    adzunaCategory: "teaching-jobs",
    nationalBaseSalary: 64500,
    demandIndex: 1.18,
    growthRatePct: 3.5,
    skills: [
      "Curriculum Design",
      "Classroom Instruction",
      "IEP & Differentiated Learning",
      "Assessment",
    ],
    tools: [
      "Canvas / Google Classroom",
      "SIS Platforms",
      "EdTech Assessment Tools",
    ],
  },
];

const EMPLOYER_POOLS = {
  "it-jobs": [
    "Amazon / AWS",
    "Microsoft",
    "JPMorgan Chase Tech",
    "Capital One",
    "Accenture",
    "Deloitte Digital",
  ],
  "healthcare-nursing-jobs": [
    "HCA Healthcare",
    "CommonSpirit Health",
    "Ascension",
    "Kaiser Permanente",
    "Trinity Health",
  ],
  "trade-construction-jobs": [
    "AECOM",
    "Jacobs Solutions",
    "Kiewit",
    "Turner Construction",
    "Fluor Corporation",
  ],
  "accounting-finance-jobs": [
    "Deloitte",
    "PwC",
    "EY",
    "KPMG",
    "Fidelity Investments",
    "Charles Schwab",
  ],
  "engineering-jobs": [
    "AECOM",
    "Jacobs",
    "HDR Engineering",
    "Burns & McDonnell",
    "Lockheed Martin",
  ],
  "sales-jobs": ["Salesforce", "Oracle", "ServiceNow", "HubSpot", "Cisco"],
  "hr-jobs": ["Workday", "ADP", "Deloitte", "Accenture", "UnitedHealth Group"],
  "logistics-warehouse-jobs": [
    "UPS",
    "FedEx",
    "Maersk",
    "C.H. Robinson",
    "Amazon Logistics",
  ],
  "legal-jobs": [
    "Baker McKenzie",
    "Latham & Watkins",
    "In-House Corporate Legal",
    "Thomson Reuters",
  ],
  "teaching-jobs": [
    "Public School Districts",
    "Regional Charter Networks",
    "Higher Ed Systems",
    "EdTech Providers",
  ],
};

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const safeNum = (val, fallback) =>
  typeof val === "number" && Number.isFinite(val) ? val : fallback;

export function buildBaselineCareerMetrics(cityObj, careerProfile) {
  const safeCity = cityObj || {};
  const safeCareer = careerProfile || CAREER_PROFILES[0];
  const seed = hashSeed(`${safeCity.id || "city"}_${safeCareer.id || "role"}`);

  const metroMult = safeNum(safeCity.metroMultiplier, 1.0);
  const rank = safeNum(safeCity.popRankInState, 1);
  const rankFactor = rank === 1 ? 1.35 : rank === 2 ? 0.72 : 0.48;
  const scaleFactor = Math.max(0.35, metroMult * rankFactor);

  const stateBaseUnemp = safeCity.isInternational
    ? 4.4
    : 3.4 + (seed % 19) / 10;
  const unemploymentRate = Number(
    safeNum(stateBaseUnemp + (metroMult > 1.15 ? 0.3 : -0.15), 4.0).toFixed(1),
  );

  const servicesIdx = safeNum(safeCity.indices?.services, 100);
  const colWageFactor = 0.78 + (servicesIdx / 100) * 0.28;
  const nationalBase = safeNum(safeCareer.nationalBaseSalary, 95000);
  const demandIdx = safeNum(safeCareer.demandIndex, 1.05);
  const growthPct = safeNum(safeCareer.growthRatePct, 7.0);

  const rawMedian =
    nationalBase * colWageFactor * (0.9 + (metroMult - 1) * 0.55);
  const roleMedianSalary = Math.max(
    32000,
    Math.round(safeNum(rawMedian, 90000) / 500) * 500,
  );
  const roleMedianHourly = Number((roleMedianSalary / 2080).toFixed(2));

  const percentiles = {
    p10: Math.round(roleMedianSalary * 0.63),
    p25: Math.round(roleMedianSalary * 0.79),
    p50: roleMedianSalary,
    p75: Math.round(roleMedianSalary * 1.24),
    p90: Math.round(roleMedianSalary * 1.54),
  };

  const totalMetroEmployment = Math.max(
    420,
    Math.round(4800 * scaleFactor * demandIdx),
  );
  const annualJobOpenings = Math.max(
    45,
    Math.round(totalMetroEmployment * (0.075 + growthPct / 240)),
  );
  const activeVacancies = Math.max(
    18,
    Math.round(annualJobOpenings * (0.28 + (seed % 15) / 100) * demandIdx),
  );
  const demandRatio = Number(
    (activeVacancies / Math.max(1, totalMetroEmployment / 100)).toFixed(2),
  );

  const pool =
    EMPLOYER_POOLS[safeCareer.adzunaCategory] || EMPLOYER_POOLS["it-jobs"];
  const offset = seed % pool.length;
  const topCompanies = [0, 1, 2, 3].map((idx) => {
    const company = pool[(offset + idx) % pool.length];
    const openRoles = Math.max(
      3,
      Math.round(activeVacancies * (0.22 - idx * 0.04)),
    );
    return { name: company, openRoles };
  });

  const bucketWidth = 15000;
  const startBucket = Math.max(
    30000,
    Math.floor((roleMedianSalary - 45000) / bucketWidth) * bucketWidth,
  );
  const salaryHistogram = Array.from({ length: 6 }, (_, i) => {
    const low = startBucket + i * bucketWidth;
    const high = low + bucketWidth;
    const distFromCenter = Math.abs(i - 2.5);
    const count = Math.max(
      2,
      Math.round(
        activeVacancies *
          0.34 *
          Math.exp(-0.45 * distFromCenter * distFromCenter),
      ),
    );
    return {
      rangeLabel: `$${Math.round(low / 1000)}k–$${Math.round(high / 1000)}k`,
      low,
      high,
      jobCount: count,
    };
  });

  const years = ["2022", "2023", "2024", "2025", "2026"];
  const historicalSalaryTrend = years.map((yr, idx) => ({
    year: yr,
    medianSalary: Math.round(roleMedianSalary * Math.pow(1.036, idx - 4)),
  }));

  const stateFipsClean = String(safeCity.censusStateFips || "29").padEnd(
    7,
    "0",
  );
  const socClean = String(safeCareer.socCode || "15-1252").replace("-", "");
  const oewsSeriesCode = `OEUS${stateFipsClean}${socClean}03`;
  const lausSeriesCode = `LAUMT${String(safeCity.censusStateFips || "29")}000000000003`;

  const blsTimeSeries = years.map((yr, idx) => ({
    period: `${yr} Annual`,
    oewsEmployment: Math.round(totalMetroEmployment * (0.94 + idx * 0.015)),
    oewsMeanWage: Math.round(
      roleMedianSalary * 1.07 * Math.pow(1.035, idx - 4),
    ),
    lausUnemploymentRate: Number(
      Math.max(2.1, unemploymentRate + (2 - idx) * 0.22).toFixed(1),
    ),
  }));

  return {
    socCode: safeCareer.socCode || "15-1252",
    careerTitle: safeCareer.title || "Software Engineer",
    careerCategory: safeCareer.category || "Technology",
    unemploymentRate,
    roleMedianSalary,
    roleMedianHourly,
    percentiles,
    totalMetroEmployment,
    annualJobOpenings,
    activeVacancies,
    demandRatio,
    topCompanies,
    salaryHistogram,
    historicalSalaryTrend,
    skills: Array.isArray(safeCareer.skills) ? safeCareer.skills : [],
    tools: Array.isArray(safeCareer.tools) ? safeCareer.tools : [],
    blsMeta: {
      oewsSeriesId: oewsSeriesCode,
      lausSeriesId: lausSeriesCode,
      series: blsTimeSeries,
    },
    apiStatus: {
      adzunaLive: false,
      cosLive: false,
      blsLive: false,
      label: "No API Key Configured — Showing Calibrated Baseline",
    },
    dataSource: "Calibrated LMI Baseline (No API Key Configured)",
  };
}
