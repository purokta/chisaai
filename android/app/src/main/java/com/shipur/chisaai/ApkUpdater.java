package com.shipur.chisaai;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Cek & pasang APK baru dari Releases GitHub (tag apk-latest) pada repo yang diatur di Pengaturan. */
public class ApkUpdater {
    static class Info { int code; String ver = "?"; String apiUrl, webUrl; long size; }

    private static HttpURLConnection open(String url, String token, String accept) throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
        h.setConnectTimeout(15000); h.setReadTimeout(120000);
        h.setRequestProperty("User-Agent", "CHISA-AI-APK");
        h.setRequestProperty("Accept", accept);
        if (token != null && !token.isEmpty()) h.setRequestProperty("Authorization", "Bearer " + token);
        return h;
    }

    /** null bila belum ada rilis APK di repo */
    static Info latest(Context c) throws Exception {
        SharedPreferences p = c.getSharedPreferences("cfg", 0);
        String repo = AppUpdater.parseRepo(p.getString("ghRepo", AppUpdater.DEF_REPO));
        if (repo == null) throw new Exception("Nama repo tidak valid.");
        HttpURLConnection h = open("https://api.github.com/repos/" + repo + "/releases/tags/apk-latest", p.getString("ghToken", "").trim(), "application/vnd.github+json");
        int code = h.getResponseCode();
        if (code == 404) return null;
        if (code != 200) throw new Exception("GitHub membalas " + code);
        String body;
        try (InputStream in = h.getInputStream(); ByteArrayOutputStream o = new ByteArrayOutputStream()) {
            byte[] b = new byte[4096]; int n; while ((n = in.read(b)) > 0) o.write(b, 0, n);
            body = o.toString("UTF-8");
        }
        JSONObject j = new JSONObject(body);
        Info i = new Info();
        String notes = j.optString("body", "");
        Matcher m = Pattern.compile("versionCode:\\s*(\\d+)").matcher(notes);
        if (m.find()) i.code = Integer.parseInt(m.group(1));
        Matcher v = Pattern.compile("v(\\d+\\.\\d+\\.\\d+)").matcher(notes);
        if (v.find()) i.ver = v.group(1);
        JSONArray as = j.optJSONArray("assets");
        if (as != null) for (int k = 0; k < as.length(); k++) {
            JSONObject a = as.getJSONObject(k);
            if (a.optString("name").endsWith(".apk")) { i.apiUrl = a.optString("url"); i.webUrl = a.optString("browser_download_url"); i.size = a.optLong("size"); break; }
        }
        if (i.webUrl == null) throw new Exception("Rilis tidak berisi berkas APK.");
        return i;
    }

    static boolean newer(Info i) { return i != null && i.code > BuildConfig.VERSION_CODE; }

    static File download(Context c, Info i) throws Exception {
        SharedPreferences p = c.getSharedPreferences("cfg", 0);
        String token = p.getString("ghToken", "").trim();
        File dir = new File(c.getCacheDir(), "apk"); dir.mkdirs();
        File out = new File(dir, "chisa-ai.apk");
        out.delete();
        HttpURLConnection h = token.isEmpty() ? open(i.webUrl, null, "application/octet-stream") : open(i.apiUrl, token, "application/octet-stream");
        if (h.getResponseCode() != 200) throw new Exception("Gagal mengunduh APK (" + h.getResponseCode() + ")");
        try (InputStream in = h.getInputStream(); FileOutputStream o = new FileOutputStream(out)) {
            byte[] b = new byte[65536]; int n; while ((n = in.read(b)) > 0) o.write(b, 0, n);
        }
        if (out.length() < 1024 * 1024) throw new Exception("APK terunduh tidak lengkap.");
        return out;
    }

    /** Buka pemasang Android. Mengembalikan false bila izin "pasang aplikasi dari sumber ini" harus diberikan dulu. */
    static boolean install(Activity a, File apk) {
        if (Build.VERSION.SDK_INT >= 26 && !a.getPackageManager().canRequestPackageInstalls()) {
            a.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + a.getPackageName())));
            return false;
        }
        Uri u = FileProvider.getUriForFile(a, a.getPackageName() + ".files", apk);
        a.startActivity(new Intent(Intent.ACTION_VIEW).setDataAndType(u, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK));
        return true;
    }
}
