import assert from 'node:assert/strict';
import { toTeamBidRequest, toTeamTenderRequest, toTeamCompanyProfileRequest } from '../src/api/contracts.js';
import { exactMoney } from '../src/utils/decimal.js';
import { indianDateTimeToISO, isoToIndiaDateTimeInput } from '../src/utils/dateTime.js';
import { formatDate, formatCurrency } from '../src/utils/format.js';

assert.deepEqual(toTeamBidRequest('9007199254740993.00'), { quotedAmount:'9007199254740993.00' });
assert.equal(toTeamBidRequest('0.01').quotedAmount, '0.01');
assert.equal(exactMoney('12345678901234567.99'), '12345678901234567.99');
assert.throws(() => exactMoney('123456789012345678.99'), /17 digits/);
assert.throws(() => exactMoney('0.000'), /decimal places/);
assert.throws(() => exactMoney('0.00'), /greater than zero/);
assert.equal(formatCurrency('9007199254740993.45'), '₹9,00,71,99,25,47,40,993.45');
assert.equal(formatCurrency('123.45'), '₹123.45');
const iso = indianDateTimeToISO('2030-05-01T10:30');
assert.equal(iso, '2030-05-01T05:00:00.000Z');
assert.equal(isoToIndiaDateTimeInput(iso), '2030-05-01T10:30');
assert.match(formatDate(iso), /IST/);
assert.throws(() => indianDateTimeToISO('2030-02-30T10:30'), /calendar date/);
const tender = toTeamTenderRequest({title:' Office upgrade ',description:'Work',budget:'123.45',submissionDeadline:'2030-05-01T10:30',openingDate:'2030-05-02T09:15'});
assert.equal(tender.estimatedValue, '123.45');
assert.equal(tender.submissionDeadline, '2030-05-01T05:00:00.000Z');
assert.deepEqual(toTeamCompanyProfileRequest({companyName:'Test Co',registrationNumber:'',address:'Road',contactNumber:'9876543210',gstin:'',pan:'',website:''}),{
  companyName:'Test Co',registrationNumber:null,gstin:null,pan:null,address:'Road',contactNumber:'9876543210',website:null,
});
console.log('PASS: v7 exact money, IST input/date display, optional profile fields and tender DTO');
