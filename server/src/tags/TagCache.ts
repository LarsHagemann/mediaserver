import { type MetaTag, type Tag } from "@lars_hagemann/tags";
import type { RedisClient } from "../redis/RedisClient.js";
import { TagService } from "./TagService.js";

export class TagCache {
  constructor(private readonly redisClient: RedisClient) {}

  public async init(
    tags: {
      tag: Tag | MetaTag;
      tagId: string;
    }[],
  ): Promise<void> {
    for (const { tag, tagId } of tags) {
      await this.redisClient.set(`tag:${TagService.toString(tag)}`, tagId);
    }
  }

  public async tagToTagId(tag: Tag | MetaTag): Promise<string> {
    const tagId = await this.redisClient.get(`tag:${TagService.toString(tag)}`);
    if (!tagId) {
      throw new Error(`Tag not found in cache: ${TagService.toString(tag)}`);
    }
    return tagId;
  }

  public async onTagAdded(tag: Tag | MetaTag, tagId: string): Promise<void> {
    await this.redisClient.set(`tag:${TagService.toString(tag)}`, tagId);
  }

  public async onTagDeleted(tag: Tag | MetaTag): Promise<void> {
    await this.redisClient.del(`tag:${TagService.toString(tag)}`);
  }
}
