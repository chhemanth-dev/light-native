/**
 * Vault — encrypted key-value store using expo-secure-store + expo-local-authentication.
 * All sensitive data (PIN hash, user identity, session tokens) lives here.
 * Nobody else using the same device can read it without biometric / PIN.
 */
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";

const KEYS = {
  PIN_HASH: "light_pin_hash",
  LOCKED: "light_locked",
  OWNER_NAME: "light_owner_name",
  SETUP_DONE: "light_setup_done",
} as const;

/* ── PIN ──────────────────────────────────────────────────── */

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + "light_salt_v1"
  );
}

export async function setPin(pin: string) {
  const hash = await hashPin(pin);
  await SecureStore.setItemAsync(KEYS.PIN_HASH, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(KEYS.PIN_HASH);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

export async function hasPin(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(KEYS.PIN_HASH);
  return !!stored;
}

/* ── Biometric unlock ─────────────────────────────────────── */

export async function hasBiometrics(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Light",
    fallbackLabel: "Use PIN",
    disableDeviceFallback: false,
  });
  return result.success;
}

/* ── Setup / owner ────────────────────────────────────────── */

export async function isSetupDone(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(KEYS.SETUP_DONE);
  return val === "true";
}

export async function completeSetup(ownerName: string, pin: string) {
  await setPin(pin);
  await SecureStore.setItemAsync(KEYS.OWNER_NAME, ownerName);
  await SecureStore.setItemAsync(KEYS.SETUP_DONE, "true");
}

export async function getOwnerName(): Promise<string> {
  return (await SecureStore.getItemAsync(KEYS.OWNER_NAME)) ?? "there";
}

/* ── Generic secure value ─────────────────────────────────── */

export async function secureSet(key: string, value: string) {
  await SecureStore.setItemAsync(`light_${key}`, value);
}

export async function secureGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(`light_${key}`);
}

export async function secureDelete(key: string) {
  await SecureStore.deleteItemAsync(`light_${key}`);
}
