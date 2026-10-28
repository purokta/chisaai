package com.shipur.chisaai;

import android.Manifest;
import android.app.Activity;
import android.app.ActivityManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.AssetFileDescriptor;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.Surface;
import android.view.TextureView;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.color.DynamicColors;
import com.google.android.material.textfield.TextInputEditText;

import java.io.File;
import java.io.RandomAccessFile;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Layar utama (Material You): banner bergerak, nomor, tombol Mulai/Stop, kode pairing, log. */
public class MainActivity extends Activity {
    private static final int[] BANNERS = {R.raw.banner1, R.raw.banner2, R.raw.banner3, R.raw.banner4};
    private static final Pattern PAIR = Pattern.compile("KODE PAIRING:\\s*([A-Z0-9]{4}-[A-Z0-9]{4})");

    private TextInputEditText botNum, ownerNum, tgToken, tgOwner;
    private TextView status, code, codeHint, logView;
    private MaterialButton toggle;
    private ScrollView logScroll;
    private TextureView banner;
    private MediaPlayer mp;
    private Surface surface;
    private int bannerIdx = (int) (System.currentTimeMillis() % BANNERS.length);
    private final Handler h = new Handler(Looper.getMainLooper());
    private SharedPreferences prefs;
    private boolean alive = true;

    @Override
    protected void onCreate(Bundle b) {
        DynamicColors.applyToActivityIfAvailable(this); // warna mengikuti wallpaper (Android 12+)
        super.onCreate(b);
        setContentView(R.layout.activity_main);
        prefs = getSharedPreferences("cfg", 0);

        botNum = findViewById(R.id.botNum); ownerNum = findViewById(R.id.ownerNum);
        tgToken = findViewById(R.id.tgToken); tgOwner = findViewById(R.id.tgOwner);
        botNum.setText(prefs.getString("botNumber", "")); ownerNum.setText(prefs.getString("ownerNumber", ""));
        tgToken.setText(prefs.getString("tgToken", "")); tgOwner.setText(prefs.getString("tgOwner", ""));
        status = findViewById(R.id.status); code = findViewById(R.id.code); codeHint = findViewById(R.id.codeHint);
        logView = findViewById(R.id.log); logScroll = findViewById(R.id.logScroll);
        toggle = findViewById(R.id.toggle); banner = findViewById(R.id.banner);
        ((TextView) findViewById(R.id.subtitle)).setText("CHISA-AI by shipur • v" + BuildConfig.VERSION_NAME);

        toggle.setOnClickListener(v -> toggle());
        findViewById(R.id.battery).setOnClickListener(v -> {
            try {
                startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName())));
            } catch (Exception e) { startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)); }
        });
        code.setOnClickListener(v -> {
            String t = code.getText().toString();
            if (t.contains("-")) {
                ((ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("kode", t));
                Toast.makeText(this, "Kode disalin", Toast.LENGTH_SHORT).show();
            }
        });

        banner.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override public void onSurfaceTextureAvailable(SurfaceTexture st, int w, int hh) { surface = new Surface(st); playBanner(); }
            @Override public void onSurfaceTextureSizeChanged(SurfaceTexture st, int w, int hh) { crop(); }
            @Override public boolean onSurfaceTextureDestroyed(SurfaceTexture st) { stopBanner(); surface = null; return true; }
            @Override public void onSurfaceTextureUpdated(SurfaceTexture st) { }
        });

        if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        tick();
    }

    // ---- banner bergerak: 4 video bergantian, diputar terus ----
    private void playBanner() {
        if (surface == null) return;
        stopBanner();
        try {
            mp = new MediaPlayer();
            AssetFileDescriptor afd = getResources().openRawResourceFd(BANNERS[bannerIdx % BANNERS.length]);
            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mp.setSurface(surface);
            mp.setVolume(0f, 0f);
            mp.setOnPreparedListener(m -> { crop(); m.start(); });
            mp.setOnCompletionListener(m -> { bannerIdx++; playBanner(); }); // ganti ke banner berikutnya
            mp.setOnErrorListener((m, w, e) -> { stopBanner(); return true; });
            mp.prepareAsync();
        } catch (Exception e) { stopBanner(); }
    }

    private void stopBanner() {
        if (mp != null) { try { mp.release(); } catch (Exception ignored) { } mp = null; }
    }

    /** isi penuh kartu tanpa gepeng (center crop) */
    private void crop() {
        if (mp == null) return;
        int vw = mp.getVideoWidth(), vh = mp.getVideoHeight(), w = banner.getWidth(), hh = banner.getHeight();
        if (vw == 0 || vh == 0 || w == 0 || hh == 0) return;
        float s = Math.max((float) w / vw, (float) hh / vh);
        Matrix m = new Matrix();
        m.setScale(s * vw / w, s * vh / hh, w / 2f, hh / 2f);
        banner.setTransform(m);
    }

    private boolean running() {
        ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo s : am.getRunningServices(100))
            if (BotService.class.getName().equals(s.service.getClassName())) return true;
        return false;
    }

    private void toggle() {
        if (running()) {
            startService(new Intent(this, BotService.class).setAction("STOP"));
            code.setText("");
            return;
        }
        String bn = String.valueOf(botNum.getText()).replaceAll("\\D", "");
        if (bn.startsWith("0")) bn = "62" + bn.substring(1);
        String on = String.valueOf(ownerNum.getText()).replaceAll("\\D", "");
        if (on.isEmpty()) on = bn;
        if (bn.length() < 9) { Toast.makeText(this, "Isi nomor WhatsApp bot dulu", Toast.LENGTH_LONG).show(); return; }
        prefs.edit().putString("botNumber", bn).putString("ownerNumber", on)
                .putString("tgToken", String.valueOf(tgToken.getText()).trim())
                .putString("tgOwner", String.valueOf(tgOwner.getText()).replaceAll("\\D", "")).apply();
        new File(getFilesDir(), "bot.log").delete();
        Intent i = new Intent(this, BotService.class);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
    }

    private String tail(File f, int max) {
        try (RandomAccessFile r = new RandomAccessFile(f, "r")) {
            long len = r.length(); long from = Math.max(0, len - max);
            r.seek(from); byte[] b = new byte[(int) (len - from)]; r.readFully(b);
            return new String(b, "UTF-8").replaceAll("\u001B\\[[;\\d?]*[A-Za-z]", "");
        } catch (Exception e) { return ""; }
    }

    private void tick() {
        if (!alive) return;
        boolean run = running();
        toggle.setText(run ? "■  STOP BOT" : "▶  MULAI BOT");
        String log = tail(new File(getFilesDir(), "bot.log"), 14000);
        Matcher m = PAIR.matcher(log); String pair = null;
        while (m.find()) pair = m.group(1);
        boolean connected = log.contains("terhubung");
        status.setText(!run ? "Bot mati" : pair != null && !connected ? "Tautkan perangkat dengan kode ini" : connected ? "Bot berjalan ✔" : "Memulai… (pertama kali ±1 menit)");
        boolean showCode = run && pair != null && !connected;
        code.setVisibility(showCode ? View.VISIBLE : View.GONE);
        codeHint.setVisibility(showCode ? View.VISIBLE : View.GONE);
        if (showCode) code.setText(pair);
        boolean bottom = logScroll.getChildAt(0).getBottom() - (logScroll.getHeight() + logScroll.getScrollY()) < 120;
        if (!log.contentEquals(logView.getText())) {
            logView.setText(log);
            if (bottom) logScroll.post(() -> logScroll.fullScroll(View.FOCUS_DOWN));
        }
        h.postDelayed(this::tick, 1500);
    }

    @Override protected void onDestroy() { alive = false; h.removeCallbacksAndMessages(null); stopBanner(); super.onDestroy(); }
}
