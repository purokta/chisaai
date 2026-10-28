// Menjalankan Node.js (nodejs-mobile) di dalam aplikasi. Output (stdout/stderr) ditulis ke file log.
#include <jni.h>
#include <string>
#include <cstdlib>
#include <cstring>
#include <fcntl.h>
#include <unistd.h>
#include <dlfcn.h>
#include <unwind.h>
#include <signal.h>
#include <stdio.h>
#include <sys/stat.h>
#include "node.h"

static int g_fd = -1;
struct BT { int n; };
static _Unwind_Reason_Code btcb(struct _Unwind_Context *c, void *arg) {
    BT *b = (BT *) arg;
    uintptr_t pc = _Unwind_GetIP(c);
    if (pc && b->n < 25) {
        Dl_info i;
        if (dladdr((void *) pc, &i) && i.dli_fname) {
            const char *base = strrchr(i.dli_fname, '/');
            dprintf(g_fd, "  #%d %s %s +0x%lx\n", b->n, base ? base + 1 : i.dli_fname, i.dli_sname ? i.dli_sname : "?",
                    (unsigned long) (pc - (uintptr_t) i.dli_fbase));
        } else dprintf(g_fd, "  #%d 0x%lx\n", b->n, (unsigned long) pc);
        b->n++;
    }
    return _URC_NO_REASON;
}
static void dumpStack(const char *why) {
    if (g_fd < 0) return;
    dprintf(g_fd, "[native] %s — jejak:\n", why);
    BT b = {0};
    _Unwind_Backtrace(btcb, &b);
}
static void onExit() { dumpStack("exit() dipanggil"); }
static void onSig(int sig) { char m[40]; snprintf(m, sizeof m, "sinyal %d", sig); dumpStack(m); signal(sig, SIG_DFL); raise(sig); }

extern "C" JNIEXPORT jint JNICALL
Java_com_shipur_chisaai_BotService_startNode(JNIEnv *env, jobject, jobjectArray arguments, jstring logPath) {
    const char *lp = env->GetStringUTFChars(logPath, nullptr);
    int fd = open(lp, O_WRONLY | O_CREAT | O_APPEND, 0644);
    env->ReleaseStringUTFChars(logPath, lp);
    if (fd >= 0) { dup2(fd, 1); dup2(fd, 2); g_fd = fd; }
    atexit(onExit);
    signal(SIGABRT, onSig); signal(SIGSEGV, onSig); signal(SIGBUS, onSig); signal(SIGILL, onSig);

    int argc = env->GetArrayLength(arguments);
    int total = 0;
    for (int i = 0; i < argc; i++) {
        jstring s = (jstring) env->GetObjectArrayElement(arguments, i);
        total += env->GetStringUTFLength(s) + 1;
    }
    // argumen harus berada di satu blok memori yang berurutan (syarat libuv)
    char *buf = (char *) calloc(total + 1, sizeof(char));
    char **argv = new char *[argc];
    char *cur = buf;
    for (int i = 0; i < argc; i++) {
        jstring s = (jstring) env->GetObjectArrayElement(arguments, i);
        const char *c = env->GetStringUTFChars(s, nullptr);
        size_t n = strlen(c);
        memcpy(cur, c, n);
        argv[i] = cur;
        cur += n + 1;
        env->ReleaseStringUTFChars(s, c);
    }
    struct stat st;
    dprintf(g_fd, "[native] skrip=%s ada=%d argc=%d\n", argv[argc > 1 ? 1 : 0], argc > 1 ? (stat(argv[1], &st) == 0) : -1, argc);
    int r = node::Start(argc, argv);
    dprintf(g_fd, "[native] node::Start kembali kode=%d\n", r);
    return jint(r);
}
