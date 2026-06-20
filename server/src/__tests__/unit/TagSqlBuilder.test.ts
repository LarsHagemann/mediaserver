import { describe, it, expect, beforeEach } from "vitest";
import { Tag, TagParser } from "@lars_hagemann/tags";
import {
  TagSqlBuilder,
  buildQueryFromSelectStatement,
  buildQueryFromInsertStatement,
  buildQueryFromDeleteStatement,
} from "../../tags/TagSqlBuilder.js";
import type { TagCache } from "../../tags/TagCache.js";

const config = {
  userdataTableName: "documents",
  userdataTableIdColumn: "id",
  userdataTableColumns: ["id", "mime"],
};

/** Fake TagCache: returns ids for known tags, throws "Tag not found" otherwise. */
const makeCache = (known: Record<string, string> = {}): TagCache =>
  ({
    tagToTagId: async (tag: { key: string; value?: string }) => {
      const key = `${tag.key}${tag.value ? `:${tag.value}` : ""}`;
      const id = known[key];
      if (!id) throw new Error(`Tag not found in cache: ${key}`);
      return id;
    },
  }) as unknown as TagCache;

describe("TagSqlBuilder (SQL injection hardening)", () => {
  let builder: TagSqlBuilder;

  beforeEach(() => {
    builder = new TagSqlBuilder(config, makeCache({ nature: "42" }));
  });

  it("binds an unknown tag key as a parameter instead of interpolating it", async () => {
    // The query parser allows single quotes in identifiers, so a key like this
    // would previously have broken out of the SQL string literal.
    const payload = "x'/**/OR/**/'1'='1";
    const filter = new TagParser(payload).parse();

    const result = await builder.buildListFilteredEntitiesQuery(filter);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const sql = buildQueryFromSelectStatement(result.stmt);
    // The raw payload must NOT appear in the SQL text...
    expect(sql).not.toContain(payload);
    // ...it must be a bound parameter instead.
    expect(sql).toMatch(/tags\.key = \$p\d+/);
    expect(Object.values(result.params ?? {})).toContain(payload);
  });

  it("binds a known tag id as a parameter instead of interpolating it", async () => {
    const filter = new TagParser("nature").parse();

    const result = await builder.buildListFilteredEntitiesQuery(filter);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const sql = buildQueryFromSelectStatement(result.stmt);
    expect(sql).toMatch(/ut\.tag_id = \$p\d+/);
    expect(sql).not.toMatch(/ut\.tag_id = '?42'?/);
    expect(Object.values(result.params ?? {})).toContain("42");
  });

  it("does not leak bind parameters between successive builds", async () => {
    const r1 = await builder.buildListFilteredEntitiesQuery(
      new TagParser("alpha'").parse(),
    );
    const r2 = await builder.buildListFilteredEntitiesQuery(
      new TagParser("beta'").parse(),
    );

    expect(r1.success && r2.success).toBe(true);
    if (!r1.success || !r2.success) return;

    expect(r1.params).toEqual({ p0: "alpha'" });
    expect(r2.params).toEqual({ p0: "beta'" });
  });

  it("binds the tag id when adding a tag to an entity", async () => {
    const result = await builder.buildAddTagToEntityQuery(new Tag("nature"));
    expect(result.success).toBe(true);
    if (!result.success) return;

    const sql = buildQueryFromInsertStatement(result.stmt);
    expect(sql).toContain("$entityId");
    expect(sql).toContain("$tagId");
    expect(sql).not.toContain("42");
    expect(result.params).toEqual({ tagId: "42" });
  });

  it("binds the tag id when removing a tag from an entity", async () => {
    const result = await builder.buildRemoveTagFromEntityQuery(
      new Tag("nature"),
    );
    expect(result.success).toBe(true);
    if (!result.success) return;

    const sql = buildQueryFromDeleteStatement(result.stmt);
    expect(sql).toContain("tag_id = $tagId");
    expect(sql).not.toContain("'42'");
    expect(result.params).toEqual({ tagId: "42" });
  });
});
