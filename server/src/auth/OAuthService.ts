import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomBytes, createHash } from "crypto";
import { ApiError } from "../common/ApiError.js";
import type { EnvironmentService } from "../common/EnvironmentService.js";
import type { RedisClient } from "../redis/RedisClient.js";

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  issuer: string;
  end_session_endpoint?: string;
};

type TokenResponse = {
  id_token: string;
  access_token: string;
};

export type OidcUserInfo = {
  sub: string;
  email: string | undefined;
  name: string | undefined;
};

const OAUTH_STATE_PREFIX = "oauth_state:";
const OAUTH_STATE_TTL_SECONDS = 300;

export class OAuthService {
  private discovery: OidcDiscovery | undefined;

  constructor(
    private readonly envService: EnvironmentService,
    private readonly redis: RedisClient,
  ) {}

  async getLogoutUrl(): Promise<string> {
    const discovery = await this.getDiscovery();
    // Fall back to Keycloak convention if end_session_endpoint not in discovery
    const endSessionEndpoint =
      discovery.end_session_endpoint ??
      `${discovery.issuer}/protocol/openid-connect/logout`;
    const params = new URLSearchParams({
      client_id: this.envService.idpClientId,
      post_logout_redirect_uri: this.envService.idpFrontendUrl,
    });
    return `${endSessionEndpoint}?${params.toString()}`;
  }

  async getRegistrationUrl(): Promise<string> {
    const discovery = await this.getDiscovery();
    // Derives registration URL from the authorization endpoint per Keycloak convention
    const registrationEndpoint = discovery.authorization_endpoint.replace(/\/auth$/, "/registrations");
    const state = randomBytes(32).toString("hex");
    const codeVerifier = randomBytes(64).toString("base64url");
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

    await this.redis.setWithTtl(
      `${OAUTH_STATE_PREFIX}${state}`,
      JSON.stringify({ codeVerifier }),
      OAUTH_STATE_TTL_SECONDS,
    );

    const params = new URLSearchParams({
      client_id: this.envService.idpClientId,
      redirect_uri: this.envService.idpRedirectUri,
      response_type: "code",
      scope: "openid profile email",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
    });
    return `${registrationEndpoint}?${params.toString()}`;
  }

  async getAuthorizationUrl(): Promise<{ url: string; state: string }> {
    const discovery = await this.getDiscovery();
    const state = randomBytes(32).toString("hex");
    const codeVerifier = randomBytes(64).toString("base64url");
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

    await this.redis.setWithTtl(
      `${OAUTH_STATE_PREFIX}${state}`,
      JSON.stringify({ codeVerifier }),
      OAUTH_STATE_TTL_SECONDS,
    );

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.envService.idpClientId,
      redirect_uri: this.envService.idpRedirectUri,
      scope: "openid profile email",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
    });

    return { url: `${discovery.authorization_endpoint}?${params.toString()}`, state };
  }

  async handleCallback(code: string, state: string): Promise<OidcUserInfo> {
    const raw = await this.redis.get(`${OAUTH_STATE_PREFIX}${state}`);
    if (!raw) {
      throw new ApiError("BadRequest", 400, "Invalid or expired OAuth state");
    }
    await this.redis.del(`${OAUTH_STATE_PREFIX}${state}`);

    const { codeVerifier } = JSON.parse(raw) as { codeVerifier: string };
    const discovery = await this.getDiscovery();
    const idToken = await this.exchangeCode(discovery.token_endpoint, code, codeVerifier);
    return this.validateIdToken(idToken, discovery.jwks_uri, discovery.issuer);
  }

  private async exchangeCode(
    tokenEndpoint: string,
    code: string,
    codeVerifier: string,
  ): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.envService.idpRedirectUri,
      client_id: this.envService.idpClientId,
      client_secret: this.envService.idpClientSecret,
      code_verifier: codeVerifier,
    });

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError("BadRequest", 400, `Token exchange failed: ${text}`);
    }

    const tokens = (await response.json()) as TokenResponse;
    if (!tokens.id_token) {
      throw new ApiError("BadRequest", 400, "No id_token in token response");
    }
    return tokens.id_token;
  }

  private async validateIdToken(
    idToken: string,
    jwksUri: string,
    issuer: string,
  ): Promise<OidcUserInfo> {
    const JWKS = createRemoteJWKSet(new URL(jwksUri));

    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer,
      audience: this.envService.idpClientId,
    });

    const sub = payload.sub;
    if (!sub) {
      throw new ApiError("BadRequest", 400, "id_token missing sub claim");
    }

    const email = typeof payload["email"] === "string" ? payload["email"] : undefined;

    let name: string | undefined;
    if (typeof payload["name"] === "string") {
      name = payload["name"];
    } else if (
      typeof payload["given_name"] === "string" ||
      typeof payload["family_name"] === "string"
    ) {
      name = [payload["given_name"], payload["family_name"]]
        .filter((v): v is string => typeof v === "string")
        .join(" ");
    }

    return { sub, email, name };
  }

  private async getDiscovery(): Promise<OidcDiscovery> {
    if (this.discovery) return this.discovery;

    const response = await fetch(this.envService.idpOidcDiscoveryUrl);
    if (!response.ok) {
      throw new ApiError("BadGateway", 502, "Failed to fetch OIDC discovery document");
    }

    this.discovery = (await response.json()) as OidcDiscovery;
    return this.discovery;
  }
}
