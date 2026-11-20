// src/data/legislationData.js

export const POLICY_DOMAINS = [
  "All Domains",
  "Taxation & Fees",
  "Housing & Zoning",
  "Energy & Utilities",
  "Labor & Healthcare",
];

export const ALL_MOCK_QUARTERS = [
  "2024-Q1",
  "2024-Q2",
  "2024-Q3",
  "2024-Q4",
  "2025-Q1",
  "2025-Q2",
  "2025-Q3",
  "2025-Q4",
  "2026-Q1",
  "2026-Q2",
  "2026-Q3",
  "2026-Q4",
];

function createBillRecord(config) {
  return {
    id: config.id,
    bill_number: config.billNumber,
    title: config.title,
    domain: config.domain,
    introduced_date: config.introducedDate,
    status_date: config.statusDate,
    outcome: config.outcome,
    executiveAction: config.executiveAction,
    summary: config.summary,
    colImpactNote: config.colImpactNote,
    sponsor: config.sponsor,
    rollCall: {
      rollCallId: `RC-${String(config.id).toUpperCase()}`,
      yea: Number(config.yea) || 0,
      nay: Number(config.nay) || 0,
      yeaVoters: Array.isArray(config.yeaVoters) ? config.yeaVoters : [],
      nayVoters: Array.isArray(config.nayVoters) ? config.nayVoters : [],
    },
  };
}

const BIDEN_ADMIN_POWER = {
  president: { name: "Joseph R. Biden Jr.", party: "D" },
  vicePresident: { name: "Kamala D. Harris", party: "D" },
  senate: { dem: 51, rep: 49, ind: 0, control: "D" },
  house: { dem: 213, rep: 220, ind: 0, control: "R" },
};

const TRUMP_ADMIN_POWER = {
  president: { name: "Donald J. Trump", party: "R" },
  vicePresident: { name: "JD Vance", party: "R" },
  senate: { dem: 45, rep: 53, ind: 2, control: "R" },
  house: { dem: 214, rep: 218, ind: 0, control: "R" },
};

export const MOCK_CONGRESS_AND_LEGISCAN_PAYLOAD = {
  source: "Mock (Congress.gov v3 + LegiScan + @unitedstates shape)",
  federalExecutive: {
    president: {
      name: "Donald J. Trump",
      party: "R",
      bioguide_id: "EXEC-POTUS-47",
    },
    vicePresident: { name: "JD Vance", party: "R", bioguide_id: "EXEC-VP-50" },
  },
  quarters: {
    "2024-Q1": {
      quarter: "2024-Q1",
      hasData: true,
      federalPower: BIDEN_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "hr-2872-118",
          billNumber: "H.R.2872",
          title:
            "Further Additional Continuing Appropriations & Infrastructure Continuity Act",
          domain: "Energy & Utilities",
          introducedDate: "2024-01-17",
          statusDate: "2024-01-19",
          outcome: "Enacted / Signed into Law",
          executiveAction: "Signed into Law (POTUS: D)",
          summary:
            "Maintains federal grid modernization, clean energy transmission grants, and public transit funding without interruption.",
          colImpactNote:
            "Prevents abrupt funding pauses for regional utility and transit programs.",
          sponsor: {
            name: "Rep. Kay Granger",
            party: "R",
            state: "TX",
            bioguide_id: "G000377",
          },
          yea: 314,
          nay: 108,
          yeaVoters: [
            {
              name: "Rep. Kay Granger",
              party: "R",
              state: "TX-12",
              bioguide_id: "G000377",
            },
            {
              name: "Rep. Rosa DeLauro",
              party: "D",
              state: "CT-03",
              bioguide_id: "D000216",
            },
          ],
          nayVoters: [
            {
              name: "Rep. Chip Roy",
              party: "R",
              state: "TX-21",
              bioguide_id: "R000614",
            },
            {
              name: "Rep. Pramila Jayapal",
              party: "D",
              state: "WA-07",
              bioguide_id: "J000298",
            },
          ],
        }),
      ],
    },
    "2024-Q2": {
      quarter: "2024-Q2",
      hasData: true,
      federalPower: BIDEN_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "hr-7024-118",
          billNumber: "H.R.7024",
          title:
            "Tax Relief for American Families and Workers Act (COL & Child Tax Provisions)",
          domain: "Taxation & Fees",
          introducedDate: "2024-01-29",
          statusDate: "2024-05-14",
          outcome: "Passed House; Advanced in Senate",
          executiveAction: "Endorsed by White House (POTUS: D)",
          summary:
            "Expands the refundable Child Tax Credit inflation adjustment, restores domestic R&D expensing, and increases Low-Income Housing Tax Credit (LIHTC) state allocations.",
          colImpactNote:
            "Directly reduces effective federal tax liability for households with dependents and supports rental supply.",
          sponsor: {
            name: "Rep. Jason Smith",
            party: "R",
            state: "MO",
            bioguide_id: "S001195",
          },
          yea: 357,
          nay: 70,
          yeaVoters: [
            {
              name: "Rep. Jason Smith",
              party: "R",
              state: "MO-08",
              bioguide_id: "S001195",
            },
            {
              name: "Rep. Emanuel Cleaver",
              party: "D",
              state: "MO-05",
              bioguide_id: "C001061",
            },
            {
              name: "Sen. Maria Cantwell",
              party: "D",
              state: "WA",
              bioguide_id: "C000127",
            },
          ],
          nayVoters: [
            {
              name: "Rep. Chip Roy",
              party: "R",
              state: "TX-21",
              bioguide_id: "R000614",
            },
            {
              name: "Rep. Alexandria Ocasio-Cortez",
              party: "D",
              state: "NY-14",
              bioguide_id: "O000172",
            },
          ],
        }),
        createBillRecord({
          id: "hr-8117-118",
          billNumber: "H.R.8117",
          title: "Housing Supply & Zoning Modernization Incentives Act",
          domain: "Housing & Zoning",
          introducedDate: "2024-04-23",
          statusDate: "2024-06-18",
          outcome: "Subcommittee Markup",
          executiveAction: "HUD Technical Review Completed",
          summary:
            "Authorizes federal infrastructure matching grants for municipalities that streamline zoning and allow accessory dwelling units (ADUs).",
          colImpactNote:
            "Targets urban housing bottlenecks to ease rent growth.",
          sponsor: {
            name: "Rep. Mike Flood",
            party: "R",
            state: "NE",
            bioguide_id: "F000474",
          },
          yea: 284,
          nay: 132,
          yeaVoters: [
            {
              name: "Rep. Mike Flood",
              party: "R",
              state: "NE-01",
              bioguide_id: "F000474",
            },
            {
              name: "Rep. Ritchie Torres",
              party: "D",
              state: "NY-15",
              bioguide_id: "T000486",
            },
          ],
          nayVoters: [
            {
              name: "Rep. Thomas Massie",
              party: "R",
              state: "KY-04",
              bioguide_id: "M001184",
            },
          ],
        }),
      ],
    },
    "2024-Q3": {
      quarter: "2024-Q3",
      hasData: true,
      federalPower: BIDEN_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "s-870-118",
          billNumber: "S.870",
          title:
            "Accelerating Deployment of Versatile, Advanced Nuclear for Clean Energy (ADVANCE) Act",
          domain: "Energy & Utilities",
          introducedDate: "2024-03-15",
          statusDate: "2024-07-09",
          outcome: "Enacted / Signed into Law",
          executiveAction: "Signed into Law (POTUS: D)",
          summary:
            "Reduces NRC licensing timelines for advanced nuclear reactors and domestic fuel supply chains to support long-term baseload electricity stability.",
          colImpactNote:
            "Supports long-term power grid reliability and utility cost stability.",
          sponsor: {
            name: "Sen. Shelley Moore Capito",
            party: "R",
            state: "WV",
            bioguide_id: "C001047",
          },
          yea: 88,
          nay: 2,
          yeaVoters: [
            {
              name: "Sen. Shelley Moore Capito",
              party: "R",
              state: "WV",
              bioguide_id: "C001047",
            },
            {
              name: "Sen. Sheldon Whitehouse",
              party: "D",
              state: "RI",
              bioguide_id: "W000802",
            },
          ],
          nayVoters: [
            {
              name: "Sen. Mike Lee",
              party: "R",
              state: "UT",
              bioguide_id: "L000577",
            },
          ],
        }),
      ],
    },
    "2024-Q4": {
      quarter: "2024-Q4",
      hasData: true,
      federalPower: BIDEN_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "hr-7777-118",
          billNumber: "H.R.7777",
          title: "Veterans Compensation Cost-of-Living Adjustment Act of 2024",
          domain: "Labor & Healthcare",
          introducedDate: "2024-03-21",
          statusDate: "2024-11-25",
          outcome: "Enacted / Signed into Law",
          executiveAction: "Signed into Law (POTUS: D)",
          summary:
            "Aligns statutory benefit adjustments with consumer price inflation indices to preserve household purchasing power.",
          colImpactNote:
            "Adjusts benefit payouts in line with CPI-W inflation.",
          sponsor: {
            name: "Rep. Derrick Van Orden",
            party: "R",
            state: "WI",
            bioguide_id: "V000135",
          },
          yea: 420,
          nay: 0,
          yeaVoters: [
            {
              name: "Rep. Derrick Van Orden",
              party: "R",
              state: "WI-03",
              bioguide_id: "V000135",
            },
            {
              name: "Rep. Mark Takano",
              party: "D",
              state: "CA-39",
              bioguide_id: "T000472",
            },
          ],
          nayVoters: [],
        }),
      ],
    },
    // Pretend quarter with NO data (intentionally empty; rendered neutrally with no default highlight)
    "2025-Q1": {
      quarter: "2025-Q1",
      hasData: false,
      noDataReason:
        "Simulated gap: No legislative or roll-call records ingested for 2025-Q1 in this mock dataset.",
      federalPower: TRUMP_ADMIN_POWER,
      federalBills: [],
    },
    "2025-Q2": {
      quarter: "2025-Q2",
      hasData: true,
      federalPower: TRUMP_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "hr-1-119",
          billNumber: "H.R.1",
          title:
            "Full Expensing, Standard Deduction & Utility Deregulation Act",
          domain: "Taxation & Fees",
          introducedDate: "2025-03-10",
          statusDate: "2025-05-22",
          outcome: "Enacted / Signed into Law",
          executiveAction: "Signed into Law by President Donald J. Trump (R)",
          summary:
            "Extends standard deduction thresholds, indexes tax brackets, and expedites energy permitting to reduce transportation and utility cost pressures.",
          colImpactNote:
            "Affects federal tax withholding and energy/transportation cost indices.",
          sponsor: {
            name: "Rep. Steve Scalise",
            party: "R",
            state: "LA",
            bioguide_id: "S001176",
          },
          yea: 218,
          nay: 214,
          yeaVoters: [
            {
              name: "Rep. Steve Scalise",
              party: "R",
              state: "LA-01",
              bioguide_id: "S001176",
            },
            {
              name: "Sen. John Thune",
              party: "R",
              state: "SD",
              bioguide_id: "T000250",
            },
          ],
          nayVoters: [
            {
              name: "Rep. Hakeem Jeffries",
              party: "D",
              state: "NY-08",
              bioguide_id: "J000294",
            },
            {
              name: "Sen. Bernie Sanders",
              party: "I",
              state: "VT",
              bioguide_id: "S000033",
            },
          ],
        }),
        createBillRecord({
          id: "hr-2090-119",
          billNumber: "H.R.2090",
          title: "Employer Health HSA & Wage Transparency Act",
          domain: "Labor & Healthcare",
          introducedDate: "2025-04-02",
          statusDate: "2025-06-11",
          outcome: "Passed House",
          executiveAction: "Referred to Senate HELP Committee",
          summary:
            "Expands pre-tax Health Savings Account contribution limits and promotes hospital price transparency.",
          colImpactNote:
            "Increases pre-tax healthcare savings capacity and out-of-pocket price visibility.",
          sponsor: {
            name: "Rep. Brett Guthrie",
            party: "R",
            state: "KY",
            bioguide_id: "G000558",
          },
          yea: 226,
          nay: 201,
          yeaVoters: [
            {
              name: "Rep. Brett Guthrie",
              party: "R",
              state: "KY-02",
              bioguide_id: "G000558",
            },
          ],
          nayVoters: [
            {
              name: "Rep. Suzan DelBene",
              party: "D",
              state: "WA-01",
              bioguide_id: "D000617",
            },
          ],
        }),
      ],
    },
    "2025-Q3": {
      quarter: "2025-Q3",
      hasData: true,
      federalPower: TRUMP_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "s-1140-119",
          billNumber: "S.1140",
          title: "Baseload Power & Permitting Streamlining Act",
          domain: "Energy & Utilities",
          introducedDate: "2025-02-18",
          statusDate: "2025-08-19",
          outcome: "Passed Senate",
          executiveAction: "Sent to House Energy & Commerce",
          summary:
            "Establishes review timelines for power generation and grid transmission projects to reduce summer peak electricity cost pressure.",
          colImpactNote:
            "Addresses electricity supply bottlenecks and peak utility rates.",
          sponsor: {
            name: "Sen. Shelley Moore Capito",
            party: "R",
            state: "WV",
            bioguide_id: "C001047",
          },
          yea: 61,
          nay: 38,
          yeaVoters: [
            {
              name: "Sen. Shelley Moore Capito",
              party: "R",
              state: "WV",
              bioguide_id: "C001047",
            },
            {
              name: "Sen. John Fetterman",
              party: "D",
              state: "PA",
              bioguide_id: "F000479",
            },
          ],
          nayVoters: [
            {
              name: "Sen. Elizabeth Warren",
              party: "D",
              state: "MA",
              bioguide_id: "W000817",
            },
          ],
        }),
      ],
    },
    "2025-Q4": {
      quarter: "2025-Q4",
      hasData: true,
      federalPower: TRUMP_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "hr-3401-119",
          billNumber: "H.R.3401",
          title: "Workforce Apprenticeship & Housing Construction Grant Act",
          domain: "Housing & Zoning",
          introducedDate: "2025-09-12",
          statusDate: "2025-11-18",
          outcome: "Passed House",
          executiveAction: "Pending Senate Action",
          summary:
            "Expands skilled-trades apprenticeship grants for residential construction and electrical/plumbing workforce pipelines.",
          colImpactNote:
            "Aims to ease skilled labor constraints in residential construction.",
          sponsor: {
            name: "Rep. Lloyd Smucker",
            party: "R",
            state: "PA",
            bioguide_id: "S001199",
          },
          yea: 268,
          nay: 154,
          yeaVoters: [
            {
              name: "Rep. Lloyd Smucker",
              party: "R",
              state: "PA-11",
              bioguide_id: "S001199",
            },
            {
              name: "Rep. Sharice Davids",
              party: "D",
              state: "KS-03",
              bioguide_id: "D000629",
            },
          ],
          nayVoters: [
            {
              name: "Rep. Matt Rosendale",
              party: "R",
              state: "MT-02",
              bioguide_id: "R000614",
            },
          ],
        }),
      ],
    },
    "2026-Q1": {
      quarter: "2026-Q1",
      hasData: true,
      federalPower: TRUMP_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "s-1780-119",
          billNumber: "S.1780",
          title:
            "Prescription Drug Rebate Pass-Through & Out-of-Pocket Cap Act",
          domain: "Labor & Healthcare",
          introducedDate: "2026-01-14",
          statusDate: "2026-03-08",
          outcome: "Committee Reported",
          executiveAction: "Senate Finance Markup Completed",
          summary:
            "Requires pharmacy benefit managers to pass negotiated rebates directly to plan sponsors and enrollees at the point of sale.",
          colImpactNote:
            "Targets out-of-pocket prescription and healthcare spending.",
          sponsor: {
            name: "Sen. Chuck Grassley",
            party: "R",
            state: "IA",
            bioguide_id: "G000386",
          },
          yea: 78,
          nay: 19,
          yeaVoters: [
            {
              name: "Sen. Chuck Grassley",
              party: "R",
              state: "IA",
              bioguide_id: "G000386",
            },
            {
              name: "Sen. Ron Wyden",
              party: "D",
              state: "OR",
              bioguide_id: "W000779",
            },
          ],
          nayVoters: [
            {
              name: "Sen. Mike Lee",
              party: "R",
              state: "UT",
              bioguide_id: "L000577",
            },
          ],
        }),
      ],
    },
    "2026-Q2": {
      quarter: "2026-Q2",
      hasData: true,
      federalPower: TRUMP_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "hr-4120-119",
          billNumber: "H.R.4120",
          title: "Regional Freight Corridor & Fuel Supply Resilience Act",
          domain: "Energy & Utilities",
          introducedDate: "2026-03-25",
          statusDate: "2026-05-29",
          outcome: "Passed House",
          executiveAction: "Sent to Senate Commerce",
          summary:
            "Improves intermodal freight corridors and refinery logistics to reduce commercial shipping and consumer goods transport costs.",
          colImpactNote: "Targets goods and transportation cost components.",
          sponsor: {
            name: "Rep. Sam Graves",
            party: "R",
            state: "MO",
            bioguide_id: "G000546",
          },
          yea: 292,
          nay: 125,
          yeaVoters: [
            {
              name: "Rep. Sam Graves",
              party: "R",
              state: "MO-06",
              bioguide_id: "G000546",
            },
            {
              name: "Rep. Rick Larsen",
              party: "D",
              state: "WA-02",
              bioguide_id: "L000560",
            },
          ],
          nayVoters: [
            {
              name: "Rep. Earl Blumenauer",
              party: "D",
              state: "OR-03",
              bioguide_id: "B000574",
            },
          ],
        }),
      ],
    },
    "2026-Q3": {
      quarter: "2026-Q3",
      hasData: true,
      federalPower: TRUMP_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "s-2410-119",
          billNumber: "S.2410",
          title: "Metro Housing Affordability & Land-Use Grant Act",
          domain: "Housing & Zoning",
          introducedDate: "2026-07-15",
          statusDate: "2026-09-17",
          outcome: "Passed Senate",
          executiveAction: "Sent to House Financial Services",
          summary:
            "Converts underutilized federal parcels in high-cost metros into workforce housing and expedites multifamily financing.",
          colImpactNote:
            "Targets housing supply in high-cost metropolitan markets.",
          sponsor: {
            name: "Sen. Tim Scott",
            party: "R",
            state: "SC",
            bioguide_id: "S001184",
          },
          yea: 72,
          nay: 26,
          yeaVoters: [
            {
              name: "Sen. Tim Scott",
              party: "R",
              state: "SC",
              bioguide_id: "S001184",
            },
            {
              name: "Sen. Maria Cantwell",
              party: "D",
              state: "WA",
              bioguide_id: "C000127",
            },
          ],
          nayVoters: [
            {
              name: "Sen. Mike Lee",
              party: "R",
              state: "UT",
              bioguide_id: "L000577",
            },
          ],
        }),
      ],
    },
    "2026-Q4": {
      quarter: "2026-Q4",
      hasData: true,
      federalPower: TRUMP_ADMIN_POWER,
      federalBills: [
        createBillRecord({
          id: "hr-4812-119",
          billNumber: "H.R.4812",
          title: "State & Local Tax Cap Adjustment & Grocery Tax Relief Act",
          domain: "Taxation & Fees",
          introducedDate: "2026-08-05",
          statusDate: "2026-11-04",
          outcome: "Passed House",
          executiveAction: "Awaiting Senate Consideration",
          summary:
            "Adjusts SALT deduction caps for married filers and provides federal matching grants for state grocery sales tax relief.",
          colImpactNote:
            "Impacts state/local tax deductions and household grocery budgets.",
          sponsor: {
            name: "Rep. Nicole Malliotakis",
            party: "R",
            state: "NY",
            bioguide_id: "M000317",
          },
          yea: 241,
          nay: 186,
          yeaVoters: [
            {
              name: "Rep. Nicole Malliotakis",
              party: "R",
              state: "NY-11",
              bioguide_id: "M000317",
            },
            {
              name: "Rep. Don Beyer",
              party: "D",
              state: "VA-08",
              bioguide_id: "B001292",
            },
          ],
          nayVoters: [
            {
              name: "Rep. Jodey Arrington",
              party: "R",
              state: "TX-19",
              bioguide_id: "A000375",
            },
            {
              name: "Rep. Lloyd Doggett",
              party: "D",
              state: "TX-37",
              bioguide_id: "D000399",
            },
          ],
        }),
      ],
    },
  },
};

export function getQuarterRecord(quarterKey) {
  if (quarterKey && MOCK_CONGRESS_AND_LEGISCAN_PAYLOAD.quarters[quarterKey]) {
    return MOCK_CONGRESS_AND_LEGISCAN_PAYLOAD.quarters[quarterKey];
  }
  return {
    quarter: quarterKey || "2026-Q4",
    hasData: false,
    noDataReason: `No mock legislative or roll-call records logged for ${quarterKey || "this quarter"}.`,
    federalPower: TRUMP_ADMIN_POWER,
    federalBills: [],
  };
}

export function buildMockStateLegislativeQuarter(cityObj, quarterKey) {
  const stateCode = (cityObj && cityObj.state) || "MO";
  const stateName = (cityObj && cityObj.stateName) || "Missouri";
  const cityName = (cityObj && cityObj.city) || stateName;
  const jurisdictionId = `ocd-jurisdiction/country:us/state:${stateCode.toLowerCase()}/government`;

  const repStates = [
    "MO",
    "TX",
    "FL",
    "OH",
    "TN",
    "IN",
    "AL",
    "AR",
    "SC",
    "KY",
    "UT",
    "OK",
    "LA",
    "GA",
  ];
  const demStates = [
    "CA",
    "WA",
    "NY",
    "IL",
    "MA",
    "CO",
    "NJ",
    "MN",
    "OR",
    "MD",
    "CT",
    "HI",
    "DC",
    "VA",
  ];

  const isRepState = repStates.includes(stateCode);
  const isDemState = demStates.includes(stateCode);

  const govParty = isRepState ? "R" : isDemState ? "D" : "R";
  const senateParty = isRepState ? "R" : isDemState ? "D" : "D";
  const houseParty = isRepState ? "R" : isDemState ? "D" : "R";
  const trifectaParty =
    govParty === senateParty && senateParty === houseParty ? govParty : "Split";
  const oppParty = govParty === "D" ? "R" : "D";
  const stateCodeLower = stateCode.toLowerCase();

  const qRec = getQuarterRecord(quarterKey);
  const hasData = Boolean(qRec.hasData);
  const yearStr = String(quarterKey || "2026-Q4").slice(0, 4);

  const stateBills = !hasData
    ? []
    : [
        createBillRecord({
          id: `os-${stateCodeLower}-${quarterKey}-101`,
          billNumber: `${stateCode === "CA" ? "AB" : "HB"} 412`,
          title: `${cityName} Residential Zoning, ADU & Rent Stabilization Act`,
          domain: "Housing & Zoning",
          introducedDate: `${yearStr}-02-10`,
          statusDate: `${yearStr}-05-10`,
          outcome:
            govParty === "D"
              ? "Signed by Governor"
              : "Amended & Passed Chamber",
          executiveAction: `${stateName} Executive Office (${govParty}) action recorded`,
          summary: `Addresses zoning and housing supply rules affecting ${cityName} and surrounding metro areas.`,
          colImpactNote: `Relevant to housing and rent affordability in ${cityName}.`,
          sponsor: {
            name: `Sen. ${stateCode} Housing Chair`,
            party: senateParty,
            state: stateCode,
            bioguide_id: `ocd-person/${stateCodeLower}-sen-12`,
          },
          yea: 28,
          nay: 14,
          yeaVoters: [
            {
              name: `Sen. ${stateCode} Housing Chair`,
              party: senateParty,
              state: `${stateCode} Senate`,
              bioguide_id: `ocd-person/${stateCodeLower}-sen-12`,
            },
            {
              name: `Rep. ${cityName} Metro District 1`,
              party: houseParty,
              state: `${stateCode} House`,
              bioguide_id: `ocd-person/${stateCodeLower}-rep-04`,
            },
          ],
          nayVoters: [
            {
              name: `Sen. ${stateCode} Caucus Member`,
              party: oppParty,
              state: `${stateCode} Senate`,
              bioguide_id: `ocd-person/${stateCodeLower}-sen-29`,
            },
          ],
        }),
        createBillRecord({
          id: `os-${stateCodeLower}-${quarterKey}-204`,
          billNumber: "SB 188",
          title: `${stateName} State Income & Grocery Sales Tax Relief Bill`,
          domain: "Taxation & Fees",
          introducedDate: `${yearStr}-02-22`,
          statusDate: `${yearStr}-05-28`,
          outcome: "Enacted into Session Law",
          executiveAction: `Processed by ${stateName} Governor (${govParty})`,
          summary: `Reviews state tax thresholds and grocery tax provisions for ${stateName} households.`,
          colImpactNote: `Pertains to state tax and grocery expenditure in ${stateName}.`,
          sponsor: {
            name: `Rep. ${stateCode} Ways & Means Chair`,
            party: houseParty,
            state: stateCode,
            bioguide_id: `ocd-person/${stateCodeLower}-rep-02`,
          },
          yea: 89,
          nay: 52,
          yeaVoters: [
            {
              name: `Rep. ${stateCode} Ways & Means Chair`,
              party: houseParty,
              state: `${stateCode} House`,
              bioguide_id: `ocd-person/${stateCodeLower}-rep-02`,
            },
          ],
          nayVoters: [
            {
              name: `Rep. ${stateCode} Budget Member`,
              party: oppParty,
              state: `${stateCode} House`,
              bioguide_id: `ocd-person/${stateCodeLower}-rep-41`,
            },
          ],
        }),
      ];

  return {
    source: "Mock (Open States v3 + LegiScan shape)",
    jurisdiction_id: jurisdictionId,
    quarter: quarterKey,
    hasData,
    noDataReason: qRec.noDataReason || "",
    governor: {
      id: `ocd-person/gov-${stateCodeLower}-01`,
      name: `${stateName} Governor's Office`,
      party: govParty,
      role: "Governor",
      executiveAction: hasData
        ? "Quarterly legislative actions logged"
        : "No bill actions logged in this quarter",
    },
    chamberControl: {
      senate: senateParty,
      house: houseParty,
      trifecta: trifectaParty,
    },
    federalDelegation: {
      senators: [
        {
          id: `ocd-person/sen-${stateCodeLower}-1`,
          name: `${stateCode} Senior Senator`,
          party: govParty,
          chamber: "Upper",
        },
        {
          id: `ocd-person/sen-${stateCodeLower}-2`,
          name: `${stateCode} Junior Senator`,
          party: isDemState ? "D" : "R",
          chamber: "Upper",
        },
      ],
      representatives: [
        {
          id: `ocd-person/rep-${stateCodeLower}-1`,
          name: `${cityName} U.S. Rep`,
          party: houseParty,
          chamber: "Lower",
        },
      ],
    },
    stateBills,
  };
}
