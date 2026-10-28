package com.shipur.chisaai;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.system.Os;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/** Menjalankan bot (Node.js) di proses terpisah ":bot". Stop = matikan proses ini. */
public class BotService extends Service {
    public static native int startNode(String[] args, String logPath);

    static final String[] KEEP = {"settings.js", "session", "data", "assets/custom", "backup"};
    private boolean started = false;
    private PowerManager.WakeLock wl;

    private void logLine(String m) {
        try (FileOutputStream o = new FileOutputStream(new File(getFilesDir(), "bot.log"), true)) { o.write(("[app] " + m + "\n").getBytes()); } catch (Exception ignored) { }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Thread.setDefaultUncaughtExceptionHandler((t, e) -> { logLine("crash di thread " + t.getName() + ": " + android.util.Log.getStackTraceString(e)); android.os.Process.killProcess(android.os.Process.myPid()); });
        logLine("layanan dibuat (Android " + Build.VERSION.SDK_INT + ", " + Build.SUPPORTED_ABIS[0] + ")");
    }

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "STOP".equals(intent.getAction())) {
            getSharedPreferences("cfg", 0).edit().putBoolean("wantRun", false).apply();
            android.os.Process.killProcess(android.os.Process.myPid());
            return START_NOT_STICKY;
        }
        getSharedPreferences("cfg", 0).edit().putBoolean("wantRun", true).apply();
        try { foreground(); } catch (Throwable t) { logLine("foreground gagal: " + android.util.Log.getStackTraceString(t)); }
        if (!started) {
            started = true;
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "chisa:bot");
            wl.acquire();
            // Node butuh tumpukan memori besar (thread biasa hanya 1 MB)
            new Thread(null, this::runBot, "node", 8L * 1024 * 1024).start();
        }
        return START_STICKY;
    }

    private void foreground() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(new NotificationChannel("bot", "CHISA-AI", NotificationManager.IMPORTANCE_LOW));
        PendingIntent pi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, "bot") : new Notification.Builder(this);
        b.setContentTitle("CHISA-AI berjalan").setContentText("Bot aktif. Ketuk untuk membuka.")
                .setSmallIcon(android.R.drawable.stat_notify_sync).setContentIntent(pi).setOngoing(true);
        startForeground(1, b.build());
    }

    private void runBot() {
        File files = getFilesDir();
        File bot = new File(files, "bot");
        File log = new File(files, "bot.log");
        int code = 1;
        try {
            try { System.loadLibrary("c++_shared"); } catch (Throwable ignored) { }
            logLine("memuat libnode…");
            System.loadLibrary("node");
            System.loadLibrary("native-lib");
            logLine("menyiapkan berkas bot (pertama kali ±30 dtk)…");
            prepare(bot);
            writeSettings(bot);
            logLine("menjalankan Node.js…");
            File bin = new File(files, "bin"); bin.mkdirs();
            File ff = new File(getApplicationInfo().nativeLibraryDir, "libffmpeg.so");
            File link = new File(bin, "ffmpeg");
            if (ff.exists()) { link.delete(); try { Os.symlink(ff.getAbsolutePath(), link.getAbsolutePath()); } catch (Exception ignored) { } }

            SharedPreferences p = getSharedPreferences("cfg", 0);
            Os.setenv("HOME", files.getAbsolutePath(), true);
            Os.setenv("TMPDIR", getCacheDir().getAbsolutePath(), true);
            Os.setenv("PATH", bin.getAbsolutePath() + ":" + System.getenv("PATH"), true);
            Os.setenv("CHISA_SUPERVISED", "1", true);
            Os.setenv("CHISA_ANDROID", "1", true);
            Os.setenv("CHISA_PAIR_NUMBER", p.getString("botNumber", ""), true);
            trimLogLater(log);
            code = startNode(new String[]{"node", new File(bot, "android-main.js").getAbsolutePath()}, log.getAbsolutePath());
        } catch (Throwable t) {
            try (FileOutputStream o = new FileOutputStream(log, true)) { o.write(("\n[app] error: " + android.util.Log.getStackTraceString(t) + "\n").getBytes()); } catch (Exception ignored) { }
        }
        logLine("Node berhenti, kode=" + code);
        // 0 = dihentikan (#stop); lainnya = #restart / #update / crash -> hidupkan lagi (maks 5x dalam 2 menit)
        SharedPreferences p = getSharedPreferences("cfg", 0);
        if (code != 0 && recentRestarts(p) < 5) {
            Intent i = new Intent(this, BotService.class);
            PendingIntent pi = Build.VERSION.SDK_INT >= 26
                    ? PendingIntent.getForegroundService(this, 7, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT)
                    : PendingIntent.getService(this, 7, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            ((AlarmManager) getSystemService(ALARM_SERVICE)).set(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 3000, pi);
        } else {
            p.edit().putBoolean("wantRun", false).apply();
        }
        android.os.Process.killProcess(android.os.Process.myPid());
    }

    private int recentRestarts(SharedPreferences p) {
        long now = System.currentTimeMillis();
        String[] old = p.getString("restarts", "").split(",");
        StringBuilder sb = new StringBuilder(); int n = 0;
        for (String s : old) {
            if (s.isEmpty()) continue;
            long t = Long.parseLong(s);
            if (now - t < 120000) { sb.append(t).append(','); n++; }
        }
        sb.append(now).append(',');
        p.edit().putString("restarts", sb.toString()).apply();
        return n;
    }

    /** log dirotasi (disimpan ke bot.log.1) tiap 10 menit kalau > 3 MB */
    private void trimLogLater(File log) {
        Thread t = new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(600000);
                    if (log.length() > 3 * 1024 * 1024) {
                        File old = new File(log.getPath() + ".1"); old.delete();
                        try (FileInputStream in = new FileInputStream(log); FileOutputStream o = new FileOutputStream(old)) { byte[] bf = new byte[65536]; int n; while ((n = in.read(bf)) > 0) o.write(bf, 0, n); }
                        try (RandomAccessFile r = new RandomAccessFile(log, "rw")) { r.setLength(0); }
                    }
                } catch (Exception e) { return; }
            }
        });
        t.setDaemon(true); t.start();
    }

    private static boolean keep(String rel) {
        for (String k : KEEP) if (rel.equals(k) || rel.startsWith(k + "/")) return true;
        return false;
    }

    private static void wipe(File dir, String rel) {
        File[] fs = dir.listFiles();
        if (fs == null) return;
        for (File f : fs) {
            String r = rel.isEmpty() ? f.getName() : rel + "/" + f.getName();
            if (keep(r)) continue;
            if (f.isDirectory()) { wipe(f, r); f.delete(); } else f.delete();
        }
    }

    /** Ekstrak bot.zip (dari assets) ke files/bot saat pertama kali / setelah APK diperbarui. Login, data, dan settings tidak dihapus. */
    private void prepare(File bot) throws Exception {
        String ver = BuildConfig.VERSION_NAME + "#" + BuildConfig.VERSION_CODE;
        File marker = new File(getFilesDir(), "bot.ver");
        String cur = "";
        if (marker.exists()) try (FileInputStream in = new FileInputStream(marker)) { byte[] mb = new byte[256]; int mn = in.read(mb); cur = mn > 0 ? new String(mb, 0, mn) : ""; }
        if (ver.equals(cur) && new File(bot, "index.js").exists()) return;
        bot.mkdirs();
        wipe(bot, "");
        try (ZipInputStream z = new ZipInputStream(getAssets().open("bot.zip"))) {
            ZipEntry e;
            byte[] buf = new byte[65536];
            while ((e = z.getNextEntry()) != null) {
                String name = e.getName();
                if (name.startsWith("bot/")) name = name.substring(4);
                if (name.isEmpty() || e.isDirectory()) { if (!name.isEmpty()) new File(bot, name).mkdirs(); continue; }
                File out = new File(bot, name);
                if (!out.getCanonicalPath().startsWith(bot.getCanonicalPath())) continue; // zip slip
                if (keep(name) && out.exists()) continue;
                out.getParentFile().mkdirs();
                try (FileOutputStream o = new FileOutputStream(out)) { int n; while ((n = z.read(buf)) > 0) o.write(buf, 0, n); }
            }
        }
        try (FileOutputStream o = new FileOutputStream(marker)) { o.write(ver.getBytes()); }
    }

    /** settings.js dibuat dari isian di aplikasi */
    private void writeSettings(File bot) throws Exception {
        SharedPreferences p = getSharedPreferences("cfg", 0);
        JSONObject o = new JSONObject();
        JSONObject owner = new JSONObject();
        owner.put("name", "shipur");
        owner.put("number", p.getString("ownerNumber", ""));
        owner.put("tiktok", "dzzhipur");
        o.put("owner", owner);
        o.put("dashboard", false);
        String tok = p.getString("tgToken", "").trim();
        if (!tok.isEmpty()) {
            JSONObject tg = new JSONObject();
            tg.put("token", tok);
            JSONArray ids = new JSONArray();
            String id = p.getString("tgOwner", "").trim();
            if (!id.isEmpty()) ids.put(id);
            tg.put("ownerIds", ids);
            o.put("telegram", tg);
        }
        try (FileOutputStream f = new FileOutputStream(new File(bot, "settings.js"))) {
            f.write(("module.exports = " + o.toString(2) + "\n").getBytes());
        }
    }

    @Override
    public void onDestroy() { if (wl != null && wl.isHeld()) wl.release(); }
}
