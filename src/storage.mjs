const HISTORY_KEY = "emergency-school:sessions:v1";
const SETUP_KEY = "emergency-school:setup:v2";

export function readLocal(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export const readHistory = () => {
  const history = readLocal(HISTORY_KEY, []);
  return Array.isArray(history)
    ? history.filter((s) => s?.id && Array.isArray(s.transcript)).slice(0, 40)
    : [];
};
export const saveHistory = (sessions) =>
  writeLocal(HISTORY_KEY, sessions.slice(0, 40));
export const readSetup = () =>
  readLocal(SETUP_KEY, {
    mode: "random",
    difficulty: "",
    language: "",
    domains: [],
  });
export const saveSetup = (setup) => writeLocal(SETUP_KEY, setup);
