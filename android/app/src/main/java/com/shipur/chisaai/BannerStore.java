package com.shipur.chisaai;

import android.content.Context;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Movie;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaFormat;
import android.media.MediaMetadataRetriever;
import android.media.MediaMuxer;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.view.Surface;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.ByteBuffer;

/**
 * Banner custom: 4 slot di files/bot/assets/custom/banner1..4.(mp4|jpg|png|webp).
 * Folder itu juga dibaca bot (menu WhatsApp & Telegram), dan tidak dihapus saat bot diperbarui.
 */
public class BannerStore {
    static final String[] EXT = {"mp4", "jpg", "jpeg", "png", "webp"};
    static final int MAX_MS = 10000;

    static File dir(Context c) { File d = new File(c.getFilesDir(), "bot/assets/custom"); d.mkdirs(); return d; }

    static File custom(Context c, int slot) {
        for (String e : EXT) { File f = new File(dir(c), "banner" + slot + "." + e); if (f.length() > 0) return f; }
        return null;
    }

    static void clear(Context c, int slot) {
        for (String e : EXT) new File(dir(c), "banner" + slot + "." + e).delete();
    }

    static String nameOf(Context c, Uri u) {
        try (Cursor q = c.getContentResolver().query(u, null, null, null, null)) {
            if (q != null && q.moveToFirst()) { int i = q.getColumnIndex(OpenableColumns.DISPLAY_NAME); if (i >= 0) return q.getString(i); }
        } catch (Exception ignored) { }
        return "file";
    }

    /** Impor pilihan pengguna ke slot. Mengembalikan ringkasan hasil; melempar Exception berisi alasan bila gagal. */
    static String importUri(Context c, Uri u, int slot) throws Exception {
        String type = String.valueOf(c.getContentResolver().getType(u));
        String name = nameOf(c, u).toLowerCase();
        File tmp = new File(c.getCacheDir(), "banner-import.tmp");
        File out;
        String info;
        try {
            if (type.equals("image/gif") || name.endsWith(".gif")) {
                byte[] data = readAll(c, u, 25 * 1024 * 1024);
                out = new File(c.getCacheDir(), "banner-new.mp4");
                info = gifToMp4(data, out);
            } else if (type.startsWith("video/") || name.endsWith(".mp4")) {
                if (!(type.equals("video/mp4") || name.endsWith(".mp4"))) throw new Exception("Video harus berformat MP4 (atau pakai GIF).");
                copy(c, u, tmp, 25 * 1024 * 1024);
                MediaMetadataRetriever r = new MediaMetadataRetriever();
                long ms;
                try { r.setDataSource(tmp.getPath()); ms = Long.parseLong(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)); }
                finally { r.release(); }
                if (ms > MAX_MS + 700) throw new Exception("Video " + (ms / 1000) + " detik. Maksimal 10 detik — potong dulu.");
                out = new File(c.getCacheDir(), "banner-new.mp4");
                out.delete();
                if (!tmp.renameTo(out)) { copyFile(tmp, out); }
                info = "video " + Math.round(ms / 1000.0) + " dtk";
            } else if (type.startsWith("image/")) {
                byte[] data = readAll(c, u, 30 * 1024 * 1024);
                BitmapFactory.Options o = new BitmapFactory.Options(); o.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(data, 0, data.length, o);
                int s = 1; while (o.outWidth / (s * 2) >= 1280) s *= 2;
                o = new BitmapFactory.Options(); o.inSampleSize = s;
                Bitmap bm = BitmapFactory.decodeByteArray(data, 0, data.length, o);
                if (bm == null) throw new Exception("Gambar tidak bisa dibaca.");
                out = new File(c.getCacheDir(), "banner-new.jpg");
                try (FileOutputStream fo = new FileOutputStream(out)) { bm.compress(Bitmap.CompressFormat.JPEG, 90, fo); }
                info = "gambar " + bm.getWidth() + "×" + bm.getHeight();
            } else {
                throw new Exception("Jenis file tidak didukung (" + type + "). Pilih GIF, MP4, JPG, PNG, atau WEBP.");
            }
        } finally { tmp.delete(); }
        clear(c, slot);
        String ext = out.getName().endsWith(".jpg") ? "jpg" : "mp4";
        File dest = new File(dir(c), "banner" + slot + "." + ext);
        if (!out.renameTo(dest)) { copyFile(out, dest); out.delete(); }
        return info + " · " + (dest.length() / 1024) + " KB";
    }

    private static byte[] readAll(Context c, Uri u, int max) throws Exception {
        try (InputStream in = c.getContentResolver().openInputStream(u); ByteArrayOutputStream o = new ByteArrayOutputStream()) {
            byte[] b = new byte[65536]; int n, t = 0;
            while ((n = in.read(b)) > 0) { t += n; if (t > max) throw new Exception("File terlalu besar (maks " + (max / 1048576) + " MB)."); o.write(b, 0, n); }
            return o.toByteArray();
        }
    }

    private static void copy(Context c, Uri u, File to, int max) throws Exception {
        try (InputStream in = c.getContentResolver().openInputStream(u); FileOutputStream o = new FileOutputStream(to)) {
            byte[] b = new byte[65536]; int n, t = 0;
            while ((n = in.read(b)) > 0) { t += n; if (t > max) throw new Exception("File terlalu besar (maks " + (max / 1048576) + " MB)."); o.write(b, 0, n); }
        }
    }

    private static void copyFile(File a, File b) throws Exception {
        try (java.io.FileInputStream in = new java.io.FileInputStream(a); FileOutputStream o = new FileOutputStream(b)) {
            byte[] bf = new byte[65536]; int n; while ((n = in.read(bf)) > 0) o.write(bf, 0, n);
        }
    }

    // ---------- GIF -> MP4 (H.264) tanpa ffmpeg: dekode frame dengan android.graphics.Movie, enkode dengan MediaCodec ----------
    static String gifToMp4(byte[] gif, File out) throws Exception {
        Movie mv = Movie.decodeByteArray(gif, 0, gif.length);
        if (mv == null || mv.width() <= 0 || mv.height() <= 0) throw new Exception("GIF tidak bisa dibaca.");
        int dur = mv.duration();
        if (dur <= 0) dur = 1000; // GIF diam
        int play = Math.min(dur, MAX_MS - 200);
        // GIF pendek diulang sampai minimal ±3 detik
        if (play < 3000) play = Math.min(MAX_MS - 200, ((3000 + dur - 1) / dur) * dur);
        float scale = Math.min(1f, 480f / Math.max(mv.width(), mv.height()));
        int w = Math.max(16, ((int) (mv.width() * scale)) & ~1), h = Math.max(16, ((int) (mv.height() * scale)) & ~1);
        final int fps = 15;
        int frames = Math.max(2, play * fps / 1000);

        MediaFormat f = MediaFormat.createVideoFormat("video/avc", w, h);
        f.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface);
        f.setInteger(MediaFormat.KEY_BIT_RATE, Math.max(600000, w * h * 5));
        f.setInteger(MediaFormat.KEY_FRAME_RATE, fps);
        f.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1);
        MediaCodec enc = MediaCodec.createEncoderByType("video/avc");
        MediaMuxer mux = null;
        Surface surf = null;
        boolean muxStarted = false;
        try {
            enc.configure(f, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
            surf = enc.createInputSurface();
            enc.start();
            out.delete();
            mux = new MediaMuxer(out.getPath(), MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
            int[] st = {-1, 0}; // [track, frame keluar]
            MediaCodec.BufferInfo bi = new MediaCodec.BufferInfo();
            float sx = (float) w / mv.width(), sy = (float) h / mv.height();
            for (int i = 0; i < frames; i++) {
                muxStarted = drain(enc, mux, bi, st, fps, false, muxStarted);
                Canvas cv = surf.lockCanvas(null);
                try {
                    cv.drawColor(Color.WHITE);
                    cv.save(); cv.scale(sx, sy);
                    mv.setTime((int) ((long) i * 1000 / fps % dur));
                    mv.draw(cv, 0, 0);
                    cv.restore();
                } finally { surf.unlockCanvasAndPost(cv); }
            }
            enc.signalEndOfInputStream();
            muxStarted = drain(enc, mux, bi, st, fps, true, muxStarted);
            if (!muxStarted) throw new Exception("Encoder tidak menghasilkan video.");
            mux.stop();
            muxStarted = false;
            mux.release(); mux = null;
        } finally {
            try { enc.stop(); } catch (Exception ignored) { }
            enc.release();
            if (surf != null) surf.release();
            if (mux != null) { try { if (muxStarted) mux.stop(); } catch (Exception ignored) { } try { mux.release(); } catch (Exception ignored) { } }
        }
        return "GIF → MP4 " + w + "×" + h + ", " + (frames / fps) + " dtk";
    }

    private static boolean drain(MediaCodec enc, MediaMuxer mux, MediaCodec.BufferInfo bi, int[] st, int fps, boolean eos, boolean started) {
        while (true) {
            int ix = enc.dequeueOutputBuffer(bi, 10000);
            if (ix == MediaCodec.INFO_TRY_AGAIN_LATER) { if (!eos) return started; else continue; }
            if (ix == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) { st[0] = mux.addTrack(enc.getOutputFormat()); mux.start(); started = true; continue; }
            if (ix < 0) continue;
            ByteBuffer buf = enc.getOutputBuffer(ix);
            if ((bi.flags & MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) bi.size = 0;
            if (bi.size > 0 && started && buf != null) {
                buf.position(bi.offset); buf.limit(bi.offset + bi.size);
                bi.presentationTimeUs = (long) st[1]++ * 1000000L / fps; // waktu dibuat teratur 15 fps
                mux.writeSampleData(st[0], buf, bi);
            }
            enc.releaseOutputBuffer(ix, false);
            if ((bi.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) return started;
        }
    }
}
