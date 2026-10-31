#!/usr/bin/env bash
# Membangun ffmpeg untuk Android (arm64, bionic) dengan NDK — dipakai workflow Build APK.
# Hasil: $1 (default ffbuild/libffmpeg.so). Biner glibc "static" dari internet dimatikan Android (SIGSYS); yang ini dibuat untuk Android.
set -euo pipefail
OUT="${1:-$PWD/ffbuild/libffmpeg.so}"
NDK="${ANDROID_NDK_LATEST_HOME:-${ANDROID_NDK_HOME:-${ANDROID_NDK_ROOT:-}}}"
[ -d "$NDK" ] || { echo "NDK tidak ditemukan"; exit 1; }
TC="$NDK/toolchains/llvm/prebuilt/linux-x86_64"
API=24; TARGET=aarch64-linux-android
export CC="$TC/bin/${TARGET}${API}-clang" AR="$TC/bin/llvm-ar" RANLIB="$TC/bin/llvm-ranlib" STRIP="$TC/bin/llvm-strip" NM="$TC/bin/llvm-nm"
W="$PWD/ffbuild"; P="$W/prefix"; mkdir -p "$W/src" "$P"; cd "$W/src"
export CFLAGS="-O2 -fPIC -I$P/include" LDFLAGS="-L$P/lib -Wl,-z,max-page-size=16384"
export PKG_CONFIG_PATH="$P/lib/pkgconfig" PKG_CONFIG_LIBDIR="$P/lib/pkgconfig"
J=$(nproc)
get() { curl -fsSL --retry 3 -o "$2" "$1" && tar xf "$2"; }
EN=()

echo "== opus"
if get https://downloads.xiph.org/releases/opus/opus-1.5.2.tar.gz opus.tgz && ( cd opus-1.5.2 && ./configure --host=$TARGET --prefix="$P" --disable-shared --enable-static --disable-doc --disable-extra-programs >/dev/null && make -j"$J" >/dev/null && make install >/dev/null ); then EN+=(--enable-libopus); else echo "opus dilewati"; fi

echo "== lame"
if get https://downloads.sourceforge.net/project/lame/lame/3.100/lame-3.100.tar.gz lame.tgz && ( cd lame-3.100 && ./configure --host=$TARGET --prefix="$P" --disable-shared --enable-static --disable-frontend --disable-decoder >/dev/null && make -j"$J" >/dev/null && make install >/dev/null ); then EN+=(--enable-libmp3lame); else echo "lame dilewati"; fi

echo "== libwebp"
if get https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.4.0.tar.gz webp.tgz && ( cd libwebp-1.4.0 && ./configure --host=$TARGET --prefix="$P" --disable-shared --enable-static --disable-gl --disable-sdl --disable-png --disable-jpeg --disable-tiff --disable-gif --disable-libwebpdecoder >/dev/null && make -j"$J" >/dev/null && make install >/dev/null ); then EN+=(--enable-libwebp); else echo "libwebp dilewati"; fi

echo "== x264"
if git clone -q --depth 1 https://code.videolan.org/videolan/x264.git x264 && ( cd x264 && ./configure --host=$TARGET --cross-prefix="$TC/bin/llvm-" --prefix="$P" --enable-static --enable-pic --disable-cli --disable-asm >/dev/null && make -j"$J" >/dev/null && make install >/dev/null ); then EN+=(--enable-libx264 --enable-gpl); else echo "x264 dilewati"; fi

echo "== ffmpeg (${EN[*]:-tanpa pustaka luar})"
get https://ffmpeg.org/releases/ffmpeg-7.0.2.tar.xz ffmpeg.txz
cd ffmpeg-7.0.2
./configure --prefix="$W/ffout" --enable-cross-compile --target-os=android --arch=aarch64 \
  --cc="$CC" --ar="$AR" --ranlib="$RANLIB" --strip="$STRIP" --nm="$NM" \
  --enable-pic --enable-small --disable-debug --disable-doc --disable-ffplay --disable-ffprobe \
  --disable-network --disable-autodetect --disable-avdevice \
  --pkg-config=pkg-config --pkg-config-flags=--static \
  --extra-cflags="-I$P/include" --extra-ldflags="-L$P/lib -Wl,-z,max-page-size=16384" \
  "${EN[@]}"
make -j"$J" >/dev/null
"$STRIP" -o "$OUT" ffmpeg
file "$OUT"; ls -la "$OUT"
