/**
 * UI Automation - Control apps with accessibility service
 * Enables Light to click buttons, scroll, type text
 */
import { NativeModules, Platform } from 'react-native';

const AccessibilityModule = Platform.OS === 'android' ? NativeModules.AccessibilityModule : null;

export interface UIAction {
  type: 'click' | 'scroll_down' | 'scroll_up' | 'type' | 'back' | 'home' | 'read_screen';
  text?: string;
  x?: number;
  y?: number;
}

export interface UIActionResult {
  success: boolean;
  message: string;
  screenText?: string[];
}

/**
 * Click a button by text
 */
export async function clickButton(buttonText: string): Promise<UIActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility not available' };
  }

  try {
    await AccessibilityModule.performAction('click', { text: buttonText });
    return {
      success: true,
      message: `Clicked "${buttonText}"`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to click: ${error.message}`,
    };
  }
}

/**
 * Scroll down in current app
 */
export async function scrollDown(): Promise<UIActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility not available' };
  }

  try {
    await AccessibilityModule.performAction('scroll_down', null);
    return {
      success: true,
      message: 'Scrolled down',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to scroll: ${error.message}`,
    };
  }
}

/**
 * Scroll up in current app
 */
export async function scrollUp(): Promise<UIActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility not available' };
  }

  try {
    await AccessibilityModule.performAction('scroll_up', null);
    return {
      success: true,
      message: 'Scrolled up',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to scroll: ${error.message}`,
    };
  }
}

/**
 * Type text in focused field
 */
export async function typeText(text: string): Promise<UIActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility not available' };
  }

  try {
    await AccessibilityModule.performAction('type_text', { text });
    return {
      success: true,
      message: `Typed: ${text}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to type: ${error.message}`,
    };
  }
}

/**
 * Press back button
 */
export async function pressBack(): Promise<UIActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility not available' };
  }

  try {
    await AccessibilityModule.performAction('back', null);
    return {
      success: true,
      message: 'Pressed back',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to go back: ${error.message}`,
    };
  }
}

/**
 * Go to home screen
 */
export async function goHome(): Promise<UIActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility not available' };
  }

  try {
    await AccessibilityModule.performAction('home', null);
    return {
      success: true,
      message: 'Went to home',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to go home: ${error.message}`,
    };
  }
}

/**
 * Read current screen content
 */
export async function readScreen(): Promise<UIActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility not available' };
  }

  try {
    await AccessibilityModule.performAction('read_screen', null);
    return {
      success: true,
      message: 'Screen read',
      screenText: [], // Will be populated by accessibility service
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to read screen: ${error.message}`,
    };
  }
}

/**
 * Execute a complex UI workflow
 * Example: Open YouTube, search for video, click first result
 */
export async function executeWorkflow(steps: UIAction[]): Promise<UIActionResult[]> {
  const results: UIActionResult[] = [];

  for (const step of steps) {
    let result: UIActionResult;

    switch (step.type) {
      case 'click':
        result = await clickButton(step.text || '');
        break;
      case 'scroll_down':
        result = await scrollDown();
        break;
      case 'scroll_up':
        result = await scrollUp();
        break;
      case 'type':
        result = await typeText(step.text || '');
        break;
      case 'back':
        result = await pressBack();
        break;
      case 'home':
        result = await goHome();
        break;
      case 'read_screen':
        result = await readScreen();
        break;
      default:
        result = { success: false, message: 'Unknown action type' };
    }

    results.push(result);

    // Stop if any step fails
    if (!result.success) {
      break;
    }

    // Small delay between steps
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}
