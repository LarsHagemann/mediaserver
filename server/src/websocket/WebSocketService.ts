import { WebSocketServer, WebSocket } from "ws";
import type { EnvironmentService } from "../common/EnvironmentService.js";
import { v4 as uuidv4 } from "uuid";
import type { LoggingService } from "../common/LoggingService.js";

export class WebSocketService {
  private wss?: WebSocketServer;
  private readonly port: number;
  private readonly allowedOrigin: string;

  private readonly clients: Map<string, WebSocket> = new Map();

  constructor(
    envService: EnvironmentService,
    private readonly logger: LoggingService,
  ) {
    this.port = envService.websocketPort;
    this.allowedOrigin = envService.corsOrigin;
  }

  private generateClientId(): string {
    return `ws://${uuidv4()}`;
  }

  public async start(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.wss = new WebSocketServer(
        {
          port: this.port,
          // Reject cross-origin browser connections. Non-browser clients (no
          // Origin header) are allowed since they are not subject to CSRF.
          verifyClient: (info: { origin?: string }) =>
            info.origin === undefined || info.origin === this.allowedOrigin,
        },
        () => {
          this.logger.info(`WebSocket server started on port ${this.port}`);
          resolve();
        },
      );
    });

    this.wss?.on("connection", (ws) => {
      const webSocketClientId = this.generateClientId();
      this.clients.set(webSocketClientId, ws);

      this.logger.info(`WebSocket client connected: ${webSocketClientId}`);

      ws.on("close", () => {
        this.clients.delete(webSocketClientId);
        this.logger.info(`WebSocket client disconnected: ${webSocketClientId}`);
      });

      ws.on("message", (message) => {
        this.logger.info(
          `Received message from ${webSocketClientId}: ${message}`,
        );
      });

      ws.send(
        JSON.stringify({
          type: "connected",
          id: webSocketClientId,
        }),
      );
    });
  }

  public async stop(): Promise<void> {
    this.clients.forEach((client) => client.close());

    await new Promise<void>((resolve) => {
      this.wss?.close(() => {
        resolve();
      });
    });
  }

  public async send(message: string, webSocketClientId: string): Promise<void> {
    const client = this.clients.get(webSocketClientId);
    if (client) {
      client.send(message);
    }
  }
}
