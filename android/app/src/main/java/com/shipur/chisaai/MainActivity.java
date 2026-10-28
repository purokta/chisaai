package com.shipur.chisaai;

import android.Manifest;
import android.app.Activity;
import android.app.ActivityManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.RandomAccessFile;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Layar tunggal: isi nomor, tekan Mulai, salin kode pairing, lihat log. */
public class MainActivity extends Activity {
    private EditText botNum, ownerNum, tgToken, tgOwner;
    private TextView status, code, logView;
    private Button toggle;
    private ScrollView logScroll;
    private final Handler h = new Handler(Looper.getMainLooper());
    private SharedPreferences prefs;
    private static final Pattern PAIR = Pattern.compile("KODE PAIRING:\\s*([A-Z0-9]{4}-[A-Z0-9]{4})");

    private int dp(int v) { return (int) (v * getResources().getDisplayMetrics().density); }

    private EditText field(LinearLayout root, String hint, String pref, boolean number) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setText(prefs.getString(pref, ""));
        e.setSingleLine(true);
        e.setTextColor(Color.WHITE); e.setHintTextColor(Color.GRAY);
        if (number) e.setInputType(InputType.TYPE_CLASS_PHONE);
        root.addView(e);
        return e;
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences("cfg", 0);
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(Color.rgb(14, 8, 12));
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(16), dp(28), dp(16), dp(24));
        sv.addView(root);

        TextView title = new TextView(this);
        title.setText("KUCHIBA CHISA"); title.setTextSize(26); title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.rgb(176, 16, 16));
        root.addView(title);
        TextView sub = new TextView(this);
        sub.setText("CHISA-AI by shipur • v" + BuildConfig.VERSION_NAME); sub.setTextColor(Color.LTGRAY);
        root.addView(sub);

        botNum = field(root, "Nomor WhatsApp BOT (628xxxxxxxxxx)", "botNumber", true);
        ownerNum = field(root, "Nomor OWNER (628xxxxxxxxxx)", "ownerNumber", true);
        tgToken = field(root, "Token Telegram (opsional)", "tgToken", false);
        tgOwner = field(root, "ID Telegram owner (opsional)", "tgOwner", true);

        toggle = new Button(this);
        toggle.setOnClickListener(v -> toggle());
        root.addView(toggle);

        Button batt = new Button(this);
        batt.setText("Izinkan jalan di latar belakang (disarankan)");
        batt.setOnClickListener(v -> {
            try {
                startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName())));
            } catch (Exception e) { startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)); }
        });
        root.addView(batt);

        status = new TextView(this); status.setTextColor(Color.WHITE); status.setPadding(0, dp(12), 0, 0);
        root.addView(status);
        code = new TextView(this);
        code.setTextSize(30); code.setTypeface(Typeface.MONOSPACE, Typeface.BOLD); code.setGravity(Gravity.CENTER);
        code.setTextColor(Color.rgb(255, 200, 80)); code.setPadding(0, dp(8), 0, dp(8));
        code.setOnClickListener(v -> {
            String t = code.getText().toString();
            if (t.contains("-")) {
                ((ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("kode", t));
                Toast.makeText(this, "Kode disalin", Toast.LENGTH_SHORT).show();
            }
        });
        root.addView(code);

        logView = new TextView(this);
        logView.setTypeface(Typeface.MONOSPACE); logView.setTextSize(11); logView.setTextColor(Color.rgb(170, 220, 170));
        logScroll = new ScrollView(this);
        logScroll.addView(logView);
        root.addView(logScroll, new LinearLayout.LayoutParams(-1, dp(320)));
        setContentView(sv);

        if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        tick();
    }

    private boolean running() {
        ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo s : am.getRunningServices(100))
            if (BotService.class.getName().equals(s.service.getClassName())) return true;
        return false;
    }

    private void toggle() {
        if (running()) {
            Intent i = new Intent(this, BotService.class).setAction("STOP");
            startService(i);
            code.setText("");
            return;
        }
        String bn = botNum.getText().toString().replaceAll("\\D", "");
        if (bn.startsWith("0")) bn = "62" + bn.substring(1);
        String on = ownerNum.getText().toString().replaceAll("\\D", "");
        if (on.isEmpty()) on = bn;
        if (bn.length() < 9) { Toast.makeText(this, "Isi nomor WhatsApp bot dulu", Toast.LENGTH_LONG).show(); return; }
        prefs.edit().putString("botNumber", bn).putString("ownerNumber", on)
                .putString("tgToken", tgToken.getText().toString().trim()).putString("tgOwner", tgOwner.getText().toString().replaceAll("\\D", "")).apply();
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
        boolean run = running();
        toggle.setText(run ? "■ STOP BOT" : "▶ MULAI BOT");
        String log = tail(new File(getFilesDir(), "bot.log"), 14000);
        Matcher m = PAIR.matcher(log); String pair = null;
        while (m.find()) pair = m.group(1);
        boolean connected = log.contains("Terhubung") || log.contains("terhubung") || log.contains("connection open") || log.contains("WhatsApp siap");
        status.setText(!run ? "Status: mati" : connected && pair == null ? "Status: berjalan ✔" : pair != null ? "Status: tautkan perangkat — ketuk kode untuk menyalin" : "Status: memulai… (pertama kali butuh ±1 menit)");
        if (pair != null && run) code.setText(pair); else if (!run) code.setText("");
        boolean bottom = logScroll.getChildAt(0).getBottom() - (logScroll.getHeight() + logScroll.getScrollY()) < dp(40);
        logView.setText(log);
        if (bottom) logScroll.post(() -> logScroll.fullScroll(View.FOCUS_DOWN));
        h.postDelayed(this::tick, 1500);
    }

    @Override protected void onDestroy() { h.removeCallbacksAndMessages(null); super.onDestroy(); }
}
