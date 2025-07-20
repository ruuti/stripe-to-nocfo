import {
  Config,
  NocfoEntry,
  NocfoEntryInput,
  NocfoApiResponse,
  HttpMethod,
  ContentType,
  HeaderKey,
} from '../types';
import logger from '../utils/logger';

export class NocfoService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async loadEntries(): Promise<NocfoEntry[]> {
    const nocfoEntries: NocfoEntry[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await fetch(
        `${this.config.NOCFO.BASE_URL}/business/${this.config.NOCFO.BUSINESS_ID}/document/?page=${page}&search=`,
        {
          method: HttpMethod.GET,
          headers: {
            [HeaderKey.CONTENT_TYPE]: ContentType.APPLICATION_JSON,
            [HeaderKey.COOKIE]: `nocfo-auth-token=${this.config.NOCFO.AUTH_TOKEN}`,
          },
        }
      );
      const data = (await response.json()) as NocfoApiResponse;
      if (!data || !data.results) {
        logger.error('Failed to load NOCFO entries:', data);
        throw new Error('Failed to load NOCFO entries');
      }
      nocfoEntries.push(...data.results);
      hasMorePages = !!data.next;
      page++;
    }
    return nocfoEntries;
  }

  async createEntry(entry: NocfoEntryInput): Promise<unknown> {
    const url = `${this.config.NOCFO.BASE_URL}/business/${this.config.NOCFO.BUSINESS_ID}/document/`;
    const response = await fetch(url, {
      method: HttpMethod.POST,
      headers: {
        [HeaderKey.CONTENT_TYPE]: ContentType.APPLICATION_JSON,
        [HeaderKey.COOKIE]: `nocfo-auth-token=${this.config.NOCFO.AUTH_TOKEN}; nocfo-csrf-token=${this.config.NOCFO.CSRF_TOKEN}`,
        [HeaderKey.X_CSRF_TOKEN]: this.config.NOCFO.CSRF_TOKEN,
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create entry: ${errorText}`);
    }

    return response.json();
  }

  async updateEntry(entryId: string, entry: NocfoEntryInput): Promise<unknown> {
    const url = `${this.config.NOCFO.BASE_URL}/business/${this.config.NOCFO.BUSINESS_ID}/document/${entryId}/`;
    const response = await fetch(url, {
      method: HttpMethod.PATCH,
      headers: {
        [HeaderKey.CONTENT_TYPE]: ContentType.APPLICATION_JSON,
        [HeaderKey.COOKIE]: `nocfo-auth-token=${this.config.NOCFO.AUTH_TOKEN}; nocfo-csrf-token=${this.config.NOCFO.CSRF_TOKEN}`,
        [HeaderKey.X_CSRF_TOKEN]: this.config.NOCFO.CSRF_TOKEN,
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update entry: ${errorText}`);
    }

    return response.json();
  }

  findExistingEntry(
    transactionId: string,
    nocfoEntries: NocfoEntry[]
  ): NocfoEntry | undefined {
    return nocfoEntries.find(
      e => e.description.split(' - ')[0] === transactionId
    );
  }

  isEntryUnchanged(
    existingEntry: NocfoEntry,
    newEntry: NocfoEntryInput
  ): boolean {
    return JSON.stringify(existingEntry) === JSON.stringify(newEntry);
  }
}
