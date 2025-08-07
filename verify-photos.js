// Simple script to verify all team photos exist
const fs = require('fs');
const path = require('path');

const teamPhotos = [
  'Bhushan.jpg',
  'devesh.jpg', 
  'pranav.jpg',
  'samiksha.jpg',
  'sneha.jpg',
  'ujwal.jpg',
  'kanchan.jpg'
];

const photoDir = path.join(__dirname, 'public', 'assets', 'images', 'team');

console.log('🔍 Verifying team photos...');
console.log('Photo directory:', photoDir);

teamPhotos.forEach(photo => {
  const photoPath = path.join(photoDir, photo);
  if (fs.existsSync(photoPath)) {
    const stats = fs.statSync(photoPath);
    console.log(`✅ ${photo} - ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    console.log(`❌ ${photo} - NOT FOUND`);
  }
});

console.log('\n📋 Photo mapping verification:');
const nameToPhotoMap = {
  "Bhushan Barun Mallick": "Bhushan.jpg",
  "Devesh Rahangdale": "devesh.jpg", 
  "Pranav Anand Deshpande": "pranav.jpg",
  "Samiksha Wasnik": "samiksha.jpg",
  "Sneha Deherarkar": "sneha.jpg",
  "Ujwal Vilas Didhate": "ujwal.jpg",
  "Kanchan Rawat": "kanchan.jpg",
};

Object.entries(nameToPhotoMap).forEach(([name, photo]) => {
  const photoPath = path.join(photoDir, photo);
  const exists = fs.existsSync(photoPath);
  console.log(`${exists ? '✅' : '❌'} "${name}" → ${photo}`);
});