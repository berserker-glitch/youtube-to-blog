const YT_ID_RE = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/i;

const testUrl = 'https://youtu.be/21pyywq8-SU?si=QS_jLmZaGc5kROKV';
console.log('Test URL:', testUrl);

// Test each part
const youtuBePart = /youtu\.be\//i.test(testUrl);
console.log('youtu.be/ matches:', youtuBePart);

const fullMatch = testUrl.match(YT_ID_RE);
console.log('Full match result:', fullMatch);

// Let's also test a simpler pattern
const simplePattern = /youtu\.be\/([^?]+)/i;
const simpleMatch = testUrl.match(simplePattern);
console.log('Simple pattern match:', simpleMatch);

// Test the exact pattern from the code
const exactPattern = /([^"&?/\\s]{11})/;
const justId = '21pyywq8-SU';
const idMatch = justId.match(exactPattern);
console.log('ID pattern match for "21pyywq8-SU":', idMatch);