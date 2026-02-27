import { google, calendar_v3 } from "googleapis";
import { db } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/crypto";
import type { SyncResult } from "@/types/providers";
import { mapGoogleEvent } from "./mapper";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export class GoogleCalendarClient {
  private readonly connectedAccountId: string;
  private readonly userId: string;

  constructor(connectedAccountId: string, userId: string) {
    this.connectedAccountId = connectedAccountId;
    this.userId = userId;
  }

  private async getAuthClient() {
    const tokenRecord = await db.oAuthToken.findUnique({
      where: { connectedAccountId: this.connectedAccountId },
    });

    if (!tokenRecord) {
      throw new Error("No OAuth token found for account");
    }

    let accessToken = decryptToken(
      Buffer.from(tokenRecord.accessTokenEnc),
      Buffer.from(tokenRecord.iv),
      this.userId
    );

    // Proactive refresh: 5 minutes before expiry
    const bufferMs = 5 * 60 * 1000;
    if (Date.now() + bufferMs >= tokenRecord.expiresAt.getTime()) {
      accessToken = await this.refreshAccessToken(tokenRecord);
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken });

    return auth;
  }

  private async refreshAccessToken(tokenRecord: {
    refreshTokenEnc: Buffer | Uint8Array;
    iv: Buffer | Uint8Array;
    id: string;
  }): Promise<string> {
    const refreshToken = decryptToken(
      Buffer.from(tokenRecord.refreshTokenEnc),
      Buffer.from(tokenRecord.iv),
      this.userId
    );

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json() as {
      access_token: string;
      expires_in: number;
    };

    const newIv = Buffer.from(
      Array.from({ length: 12 }, () => Math.floor(Math.random() * 256))
    );
    const { ciphertext } = encryptToken(data.access_token, this.userId);

    await db.oAuthToken.update({
      where: { id: tokenRecord.id },
      data: {
        accessTokenEnc: ciphertext,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        iv: newIv,
        updatedAt: new Date(),
      },
    });

    return data.access_token;
  }

  async listCalendars(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    const auth = await this.getAuthClient();
    const cal = google.calendar({ version: "v3", auth });

    const response = await cal.calendarList.list({ minAccessRole: "reader" });
    return response.data.items ?? [];
  }

  async listEvents(
    calendarId: string,
    options: {
      syncToken?: string;
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
    } = {}
  ): Promise<{
    events: calendar_v3.Schema$Event[];
    nextSyncToken?: string;
    nextPageToken?: string;
  }> {
    const auth = await this.getAuthClient();
    const cal = google.calendar({ version: "v3", auth });

    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId,
      maxResults: options.maxResults ?? 250,
      singleEvents: false, // Keep recurring master events intact
    };

    if (options.syncToken) {
      params.syncToken = options.syncToken;
    } else {
      params.timeMin = options.timeMin ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      params.timeMax = options.timeMax ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    }

    const response = await cal.events.list(params);

    return {
      events: response.data.items ?? [],
      nextSyncToken: response.data.nextSyncToken ?? undefined,
      nextPageToken: response.data.nextPageToken ?? undefined,
    };
  }

  async registerWebhook(
    calendarId: string,
    channelId: string
  ): Promise<{ resourceId: string; expiration: number }> {
    const auth = await this.getAuthClient();
    const cal = google.calendar({ version: "v3", auth });

    const response = await cal.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/google`,
      },
    });

    return {
      resourceId: response.data.resourceId!,
      expiration: parseInt(response.data.expiration ?? "0"),
    };
  }

  async stopWebhook(channelId: string, resourceId: string): Promise<void> {
    const auth = await this.getAuthClient();
    const cal = google.calendar({ version: "v3", auth });

    await cal.channels.stop({
      requestBody: { id: channelId, resourceId },
    });
  }
}

export async function createGoogleClient(
  connectedAccountId: string,
  userId: string
): Promise<GoogleCalendarClient> {
  return new GoogleCalendarClient(connectedAccountId, userId);
}
