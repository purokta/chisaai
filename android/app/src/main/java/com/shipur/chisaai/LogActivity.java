package com.shipur.chisaai;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.google.android.material.color.DynamicColors;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Log lengkap bot: lihat, salin, simpan ke Download, bagikan, hapus. */
public class LogActivity extends Activity {
    private static final int SHOW = 250 * 1024; // yang ditampilkan; file yang disimpan/dibagikan tetap lengkap
    private TextView text, info;
    private ScrollView scroll;
    private final Handler h = new Handler(Looper.getMainLooper());
    private boolean alive = true;

    @Override protected void onCreate(Bundle b) {
        DynamicColors.applyToActivityIfAvailable(this);
        super.onCreate(b);
        setContentView(R.layout.activity_log);
        text = findViewById(R.id.text); info = findViewById(R.id.info); scroll = findViewById(R.id.scroll);
        findViewById(R.id.copy).setOnClickListener(v -> {
            ((ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("log", text.getText()));
            Toast.makeText(this, "Log disalin", Toast.LENGTH_SHORT).show();
        });
        findViewById(R.id.save).setOnClickListener(v -> save());
        findViewById(R.id.share).setOnClickListener(v -> share());
        findViewById(R.id.clear).setOnClickListener(v -> {
            new File(getFilesDir(), "bot.log").delete(); new File(getFilesDir(), "bot.log.1").delete();
            Toast.makeText(this, "Log dihapus", Toast.LENGTH_SHORT).show();
        });
        tick();
    }

    private File[] parts() { return new File[]{new File(getFilesDir(), "bot.log.1"), new File(getFilesDir(), "bot.log")}; }

    /** gabungan log lama + log sekarang ke satu file di cache */
    private File combined() throws Exception {
        File out = new File(getCacheDir(), "chisa-log.txt");
        try (FileOutputStream o = new FileOutputStream(out)) {
            o.write(("CHISA-AI v" + BuildConfig.VERSION_NAME + " | " + Build.MANUFACTURER + " " + Build.MODEL + " | Android " + Build.VERSION.SDK_INT
                    + " | " + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(new Date()) + "\n\n").getBytes());
            byte[] buf = new byte[65536];
            for (File f : parts()) if (f.exists()) try (FileInputStream in = new FileInputStream(f)) { int n; while ((n = in.read(buf)) > 0) o.write(buf, 0, n); }
        }
        return out;
    }

    private void save() {
        try {
            File c = combined();
            String name = "chisa-log-" + new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(new Date()) + ".txt";
            String where;
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                cv.put(MediaStore.Downloads.MIME_TYPE, "text/plain");
                cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                try (OutputStream o = getContentResolver().openOutputStream(u); FileInputStream in = new FileInputStream(c)) {
                    byte[] buf = new byte[65536]; int n; while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
                }
                where = "Download/" + name;
            } else {
                File d = getExternalFilesDir(null); File out = new File(d, name);
                try (OutputStream o = new FileOutputStream(out); FileInputStream in = new FileInputStream(c)) {
                    byte[] buf = new byte[65536]; int n; while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
                }
                where = out.getAbsolutePath();
            }
            Toast.makeText(this, "Tersimpan: " + where, Toast.LENGTH_LONG).show();
        } catch (Exception e) { Toast.makeText(this, "Gagal menyimpan: " + e.getMessage(), Toast.LENGTH_LONG).show(); }
    }

    private void share() {
        try {
            Uri u = FileProvider.getUriForFile(this, getPackageName() + ".files", combined());
            Intent i = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_STREAM, u)
                    .putExtra(Intent.EXTRA_SUBJECT, "Log CHISA-AI").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(i, "Bagikan log"));
        } catch (Exception e) { Toast.makeText(this, "Gagal membagikan: " + e.getMessage(), Toast.LENGTH_LONG).show(); }
    }

    private String read() {
        try {
            File f = new File(getFilesDir(), "bot.log");
            if (!f.exists()) return "";
            try (RandomAccessFile r = new RandomAccessFile(f, "r")) {
                long len = r.length(), from = Math.max(0, len - SHOW);
                r.seek(from); byte[] b = new byte[(int) (len - from)]; r.readFully(b);
                String s = new String(b, "UTF-8").replaceAll("\u001B\\[[;\\d?]*[A-Za-z]", "");
                return from > 0 ? "… (bagian awal dipotong di layar; file simpan/bagikan tetap lengkap)\n" + s : s;
            }
        } catch (Exception e) { return ""; }
    }

    private void tick() {
        if (!alive) return;
        String s = read();
        File f = new File(getFilesDir(), "bot.log"), o = new File(getFilesDir(), "bot.log.1");
        info.setText(((f.length() + (o.exists() ? o.length() : 0)) / 1024) + " KB tercatat • diperbarui otomatis");
        if (!s.contentEquals(text.getText())) {
            boolean bottom = scroll.getChildAt(0).getBottom() - (scroll.getHeight() + scroll.getScrollY()) < 150;
            text.setText(s.isEmpty() ? "(log kosong)" : s);
            if (bottom) scroll.post(() -> scroll.fullScroll(android.view.View.FOCUS_DOWN));
        }
        h.postDelayed(this::tick, 2000);
    }

    @Override protected void onDestroy() { alive = false; h.removeCallbacksAndMessages(null); super.onDestroy(); }
}
