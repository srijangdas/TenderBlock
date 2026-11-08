export const DEMO_ACCOUNTS={
  'admin.demo@tenderblock.local':{password:'Demo@12345',user:{id:'demo-admin',fullName:'Demo Operations Admin',email:'admin.demo@tenderblock.local',role:'ADMIN'}},
  'auditor.demo@tenderblock.local':{password:'Demo@12345',user:{id:'demo-auditor',fullName:'Demo Government Auditor',email:'auditor.demo@tenderblock.local',role:'AUDITOR'}},
};
export const demoUsers=[
 {id:'usr-1042',fullName:'Northstar Infrastructure Pvt. Ltd.',email:'procurement@northstar.example',role:'AUTHORITY',status:'PENDING',createdAt:'2026-11-02T10:15:00Z'},
 {id:'usr-1043',fullName:'Aarav Mehta',email:'aarav@buildcraft.example',role:'CONTRACTOR',status:'PENDING',createdAt:'2026-11-04T09:30:00Z'},
 {id:'usr-1044',fullName:'Dr. Neha Rao',email:'neha.rao@tenderblock.local',role:'EVALUATOR',status:'VERIFIED',createdAt:'2026-10-20T08:00:00Z'},
];
export const demoTenders=[
 {id:'tnd-2041',title:'District Hospital HVAC Modernization',description:'Upgrade energy-efficient HVAC systems across three clinical buildings.',estimatedValue:18400000,submissionDeadline:'2026-12-10T17:00:00Z',status:'SUBMITTED',authorityName:'State Health Infrastructure Board'},
 {id:'tnd-2042',title:'Rural Bridge Rehabilitation Package',description:'Structural rehabilitation of five rural bridges across the northern district.',estimatedValue:32600000,submissionDeadline:'2026-12-18T17:00:00Z',status:'SUBMITTED',authorityName:'Public Works Department'},
];
export const demoReports=[
 {reportId:'rpt-5201',tenderId:'tnd-1974',tenderTitle:'Regional Water Treatment Plant',bidId:'bid-8021',assignedAuditorName:'Demo Government Auditor',type:'MISSING_BLOCKCHAIN_RECORD',source:'SYSTEM',description:'The award record did not receive the expected ledger confirmation.',evidenceReference:'TX-7F31C2',status:'OPEN',createdAt:'2026-11-07T11:30:00Z'},
 {reportId:'rpt-5193',tenderId:'tnd-1961',tenderTitle:'Municipal Road Resurfacing',bidId:'bid-7984',assignedAuditorName:'Demo Government Auditor',type:'UNEXPECTED_TENDER_MODIFICATION',source:'SYSTEM',description:'Tender metadata changed after publication. Review the audit trail.',evidenceReference:'EVT-1930',status:'UNDER_REVIEW',createdAt:'2026-11-06T14:20:00Z'},
];
export const demoTenderStates={'tnd-1974':'ON_HOLD','tnd-1961':'ON_HOLD'};
export const demoFlaggedTenders=[
 {tenderId:'tnd-1974',tenderTitle:'Regional Water Treatment Plant',authorityName:'State Water Authority',status:'ON_HOLD',flaggedAt:'2026-11-07T11:30:00Z',reportCount:1},
 {tenderId:'tnd-1961',tenderTitle:'Municipal Road Resurfacing',authorityName:'Municipal Works Department',status:'ON_HOLD',flaggedAt:'2026-11-06T14:20:00Z',reportCount:1},
];
export const demoCompletedTenders=[
 {tenderId:'tnd-1902',tenderTitle:'Community Health Centre Equipment',authorityName:'Regional Health Board',status:'AWARDED',completedAt:'2026-11-05T12:00:00Z',winningBidId:'bid-7811'},
 {tenderId:'tnd-1888',tenderTitle:'School Solar Installation — Phase II',authorityName:'District Education Office',status:'AWARDED',completedAt:'2026-10-29T09:15:00Z',winningBidId:'bid-7704'},
];
export const demoAuditDetails={
 'tnd-1974':{tenderId:'tnd-1974',tenderTitle:'Regional Water Treatment Plant',status:'ON_HOLD',databaseIntegrity:'VERIFIED',blockchainIntegrity:'FLAGGED',bids:[
  {bidId:'bid-8021',bidderId:'usr-882',bidderName:'AquaPure Engineering Ltd.',databaseIntegrity:'VERIFIED',blockchainIntegrity:'FLAGGED'},
  {bidId:'bid-8022',bidderId:'usr-883',bidderName:'BlueRiver Systems Pvt. Ltd.',databaseIntegrity:'VERIFIED',blockchainIntegrity:'VERIFIED'},
 ]},
 'tnd-1961':{tenderId:'tnd-1961',tenderTitle:'Municipal Road Resurfacing',status:'ON_HOLD',databaseIntegrity:'FLAGGED',blockchainIntegrity:'VERIFIED',bids:[
  {bidId:'bid-7984',bidderId:'usr-874',bidderName:'Crestline Civil Works',databaseIntegrity:'FLAGGED',blockchainIntegrity:'VERIFIED'},
  {bidId:'bid-7986',bidderId:'usr-877',bidderName:'Pavement Partners Ltd.',databaseIntegrity:'VERIFIED',blockchainIntegrity:'VERIFIED'},
 ]},
 'tnd-1902':{tenderId:'tnd-1902',tenderTitle:'Community Health Centre Equipment',status:'AWARDED',databaseIntegrity:'VERIFIED',blockchainIntegrity:'VERIFIED',bids:[
  {bidId:'bid-7811',bidderId:'usr-801',bidderName:'Aarav Medical Systems',databaseIntegrity:'VERIFIED',blockchainIntegrity:'VERIFIED'},
  {bidId:'bid-7812',bidderId:'usr-802',bidderName:'Crestline Healthcare Solutions',databaseIntegrity:'VERIFIED',blockchainIntegrity:'VERIFIED'},
 ]},
 'tnd-1888':{tenderId:'tnd-1888',tenderTitle:'School Solar Installation — Phase II',status:'AWARDED',databaseIntegrity:'VERIFIED',blockchainIntegrity:'VERIFIED',bids:[
  {bidId:'bid-7704',bidderId:'usr-791',bidderName:'SunGrid Energy Works',databaseIntegrity:'VERIFIED',blockchainIntegrity:'VERIFIED'},
 ]},
};
