package com.shipur.chisaai;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Menyalakan bot lagi setelah HP restart (kalau sebelumnya bot dinyalakan dan belum dimatikan manual). */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(i.getAction())) return;
        if (!c.getSharedPreferences("cfg", 0).getBoolean("wantRun", false)) return;
        try {
            Intent s = new Intent(c, BotService.class);
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(s); else c.startService(s);
        } catch (Exception ignored) { }
    }
}
