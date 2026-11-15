"""
Generate 5000+ training examples for Light AI
This creates a comprehensive dataset covering all assistant tasks
"""

import json
import random
from datetime import datetime, timedelta

# Training data categories
training_data = {
    "conversations": []
}

# ============================================================
# 1. REMINDERS & ALARMS (1000 examples)
# ============================================================

reminder_templates = [
    ("Set a reminder for {time} to {task}", "I'll set a reminder for {time} to {task}. You'll get a notification at that time."),
    ("Remind me to {task} at {time}", "Got it! I'll remind you to {task} at {time}."),
    ("Set alarm for {time}", "Alarm set for {time}. I'll wake you up!"),
    ("Wake me up at {time}", "Setting your alarm for {time}. Sleep well!"),
    ("Remind me {when} to {task}", "I'll remind you {when} to {task}."),
]

tasks = [
    "call mom", "take medicine", "workout", "drink water", "meeting",
    "pick up kids", "feed the dog", "water plants", "check email",
    "submit report", "pay bills", "buy groceries", "clean house",
    "dentist appointment", "gym session", "meditation", "read book",
    "team standup", "client call", "code review", "lunch break"
]

times = [
    "3pm", "5:30pm", "9am", "7:00am", "8:30pm", "noon", "midnight",
    "10:15am", "4:45pm", "6pm", "11am", "2:30pm", "8am", "9:30pm"
]

when_phrases = [
    "tomorrow", "in 2 hours", "in 30 minutes", "next Monday",
    "this evening", "tomorrow morning", "in 1 hour", "tonight"
]

for _ in range(1000):
    template = random.choice(reminder_templates)
    task = random.choice(tasks)
    time = random.choice(times) if "{time}" in template[0] else ""
    when = random.choice(when_phrases) if "{when}" in template[0] else ""
    
    user_msg = template[0].format(time=time, task=task, when=when)
    assistant_msg = template[1].format(time=time, task=task, when=when)
    
    training_data["conversations"].append({
        "system": "You are Light, a helpful personal AI assistant.",
        "user": user_msg,
        "assistant": assistant_msg,
        "category": "reminders"
    })

print(f"Generated {len(training_data['conversations'])} reminder examples")

# ============================================================
# 2. PHONE & CONTACTS (800 examples)
# ============================================================

contact_templates = [
    ("Call {name}", "Calling {name} now..."),
    ("Phone {name}", "Dialing {name}..."),
    ("Ring {name}", "Ringing {name} for you."),
    ("Dial {name}", "Calling {name}..."),
    ("Message {name} {message}", "Sending message to {name}: \"{message}\""),
    ("Text {name} {message}", "Texting {name}: \"{message}\""),
    ("Send message to {name} {message}", "Message sent to {name}!"),
    ("Save contact {name} {number}", "Contact saved: {name} - {number}"),
    ("Add {name} to contacts {number}", "Added {name} ({number}) to your contacts."),
]

names = [
    "Mom", "Dad", "John", "Sarah", "Mike", "Emily", "Boss", "Doctor",
    "Pizza Place", "Emma", "David", "Lisa", "Tom", "Anna", "Chris",
    "Rachel", "James", "Sophia", "Daniel", "Olivia"
]

messages = [
    "I'm running late", "Call me back", "See you soon", "Thanks",
    "On my way", "Can we reschedule", "Meeting at 3pm", "Love you",
    "Please call me", "Check your email", "Good morning", "Good night"
]

numbers = ["+1234567890", "+9876543210", "555-1234", "555-9876"]

for _ in range(800):
    template = random.choice(contact_templates)
    name = random.choice(names)
    message = random.choice(messages) if "{message}" in template[0] else ""
    number = random.choice(numbers) if "{number}" in template[0] else ""
    
    user_msg = template[0].format(name=name, message=message, number=number)
    assistant_msg = template[1].format(name=name, message=message, number=number)
    
    training_data["conversations"].append({
        "system": "You are Light, a helpful personal AI assistant.",
        "user": user_msg,
        "assistant": assistant_msg,
        "category": "contacts"
    })

print(f"Generated {len(training_data['conversations'])} total examples")

# ============================================================
# 3. SYSTEM CONTROLS (700 examples)
# ============================================================

system_templates = [
    ("Turn on {feature}", "Turning on {feature} now."),
    ("Enable {feature}", "{feature} enabled."),
    ("Turn off {feature}", "Turning off {feature}."),
    ("Disable {feature}", "{feature} disabled."),
    ("Toggle {feature}", "Toggling {feature} for you."),
    ("Open {feature} settings", "Opening {feature} settings..."),
    ("Increase {setting}", "Increasing {setting}..."),
    ("Decrease {setting}", "Decreasing {setting}..."),
]

features = [
    "WiFi", "Bluetooth", "airplane mode", "mobile data", "hotspot",
    "flashlight", "do not disturb", "silent mode", "location",
    "auto-rotate", "battery saver", "dark mode", "NFC"
]

settings = [
    "volume", "brightness", "screen timeout", "font size"
]

for _ in range(700):
    template = random.choice(system_templates)
    feature = random.choice(features) if "{feature}" in template[0] else ""
    setting = random.choice(settings) if "{setting}" in template[0] else ""
    
    user_msg = template[0].format(feature=feature, setting=setting)
    assistant_msg = template[1].format(feature=feature, setting=setting)
    
    training_data["conversations"].append({
        "system": "You are Light, a helpful personal AI assistant.",
        "user": user_msg,
        "assistant": assistant_msg,
        "category": "system_controls"
    })

print(f"Generated {len(training_data['conversations'])} total examples")

# ============================================================
# 4. APP NAVIGATION (600 examples)
# ============================================================

app_templates = [
    ("Open {app}", "Opening {app}..."),
    ("Launch {app}", "Launching {app}..."),
    ("Start {app}", "Starting {app}..."),
    ("Close {app}", "Closing {app}..."),
    ("Switch to {app}", "Switching to {app}..."),
    ("Uninstall {app}", "Uninstalling {app}..."),
    ("Update {app}", "Updating {app}..."),
]

apps = [
    "WhatsApp", "Instagram", "Facebook", "Twitter", "Gmail", "Chrome",
    "YouTube", "Spotify", "Maps", "Camera", "Photos", "Calendar",
    "Settings", "Calculator", "Notes", "Clock", "Weather", "Netflix",
    "Amazon", "Uber", "Messages", "Phone", "Contacts"
]

for _ in range(600):
    template = random.choice(app_templates)
    app = random.choice(apps)
    
    user_msg = template[0].format(app=app)
    assistant_msg = template[1].format(app=app)
    
    training_data["conversations"].append({
        "system": "You are Light, a helpful personal AI assistant.",
        "user": user_msg,
        "assistant": assistant_msg,
        "category": "app_navigation"
    })

print(f"Generated {len(training_data['conversations'])} total examples")

# ============================================================
# 5. INFORMATION QUERIES (800 examples)
# ============================================================

info_templates = [
    ("What's the weather", "Let me check the weather for you... It's currently {weather}."),
    ("What time is it", "It's {time} right now."),
    ("What's today's date", "Today is {date}."),
    ("How's the weather", "The weather is {weather} today."),
    ("What's my battery", "Your battery is at {battery}%."),
    ("What's my battery level", "Battery level: {battery}%"),
    ("How much storage do I have", "You have {storage}GB available."),
    ("Read my last message", "Your last message is from {name}: \"{message}\""),
    ("What's my schedule today", "You have {count} events today: {events}"),
    ("Any notifications", "You have {count} notifications: {notifications}"),
]

weather_conditions = ["sunny", "cloudy", "rainy", "partly cloudy", "clear"]
example_times = ["3:45 PM", "10:30 AM", "8:15 PM", "12:00 PM"]
example_dates = ["Monday, November 15", "Tuesday, November 16", "Wednesday, November 17"]
battery_levels = ["85", "65", "95", "50", "30"]
storage_amounts = ["32", "64", "15", "128", "8"]

for _ in range(800):
    template = random.choice(info_templates)
    
    replacements = {
        "weather": random.choice(weather_conditions),
        "time": random.choice(example_times),
        "date": random.choice(example_dates),
        "battery": random.choice(battery_levels),
        "storage": random.choice(storage_amounts),
        "name": random.choice(names),
        "message": random.choice(messages),
        "count": str(random.randint(1, 5)),
        "events": "Meeting at 2pm, Gym at 5pm",
        "notifications": "WhatsApp (3), Email (2)"
    }
    
    user_msg = template[0]
    assistant_msg = template[1]
    
    for key, value in replacements.items():
        if f"{{{key}}}" in assistant_msg:
            assistant_msg = assistant_msg.format(**{key: value})
    
    training_data["conversations"].append({
        "system": "You are Light, a helpful personal AI assistant.",
        "user": user_msg,
        "assistant": assistant_msg,
        "category": "information"
    })

print(f"Generated {len(training_data['conversations'])} total examples")

# ============================================================
# 6. GENERAL CONVERSATION (600 examples)
# ============================================================

conversation_pairs = [
    ("Hi", "Hello! How can I help you today?"),
    ("Hey Light", "Hi there! What can I do for you?"),
    ("Good morning", "Good morning! Ready to start the day?"),
    ("Good night", "Good night! Sleep well!"),
    ("Thank you", "You're welcome! Happy to help!"),
    ("Thanks", "Anytime! That's what I'm here for!"),
    ("That's all", "Alright! Let me know if you need anything else."),
    ("How are you", "I'm doing great! How can I assist you?"),
    ("What can you do", "I can set reminders, make calls, control settings, open apps, and much more! What do you need?"),
    ("Help", "I'm here to help! I can manage reminders, calls, messages, settings, and more. What do you need?"),
    ("Who are you", "I'm Light, your personal AI assistant! I'm here to make your life easier."),
    ("What's your name", "My name is Light! I'm your AI assistant."),
    ("Tell me a joke", "Why did the phone go to school? To improve its cell-f! 😄"),
    ("Are you there", "Yes, I'm always here! How can I help?"),
    ("Can you hear me", "Yes, I can hear you loud and clear! What do you need?"),
]

for _ in range(40):
    for user_msg, assistant_msg in conversation_pairs:
        training_data["conversations"].append({
            "system": "You are Light, a helpful personal AI assistant.",
            "user": user_msg,
            "assistant": assistant_msg,
            "category": "conversation"
        })

print(f"Generated {len(training_data['conversations'])} total examples")

# ============================================================
# 7. CALENDAR & EVENTS (500 examples)
# ============================================================

calendar_templates = [
    ("What's on my calendar today", "You have {count} events today: {events}"),
    ("Any meetings today", "Yes, you have {count} meetings: {events}"),
    ("Show my schedule", "Here's your schedule: {events}"),
    ("What's my next event", "Your next event is: {event} at {time}"),
    ("Do I have plans tomorrow", "Tomorrow you have: {events}"),
    ("Add event {event} at {time}", "Event added: {event} at {time}"),
    ("Schedule meeting {event} {time}", "Meeting scheduled: {event} at {time}"),
    ("Cancel event {event}", "Event cancelled: {event}"),
]

events = [
    "Team standup", "Client meeting", "Lunch with Sarah", "Gym session",
    "Doctor appointment", "Dentist", "Project review", "Coffee with Mike",
    "Presentation", "Workshop", "Training session", "Birthday party"
]

for _ in range(500):
    template = random.choice(calendar_templates)
    event = random.choice(events)
    time = random.choice(times)
    count = str(random.randint(1, 5))
    events_list = ", ".join(random.sample(events, min(3, len(events))))
    
    user_msg = template[0].format(event=event, time=time, count=count, events=events_list)
    assistant_msg = template[1].format(event=event, time=time, count=count, events=events_list)
    
    training_data["conversations"].append({
        "system": "You are Light, a helpful personal AI assistant.",
        "user": user_msg,
        "assistant": assistant_msg,
        "category": "calendar"
    })

print(f"Generated {len(training_data['conversations'])} total examples")

# ============================================================
# 8. COMPLEX MULTI-STEP TASKS (500 examples)
# ============================================================

complex_templates = [
    (
        "Set a reminder for 3pm, then call mom",
        "Got it! I'll set a reminder for 3pm and then call your mom."
    ),
    (
        "Turn on WiFi and open YouTube",
        "Turning on WiFi and opening YouTube for you."
    ),
    (
        "Send a message to John saying I'm on my way, then navigate to his location",
        "Sending message to John and starting navigation."
    ),
    (
        "What's the weather and should I bring an umbrella",
        "It's {weather} today. {umbrella_advice}"
    ),
    (
        "Schedule a meeting for tomorrow at 2pm and send invites",
        "Meeting scheduled for tomorrow at 2pm. Sending invites now."
    ),
]

umbrella_advice = [
    "You should bring an umbrella!",
    "No need for an umbrella today.",
    "Better safe than sorry - bring one!",
    "Looks clear, leave the umbrella at home."
]

for _ in range(500):
    template = random.choice(complex_templates)
    weather = random.choice(weather_conditions)
    advice = random.choice(umbrella_advice)
    
    user_msg = template[0]
    assistant_msg = template[1]
    
    if "{weather}" in assistant_msg:
        assistant_msg = assistant_msg.format(weather=weather, umbrella_advice=advice)
    
    training_data["conversations"].append({
        "system": "You are Light, a helpful personal AI assistant.",
        "user": user_msg,
        "assistant": assistant_msg,
        "category": "complex_tasks"
    })

print(f"Generated {len(training_data['conversations'])} total examples")

# ============================================================
# 9. ERROR HANDLING & CLARIFICATION (300 examples)
# ============================================================

error_templates = [
    ("What?", "I didn't quite catch that. Could you repeat?"),
    ("Huh?", "Sorry, could you say that again?"),
    ("I don't understand", "Let me know what you need help with!"),
    ("That didn't work", "Let me try a different approach."),
    ("Try again", "Sure, let's try again!"),
    ("Wrong", "Oops, let me correct that."),
    ("No", "Understood, what would you like instead?"),
    ("Stop", "Stopped! Anything else?"),
    ("Cancel", "Cancelled. What would you like to do?"),
    ("Go back", "Going back to the previous step."),
]

for _ in range(30):
    for user_msg, assistant_msg in error_templates:
        training_data["conversations"].append({
            "system": "You are Light, a helpful personal AI assistant.",
            "user": user_msg,
            "assistant": assistant_msg,
            "category": "error_handling"
        })

print(f"Generated {len(training_data['conversations'])} total examples")

# ============================================================
# 10. PERSONALIZATION (200 examples)
# ============================================================

personal_templates = [
    ("Remember my name is {name}", "Got it! I'll remember you as {name}."),
    ("My favorite color is {color}", "Noted! Your favorite color is {color}."),
    ("I like {thing}", "I'll remember that you like {thing}!"),
    ("I don't like {thing}", "Noted, you don't like {thing}."),
    ("My work starts at {time}", "I'll remember your work starts at {time}."),
    ("Call me {name}", "Sure! I'll call you {name} from now on."),
]

colors = ["blue", "red", "green", "purple", "black", "white"]
things = ["pizza", "coffee", "mornings", "early calls", "long meetings"]

for _ in range(200):
    template = random.choice(personal_templates)
    name = random.choice(names)
    color = random.choice(colors)
    thing = random.choice(things)
    time = random.choice(times)
    
    user_msg = template[0].format(name=name, color=color, thing=thing, time=time)
    assistant_msg = template[1].format(name=name, color=color, thing=thing, time=time)
    
    training_data["conversations"].append({
        "system": "You are Light, a helpful personal AI assistant.",
        "user": user_msg,
        "assistant": assistant_msg,
        "category": "personalization"
    })

print(f"Generated {len(training_data['conversations'])} total examples")

# ============================================================
# SAVE TO FILE
# ============================================================

print(f"\n✅ Total training examples: {len(training_data['conversations'])}")

with open('light_training_data.json', 'w', encoding='utf-8') as f:
    json.dump(training_data, f, indent=2, ensure_ascii=False)

print("✅ Saved to light_training_data.json")

# Also create a summary
summary = {}
for conv in training_data["conversations"]:
    category = conv.get("category", "other")
    summary[category] = summary.get(category, 0) + 1

print("\n📊 Training Data Summary:")
for category, count in sorted(summary.items(), key=lambda x: x[1], reverse=True):
    print(f"  {category}: {count} examples")
