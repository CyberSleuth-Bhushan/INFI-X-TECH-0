// Debug script to test Sneha's name mapping
const getProfilePhotoUrl = (name) => {
  // Clean the name to remove any extra spaces or invisible characters
  const cleanName = name.trim();
  
  // Exact mapping of names to photo files (case-sensitive)
  const photoMap = {
    "Bhushan Barun Mallick": "/assets/images/team/Bhushan.jpg",
    "Devesh Rahangdale": "/assets/images/team/devesh.jpg",
    "Pranav Anand Deshpande": "/assets/images/team/pranav.jpg",
    "Samiksha Wasnik": "/assets/images/team/samiksha.jpg",
    "Sneha Deherarkar": "/assets/images/team/sneha.jpg",
    "Sneha Deharkar": "/assets/images/team/sneha.jpg", // Alternative spelling
    "Ujwal Vilas Didhate": "/assets/images/team/ujwal.jpg",
    "Kanchan Rawat": "/assets/images/team/kanchan.jpg",
  };

  const photoUrl = photoMap[cleanName];

  console.log(`Testing name: "${name}"`);
  console.log(`Clean name: "${cleanName}"`);
  console.log(`Found photo: ${photoUrl ? 'YES' : 'NO'}`);
  console.log(`Photo URL: ${photoUrl || 'NOT FOUND'}`);
  console.log('---');

  return photoUrl;
};

// Test different variations
console.log('🔍 Testing Sneha name variations:');
getProfilePhotoUrl("Sneha Deharkar");
getProfilePhotoUrl("Sneha Deherarkar");
getProfilePhotoUrl(" Sneha Deharkar ");
getProfilePhotoUrl("Sneha Deharkar ");
getProfilePhotoUrl(" Sneha Deharkar");

console.log('\n📋 Available mappings:');
const photoMap = {
  "Bhushan Barun Mallick": "/assets/images/team/Bhushan.jpg",
  "Devesh Rahangdale": "/assets/images/team/devesh.jpg",
  "Pranav Anand Deshpande": "/assets/images/team/pranav.jpg",
  "Samiksha Wasnik": "/assets/images/team/samiksha.jpg",
  "Sneha Deherarkar": "/assets/images/team/sneha.jpg",
  "Sneha Deharkar": "/assets/images/team/sneha.jpg",
  "Ujwal Vilas Didhate": "/assets/images/team/ujwal.jpg",
  "Kanchan Rawat": "/assets/images/team/kanchan.jpg",
};

Object.keys(photoMap).forEach(key => {
  if (key.includes('Sneha')) {
    console.log(`✅ "${key}" → ${photoMap[key]}`);
  }
});