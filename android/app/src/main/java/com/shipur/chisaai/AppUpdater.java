package com.shipur.chisaai;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Update script bot dari GitHub (repo & branch bisa diganti di aplikasi).
 * Yang diganti hanya script bot; node_modules (dependensi) tetap dari APK. Login, data, settings.js, banner custom tidak disentuh.
 */
public class AppUpdater {
    static final String DEF_REPO = "purokta/chisaai", DEF_BRANCH = "main";
    private static final String[] KEEP = {"settings.js", "session", "data", "assets/custom", "backup", "node_modules"};
    private static final String[] SKIP = {"android/", ".github/", ".git/", "node_modules/", "docs/", "tmp/"};

    /** "owner/repo" dari berbagai bentuk: owner/repo, https://github.com/owner/repo(.git), .../tree/branch */
    static String parseRepo(String in) {
        if (in == null) return null;
        String s = in.trim().replaceAll("^https?://(www\\.)?github\\.com/", "").replaceAll("^github\\.com/", "").replaceAll("\\.git$", "");
        Matcher m = Pattern.compile("^([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)").matcher(s);
        return m.find() ? m.group(1) + "/" + m.group(2) : null;
    }

    static void log(Context c, String msg) {
        try (FileOutputStream o = new FileOutputStream(new File(c.getFilesDir(), "bot.log"), true)) { o.write(("[update] " + msg + "\n").getBytes()); } catch (Exception ignored) { }
    }

    static String summary(Context c) {
        SharedPreferences p = c.getSharedPreferences("cfg", 0);
        String sha = p.getString("ghSha", "");
        return p.getString("ghRepo", DEF_REPO) + "@" + p.getString("ghBranch", DEF_BRANCH) + (sha.isEmpty() ? " • bawaan APK" : " • " + sha.substring(0, Math.min(7, sha.length())));
    }

    private static HttpURLConnection open(String url, String token, String accept) throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
        h.setConnectTimeout(15000); h.setReadTimeout(60000);
        h.setRequestProperty("User-Agent", "CHISA-AI-APK");
        h.setRequestProperty("Accept", accept);
        if (token != null && !token.isEmpty()) h.setRequestProperty("Authorization", "Bearer " + token);
        return h;
    }

    private static String httpText(HttpURLConnection h) throws Exception {
        int code = h.getResponseCode();
        if (code == 404) throw new Exception("Repo/branch tidak ditemukan (404). Cek nama repo & branch; repo privat butuh token.");
        if (code == 401 || code == 403) throw new Exception("Ditolak GitHub (" + code + "). Token salah atau batas permintaan tercapai.");
        if (code != 200) throw new Exception("GitHub membalas " + code);
        try (InputStream in = h.getInputStream(); ByteArrayOutputStream o = new ByteArrayOutputStream()) {
            byte[] b = new byte[4096]; int n; while ((n = in.read(b)) > 0) o.write(b, 0, n);
            return o.toString("UTF-8").trim();
        }
    }

    static boolean keep(String rel) { for (String k : KEEP) if (rel.equals(k) || rel.startsWith(k + "/")) return true; return false; }

    private static void wipe(File dir, String rel) {
        File[] fs = dir.listFiles(); if (fs == null) return;
        for (File f : fs) {
            String r = rel.isEmpty() ? f.getName() : rel + "/" + f.getName();
            if (keep(r)) continue;
            if (f.isDirectory()) { wipe(f, r); f.delete(); } else f.delete();
        }
    }

    private static void deleteTree(File f) {
        File[] fs = f.listFiles();
        if (fs != null) for (File x : fs) deleteTree(x);
        f.delete();
    }

    /**
     * @param force true = pasang walau commit sama (tombol manual)
     * @return ringkasan hasil untuk pengguna. Melempar Exception berisi alasan bila gagal.
     */
    static String run(Context c, File bot, boolean force) throws Exception {
        SharedPreferences p = c.getSharedPreferences("cfg", 0);
        String repo = parseRepo(p.getString("ghRepo", DEF_REPO));
        String branch = p.getString("ghBranch", DEF_BRANCH).trim();
        String token = p.getString("ghToken", "").trim();
        if (repo == null) throw new Exception("Nama repo tidak valid (contoh: purokta/chisaai).");
        if (branch.isEmpty()) branch = DEF_BRANCH;

        // 1) commit terbaru
        String sha = httpText(open("https://api.github.com/repos/" + repo + "/commits/" + branch, token, "application/vnd.github.sha"));
        if (!sha.matches("[0-9a-f]{7,64}")) throw new Exception("Jawaban GitHub tidak dikenali.");
        String cur = p.getString("ghSha", "");
        if (!force && sha.equals(cur)) return "Sudah terbaru (" + sha.substring(0, 7) + ")";

        // 2) unduh zip ke staging
        File stage = new File(c.getFilesDir(), "bot.stage"); deleteTree(stage); stage.mkdirs();
        HttpURLConnection h = open("https://api.github.com/repos/" + repo + "/zipball/" + branch, token, "application/vnd.github+json");
        if (h.getResponseCode() != 200) throw new Exception("Gagal mengunduh zip (" + h.getResponseCode() + ")");
        long total = 0; int files = 0;
        try (ZipInputStream z = new ZipInputStream(h.getInputStream())) {
            ZipEntry e; byte[] buf = new byte[65536];
            while ((e = z.getNextEntry()) != null) {
                String name = e.getName();
                int sl = name.indexOf('/'); if (sl < 0) continue;
                name = name.substring(sl + 1);              // buang folder pembungkus "owner-repo-sha/"
                if (name.isEmpty() || e.isDirectory()) continue;
                boolean skip = false;
                for (String s : SKIP) if (name.startsWith(s)) skip = true;
                if (skip || keep(name)) continue;
                File out = new File(stage, name);
                if (!out.getCanonicalPath().startsWith(stage.getCanonicalPath())) continue; // zip slip
                out.getParentFile().mkdirs();
                try (FileOutputStream o = new FileOutputStream(out)) { int n; while ((n = z.read(buf)) > 0) { total += n; if (total > 120L * 1024 * 1024) throw new Exception("Zip terlalu besar."); o.write(buf, 0, n); } }
                files++;
            }
        }
        if (!new File(stage, "index.js").exists() || !new File(stage, "package.json").exists() || !new File(stage, "android-main.js").exists()) {
            deleteTree(stage);
            throw new Exception("Isi repo bukan script CHISA-AI (index.js / package.json / android-main.js tidak ada).");
        }

        // 3) dependensi baru yang belum ada di APK -> jangan dipasang (bot akan gagal start)
        JSONObject pj = new JSONObject(readFile(new File(stage, "package.json")));
        StringBuilder miss = new StringBuilder();
        JSONObject deps = pj.optJSONObject("dependencies");
        if (deps != null) for (java.util.Iterator<String> it = deps.keys(); it.hasNext(); ) {
            String d = it.next();
            if (!new File(bot, "node_modules/" + d + "/package.json").exists()) miss.append(d).append(' ');
        }
        if (miss.length() > 0) {
            deleteTree(stage);
            throw new Exception("Repo butuh dependensi yang belum ada di APK: " + miss.toString().trim() + ". Build APK baru dulu.");
        }

        // 4) pasang: hapus script lama (kecuali login/data/node_modules/banner), pindahkan yang baru
        bot.mkdirs();
        wipe(bot, "");
        moveTree(stage, bot);
        deleteTree(stage);
        String ver = pj.optString("version", "?");
        p.edit().putString("ghSha", sha).putLong("ghTime", System.currentTimeMillis()).putString("ghVer", ver).apply();
        return "Terpasang v" + ver + " (" + sha.substring(0, 7) + ", " + files + " berkas)";
    }

    private static String readFile(File f) throws Exception {
        try (java.io.FileInputStream in = new java.io.FileInputStream(f); ByteArrayOutputStream o = new ByteArrayOutputStream()) {
            byte[] b = new byte[8192]; int n; while ((n = in.read(b)) > 0) o.write(b, 0, n);
            return o.toString("UTF-8");
        }
    }

    private static void moveTree(File from, File to) throws Exception {
        File[] fs = from.listFiles(); if (fs == null) return;
        for (File f : fs) {
            File d = new File(to, f.getName());
            if (f.isDirectory()) { d.mkdirs(); moveTree(f, d); }
            else { d.delete(); if (!f.renameTo(d)) { try (java.io.FileInputStream in = new java.io.FileInputStream(f); FileOutputStream o = new FileOutputStream(d)) { byte[] b = new byte[65536]; int n; while ((n = in.read(b)) > 0) o.write(b, 0, n); } } }
        }
    }

    /** dipanggil saat bot dimulai: cek & pasang bila opsi otomatis aktif. Tidak pernah melempar. */
    static void auto(Context c, File bot) {
        SharedPreferences p = c.getSharedPreferences("cfg", 0);
        if (!p.getBoolean("ghAuto", true)) return;
        try {
            log(c, "memeriksa " + summary(c).split(" • ")[0] + "…");
            log(c, run(c, bot, false));
        } catch (Throwable t) {
            log(c, "dilewati: " + (t.getMessage() == null ? t.toString() : t.getMessage()) + " (memakai script yang ada)");
        }
    }

    static String when(Context c) {
        long t = c.getSharedPreferences("cfg", 0).getLong("ghTime", 0);
        return t == 0 ? "-" : new SimpleDateFormat("dd/MM HH:mm", Locale.US).format(new Date(t));
    }
}
