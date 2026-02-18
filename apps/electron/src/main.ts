export function bootstrapElectronShell(): string {
  return "electron-shell-ready";
}

if (process.env.NODE_ENV !== "test") {
  console.log("Electron workspace initialized.");
}
