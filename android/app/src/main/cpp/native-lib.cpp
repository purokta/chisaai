// Menjalankan Node.js (nodejs-mobile) di dalam aplikasi. Output (stdout/stderr) ditulis ke file log.
#include <jni.h>
#include <string>
#include <cstdlib>
#include <cstring>
#include <fcntl.h>
#include <unistd.h>
#include "node.h"

extern "C" JNIEXPORT jint JNICALL
Java_com_shipur_chisaai_BotService_startNode(JNIEnv *env, jobject, jobjectArray arguments, jstring logPath) {
    const char *lp = env->GetStringUTFChars(logPath, nullptr);
    int fd = open(lp, O_WRONLY | O_CREAT | O_APPEND, 0644);
    env->ReleaseStringUTFChars(logPath, lp);
    if (fd >= 0) { dup2(fd, 1); dup2(fd, 2); }

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
    return jint(node::Start(argc, argv));
}
