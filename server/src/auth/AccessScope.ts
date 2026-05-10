export type CollectionAccessScope = { type: "all" } | { type: "none" };
// future: | { type: "accessible-by"; userId: string }

export type DocumentAccessScope =
  | { type: "all" }
  | { type: "none" }
  | { type: "public-only" }
  | { type: "accessible-by"; userId: string };
