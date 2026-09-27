#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${PROJECT_DIR}/$(basename -- "${BASH_SOURCE[0]}")"
MONOREPO_DIR="${TURISMO_MONOREPO_DIR:-${PROJECT_DIR}/../app-turismo-vinculacion}"

export ANDROID_HOME="${ANDROID_HOME:-${HOME}/Android/Sdk}"
export PATH="${HOME}/.bun/bin:${ANDROID_HOME}/platform-tools:${PATH}"

info() {
  printf '[Turismo Admin] %s\n' "$*"
}

fail() {
  printf '[Turismo Admin] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Uso:
  ./iniciar-turismo-admin-local.sh                   Abre app Android y admin en Kitty.
  ./iniciar-turismo-admin-local.sh --web-only        Abre solo la web en Kitty.
  ./iniciar-turismo-admin-local.sh --check           Comprueba app, API, base y admin.
  ./iniciar-turismo-admin-local.sh --check --web-only Comprueba solo la web.
  ./iniciar-turismo-admin-local.sh --help            Muestra esta ayuda.

El modo completo abre pestañas para API y admin, Metro y Android. Espera un dispositivo
Android USB autorizado; instala y abre la variante de desarrollo sin reemplazar la app
publicada. Puedes indicar otra ruta con TURISMO_MONOREPO_DIR.
Admin: http://localhost:3002/admin.
EOF
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "No se encontró '$1'. $2"
}

port_is_open() {
  ss -ltnH "sport = :$1" 2>/dev/null | grep -q .
}

java_17_home() {
  local candidate version_line
  local -a candidates=(
    "${TURISMO_JAVA_HOME:-}"
    "${JAVA_HOME:-}"
    "/usr/lib/jvm/java-17-openjdk"
    "/usr/lib/jvm/java-17-openjdk-amd64"
  )

  for candidate in "${candidates[@]}"; do
    [[ -n "$candidate" && -x "$candidate/bin/java" ]] || continue
    version_line="$("$candidate/bin/java" -version 2>&1 | head -n 1)"
    if [[ "$version_line" == *'version "17.'* || "$version_line" == *'version "17"'* ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

preflight() {
  local mode="$1"
  local api_port="${API_PORT:-3000}"

  require_command kitty "Instala Kitty antes de usar este lanzador."
  require_command bun "Instala Bun o comprueba ~/.bun/bin."
  require_command ss "Instala iproute2 para comprobar los puertos."
  [[ -f "$PROJECT_DIR/package.json" ]] || fail "No se encontró el proyecto web."
  [[ -f "$PROJECT_DIR/bun.lock" ]] || fail "No se encontró bun.lock."

  port_is_open 3002 && fail "El puerto 3002 ya está ocupado. Cierra la web anterior."

  if [[ "$mode" == full ]]; then
    require_command corepack "Instala Node.js con Corepack."
    require_command psql "Instala el cliente de PostgreSQL."
    require_command curl "Instala curl para comprobar API y Metro."
    require_command adb "Instala Android platform-tools o comprueba ANDROID_HOME."
    [[ "$api_port" =~ ^[0-9]+$ ]] || fail "API_PORT debe ser un número de puerto."
    [[ -f "$MONOREPO_DIR/scripts/dev-local.sh" ]] ||
      fail "No se encontró scripts/dev-local.sh en $MONOREPO_DIR. Define TURISMO_MONOREPO_DIR."
    [[ -f "$MONOREPO_DIR/apps/mobile/package.json" ]] || fail "No se encontró la app móvil."
    [[ -x "$MONOREPO_DIR/apps/mobile/node_modules/.bin/expo" ]] ||
      fail "Faltan dependencias móviles. Ejecuta corepack pnpm install en el monorepo."
    [[ -f "$MONOREPO_DIR/apps/mobile/.env" ]] ||
      fail "Falta apps/mobile/.env. Créalo desde apps/mobile/.env.example."
    [[ -d "$ANDROID_HOME" ]] || fail "No existe el Android SDK en $ANDROID_HOME."
    if ! native_project_is_development; then
      info "El proyecto Android se regenerará para la variante de desarrollo al iniciar."
    fi

    if ! podman compose version >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
      fail "Necesitas Podman Compose o Docker Compose para levantar PostgreSQL local."
    fi

    port_is_open "$api_port" && fail "El puerto $api_port ya está ocupado. Cierra la API anterior."
    port_is_open 8081 && fail "El puerto 8081 ya está ocupado. Cierra Metro anterior."
    JAVA_HOME="$(java_17_home)" ||
      fail "No se encontró JDK 17. Instala OpenJDK 17 o define TURISMO_JAVA_HOME."
    export JAVA_HOME
    export TURISMO_MONOREPO_DIR="$(cd -- "$MONOREPO_DIR" && pwd)"
  elif [[ ! -x "$PROJECT_DIR/node_modules/.bin/next" ]]; then
    info "Las dependencias de la web se instalarán al iniciar."
  fi

  info "Entorno local comprobado."
}

run_and_hold() {
  local mode="$1"
  local status
  local user_shell="${SHELL:-/bin/bash}"
  shift

  set +e
  "$@"
  status=$?
  set -e

  if ((status == 0)); then
    info "$mode se detuvo."
  else
    printf '[Turismo Admin] %s terminó con código %s.\n' "$mode" "$status" >&2
  fi
  info "La terminal queda abierta para revisar el resultado."
  [[ -x "$user_shell" ]] || user_shell=/bin/bash
  exec "$user_shell" -l
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local elapsed=0

  info "Esperando $name..."
  while ((elapsed < 180)); do
    if curl -fsS --max-time 1 "$url" >/dev/null 2>&1; then
      info "$name listo."
      return 0
    fi
    sleep 1
    ((elapsed += 1))
  done

  printf '[Turismo Admin] %s no respondió después de 180 segundos.\n' "$name" >&2
  return 1
}

select_android_device() {
  local configured_serial="${ANDROID_SERIAL:-}"

  if [[ -n "$configured_serial" ]] &&
    adb -s "$configured_serial" get-state 2>/dev/null | grep -qx device; then
    printf '%s\n' "$configured_serial"
    return 0
  fi

  adb devices | awk 'NR > 1 && $2 == "device" { print $1; exit }'
}

expo_device_name() {
  local serial="$1"
  local name

  if [[ "$serial" == emulator-* ]]; then
    adb -s "$serial" emu avd name 2>/dev/null | head -n 1
    return
  fi

  name="$(adb devices -l | awk -v serial="$serial" '
    $1 == serial {
      for (i = 2; i <= NF; i++) {
        if ($i ~ /^model:/) {
          sub(/^model:/, "", $i)
          print $i
          exit
        }
      }
    }
  ')"
  printf '%s\n' "${name:-Device $serial}"
}

native_project_is_development() {
  local build_file="$MONOREPO_DIR/apps/mobile/android/app/build.gradle"
  [[ -f "$build_file" ]] &&
    grep -Fq "applicationId = 'ec.edu.ueb.turismovinculacion.software.dev'" "$build_file"
}

ensure_development_native_project() {
  local attempt
  native_project_is_development && return 0

  info "Regenerando el proyecto Android para Turismo Vinculación Dev..."
  corepack pnpm --filter @turismo/mobile exec expo prebuild \
    --platform android --clean --no-install || return 1
  native_project_is_development || {
    printf '[Turismo Admin] El proyecto Android no tiene el identificador de desarrollo.\n' >&2
    return 1
  }

  info "Resolviendo los plugins de Gradle antes de compilar..."
  for attempt in 1 2; do
    if (cd "$MONOREPO_DIR/apps/mobile/android" && ./gradlew help --quiet); then
      return 0
    fi
    if ((attempt == 1)); then
      info "Gradle no pudo resolver los plugins. Reintentando una vez..."
      sleep 3
    fi
  done

  printf '[Turismo Admin] Gradle no pudo preparar los plugins de Android.\n' >&2
  return 1
}

run_android() {
  local api_port="${API_PORT:-3000}"
  local device_serial=""
  local device_name

  wait_for_url "la API" "http://127.0.0.1:${api_port}/api/v1/health" || return 1
  wait_for_url "Metro" "http://127.0.0.1:8081/status" || return 1
  adb start-server >/dev/null || return 1
  info "Conecta y desbloquea el teléfono; acepta la autorización USB si aparece."

  until [[ -n "$device_serial" ]]; do
    device_serial="$(select_android_device)"
    [[ -n "$device_serial" ]] || sleep 2
  done

  export ANDROID_SERIAL="$device_serial"
  export APP_VARIANT=development
  export EXPO_PUBLIC_API_URL="http://127.0.0.1:${api_port}/api/v1"
  export EXPO_PACKAGER_PROXY_URL=http://127.0.0.1:8081
  export NODE_OPTIONS="${NODE_OPTIONS:+${NODE_OPTIONS} }--dns-result-order=ipv4first"
  info "Dispositivo Android listo: $device_serial"
  adb -s "$device_serial" reverse "tcp:${api_port}" "tcp:${api_port}" || return 1
  adb -s "$device_serial" reverse tcp:8081 tcp:8081 || return 1
  device_name="$(expo_device_name "$device_serial")"
  [[ -n "$device_name" ]] || {
    printf '[Turismo Admin] No se pudo obtener el nombre Expo del dispositivo.\n' >&2
    return 1
  }

  cd -- "${TURISMO_MONOREPO_DIR:-$MONOREPO_DIR}"
  ensure_development_native_project || return 1
  info "Compilando e instalando Turismo Vinculación Dev..."
  corepack pnpm --filter @turismo/mobile exec expo run:android \
    --device "$device_name" --variant debug --no-bundler
}

run_mode() {
  local mode="$1"

  case "$mode" in
    stack)
      cd -- "${TURISMO_MONOREPO_DIR:-$MONOREPO_DIR}"
      export TURISMO_WEB_ROOT="$PROJECT_DIR"
      info "Iniciando PostgreSQL local, API y admin: http://localhost:3002/admin"
      run_and_hold "La API y el admin" corepack pnpm dev:local
      ;;
    metro)
      cd -- "${TURISMO_MONOREPO_DIR:-$MONOREPO_DIR}"
      export APP_VARIANT=development
      export EXPO_PUBLIC_API_URL="http://127.0.0.1:${API_PORT:-3000}/api/v1"
      export NODE_OPTIONS="${NODE_OPTIONS:+${NODE_OPTIONS} }--dns-result-order=ipv4first"
      info "Iniciando Metro para la app Android en http://localhost:8081"
      run_and_hold "Metro" corepack pnpm --filter @turismo/mobile exec expo start \
        --dev-client --localhost
      ;;
    android)
      run_and_hold "Android" run_android
      ;;
    web)
      cd -- "$PROJECT_DIR"
      if [[ ! -x node_modules/.bin/next ]]; then
        info "Instalando dependencias de la web..."
        bun install --frozen-lockfile
      fi
      info "Iniciando web. Admin: http://localhost:3002/admin"
      run_and_hold "La web" bun run dev
      ;;
  esac
}

write_kitty_session() {
  local quoted_project quoted_monorepo quoted_script
  printf -v quoted_project '%q' "$PROJECT_DIR"
  printf -v quoted_monorepo '%q' "$TURISMO_MONOREPO_DIR"
  printf -v quoted_script '%q' "$SCRIPT_PATH"

  umask 077
  SESSION_FILE="$(mktemp "${XDG_RUNTIME_DIR:-${TMPDIR:-/tmp}}/turismo-local-${UID}.XXXXXX.kitty-session")"
  cat >"$SESSION_FILE" <<EOF
os_window_title Turismo Vinculación local
layout stack
cd $quoted_project
launch --title API-y-Admin $quoted_script __run stack

new_tab Metro
cd $quoted_monorepo
launch --title Metro $quoted_script __run metro

new_tab Android
cd $quoted_monorepo
launch --title Android $quoted_script __run android

focus_tab 2
EOF
}

launch() {
  local mode="$1"
  preflight "$mode"

  if [[ "$mode" == full ]]; then
    write_kitty_session
    kitty --detach --class turismo-local --name turismo-local --session "$SESSION_FILE"
    info "Kitty abierto con API, admin, Metro y Android. Admin: http://localhost:3002/admin"
  else
    kitty --detach --class turismo-local --name turismo-local \
      --directory "$PROJECT_DIR" "$SCRIPT_PATH" __run web
    info "Kitty abierto. Admin: http://localhost:3002/admin"
  fi
  info "Cierra la ventana para detener todo; Ctrl+C detiene solo la pestaña activa."
}

case "${1:-}" in
  "")
    launch full
    ;;
  --web-only)
    [[ $# -eq 1 ]] || fail "Opción desconocida: ${2:-}"
    launch web
    ;;
  --check)
    case "${2:-}" in
      "") preflight full ;;
      --web-only) [[ $# -eq 2 ]] || fail "Opción desconocida: ${3:-}"; preflight web ;;
      *) fail "Opción desconocida: $2" ;;
    esac
    ;;
  --help|-h)
    usage
    ;;
  __run)
    case "${2:-}" in
      stack|metro|android|web) run_mode "$2" ;;
      *) fail "Modo interno desconocido: ${2:-vacío}" ;;
    esac
    ;;
  *)
    usage >&2
    fail "Opción desconocida: $1"
    ;;
esac
