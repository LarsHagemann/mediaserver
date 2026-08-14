export type CollectionAccessScope =
  | { type: "all" }
  | { type: "none" }
  | { type: "public-only" }
  | { type: "accessible-by"; userId: string };

export type DocumentAccessScope =
  | { type: "all" }
  | { type: "none" }
  | { type: "public-only" }
  | { type: "accessible-by"; userId: string }
  // Strictly narrower than `accessible-by`: only documents the user actually
  // owns, excluding public and shared-with-me ones. Used by destructive
  // features (duplicate resolution) where "can see" must not imply "may delete".
  | { type: "owned-by"; userId: string };
