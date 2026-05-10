import { createClient } from "redis";
import type { EnvironmentService } from "../common/EnvironmentService.js";

export class RedisClient {
  private readonly client;

  private static buildEndpoint(envService: EnvironmentService): string {
    const host = envService.redisHost;
    const port = envService.redisPort;

    return `redis://${host}:${port}`;
  }

  constructor(private readonly envService: EnvironmentService) {
    this.client = createClient({
      url: RedisClient.buildEndpoint(this.envService),
    }).on("error", (err) => {
      console.error("Redis Client Error", err);
    });
  }

  public async connect(): Promise<void> {
    const p = new Promise((resolve, reject) => {
      this.client.once("ready", resolve);
      this.client.once("error", reject);
    });

    await this.client.connect();
    await p;
  }

  public async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  public async setWithTtl(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, { EX: ttlSeconds });
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.destroy();
    }
  }
}
