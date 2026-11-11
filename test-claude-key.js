/**
 * Quick Test: Verify Claude API Key Works
 * Run with: node test-claude-key.js
 */

const CLAUDE_KEY = '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';

async function testClaudeKey() {
  console.log('🔍 Testing Claude API Key...\n');
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Say hello in one sentence'
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Claude API Error:', response.status);
      console.error('Error details:', error);
      console.error('\n💡 Your Claude key might be invalid or expired.');
      console.error('Get a new one at: https://console.anthropic.com/');
      return false;
    }

    const data = await response.json();
    const message = data.content?.[0]?.text;
    
    console.log('✅ Claude API Key is VALID!');
    console.log('✅ Response:', message);
    console.log('\n🎉 Your app will work with Claude!');
    console.log('💰 You have free credits available');
    console.log('\nJust run: npm run android');
    
    return true;
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.error('\n💡 Check your internet connection');
    return false;
  }
}

// Run the test
testClaudeKey();
