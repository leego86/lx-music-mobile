#!/bin/sh

set -e

MAX_JOBS="${MAX_JOBS:-6}"
BUILD_TYPE="${1:-release}"
ARCHS="${ARCHS:-arm64-v8a}"

cd "$(dirname "$0")"

case "$BUILD_TYPE" in
  release) GRADLE_TASK="assembleRelease" ;;
  debug) GRADLE_TASK="assembleDebug" ;;
  *)
    echo "用法: $0 [release|debug]"
    echo "环境变量: MAX_JOBS(并发数, 默认6) ARCHS(架构, 默认arm64-v8a) NO_BUMP=1(跳过版本号自增) INSTALL=1(编译后自动adb安装)"
    exit 1
    ;;
esac

PINNER=""
if [ -f /proc/cpuinfo ]; then
  CPU_COUNT=$(grep -c ^processor /proc/cpuinfo)
  if [ "$CPU_COUNT" -gt "$MAX_JOBS" ] && command -v taskset >/dev/null 2>&1; then
    CORES=$(seq -s, 0 "$((MAX_JOBS - 1))")
    PINNER="taskset -c $CORES"
  fi
fi

if [ ! -d node_modules ]; then
  echo "node_modules 不存在，请先执行 npm install"
  exit 1
fi
if [ ! -x android/gradlew ]; then
  echo "android/gradlew 不存在或没有可执行权限"
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "未找到 node"
  exit 1
fi

if [ "${NO_BUMP:-0}" != "1" ]; then
  VERSION_INFO=$(node -e '
const fs = require("fs")
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
pkg.versionCode = (pkg.versionCode ?? 0) + 1
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n")
process.stdout.write(pkg.version + " " + pkg.versionCode)
')
  echo "版本号已自增: $VERSION_INFO"
fi

if [ "$BUILD_TYPE" = "release" ] && [ ! -f android/keystore.properties ]; then
  if ! command -v keytool >/dev/null 2>&1; then
    echo "未找到 keytool，无法自动生成本地签名，请安装 JDK 或自备 android/keystore.properties"
    exit 1
  fi
  echo "未检测到 android/keystore.properties，自动生成本地签名（仅供本地构建使用，非官方签名）"
  KEY_ALIAS="lx_music_local"
  if command -v openssl >/dev/null 2>&1; then
    KEY_PASSWORD=$(openssl rand -base64 16)
  else
    KEY_PASSWORD="lx_music_local_$(date +%s)"
  fi
  STORE_PASSWORD="$KEY_PASSWORD"
  keytool -genkeypair -v \
    -keystore android/app/lx_music_local.keystore \
    -alias "$KEY_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$STORE_PASSWORD" -keypass "$KEY_PASSWORD" \
    -dname "CN=lx-music-local, OU=local, O=local, L=local, ST=local, C=CN"
  cat > android/keystore.properties <<EOF
storeFile=lx_music_local.keystore
storePassword=$STORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASSWORD
EOF
fi

echo "构建 Android ($BUILD_TYPE, $ARCHS)，限制并发数为 $MAX_JOBS"

# shellcheck disable=SC2086
$PINNER android/gradlew "$GRADLE_TASK" \
  --max-workers="$MAX_JOBS" \
  -Pandroid.native.buildParallelism="$MAX_JOBS" \
  -PreactNativeArchitectures="$ARCHS" \
  -p android

APK_DIR="android/app/build/outputs/apk/$BUILD_TYPE"
echo "构建完成，产物位于 $APK_DIR/"
ls -lh "$APK_DIR"/*.apk

APK=$(ls "$APK_DIR"/*arm64-v8a*.apk 2>/dev/null | head -n 1 || true)
if [ -z "$APK" ]; then
  APK=$(ls "$APK_DIR"/*.apk 2>/dev/null | head -n 1 || true)
fi
if [ -n "$APK" ]; then
  echo ""
  echo "安装到设备: adb install -r \"$APK\""
  if [ "${INSTALL:-0}" = "1" ]; then
    echo ""
    if adb install -r "$APK"; then
      echo "安装成功"
    else
      echo ""
      echo "安装失败。若提示 INSTALL_FAILED_UPDATE_INCOMPATIBLE（签名不一致），"
      echo "需先卸载旧版本（会清除应用数据）: adb uninstall cn.toside.music.mobile"
      INSTALLED=0
      if [ -t 0 ]; then
        printf "是否卸载旧版本并重新安装? [y/N] "
        read -r ANSWER
        case "$ANSWER" in
          y|Y)
            adb uninstall cn.toside.music.mobile
            adb install -r "$APK" && { echo "安装成功"; INSTALLED=1; }
            ;;
          *) echo "已取消" ;;
        esac
      fi
      [ "$INSTALLED" = "1" ] || exit 1
    fi
  fi
fi
