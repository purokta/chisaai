#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  DEPLOY CHISA-AI KE GITHUB  (push kode terbaru ke repo)
#  Pemakaian:  bash deploy.sh ["pesan commit"] [paksa]
#  Token dibaca dari settings.js (github.token) / env GITHUB_TOKEN, TIDAK disimpan di .git
# ============================================================
set -e
cd "$(dirname "$0")"
MSG="${1:-update $(date +%Y-%m-%d_%H:%M)}"
FORCE="$2"
[ "$MSG" = "paksa" ] && { MSG="update $(date +%Y-%m-%d_%H:%M)"; FORCE=paksa; }

cfg() { node -e "try{const c=require('./config');console.log((c.github||{})['$1']||'')}catch(e){}" 2>/dev/null; }
USER_GH="${GITHUB_USER:-$(cfg user)}"; REPO="${GITHUB_REPO:-$(cfg repo)}"; BRANCH="${GITHUB_BRANCH:-$(cfg branch)}"
TOKEN="${GITHUB_TOKEN:-$(cfg token)}"
USER_GH="${USER_GH:-purokta}"; REPO="${REPO:-chisaai}"; BRANCH="${BRANCH:-main}"

command -v git >/dev/null || { echo "!! git belum terpasang. Jalankan: pkg install git"; exit 1; }
[ -n "$TOKEN" ] || { echo "!! Token GitHub belum diisi. Isi github.token di settings.js (buat di github.com/settings/tokens/new, centang repo)."; exit 1; }

[ -d .git ] || git init -q
git checkout -q -B "$BRANCH" 2>/dev/null || git branch -M "$BRANCH"
git config user.name  >/dev/null 2>&1 || git config user.name  "CHISA-AI"
git config user.email >/dev/null 2>&1 || git config user.email "chisa-ai@users.noreply.github.com"

# pengaman: login & settings tidak boleh ikut
git rm -r -q --cached session data settings.js 2>/dev/null || true

URL="${GITHUB_URL:-https://github.com/$USER_GH/$REPO.git}"
git remote get-url origin >/dev/null 2>&1 && git remote set-url origin "$URL" || git remote add origin "$URL"
AUTH="Authorization: Basic $(printf '%s' "x-access-token:$TOKEN" | base64 | tr -d '\n')"
G() { git -c "http.extraheader=$AUTH" "$@"; }

git add -A
if git diff --cached --quiet; then CHANGED=0; else git commit -q -m "$MSG"; CHANGED=1; fi

# gabungkan dulu kalau repo di GitHub sudah punya isi (mis. README awal)
if G fetch -q origin "$BRANCH" 2>/dev/null; then
  if [ "$FORCE" != "paksa" ]; then
    G pull -q --rebase --allow-unrelated-histories -X ours origin "$BRANCH" >/dev/null 2>&1 || { git rebase --abort 2>/dev/null; echo "!! Bentrok dengan isi GitHub. Kirim ulang dengan kata 'paksa' untuk menimpa GitHub dengan versi di HP ini."; exit 3; }
  fi
fi

if [ "$FORCE" = "paksa" ]; then G push -q -u --force origin "$BRANCH"; else G push -q -u origin "$BRANCH"; fi
VER="$(grep -m1 '"version"' package.json | sed 's/[^0-9.]//g')"
echo "OK v$VER -> https://github.com/$USER_GH/$REPO ($BRANCH)$([ "$CHANGED" = 0 ] && echo ' (tidak ada perubahan baru)')"
