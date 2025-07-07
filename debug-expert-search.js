// Debug script to test Expert Discovery search logic
// Run this in the browser console while on the Expert Discovery page

console.log('=== Expert Discovery Debug Tool ===')

// Get mock experts data
const mockExperts = [
  {
    id: '1',
    name: 'Sarah Chen',
    title: 'Senior Frontend Developer',
    specializations: ['React', 'TypeScript', 'UI/UX', 'Web Performance'],
    technologies: ['React', 'TypeScript', 'Jest', 'Vite', 'Webpack', 'Sass'],
    experienceLevel: 'senior',
    confidence: 0.92,
    active: true,
    lastActive: '2024-01-15'
  },
  {
    id: '7',
    name: 'Chris Anderson',
    title: 'Junior Developer',
    specializations: ['JavaScript', 'Web Development', 'Learning', 'Frontend'],
    technologies: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
    experienceLevel: 'junior',
    confidence: 0.65,
    active: true,
    lastActive: '2024-01-16'
  }
]

// Test query
const testQuery = "Find a React expert with TypeScript experience who can build responsive user interfaces using modern CSS frameworks like Tailwind or Styled Components"

// Test search logic
function testTextSearch(query, experts) {
  console.log('\n--- Testing Text Search Logic ---')
  console.log('Query:', query)
  
  const searchTerms = query.toLowerCase().split(' ').filter(Boolean)
  console.log('Search terms:', searchTerms)
  
  const results = experts.filter(expert => {
    const searchableText = [
      expert.name,
      expert.title,
      ...expert.specializations,
      ...expert.technologies
    ].join(' ').toLowerCase()
    
    console.log(`\n${expert.name}:`)
    console.log('  Searchable text:', searchableText)
    
    const matches = searchTerms.filter(term => searchableText.includes(term))
    console.log('  Matching terms:', matches)
    
    const hasMatch = searchTerms.some(term => searchableText.includes(term))
    console.log('  Has match:', hasMatch)
    
    return hasMatch
  })
  
  console.log('\nText search results:', results.map(e => e.name))
  return results
}

// Test confidence filtering
function testConfidenceFilter(experts, threshold) {
  console.log('\n--- Testing Confidence Filter ---')
  console.log('Confidence threshold:', threshold)
  
  const results = experts.filter(expert => {
    console.log(`${expert.name}: confidence ${expert.confidence} >= ${threshold} = ${expert.confidence >= threshold}`)
    return expert.confidence >= threshold
  })
  
  console.log('Confidence filter results:', results.map(e => e.name))
  return results
}

// Run tests
const textSearchResults = testTextSearch(testQuery, mockExperts)
const confidenceResults10 = testConfidenceFilter(textSearchResults, 0.1)
const confidenceResults70 = testConfidenceFilter(textSearchResults, 0.7)

console.log('\n=== SUMMARY ===')
console.log('Original experts:', mockExperts.length)
console.log('After text search:', textSearchResults.length)
console.log('After 10% confidence filter:', confidenceResults10.length)
console.log('After 70% confidence filter:', confidenceResults70.length)

// Check current UI state if possible
console.log('\n--- Checking Current UI State ---')
try {
  // Try to access React component state (this might not work depending on how React dev tools are set up)
  console.log('If you can see the React DevTools, check:')
  console.log('1. ExpertDiscoveryPage component state for queryParameters.confidenceThreshold')
  console.log('2. The actual query object passed to mockDiscoverExperts')
  console.log('3. Any console errors in the Network tab')
} catch (e) {
  console.log('Could not access React state directly')
}

console.log('\nTo debug further:')
console.log('1. Open React DevTools')
console.log('2. Find ExpertDiscoveryPage component')
console.log('3. Check queryParameters.confidenceThreshold value')
console.log('4. Check if handleSearch is being called with the right parameters')