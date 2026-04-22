const input='shipping';
const k='shipping';
console.log('1 bs:', new RegExp(`\b${k}\b`, 'i').test(input));
console.log('2 bs:', new RegExp(`\\b${k}\\b`, 'i').test(input));
console.log('3 bs:', new RegExp(`\\\b${k}\\\b`, 'i').test(input));
console.log('4 bs:', new RegExp(`\\\\b${k}\\\\b`, 'i').test(input));
