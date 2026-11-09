import assert from 'node:assert/strict';
import { toRegisterRequest, toDemoRegisterRequest, toLoginRequest } from '../src/api/dtos.js';
const form = { fullName: ' Example User ', email:' NAME@example.com ', password:'Abc12345',
  age:'25', phoneNumber:'9876543210', organizationName:'ABC', organizationType:'Private company',
  sector:'Information Technology', address:'Example address', registrationId:'ABC-001',
  role:'BIDDER', designation:'Engineer', yearsOfExperience:'3' };
assert.deepEqual(toRegisterRequest(form), {
  fullName:'Example User', email:'name@example.com', password:'Abc12345',
  phoneNumber:'9876543210', age:25, designation:'Engineer', yearsOfExperience:3,
  organizationName:'ABC', organizationType:'Private company', registrationId:'ABC-001',
  industry:'Information Technology', address:'Example address'
});
assert.deepEqual(toLoginRequest(form), {email:'name@example.com', password:'Abc12345'});
assert.equal(toDemoRegisterRequest(form).role, 'BIDDER');
assert.equal(toDemoRegisterRequest(form).organizationName, 'ABC');
assert.equal(toDemoRegisterRequest(form).registrationId, 'ABC-001');
assert.equal(Object.hasOwn(toDemoRegisterRequest(form), 'age'), false);
assert.equal(Object.hasOwn(toDemoRegisterRequest(form), 'industry'), false);
console.log('Registration/login DTO contract tests passed.');
