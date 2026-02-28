import { DAVClient } from "tsdav";
import { db } from "@/lib/db";
import { decryptToken } from "@/lib/crypto";

export class CaldavCalendarClient {
  private readonly connectedAccountId: string;
  private readonly userId: string;

  constructor(connectedAccountId: string, userId: string) {
    this.connectedAccountId = connectedAccountId;
    this.userId = userId;
  }

  private async getClient(): Promise<{ client: DAVClient; username: string }> {
    const account = await db.connectedAccount.findUnique({
      where: { id: this.connectedAccountId },
    });
    if (!account) throw new Error("Account not found");

    const tokenRecord = await db.oAuthToken.findUnique({
      where: { connectedAccountId: this.connectedAccountId },
    });
    if (!tokenRecord) throw new Error("No token record found");

    const password  = decryptToken(Buffer.from(tokenRecord.accessTokenEnc), this.userId);
    const serverUrl = decryptToken(Buffer.from(tokenRecord.refreshTokenEnc), this.userId);
    const username  = account.email;

    const client = new DAVClient({
      serverUrl,
      credentials: { username, password },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });

    await client.login();
    return { client, username };
  }

  async listCalendars() {
    const { client } = await this.getClient();
    return client.fetchCalendars();
  }

  async listEvents(
    calendarUrl: string,
    options: { timeMin?: string; timeMax?: string } = {}
  ) {
    const { client } = await this.getClient();
    const calendars  = await client.fetchCalendars();
    const calendar   = calendars.find((c) => c.url === calendarUrl);
    if (!calendar) return [];

    const timeRange =
      options.timeMin && options.timeMax
        ? { start: options.timeMin, end: options.timeMax }
        : {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end:   new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          };

    return client.fetchCalendarObjects({ calendar, timeRange });
  }
}

// ── One-shot helper used during account connection to verify credentials ──────

export async function testCaldavConnection(
  serverUrl: string,
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string; calendarCount?: number }> {
  try {
    const client = new DAVClient({
      serverUrl,
      credentials: { username, password },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });
    await client.login();
    const calendars = await client.fetchCalendars();
    return { ok: true, calendarCount: calendars.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return { ok: false, error: msg };
  }
}
