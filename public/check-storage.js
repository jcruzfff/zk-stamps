// Simple script to check localStorage contents
console.log('======= localStorage Diagnostic Script =======');

// Check all keys in localStorage
console.log('All localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`- ${key}`);
}

// Check specifically for POAPs key
const storedPoaps = localStorage.getItem('poaps');
console.log('\nPOAPs in localStorage:', storedPoaps);

if (storedPoaps) {
  try {
    const parsedPoaps = JSON.parse(storedPoaps);
    console.log('Parsed POAPs:', parsedPoaps);
    console.log('Number of POAPs:', Array.isArray(parsedPoaps) ? parsedPoaps.length : 'Not an array');
    
    if (Array.isArray(parsedPoaps) && parsedPoaps.length > 0) {
      console.log('POAP details:');
      parsedPoaps.forEach((poap, index) => {
        console.log(`POAP ${index + 1}:`, {
          id: poap.id,
          country: poap.country,
          countryCode: poap.countryCode,
          timestamp: poap.timestamp,
        });
      });
      
      // Check specifically for US POAP
      const usPoap = parsedPoaps.find(poap => 
        poap.countryCode && poap.countryCode.toLowerCase() === 'us'
      );
      
      console.log('\nUS POAP found?', usPoap ? 'YES' : 'NO');
      if (usPoap) {
        console.log('US POAP details:', usPoap);
      }
    }
  } catch (error) {
    console.error('Error parsing POAPs:', error);
  }
}

// Also check poapMemories key
const storedMemories = localStorage.getItem('poapMemories');
console.log('\nPOAP Memories in localStorage:', storedMemories);
if (storedMemories) {
  try {
    const parsedMemories = JSON.parse(storedMemories);
    console.log('Parsed Memories:', parsedMemories);
    
    // Check for US in memories
    if (Array.isArray(parsedMemories)) {
      const usMemory = parsedMemories.find(mem => 
        mem.countryCode && mem.countryCode.toLowerCase() === 'us'
      );
      
      console.log('US in POAP Memories?', usMemory ? 'YES' : 'NO');
      if (usMemory) {
        console.log('US Memory details:', usMemory);
      }
    }
  } catch (error) {
    console.error('Error parsing POAP Memories:', error);
  }
}

console.log('============================================'); 