# Phase 2 Testing Guide

## Before You Test

### 1. Enable Accessibility Service
1. Go to Android Settings
2. Navigate to Accessibility
3. Find "Light" in the list
4. Toggle it ON
5. Accept the permission dialog

**Why?** Light needs accessibility permission to control other apps, click buttons, scroll, and read screen content.

### 2. Grant Phone Permission
1. Open Light app
2. Go to Settings tab
3. Tap "Allow Phone Calls"
4. Accept permission when prompted

**Why?** Needed for making calls by contact name.

### 3. Grant Contacts Permission
If not already granted:
1. Android Settings → Apps → Light → Permissions
2. Enable "Contacts" permission

**Why?** Needed to call people by name ("call Mom").

### 4. Enable Exact Alarms
1. Android Settings → Apps → Light → Alarms & reminders
2. Enable "Allow setting alarms and reminders"

**Why?** For precise reminder notifications.

## Testing Checklist

### ✅ Core Voice Commands

#### App Opening
- [ ] "Open YouTube"
- [ ] "Open Spotify"
- [ ] "Open WhatsApp"
- [ ] "Open Camera"
- [ ] "Open Settings"

**Expected**: App opens immediately

#### Phone Calls
- [ ] "Call [Contact Name]" (use real contact)
- [ ] "Call Mom" (if you have a Mom contact)
- [ ] "Call 1234567890" (your test number)

**Expected**: 
- Finds contact by name
- Initiates call immediately
- Speaks "Calling [name]"

#### Reminders
- [ ] "Remind me to take medicine in 5 minutes"
- [ ] "Set reminder for meeting at 3 PM"
- [ ] "Remind me to call John tomorrow"

**Expected**:
- Speaks confirmation
- Alarm notification appears at specified time
- Notification has title and message

#### YouTube Commands
- [ ] "Play Despacito on YouTube"
- [ ] "Open YouTube and search for funny cats"
- [ ] "Play Shape of You"

**Expected**:
- Opens YouTube
- Searches for video
- Auto-clicks first result (Phase 2 feature!)
- Video starts playing

#### Google Search
- [ ] "Search for weather today"
- [ ] "Google python tutorial"
- [ ] "Search for pizza near me"

**Expected**:
- Opens Chrome/Browser
- Shows Google search results
- Speaks confirmation

#### Spotify Commands
- [ ] "Play Bohemian Rhapsody on Spotify"
- [ ] "Open Spotify and search for Drake"

**Expected**:
- Opens Spotify
- Searches for song/artist
- Shows results

### ✅ UI Automation (Phase 2 New Features!)

#### Basic UI Actions
- [ ] "Scroll down" (while in any app)
- [ ] "Scroll up"
- [ ] "Go back"
- [ ] "Go home"
- [ ] "Click play button" (on YouTube)
- [ ] "Read screen" (tells you what's shown)

**Expected**: 
- Actions happen immediately
- Light confirms action
- No hanging or timeout

#### Multi-Step Workflows
- [ ] "Open YouTube, search for cats, and play the first video"
- [ ] "Open Spotify, search for Ed Sheeran"
- [ ] "Search for restaurants on Google and scroll down"

**Expected**:
- Each step executes in order
- Delays between steps work
- Completes full workflow

#### Screen Reading
- [ ] Open any app
- [ ] Say "what's on the screen?"
- [ ] Say "read screen"

**Expected**:
- Light lists visible text elements
- Speaks the content
- Privacy: Won't read passwords

### ✅ Bug Fixes Verification

#### Float Error (FIXED)
- [ ] Open any app using accessibility
- [ ] No crash on "rect.exactCenterX()"

**What was wrong**: Used non-existent method
**Fixed**: Changed to `rect.centerX().toFloat()`

#### Speech Hanging (FIXED)
- [ ] Give any voice command
- [ ] Light should respond within 30 seconds
- [ ] Never hangs in "speaking" state forever

**What was wrong**: No timeout on speech
**Fixed**: Added 30-second timeout with resolveOnce()

#### AI Confidence Not Changeable (FIXED)
- [ ] Open Settings
- [ ] Tap "AI Confidence Level"
- [ ] Enter new value (0.1 to 1.0)
- [ ] Tap OK

**What was wrong**: Alert.prompt doesn't exist on Android
**Fixed**: Created custom Modal with TextInput

### ✅ Edge Cases

#### No Internet
- [ ] Turn off WiFi and mobile data
- [ ] Try: "Open YouTube"
- [ ] Try: "Call [contact]"
- [ ] Try: "Set reminder in 5 minutes"

**Expected**: Offline features still work (app opening, calls, reminders)

#### App Not Installed
- [ ] "Open Netflix" (if you don't have it)

**Expected**: "I couldn't find Netflix on your phone"

#### Contact Not Found
- [ ] "Call NonexistentPerson"

**Expected**: "I couldn't find NonexistentPerson in your contacts"

#### Invalid Reminder
- [ ] "Remind me tomorrow" (no time)
- [ ] "Set reminder yesterday"

**Expected**: Graceful error, asks for clarification

#### Accessibility Disabled
- [ ] Disable accessibility service
- [ ] Try "scroll down"

**Expected**: "Accessibility service not enabled"

### ✅ Performance Tests

#### Response Time
- [ ] Voice command → Action: Should be < 3 seconds
- [ ] App opening: Should be < 1 second
- [ ] Phone call: Should be immediate
- [ ] YouTube auto-play: Should be < 5 seconds

#### Multiple Commands
- [ ] Give 3 commands in a row quickly
- [ ] Each should execute without overlap
- [ ] No commands lost

#### Background Operation
- [ ] Give command
- [ ] Switch to another app immediately
- [ ] Command should still complete

### ✅ Voice Recognition

#### Noisy Environment
- [ ] Test with background noise
- [ ] Test with music playing
- [ ] Test while walking

#### Different Accents/Speeds
- [ ] Speak slowly
- [ ] Speak fast
- [ ] Use your natural accent

#### Partial Matches
- [ ] "Open WhatsApp" vs "Open What's Up"
- [ ] "Call Mom" vs "Cole Mom"
- [ ] "YouTube" vs "You Tube"

## Known Issues & Limitations

### Current Limitations
1. **Text-based clicking only**: Can't click images without text labels
2. **Fixed timing**: Uses hardcoded delays, not smart waiting
3. **No gesture support**: Can't pinch/zoom/long-press yet
4. **Single language**: English only for now
5. **Android 7.0+**: Gestures require Nougat or higher

### Expected Behaviors
- **Session timeout**: Screen access expires after 30 seconds of inactivity
- **Element not found**: If button text doesn't match exactly, clicking fails
- **Slow apps**: If YouTube takes >2 seconds to load, auto-click might miss
- **Background apps**: Accessibility only works on foreground app

## Troubleshooting

### Command Not Working
1. Check accessibility is enabled
2. Verify app is installed
3. Try rephrasing command
4. Check phone volume (for speech feedback)

### App Won't Open
1. Check app is actually installed
2. Try opening manually first
3. Clear Light app cache
4. Restart Light app

### Calls Not Working
1. Verify phone permission granted
2. Check contact exists in Contacts app
3. Try full phone number instead of name
4. Restart Light app

### Reminders Not Appearing
1. Check "Exact Alarms" permission
2. Verify notification permissions
3. Check Do Not Disturb is off
4. Wait for full time (test with 1 minute reminder)

### UI Automation Fails
1. Ensure accessibility service is enabled
2. Check target app is in foreground
3. Try exact button text match
4. Check session hasn't expired
5. Look at logs for error messages

### Speech Not Working
1. Check phone volume is up
2. Verify microphone permission
3. Test in quiet environment
4. Try other voice commands
5. Restart app if hung

## Success Criteria

Phase 2 is working correctly if:
- ✅ All core voice commands execute
- ✅ YouTube auto-plays after search
- ✅ Contact calls work by name
- ✅ Reminders trigger notifications
- ✅ UI automation (scroll, click) works
- ✅ No float/crash errors
- ✅ Speech never hangs forever
- ✅ AI confidence is changeable
- ✅ Response times are reasonable
- ✅ Edge cases handled gracefully

## Performance Benchmarks

Target performance (90th percentile):
- **Voice recognition**: < 2 seconds
- **Command processing**: < 1 second
- **App opening**: < 1 second
- **Phone call initiation**: < 500ms
- **UI action**: < 500ms
- **YouTube auto-play**: < 5 seconds total
- **Speech synthesis**: < 2 seconds
- **End-to-end (voice to action)**: < 5 seconds

## Logging

Enable debug logs to track issues:

```bash
# Android logs
adb logcat | grep "Light\|Accessibility"

# Filter by tag
adb logcat -s LightAccessibility:D AccessibilityModule:D SmartAction:D Assistant:D
```

Key log tags:
- `LightAccessibility` - UI automation actions
- `AccessibilityModule` - Bridge layer
- `SmartAction` - Smart action executor
- `Assistant` - Voice command routing
- `ContactsBridge` - Contact lookup
- `ReminderModule` - Reminder scheduling

## Next Steps After Testing

Once Phase 2 tests pass:
1. Document any bugs found
2. Test on different Android versions
3. Test on different devices
4. Get user feedback
5. Plan Phase 3 enhancements

## Phase 3 Preview

Future enhancements planned:
- 🎯 ML-based element finding (no text needed)
- 📸 Computer vision for icon clicking
- ⏰ Smart waiting (dynamic delays)
- 🎨 Gesture support (pinch, zoom, swipe)
- 🎬 Macro recording
- 🌍 Multi-language support
- 🔗 Cross-app workflows
- 🧠 Context-aware automation

---

**Happy Testing!** 🚀

Report issues: Open GitHub issue or contact developer
