import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * POST /api/admin/media/convert
 *
 * Admin-only. Convert video to WebM format and store alongside original.
 * Called asynchronously after video upload.
 *
 * Request body:
 * {
 *   mediaId: string (UUID),
 *   originalFilename: string (e.g., "1234567-uuid.mp4")
 * }
 *
 * Returns 403 if not admin, 400 if invalid payload, 200 on success.
 * Runs as fire-and-forget: conversion happens in background.
 */

const convertSchema = z.object({
  mediaId: z.string().min(1, 'Media ID required'),
  originalFilename: z.string().min(1, 'Filename required'),
});

type ConvertPayload = z.infer<typeof convertSchema>;

/**
 * Convert video to WebM using FFmpeg
 * Downloads from Supabase, converts, uploads back
 */
async function convertVideoToWebM(
  fileUrl: string,
  originalFilename: string,
  mediaId: string
): Promise<boolean> {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    // Dynamically load FFmpeg (only at runtime, not at build time)
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegStatic = require('ffmpeg-static');

    if (ffmpegStatic) {
      ffmpeg.setFfmpegPath(ffmpegStatic);
    }

    const webmFilename = originalFilename.replace(/\.(mp4|mov|m4v)$/i, '.webm');
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-convert-'));
    inputPath = path.join(tempDir, originalFilename);
    outputPath = path.join(tempDir, webmFilename);

    // 1. Download original from Supabase
    console.log(`📥 Downloading: ${originalFilename}`);
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(buffer));
    console.log(`✓ Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

    // 2. Convert to WebM with VP9 codec
    console.log(`🎬 Converting to WebM (VP9)...`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath!)
        .outputOptions([
          '-c:v vp9',
          '-b:v 1M', // 1Mbps bitrate (adjust for quality)
          '-c:a libopus',
          '-b:a 128k',
          '-deadline realtime', // Speed up encoding
        ])
        .output(outputPath!)
        .on('error', reject)
        .on('end', () => {
          console.log(`✓ Conversion complete`);
          resolve();
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`  Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .run();
    });

    // 3. Upload converted WebM to Supabase
    console.log(`📤 Uploading WebM version...`);
    const admin = createAdminClient();
    const webmData = await fs.readFile(outputPath);

    const { error: uploadErr } = await admin.storage
      .from('media')
      .upload(webmFilename, webmData, {
        contentType: 'video/webm',
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }
    console.log(`✓ Uploaded ${(webmData.length / 1024 / 1024).toFixed(2)}MB`);

    // 4. Update storage_formats in database
    const { error: updateErr } = await admin
      .from('media')
      .update({
        storage_formats: ['mp4', 'webm'],
      })
      .eq('id', mediaId);

    if (updateErr) {
      console.warn(`Warning: Could not update storage_formats: ${updateErr.message}`);
    } else {
      console.log(`✓ Updated storage_formats in database`);
    }

    return true;
  } catch (err) {
    console.error('❌ Conversion failed:', err);
    return false;
  } finally {
    // 5. Clean up temp files
    if (inputPath) {
      try {
        await fs.unlink(inputPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (outputPath) {
      try {
        await fs.unlink(outputPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (inputPath) {
      try {
        const tempDir = path.dirname(inputPath);
        await fs.rmdir(tempDir);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

export async function POST(request: NextRequest) {
  // 1. Identity check
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Parse and validate body
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = convertSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { mediaId, originalFilename } = parsed.data;

  // Log the request for debugging
  console.log(`[CONVERT] POST /api/admin/media/convert - mediaId: ${mediaId}, filename: ${originalFilename}`);

  try {
    // 3. Fetch media record
    // Support both UUID (direct lookup) and filename-based (for newly uploaded files)
    const admin = createAdminClient();
    let media;
    let fetchErr;

    // Check if mediaId is a valid UUID or 'pending' (from new uploads)
    const isValidUuid = mediaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    if (!isValidUuid) {
      // Look up by filename (for newly uploaded files where mediaId='pending')
      console.log(`Looking up media by filename: ${originalFilename}`);
      const result = await admin
        .from('media')
        .select('id, file_url, media_type, storage_formats')
        .ilike('file_url', `%${originalFilename}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      media = result.data;
      fetchErr = result.error;
    } else {
      // Direct UUID lookup (if called with explicit mediaId)
      const result = await admin
        .from('media')
        .select('id, file_url, media_type, storage_formats')
        .eq('id', mediaId)
        .single();
      media = result.data;
      fetchErr = result.error;
    }

    if (fetchErr || !media) {
      console.warn(`Media not found: mediaId=${mediaId}, filename=${originalFilename}, error=${fetchErr?.message}`);
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    if (media.media_type !== 'video') {
      return NextResponse.json(
        { error: 'Only videos can be converted' },
        { status: 400 }
      );
    }

    // Skip if WebM already exists
    if (media.storage_formats?.includes('webm')) {
      return NextResponse.json(
        {
          ok: true,
          message: 'WebM version already exists',
          mediaId,
        },
        { status: 200 }
      );
    }

    // 4. Start conversion in background (don't wait)
    console.log(`🎬 Starting conversion: ${originalFilename}`);
    convertVideoToWebM(media.file_url, originalFilename, media.id).catch((err) => {
      console.error('Background conversion error:', err);
    });

    return NextResponse.json(
      {
        ok: true,
        message: 'Conversion started in background',
        mediaId,
        filename: originalFilename,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Conversion request failed:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
