export const demoTenders = [
  { tenderId: 'tnd-2048', title: 'Community Health Centre Equipment', openingDate: '2026-11-05T09:00:00Z', submissionDeadline: '2026-11-04T17:00:00Z', status: 'UNDER_EVALUATION', submittedBidCount: 3 },
  { tenderId: 'tnd-2045', title: 'School Solar Installation — Phase II', openingDate: '2026-11-01T09:00:00Z', submissionDeadline: '2026-10-30T17:00:00Z', status: 'UNDER_EVALUATION', submittedBidCount: 2 },
];

export const demoBids = {
  'tnd-2048': [
    { bidId: 'bid-9041', tenderId: 'tnd-2048', contractorName: 'Aarav Medical Systems', quotedAmount: 4280000, status: 'OPENED', submittedAt: '2026-11-02T12:34:00Z', proposalUploaded: true },
    { bidId: 'bid-9042', tenderId: 'tnd-2048', contractorName: 'Crestline Healthcare Solutions', quotedAmount: 3960000, status: 'OPENED', submittedAt: '2026-11-03T15:10:00Z', proposalUploaded: true },
    { bidId: 'bid-9043', tenderId: 'tnd-2048', contractorName: 'MedEquip India', quotedAmount: 4510000, status: 'OPENED', submittedAt: '2026-11-04T10:02:00Z', proposalUploaded: true },
  ],
  'tnd-2045': [
    { bidId: 'bid-9022', tenderId: 'tnd-2045', contractorName: 'SunGrid Works', quotedAmount: 6170000, status: 'OPENED', submittedAt: '2026-10-29T09:48:00Z', proposalUploaded: true },
    { bidId: 'bid-9023', tenderId: 'tnd-2045', contractorName: 'BrightPath Energy', quotedAmount: 5890000, status: 'OPENED', submittedAt: '2026-10-30T16:12:00Z', proposalUploaded: true },
  ],
};

export const demoScores = {};
