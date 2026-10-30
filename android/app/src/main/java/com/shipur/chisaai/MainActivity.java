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
public class MainActivity extends BaseActivity {
    private static final int[] RAW = {R.raw.banner1}; // hanya banner utama yang bawaan; slot 2-4 kosong sampai diisi
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
    private static final int REQ_ICON = 77;
    private String lastLogShown = "";

    @Override
    protected void onCreate(Bundle b) {
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

        setupLook();
        setupYt();
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
            String sub = cf == null ? (s == 1 ? "Bawaan (banner utama / cadangan)" : "Kosong — memakai banner utama") : (cf.getName().endsWith(".mp4") ? "Video/GIF" : "Gambar") + " custom • " + (cf.length() / 1024) + " KB";
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
        if (req == REQ_ICON && res == RESULT_OK && data != null && data.getData() != null) { handleIconPick(data); return; }
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
        if (ytOn()) { playYt(); return; }
        int slot = 1; // cari slot berikutnya yang ada isinya (custom), slot 1 selalu ada (bawaan)
        for (int k = 0; k < 4; k++) { int s = bannerIdx % 4 + 1; bannerIdx++; if (s == 1 || BannerStore.custom(this, s) != null) { slot = s; break; } }
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
        if (prefs.getBoolean("autoClear", true)) {
            for (String n : new String[]{"bot.log", "bot.log.1", "bot.log.2", "bot.log.3", "bot.log.4", "bot.log.5"}) new File(getFilesDir(), n).delete();
            lastLogShown = "";
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
        if (page == 2) showYtStatus();
        long ym = ytFile().lastModified();
        if (ym != lastYtMod) { boolean first = lastYtMod == 0; lastYtMod = ym; if (!first && ytOn()) restartBanner(); }
        h.postDelayed(this::tick, 1500);
    }

    @Override protected void onPause() { super.onPause(); stopBanner(); } // hentikan suara banner saat aplikasi ditinggalkan
    @Override protected void onResume() { super.onResume(); if (surface != null) restartBanner(); }
    @Override protected void onDestroy() { alive = false; h.removeCallbacksAndMessages(null); stopBanner(); super.onDestroy(); }

    // ---------- tampilan: warna, mode, ikon ----------
    private static final String[] ICON_KEYS = {"Default", "Sakura", "Midnight", "Sky", "Mint", "Cream"};
    private static final String[] ICON_NAMES = {"Klasik", "Sakura", "Malam", "Langit", "Mint", "Krem"};
    private static final int[] ICON_RES = {R.mipmap.ic_launcher, R.mipmap.ic_launcher_sakura, R.mipmap.ic_launcher_midnight, R.mipmap.ic_launcher_sky, R.mipmap.ic_launcher_mint, R.mipmap.ic_launcher_cream};

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    private android.view.View chip(String label, int fill, boolean sel, View.OnClickListener l) {
        android.widget.LinearLayout c = new android.widget.LinearLayout(this);
        c.setOrientation(android.widget.LinearLayout.VERTICAL); c.setGravity(android.view.Gravity.CENTER_HORIZONTAL);
        c.setPadding(dp(6), dp(4), dp(6), dp(4));
        View dot = new View(this);
        android.graphics.drawable.GradientDrawable g = new android.graphics.drawable.GradientDrawable();
        g.setShape(android.graphics.drawable.GradientDrawable.OVAL); g.setColor(fill);
        int ring = obtainStyledAttributes(new int[]{com.google.android.material.R.attr.colorPrimary}).getColor(0, 0);
        if (sel) g.setStroke(dp(3), ring); else g.setStroke(dp(1), 0x33888888);
        dot.setBackground(g);
        c.addView(dot, new android.widget.LinearLayout.LayoutParams(dp(46), dp(46)));
        TextView t = new TextView(this); t.setText(label); t.setTextSize(11); t.setGravity(android.view.Gravity.CENTER);
        t.setPadding(0, dp(4), 0, 0);
        c.addView(t);
        c.setOnClickListener(l);
        return c;
    }

    private void setupLook() {
        android.widget.LinearLayout pr = findViewById(R.id.palRow);
        String cur = prefs.getString("pal", "sakura");
        TypedValueHelper tv = new TypedValueHelper();
        for (int i = 0; i < PAL_KEYS.length; i++) {
            final String key = PAL_KEYS[i];
            int col = tv.primaryOf(this, PAL_STYLES[i]);
            pr.addView(chip(getString(PAL_NAMES[i]), col, key.equals(cur), v -> { prefs.edit().putString("pal", key).apply(); recreate(); }));
        }
        if (Build.VERSION.SDK_INT >= 31)
            pr.addView(chip("Dinamis", 0xFF8E8E93, "dyn".equals(cur), v -> { prefs.edit().putString("pal", "dyn").apply(); recreate(); }));
        com.google.android.material.button.MaterialButtonToggleGroup mg = findViewById(R.id.modeGroup);
        int mode = prefs.getInt("uiMode", 0);
        mg.check(mode == 1 ? R.id.modeLight : mode == 2 ? R.id.modeDark : R.id.modeSys);
        mg.addOnButtonCheckedListener((g, id, on) -> {
            if (!on) return;
            int m = id == R.id.modeLight ? 1 : id == R.id.modeDark ? 2 : 0;
            if (m == prefs.getInt("uiMode", 0)) return;
            prefs.edit().putInt("uiMode", m).apply(); recreate();
        });
        android.widget.LinearLayout ir = findViewById(R.id.iconRow);
        String curIcon = prefs.getString("icon", "Default");
        for (int i = 0; i < ICON_KEYS.length; i++) {
            final String key = ICON_KEYS[i]; final int idx = i;
            android.widget.LinearLayout c = new android.widget.LinearLayout(this);
            c.setOrientation(android.widget.LinearLayout.VERTICAL); c.setGravity(android.view.Gravity.CENTER_HORIZONTAL);
            c.setPadding(dp(6), dp(4), dp(6), dp(4));
            ImageView iv = new ImageView(this); iv.setImageResource(ICON_RES[i]);
            c.addView(iv, new android.widget.LinearLayout.LayoutParams(dp(56), dp(56)));
            TextView t = new TextView(this); t.setText(ICON_NAMES[i]); t.setTextSize(11); t.setGravity(android.view.Gravity.CENTER);
            t.setPadding(0, dp(4), 0, 0); c.addView(t);
            if (key.equals(curIcon)) c.setBackgroundResource(R.drawable.bg_circle);
            c.setOnClickListener(v -> iconDialog(key, idx));
            ir.addView(c);
        }
        findViewById(R.id.iconCustom).setOnClickListener(v -> {
            Intent p = new Intent(Intent.ACTION_GET_CONTENT).setType("image/*");
            try { startActivityForResult(Intent.createChooser(p, "Pilih gambar ikon"), REQ_ICON); } catch (Exception e) { Toast.makeText(this, "Tidak ada pemilih gambar", Toast.LENGTH_SHORT).show(); }
        });
        com.google.android.material.materialswitch.MaterialSwitch ac = findViewById(R.id.autoClear);
        ac.setChecked(prefs.getBoolean("autoClear", true));
        ac.setOnCheckedChangeListener((bv, on) -> prefs.edit().putBoolean("autoClear", on).apply());
    }

    /** pilihan: ganti ikon aplikasi (alias) atau pasang pintasan ber-ikon di layar utama (cara ini paling pasti di semua peluncur) */
    private void iconDialog(String key, int idx) {
        new android.app.AlertDialog.Builder(this)
                .setTitle("Ikon " + ICON_NAMES[idx])
                .setMessage("• Ganti ikon aplikasi: ikon aplikasi berubah, tapi sebagian peluncur (MIUI/HyperOS) baru memperbaruinya setelah beberapa menit atau setelah peluncur dimulai ulang.\n\n• Pasang pintasan: menaruh ikon ini langsung di layar utama. Di POCO/Xiaomi, izinkan dulu \"Pintasan layar utama\" di Info aplikasi > Izin lainnya.")
                .setPositiveButton("Ganti ikon aplikasi", (d, w) -> setIcon(key))
                .setNeutralButton("Pasang pintasan", (d, w) -> pinResIcon(ICON_RES[idx], key))
                .setNegativeButton("Batal", null).show();
    }

    private void pinResIcon(int res, String key) {
        try {
            if (Build.VERSION.SDK_INT < 26) throw new Exception("butuh Android 8+");
            android.graphics.drawable.Drawable dr = getDrawable(res);
            Bitmap bm = Bitmap.createBitmap(192, 192, Bitmap.Config.ARGB_8888);
            android.graphics.Canvas cv = new android.graphics.Canvas(bm);
            dr.setBounds(0, 0, 192, 192); dr.draw(cv);
            android.content.pm.ShortcutManager sm = getSystemService(android.content.pm.ShortcutManager.class);
            if (!sm.isRequestPinShortcutSupported()) throw new Exception("peluncur tidak mendukung pintasan");
            android.content.pm.ShortcutInfo si = new android.content.pm.ShortcutInfo.Builder(this, "chisa-" + key)
                    .setShortLabel("CHISA-AI").setIcon(android.graphics.drawable.Icon.createWithBitmap(bm))
                    .setIntent(new Intent(this, MainActivity.class).setAction(Intent.ACTION_MAIN)).build();
            sm.requestPinShortcut(si, null);
            Toast.makeText(this, "Konfirmasi pintasan di layar. Kalau tidak muncul, izinkan \"Pintasan layar utama\" untuk aplikasi ini.", Toast.LENGTH_LONG).show();
        } catch (Throwable t) { Toast.makeText(this, "Gagal: " + t.getMessage(), Toast.LENGTH_LONG).show(); }
    }

    /** ganti ikon peluncur lewat activity-alias */
    private void setIcon(String key) {
        android.content.pm.PackageManager pm = getPackageManager();
        for (String k : ICON_KEYS) {
            pm.setComponentEnabledSetting(new android.content.ComponentName(getPackageName(), "com.shipur.chisaai.Icon" + k),
                    k.equals(key) ? android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_ENABLED : android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    android.content.pm.PackageManager.DONT_KILL_APP);
        }
        prefs.edit().putString("icon", key).apply();
        Toast.makeText(this, "Ikon diganti. Beberapa peluncur butuh beberapa detik untuk memperbarui.", Toast.LENGTH_LONG).show();
        recreate();
    }

    private void handleIconPick(Intent data) {
        try (java.io.InputStream in = getContentResolver().openInputStream(data.getData())) {
            Bitmap src = BitmapFactory.decodeStream(in);
            if (src == null) throw new Exception("gambar tidak terbaca");
            int s = Math.min(src.getWidth(), src.getHeight());
            Bitmap sq = Bitmap.createBitmap(src, (src.getWidth() - s) / 2, (src.getHeight() - s) / 2, s, s);
            sq = Bitmap.createScaledBitmap(sq, 192, 192, true);
            if (Build.VERSION.SDK_INT >= 26) {
                android.content.pm.ShortcutManager sm = getSystemService(android.content.pm.ShortcutManager.class);
                if (!sm.isRequestPinShortcutSupported()) throw new Exception("peluncur tidak mendukung pintasan");
                android.content.pm.ShortcutInfo si = new android.content.pm.ShortcutInfo.Builder(this, "chisa-custom")
                        .setShortLabel("CHISA-AI").setIcon(android.graphics.drawable.Icon.createWithBitmap(sq))
                        .setIntent(new Intent(this, MainActivity.class).setAction(Intent.ACTION_MAIN)).build();
                sm.requestPinShortcut(si, null);
            } else throw new Exception("butuh Android 8+");
        } catch (Throwable t) { Toast.makeText(this, "Gagal: " + t.getMessage(), Toast.LENGTH_LONG).show(); }
    }

    /** ambil warna primary dari sebuah style palet tanpa menerapkannya */
    static final class TypedValueHelper {
        int primaryOf(Context c, int style) {
            android.content.res.TypedArray a = c.obtainStyledAttributes(style, new int[]{com.google.android.material.R.attr.colorPrimary});
            int v = a.getColor(0, 0xFF888888); a.recycle(); return v;
        }
    }

    // ---------- banner YouTube (file diunduh bot, diputar di aplikasi) ----------
    private File ytFile() { return new File(BannerStore.dir(this), "ytbanner.mp4"); }
    private File ytReq() { File d = new File(getFilesDir(), "bot/data"); d.mkdirs(); return new File(d, "ytbanner-req.json"); }
    private File ytStat() { return new File(getFilesDir(), "bot/data/ytbanner-status.json"); }
    private boolean ytOn() { return prefs.getBoolean("ytOn", false) && ytFile().length() > 10000; }
    private TextView ytStatus;
    private long lastYtMod = 0;

    private String readSmall(File f) {
        try (java.io.FileInputStream in = new java.io.FileInputStream(f)) { byte[] b = new byte[(int) Math.min(f.length(), 4000)]; int n = in.read(b); return new String(b, 0, Math.max(n, 0), "UTF-8"); } catch (Exception e) { return ""; }
    }

    private void showYtStatus() {
        if (ytStatus == null) return;
        String t;
        File st = ytStat();
        String raw = st.exists() ? readSmall(st) : "";
        try {
            org.json.JSONObject o = new org.json.JSONObject(raw);
            String s = o.optString("state"), msg = o.optString("msg");
            t = ("busy".equals(s) ? "⏳ " : "ok".equals(s) ? "✅ " : "❌ ") + msg;
        } catch (Exception e) { t = ytFile().length() > 10000 ? "✅ Video tersimpan (" + (ytFile().length() / 1024) + " KB)" : "Belum ada video. Isi link lalu tekan Terapkan (bot harus menyala)."; }
        ytStatus.setText(t);
    }

    private void setupYt() {
        TextInputEditText link = findViewById(R.id.ytLink), start = findViewById(R.id.ytStart), dur = findViewById(R.id.ytDur);
        MaterialSwitch en = findViewById(R.id.ytEnable), snd = findViewById(R.id.ytSound);
        ytStatus = findViewById(R.id.ytStatus);
        link.setText(prefs.getString("ytLink", "")); start.setText(String.valueOf(prefs.getInt("ytStart", 0))); dur.setText(String.valueOf(prefs.getInt("ytDur", 0)));
        en.setChecked(prefs.getBoolean("ytOn", false)); snd.setChecked(prefs.getBoolean("ytSound", false));
        snd.setOnCheckedChangeListener((bv, on) -> { prefs.edit().putBoolean("ytSound", on).apply(); if (mp != null) { try { mp.setVolume(on ? 1f : 0f, on ? 1f : 0f); } catch (Exception ignored) { } } });
        en.setOnCheckedChangeListener((bv, on) -> { prefs.edit().putBoolean("ytOn", on).apply(); restartBanner(); });
        findViewById(R.id.ytApply).setOnClickListener(v -> {
            String l = String.valueOf(link.getText()).trim();
            if (!l.matches("(?i)^https?://(www\\.|m\\.|music\\.)?(youtube\\.com|youtu\\.be)/.+")) { Toast.makeText(this, "Link YouTube tidak valid", Toast.LENGTH_SHORT).show(); return; }
            int st = 0, du = 0;
            try { st = Integer.parseInt(String.valueOf(start.getText()).trim()); } catch (Exception ignored) { }
            try { du = Integer.parseInt(String.valueOf(dur.getText()).trim()); } catch (Exception ignored) { }
            boolean same = l.equals(prefs.getString("ytLink", "")) && ytFile().length() > 10000;
            prefs.edit().putString("ytLink", l).putInt("ytStart", Math.max(0, st)).putInt("ytDur", Math.max(0, du)).putBoolean("ytOn", true).apply();
            en.setChecked(true);
            if (same) { restartBanner(); Toast.makeText(this, "Pengaturan diterapkan", Toast.LENGTH_SHORT).show(); showYtStatus(); return; }
            if (!running()) { Toast.makeText(this, "Nyalakan bot dulu — video diunduh oleh bot", Toast.LENGTH_LONG).show(); }
            try (java.io.FileOutputStream o = new java.io.FileOutputStream(ytReq())) { o.write(new org.json.JSONObject().put("link", l).put("ts", System.currentTimeMillis()).toString().getBytes()); } catch (Exception e) { Toast.makeText(this, "Gagal membuat permintaan: " + e.getMessage(), Toast.LENGTH_LONG).show(); }
            try { new File(getFilesDir(), "bot/data/ytbanner-status.json").delete(); } catch (Exception ignored) { }
            if (ytStatus != null) ytStatus.setText("⏳ Menunggu bot mengunduh…");
        });
        showYtStatus();
    }

    /** putar video YouTube yang sudah diunduh (dengan suara bila saklar suara aktif), mulai dari detik yang diatur */
    private void playYt() {
        bannerImg.setVisibility(View.GONE);
        final boolean sound = prefs.getBoolean("ytSound", false);
        final int st = prefs.getInt("ytStart", 0) * 1000, du = prefs.getInt("ytDur", 0) * 1000;
        try {
            mp = new MediaPlayer();
            mp.setDataSource(ytFile().getPath());
            mp.setSurface(surface);
            mp.setVolume(sound ? 1f : 0f, sound ? 1f : 0f);
            mp.setOnPreparedListener(m -> {
                crop();
                if (st > 0 && st < m.getDuration()) m.seekTo(st);
                m.start();
                if (du > 0) h.postDelayed(nextBanner, du); // lewat durasi -> ulang dari awal klip
            });
            mp.setOnCompletionListener(m -> playBanner());
            mp.setOnErrorListener((m, w, e) -> { stopBanner(); h.postDelayed(nextBanner, 3000); return true; });
            mp.prepareAsync();
        } catch (Exception e) { stopBanner(); h.postDelayed(nextBanner, 3000); }
    }
}
