package com.shipur.chisaai;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.media.MediaMetadataRetriever;
import android.os.Build;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * Server HTTP kecil di 127.0.0.1 untuk konversi gambar. Bot (Node) memakainya karena ffmpeg diblokir Android (SIGSYS).
 * POST /webp  gambar -> WebP 512x512 transparan (stiker)
 * POST /frame?t=ms  video -> PNG (satu bingkai)
 * POST /png   gambar/WebP -> PNG
 * POST /jpeg?w=480  gambar -> JPEG diperkecil
 */
public class Converter {
    public static final int PORT = 38917;
    private final File cache;
    private static boolean started = false;

    public Converter(File cache) { this.cache = cache; }

    public synchronized void start() {
        if (started) return;
        started = true;
        Thread t = new Thread(() -> {
            try (ServerSocket ss = new ServerSocket(PORT, 8, InetAddress.getByName("127.0.0.1"))) {
                while (true) {
                    final Socket s = ss.accept();
                    Thread w = new Thread(() -> handle(s), "chisa-conv-req");
                    w.setDaemon(true);
                    w.start();
                }
            } catch (Throwable ignored) { started = false; }
        }, "chisa-conv");
        t.setDaemon(true);
        t.start();
    }

    private static String readLine(InputStream in) throws Exception {
        StringBuilder sb = new StringBuilder();
        int c;
        while ((c = in.read()) != -1) {
            if (c == '\n') break;
            if (c != '\r') sb.append((char) c);
            if (sb.length() > 4096) break;
        }
        return sb.toString();
    }

    private void handle(Socket s) {
        try (Socket sock = s) {
            sock.setSoTimeout(30000);
            InputStream in = new BufferedInputStream(sock.getInputStream());
            String req = readLine(in);
            String[] parts = req.split(" ");
            String target = parts.length > 1 ? parts[1] : "/";
            int len = 0;
            String h;
            while ((h = readLine(in)).length() > 0) {
                String low = h.toLowerCase();
                if (low.startsWith("content-length:")) len = Integer.parseInt(h.substring(15).trim());
            }
            byte[] body = new byte[len];
            int off = 0;
            while (off < len) {
                int n = in.read(body, off, len - off);
                if (n < 0) break;
                off += n;
            }
            String route = target, query = "";
            int q = target.indexOf('?');
            if (q >= 0) { route = target.substring(0, q); query = target.substring(q + 1); }
            byte[] out;
            int code = 200;
            try {
                if (route.equals("/webp")) out = webp(body);
                else if (route.equals("/frame")) out = frame(body, param(query, "t", 0));
                else if (route.equals("/png")) out = png(decode(body));
                else if (route.equals("/jpeg")) out = jpeg(decode(body), param(query, "w", 480));
                else { code = 404; out = "tidak ada".getBytes("UTF-8"); }
            } catch (Throwable e) {
                code = 500;
                out = String.valueOf(e).getBytes("UTF-8");
            }
            OutputStream os = sock.getOutputStream();
            os.write(("HTTP/1.1 " + code + (code == 200 ? " OK" : " ERR") + "\r\nContent-Type: application/octet-stream\r\nContent-Length: " + out.length + "\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
            os.write(out);
            os.flush();
        } catch (Throwable ignored) { }
    }

    private static int param(String query, String key, int def) {
        for (String kv : query.split("&")) {
            String[] p = kv.split("=");
            if (p.length == 2 && p[0].equals(key)) { try { return Integer.parseInt(p[1]); } catch (Exception ignored) { } }
        }
        return def;
    }

    private static Bitmap decode(byte[] b) {
        Bitmap bm = BitmapFactory.decodeByteArray(b, 0, b.length);
        if (bm == null) throw new IllegalArgumentException("gambar tidak terbaca");
        return bm;
    }

    private static byte[] png(Bitmap bm) {
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        bm.compress(Bitmap.CompressFormat.PNG, 100, o);
        return o.toByteArray();
    }

    private static byte[] jpeg(Bitmap bm, int w) {
        if (bm.getWidth() > w) {
            int h = Math.max(1, Math.round(bm.getHeight() * (w / (float) bm.getWidth())));
            bm = Bitmap.createScaledBitmap(bm, w, h, true);
        }
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        bm.compress(Bitmap.CompressFormat.JPEG, 80, o);
        return o.toByteArray();
    }

    @SuppressWarnings("deprecation")
    private static byte[] webp(byte[] b) {
        Bitmap src = decode(b);
        float sc = Math.min(512f / src.getWidth(), 512f / src.getHeight());
        float nw = src.getWidth() * sc, nh = src.getHeight() * sc;
        Bitmap out = Bitmap.createBitmap(512, 512, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(out);
        Paint p = new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG);
        c.drawBitmap(src, null, new RectF((512 - nw) / 2f, (512 - nh) / 2f, (512 + nw) / 2f, (512 + nh) / 2f), p);
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        Bitmap.CompressFormat f = Build.VERSION.SDK_INT >= 30 ? Bitmap.CompressFormat.WEBP_LOSSY : Bitmap.CompressFormat.WEBP;
        out.compress(f, 80, o);
        return o.toByteArray();
    }

    private byte[] frame(byte[] video, int ms) throws Exception {
        File f = File.createTempFile("conv", ".bin", cache);
        MediaMetadataRetriever r = new MediaMetadataRetriever();
        try {
            try (FileOutputStream fo = new FileOutputStream(f)) { fo.write(video); }
            r.setDataSource(f.getAbsolutePath());
            Bitmap bm = r.getFrameAtTime(ms * 1000L, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
            if (bm == null) bm = r.getFrameAtTime();
            if (bm == null) throw new IllegalStateException("bingkai video tidak terbaca");
            return png(bm);
        } finally {
            try { r.release(); } catch (Throwable ignored) { }
            f.delete();
        }
    }
}
