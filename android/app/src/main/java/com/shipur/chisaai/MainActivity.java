package com.shipur.chisaai;

import android.Manifest;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.ApplicationExitInfo;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.style.ForegroundColorSpan;
import android.view.LayoutInflater;
import android.view.Surface;
import android.view.TextureView;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.ImageView;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.color.DynamicColors;
import com.google.android.material.materialswitch.MaterialSwitch;
import com.google.android.material.textfield.TextInputEditText;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.io.RandomAccessFile;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Layar utama (Material You): Home, Terminal, Banner, Pengaturan. */
public class MainActivity extends Activity {
    private static final int[] RAW = {R.raw.banner1, R.raw.banner2, R.raw.banner3, R.raw.banner4};
    private static final Pattern PAIR = Pattern.compile("KODE PAIRING:\\s*([A-Z0-9]{4}-[A-Z0-9]{4})");
    private static final int GREEN = 0xFF7EE787, BLUE = 0xFF79C0FF, AMBER = 0xFFE3B341, RED = 0xFFFF7B72, PURPLE = 0xFFD2A8FF, CYAN = 0xFF56D4DD, GRAY = 0xFFC9D1D9, DIM = 0xFF8B949E;

    private View[] pages;
    private BottomNavigationView nav;
    private int page = 0;
    private TextInputEditText botNum, ownerNum, tgToken, tgOwner, ghRepo, ghBranch, ghToken;
    private MaterialSwitch ghAuto, autoBoot;
    private android.widget.LinearLayout apkBox;
    private TextView ghInfo;
    private TextView status, subtitle, code, miniLog, termText, shellText;
    private ImageView statusIcon, bannerImg;
    private MaterialButton toggle;
    private View codeCard, shellBar;
    private ScrollView termScroll, shellScroll;
    private android.widget.EditText shellIn;
    private android.widget.LinearLayout infoList, slotList;
    private TextureView banner;
    private MediaPlayer mp;
    private Surface surface;
    private int bannerIdx = (int) (System.currentTimeMillis() % 4);
    private boolean shellMode = false;
    private final SpannableStringBuilder shellBuf = new SpannableStringBuilder();
    private final Handler h = new Handler(Looper.getMainLooper());
    private final Runnable nextBanner = this::playBanner;
    private SharedPreferences prefs;
    private boolean alive = true;
    private String lastLogShown = "";

    @Override
    protected void onCreate(Bundle b) {
        DynamicColors.applyToActivityIfAvailable(this);
        super.onCreate(b);
        setContentView(R.layout.activity_main);
        prefs = getSharedPreferences("cfg", 0);

        pages = new View[]{findViewById(R.id.pageHome), findViewById(R.id.pageTerm), findViewById(R.id.pageBanner), findViewById(R.id.pageSet)};
        nav = findViewById(R.id.nav);
        nav.setOnItemSelectedListener(it -> {
            int id = it.getItemId();
            show(id == R.id.nav_home ? 0 : id == R.id.nav_term ? 1 : id == R.id.nav_banner ? 2 : 3);
            return true;
        });

        botNum = findViewById(R.id.botNum); ownerNum = findViewById(R.id.ownerNum);
        tgToken = findViewById(R.id.tgToken); tgOwner = findViewById(R.id.tgOwner);
        botNum.setText(prefs.getString("botNumber", "")); ownerNum.setText(prefs.getString("ownerNumber", ""));
        tgToken.setText(prefs.getString("tgToken", "")); tgOwner.setText(prefs.getString("tgOwner", ""));
        ghRepo = findViewById(R.id.ghRepo); ghBranch = findViewById(R.id.ghBranch); ghToken = findViewById(R.id.ghToken);
        ghAuto = findViewById(R.id.ghAuto); ghInfo = findViewById(R.id.ghInfo);
        ghRepo.setText(prefs.getString("ghRepo", AppUpdater.DEF_REPO)); ghBranch.setText(prefs.getString("ghBranch", AppUpdater.DEF_BRANCH));
        ghToken.setText(prefs.getString("ghToken", "")); ghAuto.setChecked(prefs.getBoolean("ghAuto", true));
        autoBoot = findViewById(R.id.autoBoot); autoBoot.setChecked(prefs.getBoolean("autoBoot", true));
        autoBoot.setOnCheckedChangeListener((bv, on) -> prefs.edit().putBoolean("autoBoot", on).apply());
        apkBox = findViewById(R.id.apkBox);
        findViewById(R.id.apkCheck).setOnClickListener(v -> checkApk(true));
        findViewById(R.id.resetSession).setOnClickListener(v -> resetSession());
        refreshGh();
        findViewById(R.id.ghUpdate).setOnClickListener(v -> manualUpdate());
        findViewById(R.id.ghRestore).setOnClickListener(v -> {
            prefs.edit().putBoolean("restoreBundled", true).apply();
            Toast.makeText(this, "Saat bot dimulai berikutnya, script dikembalikan ke bawaan APK (update otomatis dimatikan).", Toast.LENGTH_LONG).show();
        });
        status = findViewById(R.id.status); subtitle = findViewById(R.id.subtitle); statusIcon = findViewById(R.id.statusIcon);
        code = findViewById(R.id.code); codeCard = findViewById(R.id.codeCard);
        miniLog = findViewById(R.id.miniLog); toggle = findViewById(R.id.toggle);
        banner = findViewById(R.id.banner); bannerImg = findViewById(R.id.bannerImg);
        infoList = findViewById(R.id.infoList); slotList = findViewById(R.id.slotList);
        termText = findViewById(R.id.termText); shellText = findViewById(R.id.shellText);
        termScroll = findViewById(R.id.termScroll); shellScroll = findViewById(R.id.shellScroll);
        shellBar = findViewById(R.id.shellBar); shellIn = findViewById(R.id.shellIn);
        subtitle.setText("CHISA-AI by shipur • v" + BuildConfig.VERSION_NAME);

        toggle.setOnClickListener(v -> toggle());
        findViewById(R.id.power).setOnClickListener(v -> toggle());
        findViewById(R.id.openLog).setOnClickListener(v -> startActivity(new Intent(this, LogActivity.class)));
        findViewById(R.id.miniLogCard).setOnClickListener(v -> { nav.setSelectedItemId(R.id.nav_term); });
        findViewById(R.id.saveSet).setOnClickListener(v -> { savePrefs(); Toast.makeText(this, "Tersimpan", Toast.LENGTH_SHORT).show(); renderInfo(); });
        code.setOnClickListener(v -> {
            String t = code.getText().toString();
            if (t.contains("-")) {
                ((ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("kode", t));
                Toast.makeText(this, "Kode disalin", Toast.LENGTH_SHORT).show();
            }
        });
        ((com.google.android.material.button.MaterialButtonToggleGroup) findViewById(R.id.termMode)).addOnButtonCheckedListener((g, id, on) -> {
            if (!on) return;
            shellMode = id == R.id.modeShell;
            termScroll.setVisibility(shellMode ? View.GONE : View.VISIBLE);
            shellScroll.setVisibility(shellMode ? View.VISIBLE : View.GONE);
            shellBar.setVisibility(shellMode ? View.VISIBLE : View.GONE);
            if (shellMode && shellBuf.length() == 0) shellOut("Shell CHISA-AI — folder: files/bot\nContoh: ls | tail -n 50 bot.log | cat settings.js | ps | df\nKetik 'clear' untuk membersihkan.\n", DIM);
        });
        shellIn.setOnEditorActionListener((v, a, e) -> { if (a == EditorInfo.IME_ACTION_SEND) { runShell(); return true; } return false; });
        findViewById(R.id.shellSend).setOnClickListener(v -> runShell());

        banner.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override public void onSurfaceTextureAvailable(SurfaceTexture st, int w, int hh) { surface = new Surface(st); playBanner(); }
            @Override public void onSurfaceTextureSizeChanged(SurfaceTexture st, int w, int hh) { crop(); }
            @Override public boolean onSurfaceTextureDestroyed(SurfaceTexture st) { stopBanner(); surface = null; return true; }
            @Override public void onSurfaceTextureUpdated(SurfaceTexture st) { }
        });

        if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        renderInfo();
        renderSlots();
        if (System.currentTimeMillis() - prefs.getLong("apkChecked", 0) > 6L * 3600 * 1000) checkApk(false);
        tick();
    }

    private void show(int i) {
        page = i;
        for (int k = 0; k < pages.length; k++) pages[k].setVisibility(k == i ? View.VISIBLE : View.GONE);
        if (i == 1) lastLogShown = ""; // paksa muat ulang terminal
        if (i == 0) renderInfo();
    }

    private void savePrefs() {
        String bn = String.valueOf(botNum.getText()).replaceAll("\\D", "");
        if (bn.startsWith("0")) bn = "62" + bn.substring(1);
        String on = String.valueOf(ownerNum.getText()).replaceAll("\\D", "");
        if (on.isEmpty()) on = bn;
        SharedPreferences.Editor ed = prefs.edit();
        ed.putString("botNumber", bn).putString("ownerNumber", on)
                .putString("tgToken", String.valueOf(tgToken.getText()).trim())
                .putString("tgOwner", String.valueOf(tgOwner.getText()).replaceAll("\\D", ""))
                .putString("ghBranch", String.valueOf(ghBranch.getText()).trim().isEmpty() ? AppUpdater.DEF_BRANCH : String.valueOf(ghBranch.getText()).trim())
                .putString("ghToken", String.valueOf(ghToken.getText()).trim()).putBoolean("ghAuto", ghAuto.isChecked());
        String repo = AppUpdater.parseRepo(String.valueOf(ghRepo.getText()));
        ed.putString("ghRepo", repo == null ? AppUpdater.DEF_REPO : repo);
        String oldRepo = prefs.getString("ghRepo", AppUpdater.DEF_REPO), oldBr = prefs.getString("ghBranch", AppUpdater.DEF_BRANCH);
        if (repo != null && (!repo.equals(oldRepo) || !String.valueOf(ghBranch.getText()).trim().equals(oldBr))) ed.remove("ghSha"); // sumber diganti -> pasang ulang
        ed.apply();
        botNum.setText(bn); ownerNum.setText(on); if (repo != null) ghRepo.setText(repo);
        refreshGh();
    }

    // ---------- APK baru dari Releases ----------
    private ApkUpdater.Info apkInfo;

    private void checkApk(boolean manual) {
        if (manual) Toast.makeText(this, "Memeriksa versi APK…", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            String err = null; ApkUpdater.Info i = null;
            try { i = ApkUpdater.latest(this); prefs.edit().putLong("apkChecked", System.currentTimeMillis()).apply(); } catch (Throwable t) { err = t.getMessage() == null ? t.toString() : t.getMessage(); }
            final ApkUpdater.Info info = i; final String e = err;
            runOnUiThread(() -> {
                if (!alive) return;
                apkInfo = info; renderApkCard();
                if (manual) Toast.makeText(this, e != null ? "Gagal: " + e : info == null ? "Belum ada rilis APK di repo." : ApkUpdater.newer(info) ? "APK baru tersedia: v" + info.ver : "APK sudah terbaru (v" + BuildConfig.VERSION_NAME + ")", Toast.LENGTH_LONG).show();
            });
        }).start();
    }

    private void renderApkCard() {
        apkBox.removeAllViews();
        if (apkInfo == null || !ApkUpdater.newer(apkInfo)) return;
        View v = row(apkBox, R.drawable.ic_info, "APK baru tersedia", "v" + apkInfo.ver + " (kamu v" + BuildConfig.VERSION_NAME + ") • ketuk untuk mengunduh & memasang", x -> installApk());
        ((android.widget.LinearLayout.LayoutParams) v.getLayoutParams()).bottomMargin = (int) (12 * getResources().getDisplayMetrics().density);
    }

    private void installApk() {
        final ApkUpdater.Info info = apkInfo;
        if (info == null) return;
        Toast.makeText(this, "Mengunduh APK (" + (info.size / 1048576) + " MB)…", Toast.LENGTH_LONG).show();
        new Thread(() -> {
            try {
                final File f = ApkUpdater.download(this, info);
                runOnUiThread(() -> { if (alive && !ApkUpdater.install(this, f)) Toast.makeText(this, "Izinkan 'pasang aplikasi dari sumber ini' untuk CHISA-AI, lalu ketuk lagi.", Toast.LENGTH_LONG).show(); });
            } catch (Throwable t) { runOnUiThread(() -> Toast.makeText(this, "Gagal: " + t.getMessage(), Toast.LENGTH_LONG).show()); }
        }).start();
    }

    private void resetSession() {
        if (running()) { Toast.makeText(this, "Hentikan bot dulu.", Toast.LENGTH_LONG).show(); return; }
        new android.app.AlertDialog.Builder(this).setTitle("Reset sesi WhatsApp?")
                .setMessage("Login WhatsApp bot dihapus. Kamu perlu menautkan ulang dengan kode pairing. Data bot lain tidak dihapus.")
                .setPositiveButton("Reset", (d, w) -> { deleteTree(new File(getFilesDir(), "bot/session")); Toast.makeText(this, "Sesi dihapus. Tekan Mulai bot untuk pairing ulang.", Toast.LENGTH_LONG).show(); })
                .setNegativeButton("Batal", null).show();
    }

    private static void deleteTree(File f) {
        File[] fs = f.listFiles();
        if (fs != null) for (File x : fs) deleteTree(x);
        f.delete();
    }

    // ---------- update script dari GitHub ----------
    private void refreshGh() {
        ghInfo.setText("Sekarang: " + AppUpdater.summary(this) + (prefs.getString("ghSha", "").isEmpty() ? "" : " • v" + prefs.getString("ghVer", "?") + " • " + AppUpdater.when(this)));
    }

    private void manualUpdate() {
        savePrefs();
        if (running()) { Toast.makeText(this, "Hentikan bot dulu, lalu cek update.", Toast.LENGTH_LONG).show(); return; }
        File bot = new File(getFilesDir(), "bot");
        if (!new File(bot, "index.js").exists()) { Toast.makeText(this, "Jalankan bot sekali dulu (script bawaan APK diekstrak otomatis), lalu cek update.", Toast.LENGTH_LONG).show(); return; }
        Toast.makeText(this, "Memeriksa GitHub…", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            String msg;
            try { msg = AppUpdater.run(this, bot, true); } catch (Throwable t) { msg = "Gagal: " + (t.getMessage() == null ? t.toString() : t.getMessage()); }
            final String r = msg;
            AppUpdater.log(this, r);
            runOnUiThread(() -> { if (!alive) return; Toast.makeText(this, r, Toast.LENGTH_LONG).show(); refreshGh(); renderInfo(); });
        }).start();
    }

    // ---------- Home: daftar info ----------
    private View row(android.widget.LinearLayout parent, int icon, String title, String sub, View.OnClickListener click) {
        View v = LayoutInflater.from(this).inflate(R.layout.item_info, parent, false);
        ((ImageView) v.findViewById(R.id.icon)).setImageResource(icon);
        ((TextView) v.findViewById(R.id.title)).setText(title);
        ((TextView) v.findViewById(R.id.sub)).setText(sub);
        if (click != null) v.setOnClickListener(click);
        parent.addView(v);
        return v;
    }

    private void renderInfo() {
        infoList.removeAllViews();
        String bn = prefs.getString("botNumber", ""), tg = prefs.getString("tgToken", "");
        View.OnClickListener toSet = v -> nav.setSelectedItemId(R.id.nav_set);
        row(infoList, R.drawable.ic_phone, "Nomor WhatsApp bot", bn.isEmpty() ? "Belum diisi — ketuk untuk mengatur" : "+" + bn, toSet);
        row(infoList, R.drawable.ic_person, "Owner", prefs.getString("ownerNumber", "").isEmpty() ? "Sama dengan nomor bot" : "+" + prefs.getString("ownerNumber", ""), toSet);
        row(infoList, R.drawable.ic_send, "Telegram", tg.isEmpty() ? "Tidak aktif (opsional)" : "Aktif • token tersimpan", toSet);
        row(infoList, R.drawable.ic_battery, "Latar belakang", "Izinkan agar bot tidak dimatikan sistem", v -> {
            try { startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName()))); }
            catch (Exception e) { startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)); }
        });
        row(infoList, R.drawable.ic_log, "Script bot", AppUpdater.summary(this), v -> nav.setSelectedItemId(R.id.nav_set));
        row(infoList, R.drawable.ic_info, "Versi", "v" + BuildConfig.VERSION_NAME + " • " + Build.MODEL + " • Android " + Build.VERSION.RELEASE, null);
    }

    // ---------- Banner: 4 slot custom ----------
    private void renderSlots() {
        slotList.removeAllViews();
        for (int s = 1; s <= 4; s++) {
            final int slot = s;
            File cf = BannerStore.custom(this, s);
            String sub = cf == null ? "Bawaan" : (cf.getName().endsWith(".mp4") ? "Video/GIF" : "Gambar") + " custom • " + (cf.length() / 1024) + " KB";
            View v = row(slotList, cf != null && !cf.getName().endsWith(".mp4") ? R.drawable.ic_image : R.drawable.ic_image, "Banner " + s, sub, null);
            MaterialButton a1 = v.findViewById(R.id.act1), a2 = v.findViewById(R.id.act2);
            a1.setVisibility(View.VISIBLE); a1.setText("Ganti");
            a1.setOnClickListener(x -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
                        .putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/gif", "image/jpeg", "image/png", "image/webp", "video/mp4"});
                startActivityForResult(i, 100 + slot);
            });
            if (cf != null) {
                a2.setVisibility(View.VISIBLE); a2.setText("Reset");
                a2.setOnClickListener(x -> { BannerStore.clear(this, slot); renderSlots(); restartBanner(); });
            }
        }
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req < 101 || req > 104 || res != RESULT_OK || data == null || data.getData() == null) return;
        final int slot = req - 100; final Uri u = data.getData();
        Toast.makeText(this, "Memproses banner " + slot + "…", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            String msg;
            try { msg = "Banner " + slot + " diganti: " + BannerStore.importUri(this, u, slot); }
            catch (Throwable t) { msg = "Gagal: " + (t.getMessage() == null ? t.toString() : t.getMessage()); }
            final String m = msg;
            runOnUiThread(() -> { if (!alive) return; Toast.makeText(this, m, Toast.LENGTH_LONG).show(); renderSlots(); restartBanner(); });
        }).start();
    }

    // ---------- banner bergerak ----------
    private void restartBanner() { h.removeCallbacks(nextBanner); playBanner(); }

    private void playBanner() {
        if (surface == null || !alive) return;
        stopBanner();
        int slot = bannerIdx % 4 + 1; bannerIdx++;
        File cf = BannerStore.custom(this, slot);
        try {
            if (cf != null && !cf.getName().endsWith(".mp4")) { // gambar: tampil 4 detik
                BitmapFactory.Options o = new BitmapFactory.Options(); o.inSampleSize = 2;
                Bitmap bm = BitmapFactory.decodeFile(cf.getPath(), o);
                if (bm == null) throw new Exception("gambar rusak");
                bannerImg.setImageBitmap(bm); bannerImg.setVisibility(View.VISIBLE);
                h.postDelayed(nextBanner, 4000);
                return;
            }
            bannerImg.setVisibility(View.GONE);
            mp = new MediaPlayer();
            if (cf != null) mp.setDataSource(cf.getPath());
            else { AssetFileDescriptor afd = getResources().openRawResourceFd(RAW[slot - 1]); mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength()); afd.close(); }
            mp.setSurface(surface);
            mp.setVolume(0f, 0f);
            mp.setOnPreparedListener(m -> { crop(); m.start(); });
            mp.setOnCompletionListener(m -> playBanner());
            mp.setOnErrorListener((m, w, e) -> { stopBanner(); h.postDelayed(nextBanner, 1500); return true; });
            mp.prepareAsync();
        } catch (Exception e) { stopBanner(); h.postDelayed(nextBanner, 1500); }
    }

    private void stopBanner() {
        h.removeCallbacks(nextBanner);
        if (mp != null) { try { mp.release(); } catch (Exception ignored) { } mp = null; }
    }

    private void crop() {
        if (mp == null) return;
        int vw = mp.getVideoWidth(), vh = mp.getVideoHeight(), w = banner.getWidth(), hh = banner.getHeight();
        if (vw == 0 || vh == 0 || w == 0 || hh == 0) return;
        float s = Math.max((float) w / vw, (float) hh / vh);
        Matrix m = new Matrix();
        m.setScale(s * vw / w, s * vh / hh, w / 2f, hh / 2f);
        banner.setTransform(m);
    }

    // ---------- start / stop ----------
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
        savePrefs();
        if (prefs.getString("botNumber", "").length() < 9) {
            Toast.makeText(this, "Isi nomor WhatsApp bot dulu", Toast.LENGTH_LONG).show();
            nav.setSelectedItemId(R.id.nav_set);
            return;
        }
        try (java.io.FileOutputStream lo = new java.io.FileOutputStream(new File(getFilesDir(), "bot.log"), true)) {
            lo.write(("\n──── sesi baru " + new java.text.SimpleDateFormat("dd/MM HH:mm:ss", java.util.Locale.US).format(new java.util.Date()) + " ────\n").getBytes());
        } catch (Exception ignored) { }
        Intent i = new Intent(this, BotService.class);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
    }

    // ---------- log & terminal ----------
    /** ekor log yang menyambung lintas arsip (bot.log.N … bot.log), supaya riwayat sebelum rotasi/restart tetap terlihat */
    private String tailAll(int max) {
        StringBuilder sb = new StringBuilder();
        File base = new File(getFilesDir(), "bot.log");
        String cur = tail(base, max);
        sb.append(cur);
        for (int i = 1; i <= 5 && sb.length() < max; i++) {
            File a = new File(getFilesDir(), "bot.log." + i);
            if (!a.exists()) break;
            sb.insert(0, tail(a, max - sb.length()));
        }
        return sb.toString();
    }

    private String tail(File f, int max) {
        try (RandomAccessFile r = new RandomAccessFile(f, "r")) {
            long len = r.length(); long from = Math.max(0, len - max);
            r.seek(from); byte[] b = new byte[(int) (len - from)]; r.readFully(b);
            return new String(b, "UTF-8").replaceAll("\u001B\\[[;\\d?]*[A-Za-z]", "");
        } catch (Exception e) { return ""; }
    }

    /** alasan proses bot terakhir mati (Android 11+) */
    private String lastExit() {
        if (Build.VERSION.SDK_INT < 30) return "";
        try {
            List<ApplicationExitInfo> l = ((ActivityManager) getSystemService(ACTIVITY_SERVICE)).getHistoricalProcessExitReasons(null, 0, 6);
            StringBuilder sb = new StringBuilder();
            for (ApplicationExitInfo e : l) if (e.getProcessName() != null && e.getProcessName().endsWith(":bot")) {
                sb.append("[sistem] proses bot mati: reason=").append(e.getReason()).append(" status=").append(e.getStatus())
                  .append(" ").append(e.getDescription()).append("\n");
                if (sb.length() > 600) break;
            }
            return sb.toString();
        } catch (Throwable t) { return ""; }
    }

    /** warnai log seperti terminal */
    static SpannableStringBuilder colorize(String log) {
        SpannableStringBuilder sb = new SpannableStringBuilder();
        for (String line : log.split("\n", -1)) {
            int c = GRAY;
            String l = line.toLowerCase();
            if (line.startsWith("[app]")) c = BLUE;
            else if (line.startsWith("[js]")) c = GREEN;
            else if (line.startsWith("[native]") || line.startsWith("  #")) c = AMBER;
            else if (line.startsWith("[sistem]")) c = PURPLE;
            else if (line.startsWith("──")) c = CYAN;
            if (l.contains("error") || l.contains("gagal") || l.contains("fatal") || l.contains("exception") || l.contains("syntaxerror")) c = RED;
            else if (l.contains("terhubung") || l.contains("kode pairing") || l.contains("berhasil")) c = GREEN;
            else if (l.contains("warn") || l.contains("peringatan")) c = AMBER;
            int st = sb.length();
            sb.append(line).append('\n');
            sb.setSpan(new ForegroundColorSpan(c), st, sb.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        }
        return sb;
    }

    private void shellOut(String text, int color) {
        runOnUiThread(() -> {
            int st = shellBuf.length();
            shellBuf.append(text);
            shellBuf.setSpan(new ForegroundColorSpan(color), st, shellBuf.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
            if (shellBuf.length() > 60000) shellBuf.delete(0, shellBuf.length() - 40000);
            shellText.setText(shellBuf);
            shellScroll.post(() -> shellScroll.fullScroll(View.FOCUS_DOWN));
        });
    }

    private void runShell() {
        final String cmd = String.valueOf(shellIn.getText()).trim();
        if (cmd.isEmpty()) return;
        shellIn.setText("");
        shellOut("$ " + cmd + "\n", GREEN);
        if (cmd.equals("clear")) { shellBuf.clear(); shellText.setText(""); return; }
        new Thread(() -> {
            try {
                File files = getFilesDir(), bot = new File(files, "bot");
                ProcessBuilder pb = new ProcessBuilder("/system/bin/sh", "-c", cmd).redirectErrorStream(true);
                pb.directory(bot.isDirectory() ? bot : files);
                Map<String, String> env = pb.environment();
                env.put("HOME", files.getAbsolutePath());
                env.put("TMPDIR", getCacheDir().getAbsolutePath());
                env.put("PATH", new File(files, "bin").getAbsolutePath() + ":" + env.get("PATH"));
                final Process p = pb.start();
                new Thread(() -> { try { Thread.sleep(60000); p.destroy(); } catch (Exception ignored) { } }).start();
                try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                    String line; StringBuilder chunk = new StringBuilder(); long t = System.currentTimeMillis();
                    while ((line = r.readLine()) != null) {
                        chunk.append(line).append('\n');
                        if (chunk.length() > 2000 || System.currentTimeMillis() - t > 200) { shellOut(chunk.toString(), GRAY); chunk.setLength(0); t = System.currentTimeMillis(); }
                    }
                    if (chunk.length() > 0) shellOut(chunk.toString(), GRAY);
                }
                int code = p.waitFor();
                if (code != 0) shellOut("[keluar " + code + "]\n", DIM);
            } catch (Exception e) { shellOut("gagal: " + e.getMessage() + "\n", RED); }
        }).start();
    }

    private void tick() {
        if (!alive) return;
        boolean run = running();
        toggle.setText(run ? "■  Hentikan bot" : "▶  Mulai bot");
        String raw = tailAll(150000);
        if (!run) raw = raw + lastExit();
        String cur = raw;
        int sx = cur.lastIndexOf("sesi baru"); if (sx > 0) cur = cur.substring(sx);
        Matcher m = PAIR.matcher(cur); String pair = null;
        while (m.find()) pair = m.group(1);
        boolean connected = cur.contains("terhubung");
        boolean failed = run && (cur.contains("GAGAL memuat") || cur.contains("[app] error"));
        boolean showCode = run && pair != null && !connected;
        status.setText(!run ? "Bot mati" : failed ? "Bot bermasalah" : showCode ? "Tautkan perangkat" : connected ? "Bot berjalan" : "Memulai…");
        statusIcon.setImageResource(run && !failed ? R.drawable.ic_check : R.drawable.ic_off);
        codeCard.setVisibility(showCode ? View.VISIBLE : View.GONE);
        if (showCode) code.setText(pair);

        // cuplikan log di Home
        String[] ls = cur.trim().split("\n");
        StringBuilder mini = new StringBuilder();
        for (int i = Math.max(0, ls.length - 6); i < ls.length; i++) mini.append(ls[i].length() > 90 ? ls[i].substring(0, 90) + "…" : ls[i]).append('\n');
        miniLog.setText(mini.length() == 0 ? "(log kosong) — ketuk untuk membuka terminal" : colorize(mini.toString().trim()));

        // terminal (hanya bila terlihat)
        if (page == 1 && !shellMode && !raw.equals(lastLogShown)) {
            boolean bottom = termScroll.getChildAt(0).getBottom() - (termScroll.getHeight() + termScroll.getScrollY()) < 150;
            lastLogShown = raw;
            termText.setText(colorize(raw.isEmpty() ? "(log kosong)" : raw));
            if (bottom || termScroll.getScrollY() == 0) termScroll.post(() -> termScroll.fullScroll(View.FOCUS_DOWN));
        }
        h.postDelayed(this::tick, 1500);
    }

    @Override protected void onDestroy() { alive = false; h.removeCallbacksAndMessages(null); stopBanner(); super.onDestroy(); }
}
