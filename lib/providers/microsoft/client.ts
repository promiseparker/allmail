import { Client } from "@microsoft/microsoft-graph-client";
import { db } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/crypto";
import type { MicrosoftEvent, MicrosoftCalendar } from "@/types/providers";

const MS_TOKEN_URL = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID ?? "common"}/oauth2/v2.0/token`;

export class MicrosoftCalendarClient {
  private readonly connectedAccountId: string;
  private readonly userId: string;

  constructor(connectedAccountId: string, userId: string) {
    this.connectedAccountId = connectedAccountId;
    this.userId = userId;
  }

  private async getAccessToken(): Promise<string> {
    const tokenRecord = await db.oAuthToken.findUnique({
      where: { connectedAccountId: this.connectedAccountId },
    });

    if (!tokenRecord) throw new Error("No OAuth token found");

    let accessToken = decryptToken(
      Buffer.from(tokenRecord.accessTokenEnc),
      this.userId
    );

    const bufferMs = 5 * 60 * 1000;
    if (Date.now() + bufferMs >= tokenRecord.expiresAt.getTime()) {
      accessToken = await this.refreshAccessToken(tokenRecord);
    }

    return accessToken;
  }

  private async refreshAccessToken(tokenRecord: {
    refreshTokenEnc: Buffer | Uint8Array;
    id: string;
  }): Promise<string> {
    const refreshToken = decryptToken(
      Buffer.from(tokenRecord.refreshTokenEnc),
      this.userId
    );

    const response = await fetch(MS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "openid email profile offline_access Calendars.Read",
      }),
    });

    if (!response.ok) {
      throw new Error(`MS token refresh failed: ${await response.text()}`);
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const newAccessEnc  = encryptToken(data.access_token,  this.userId);
    const newRefreshEnc = encryptToken(data.refresh_token, this.userId);

    await db.oAuthToken.update({
      where: { id: tokenRecord.id },
      data: {
        accessTokenEnc: newAccessEnc,
        refreshTokenEnc: newRefreshEnc,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        // MS refresh tokens have 90-day sliding window
        refreshExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    return data.access_token;
  }

  private async getClient(): Promise<Client> {
    const accessToken = await this.getAccessToken();
    return Client.init({
      authProvider: (done) => done(null, accessToken),
    });
  }

  async listCalendars(): Promise<MicrosoftCalendar[]> {
    const client = await this.getClient();
    const response = await client.api("/me/calendars").get();
    return response.value ?? [];
  }

  async listEvents(
    calendarId: string,
    options: {
      deltaLink?: string;
      startDateTime?: string;
      endDateTime?: string;
    } = {}
  ): Promise<{
    events: MicrosoftEvent[];
    nextDeltaLink?: string;
  }> {
    const client = await this.getClient();

    let endpoint: string;

    if (options.deltaLink) {
      // Delta sync — only changes since last sync
      endpoint = options.deltaLink;
    } else {
      const startDate =
        options.startDateTime ??
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate =
        options.endDateTime ??
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      endpoint = `/me/calendars/${calendarId}/calendarView/delta?startDateTime=${startDate}&endDateTime=${endDate}`;
    }

    const response = await client.api(endpoint).get();
    const events: MicrosoftEvent[] = response.value ?? [];
    const nextDeltaLink = response["@odata.deltaLink"];

    return { events, nextDeltaLink };
  }

  async registerWebhook(calendarId: string): Promise<{
    subscriptionId: string;
    expiresAt: Date;
  }> {
    const client = await this.getClient();
    // MS Graph subscriptions expire in 3 days max
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const subscription = await client.api("/subscriptions").post({
      changeType: "created,updated,deleted",
      notificationUrl: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/microsoft`,
      resource: `/me/calendars/${calendarId}/events`,
      expirationDateTime: expiresAt.toISOString(),
    });

    return {
      subscriptionId: subscription.id,
      expiresAt,
    };
  }

  async renewWebhook(subscriptionId: string): Promise<Date> {
    const client = await this.getClient();
    const newExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await client.api(`/subscriptions/${subscriptionId}`).patch({
      expirationDateTime: newExpiry.toISOString(),
    });

    return newExpiry;
  }
}
