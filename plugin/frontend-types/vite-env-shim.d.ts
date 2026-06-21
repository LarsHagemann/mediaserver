// The host source reaches Vite's `import.meta.env` (e.g. in app/baseApi.ts).
// This minimal shim lets that source type-check while we emit the plugin type
// package from it; it is not part of the published types (only `types/` is).
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
