package com.shipur.chisaai;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.os.Bundle;

import com.google.android.material.color.DynamicColors;

/** Menerapkan mode (sistem/terang/gelap) dan palet warna pilihan pengguna. */
public abstract class BaseActivity extends Activity {
    static final String[] PAL_KEYS = {"sakura", "lavender", "sky", "mint", "peach", "sand", "teal", "rose", "mono"};
    static final int[] PAL_STYLES = {R.style.Pal_Sakura, R.style.Pal_Lavender, R.style.Pal_Sky, R.style.Pal_Mint, R.style.Pal_Peach, R.style.Pal_Sand, R.style.Pal_Teal, R.style.Pal_Rose, R.style.Pal_Mono};
    static final int[] PAL_NAMES = {R.string.pal_sakura, R.string.pal_lavender, R.string.pal_sky, R.string.pal_mint, R.string.pal_peach, R.string.pal_sand, R.string.pal_teal, R.string.pal_rose, R.string.pal_mono};

    static SharedPreferences cfg(Context c) { return c.getSharedPreferences("cfg", 0); }

    @Override protected void attachBaseContext(Context base) {
        int mode = cfg(base).getInt("uiMode", 0); // 0 sistem, 1 terang, 2 gelap
        if (mode != 0) {
            Configuration conf = new Configuration(base.getResources().getConfiguration());
            conf.uiMode = (conf.uiMode & ~Configuration.UI_MODE_NIGHT_MASK) | (mode == 2 ? Configuration.UI_MODE_NIGHT_YES : Configuration.UI_MODE_NIGHT_NO);
            base = base.createConfigurationContext(conf);
        }
        super.attachBaseContext(base);
    }

    @Override protected void onCreate(Bundle b) {
        String pal = cfg(this).getString("pal", "sakura");
        if ("dyn".equals(pal)) DynamicColors.applyToActivityIfAvailable(this);
        else {
            int idx = 0;
            for (int i = 0; i < PAL_KEYS.length; i++) if (PAL_KEYS[i].equals(pal)) idx = i;
            getTheme().applyStyle(PAL_STYLES[idx], true);
        }
        super.onCreate(b);
    }
}
