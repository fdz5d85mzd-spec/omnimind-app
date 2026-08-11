import { NextRequest } from 'next/server';
import { prisma } from '@/lib/ogn/db';

export interface ApiAuthResult {
  valid: boolean;
  apiKey?: any;
  error?: string;
}

/**
  * Verifies the x-api-key header against active keys in the database.
  * Updates lastUsedAt and records an entry in ApiUsageLog on success.
  */
export async function verifyApiKey(req: NextRequest): Promise<ApiAuthResult> {
  try {
    const key = req.headers.get('x-api-key');

    if (!key) {
      return {
        valid: false,
        error: 'API key missing. Please provide a valid key in the x-api-key header.',
      };
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
    });

    if (!apiKey || !apiKey.isActive) {
      return {
        valid: false,
        error: 'Invalid or inactive API key.',
      };
    }

    // Update lastUsedAt and log usage
    try {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;
      await prisma.apiUsageLog.create({
        data: {
          apiKeyId: apiKey.id,
          endpoint: pathname,
          method: req.method,
          statusCode: 200,
        },
      });
    } catch (logErr) {
      console.error('[verifyApiKey] Error logging API key usage:', logErr);
    }

    return {
      valid: true,
      apiKey,
    };
  } catch (error: any) {
    console.error('[verifyApiKey] Verification error:', error);
    return {
      valid: false,
      error: 'Failed to verify API key due to server error.',
    };
  }
}
