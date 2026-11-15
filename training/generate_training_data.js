/**
 * Generate 5000+ training examples for Light AI
 * Run: node generate_training_data.js
 */

const fs = require('fs');

const trainingData = { conversations: [] };

// Helper to add conversation
function addConversation(user, assistant, category) {
  trainingData.conversations.push({
    system: "You are Light, a helpful personal AI assistant.",
    user,
    assistant,
    category
  });
}

// Helper to pick random
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

console.log('🚀 Generating training data...\n');

// ============================================================
// 1. REMINDERS & ALARMS (1000 examples)
// ============================================================

const reminderTemplates = [
  [(time, task) => `Set a reminder for ${time} to ${task}`, (time, task) => `I'll set a reminder for ${time} to ${task}. You'll get a notification at that time.`],
  [(time, task) => `Remind me to ${task} at ${time}`, (time, task) => `Got it! I'll remind you to ${task} at ${time}.`],
  [(time) => `Set alarm for ${time}`, (time) => `Alarm set for ${time}. I'll wake you up!`],
  [(time) => `Wake me up at ${time}`, (time) => `Setting your alarm for ${time}. Sleep well!`],
];

const tasks = [
  "call mom", "take medicine", "workout", "drink water", "meeting",
  "pick up kids", "feed the dog", "water plants", "check email",
  "submit report", "pay bills", "buy groceries", "clean house",
  "dentist appointment", "gym session", "meditation", "read book"
];

const times = ["3pm", "5:30pm", "9am", "7:00am", "8:30pm", "noon", "10:15am", "4:45pm"];

for (let i = 0; i < 1000; i++) {
  const template = pick(reminderTemplates);
  const time = pick(times);
  const task = pick(tasks);
  
  addConversation(
    template[0](time, task),
    template[1](time, task),
    'reminders'
  );
}

console.log(`✅ Generated ${trainingData.conversations.length} reminder examples`);

// ============================================================
// 2. PHONE & CONTACTS (800 examples)
// ============================================================

const names = ["Mom", "Dad", "John", "Sarah", "Mike", "Emily", "Boss", "Doctor"];
const messages = ["I'm running late", "Call me back", "See you soon", "On my way"];

const contactTemplates = [
  [(name) => `Call ${name}`, (name) => `Calling ${name} now...`],
  [(name) => `Phone ${name}`, (name) => `Dialing ${name}...`],
  [(name, msg) => `Message ${name} ${msg}`, (name, msg) => `Sending message to ${name}: "${msg}"`],
  [(name, msg) => `Text ${name} ${msg}`, (name, msg) => `Texting ${name}: "${msg}"`],
];

for (let i = 0; i < 800; i++) {
  const template = pick(contactTemplates);
  const name = pick(names);
  const msg = pick(messages);
  
  addConversation(
    template[0](name, msg),
    template[1](name, msg),
    'contacts'
  );
}

console.log(`✅ Generated ${trainingData.conversations.length} total examples`);

// ============================================================
// 3. SYSTEM CONTROLS (700 examples)
// ============================================================

const features = ["WiFi", "Bluetooth", "airplane mode", "mobile data", "flashlight", "dark mode"];
const systemTemplates = [
  [(f) => `Turn on ${f}`, (f) => `Turning on ${f} now.`],
  [(f) => `Enable ${f}`, (f) => `${f} enabled.`],
  [(f) => `Turn off ${f}`, (f) => `Turning off ${f}.`],
  [(f) => `Disable ${f}`, (f) => `${f} disabled.`],
];

for (let i = 0; i < 700; i++) {
  const template = pick(systemTemplates);
  const feature = pick(features);
  
  addConversation(
    template[0](feature),
    template[1](feature),
    'system_controls'
  );
}

console.log(`✅ Generated ${trainingData.conversations.length} total examples`);

// ============================================================
// 4. APP NAVIGATION (600 examples)
// ============================================================

const apps = ["WhatsApp", "Instagram", "Gmail", "Chrome", "YouTube", "Spotify", "Maps", "Camera"];
const appTemplates = [
  [(app) => `Open ${app}`, (app) => `Opening ${app}...`],
  [(app) => `Launch ${app}`, (app) => `Launching ${app}...`],
  [(app) => `Start ${app}`, (app) => `Starting ${app}...`],
  [(app) => `Close ${app}`, (app) => `Closing ${app}...`],
];

for (let i = 0; i < 600; i++) {
  const template = pick(appTemplates);
  const app = pick(apps);
  
  addConversation(
    template[0](app),
    template[1](app),
    'app_navigation'
  );
}

console.log(`✅ Generated ${trainingData.conversations.length} total examples`);

// ============================================================
// 5. INFORMATION QUERIES (800 examples)
// ============================================================

const infoQueries = [
  ["What's the weather", "Let me check the weather for you... It's currently sunny."],
  ["What time is it", "It's 3:45 PM right now."],
  ["What's today's date", "Today is Monday, November 15."],
  ["What's my battery", "Your battery is at 85%."],
  ["How much storage do I have", "You have 32GB available."],
  ["Read my last message", "Your last message is from John: 'See you soon'"],
  ["What's my schedule today", "You have 3 events today: Meeting at 2pm, Gym at 5pm"],
  ["Any notifications", "You have 5 notifications: WhatsApp (3), Email (2)"],
];

for (let i = 0; i < 100; i++) {
  for (const [user, assistant] of infoQueries) {
    addConversation(user, assistant, 'information');
  }
}

console.log(`✅ Generated ${trainingData.conversations.length} total examples`);

// ============================================================
// 6. GENERAL CONVERSATION (600 examples)
// ============================================================

const conversationPairs = [
  ["Hi", "Hello! How can I help you today?"],
  ["Hey Light", "Hi there! What can I do for you?"],
  ["Good morning", "Good morning! Ready to start the day?"],
  ["Good night", "Good night! Sleep well!"],
  ["Thank you", "You're welcome! Happy to help!"],
  ["Thanks", "Anytime! That's what I'm here for!"],
  ["How are you", "I'm doing great! How can I assist you?"],
  ["What can you do", "I can set reminders, make calls, control settings, and more!"],
  ["Help", "I'm here to help! What do you need?"],
  ["Who are you", "I'm Light, your personal AI assistant!"],
];

for (let i = 0; i < 60; i++) {
  for (const [user, assistant] of conversationPairs) {
    addConversation(user, assistant, 'conversation');
  }
}

console.log(`✅ Generated ${trainingData.conversations.length} total examples`);

// ============================================================
// 7. CALENDAR & EVENTS (500 examples)
// ============================================================

const events = ["Team standup", "Client meeting", "Lunch", "Gym", "Doctor appointment"];
const calendarTemplates = [
  [() => "What's on my calendar today", () => "You have 3 events today: Team standup, Lunch, Gym"],
  [() => "Any meetings today", () => "Yes, you have 2 meetings: Team standup at 10am, Client meeting at 3pm"],
  [(e, t) => `Add event ${e} at ${t}`, (e, t) => `Event added: ${e} at ${t}`],
  [(e) => `Cancel event ${e}`, (e) => `Event cancelled: ${e}`],
];

for (let i = 0; i < 500; i++) {
  const template = pick(calendarTemplates);
  const event = pick(events);
  const time = pick(times);
  
  addConversation(
    template[0](event, time),
    template[1](event, time),
    'calendar'
  );
}

console.log(`✅ Generated ${trainingData.conversations.length} total examples`);

// ============================================================
// 8. COMPLEX TASKS (500 examples)
// ============================================================

const complexPairs = [
  ["Set a reminder for 3pm, then call mom", "Got it! I'll set a reminder for 3pm and then call your mom."],
  ["Turn on WiFi and open YouTube", "Turning on WiFi and opening YouTube for you."],
  ["What's the weather and should I bring an umbrella", "It's cloudy today. You should bring an umbrella!"],
  ["Send a message to John and navigate home", "Sending message to John and starting navigation home."],
];

for (let i = 0; i < 125; i++) {
  for (const [user, assistant] of complexPairs) {
    addConversation(user, assistant, 'complex_tasks');
  }
}

console.log(`✅ Generated ${trainingData.conversations.length} total examples`);

// ============================================================
// 9. ERROR HANDLING (300 examples)
// ============================================================

const errorPairs = [
  ["What?", "I didn't quite catch that. Could you repeat?"],
  ["Huh?", "Sorry, could you say that again?"],
  ["That didn't work", "Let me try a different approach."],
  ["Try again", "Sure, let's try again!"],
  ["Cancel", "Cancelled. What would you like to do?"],
  ["Stop", "Stopped! Anything else?"],
];

for (let i = 0; i < 50; i++) {
  for (const [user, assistant] of errorPairs) {
    addConversation(user, assistant, 'error_handling');
  }
}

console.log(`✅ Generated ${trainingData.conversations.length} total examples`);

// ============================================================
// 10. PERSONALIZATION (200 examples)
// ============================================================

const personalPairs = [
  [(name) => `Remember my name is ${name}`, (name) => `Got it! I'll remember you as ${name}.`],
  [(thing) => `I like ${thing}`, (thing) => `I'll remember that you like ${thing}!`],
  [(time) => `My work starts at ${time}`, (time) => `I'll remember your work starts at ${time}.`],
];

const things = ["pizza", "coffee", "mornings"];

for (let i = 0; i < 200; i++) {
  const template = pick(personalPairs);
  const name = pick(names);
  const thing = pick(things);
  const time = pick(times);
  
  addConversation(
    template[0](name || thing || time),
    template[1](name || thing || time),
    'personalization'
  );
}

console.log(`✅ Generated ${trainingData.conversations.length} total examples\n`);

// ============================================================
// SAVE TO FILE
// ============================================================

console.log(`📦 Total training examples: ${trainingData.conversations.length}`);

fs.writeFileSync(
  'light_training_data.json',
  JSON.stringify(trainingData, null, 2),
  'utf-8'
);

console.log('✅ Saved to light_training_data.json\n');

// Summary
const summary = {};
for (const conv of trainingData.conversations) {
  const cat = conv.category || 'other';
  summary[cat] = (summary[cat] || 0) + 1;
}

console.log('📊 Training Data Summary:');
Object.entries(summary)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    console.log(`  ${category}: ${count} examples`);
  });

console.log('\n🎉 Training data generation complete!');
