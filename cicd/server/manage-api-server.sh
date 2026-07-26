#!/usr/bin/env bash
set -euo pipefail

container_name="socialfabric-api"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
compose_file="$repo_root/artifacts/api-server/docker-compose.yml"
pid_file="$script_dir/socialfabric-api.pid"
log_file="$script_dir/socialfabric-api.log"

show_help() {
  echo "Usage: $0 [start|stop|restart|status|enable|disable]"
  echo ""
  echo "Commands:"
  echo "  start      Start the API server container"
  echo "  stop       Gracefully stop the API server container"
  echo "  restart    Restart the API server container"
  echo "  status     Show container status"
  echo "  enable     Start the container on boot (via docker compose up -d)"
  echo "  disable    Stop and remove the container"
}

ensure_compose() {
  if [ ! -f "$compose_file" ]; then
    echo "Compose file not found: $compose_file"
    exit 1
  fi
}

case "${1:-status}" in
  start)
    if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" >/dev/null 2>&1; then
      echo "Server already running (pid $(cat "$pid_file"))"
      exit 0
    fi

    echo "Running local pre-deploy steps: docker compose and port cleanup"
    #sudo docker compose down || true
    #sudo docker compose up -d db redis || true
    #sudo docker ps || true

    # Free common dev ports if in use
    lsof -ti:8081 -sTCP:LISTEN | xargs -r kill -9 || true
    lsof -ti:8082 -sTCP:LISTEN | xargs -r kill -9 || true
    lsof -ti:3000 -sTCP:LISTEN | xargs -r kill -9 || true
    echo "Ports 8081 and 8082 and 3000 are free"

    echo "Starting API server in background, logs: $log_file"
    cd "$repo_root"
    nohup \
      GOOGLE_OAUTH_CLIENT_ID="$GOOGLE_OAUTH_CLIENT_ID" \
      GOOGLE_OAUTH_CLIENT_SECRET="$GOOGLE_OAUTH_CLIENT_SECRET" \
      GOOGLE_OAUTH_CALLBACK_URL="$GOOGLE_OAUTH_CALLBACK_URL" \
      PORT=3000 \
      DATABASE_URL="postgres://postgres:postgres@localhost:5432/social_fabric" \
      pnpm --filter @workspace/api-server run dev > "$log_file" 2>&1 &
    echo $! > "$pid_file"
    echo "Started (pid $(cat "$pid_file"))"
    ;;
  stop)
    if [ ! -f "$pid_file" ]; then
      echo "No pid file found; nothing to stop"
      exit 0
    fi
    pid=$(cat "$pid_file")
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      echo "Process $pid not running; removing pid file"
      rm -f "$pid_file"
      exit 0
    fi
    echo "Stopping process $pid"
    kill "$pid"
    # wait up to 10s
    for i in {1..10}; do
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done
    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "Process did not exit; sending SIGKILL"
      kill -9 "$pid" || true
    fi
    rm -f "$pid_file"
    echo "Stopped"
    ;;
  restart)
    "$0" stop
    sleep 1
    "$0" start
    ;;
  status)
    if [ -f "$pid_file" ]; then
      pid=$(cat "$pid_file")
      if kill -0 "$pid" >/dev/null 2>&1; then
        echo "Running (pid $pid)"
        echo "Logs (last 20 lines):"
        tail -n 20 "$log_file" 2>/dev/null || true
        exit 0
      else
        echo "Stale pid file (pid $pid not running)"
        exit 1
      fi
    else
      echo "No running server managed by this script"
      exit 1
    fi
    ;;
  enable)
    ensure_compose
    docker compose -f "$compose_file" up -d "$container_name"
    ;;
  disable)
    ensure_compose
    docker compose -f "$compose_file" down "$container_name" || true
    ;;
  help|-h|--help)
    show_help
    ;;
  *)
    show_help
    exit 1
    ;;
esac
