#!/data/data/com.termux/files/usr/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# --- CONFIGURATION ---
# Replace the placeholder text below with your actual Cloudflare Tunnel Token
TOKEN="eyJhIjoiZDY4MWIxYjIwZTI1YzI1ZmFmNDQ3ZTBhNDJmNDk3YjAiLCJ0IjoiYzA5OWQxZTEtOGNhNy00NDI0LWE4ZmItNzlmODA5NjRiNDcxIiwicyI6IlkyTmlPVGRpTnprdE5XVTNaaTAwT1RjMkxUbGhOamN0WkdKbU0yTm1NemhoWWpOayJ9"
# ---------------------

# Verify that the user updated the token placeholder
if [ "$TOKEN" = "YOUR_CLOUDFLARE_TUNNEL_TOKEN_HERE" ]; then
  echo "❌ Error: You must replace 'YOUR_CLOUDFLARE_TUNNEL_TOKEN_HERE' with your real token inside the script."
  exit 1
fi

echo "🔄 Updating package lists..."
#apt-get update

echo "🔍 Detecting architecture..."
ARCH=$(uname -m)

case "$ARCH" in
  x86_64)
    FILE="cloudflared-linux-amd64"
    ;;
  aarch64)
    FILE="cloudflared-linux-arm64"
    ;;
  armv7l)
    FILE="cloudflared-linux-arm"
    ;;
  *)
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

echo "📥 Downloading cloudflared ($FILE)..."
wget -q --show-progress https://github.com/cloudflare/cloudflared/releases/latest/download/$FILE -O cloudflared

echo "🔐 Installing binary..."
chmod +x cloudflared
mv cloudflared /usr/local/bin/

echo "✅ Installed version:"
cloudflared --version

echo "📁 Creating systemd service..."
SERVICE_FILE="/etc/systemd/system/cloudflared.service"

sudo bash -c "cat > $SERVICE_FILE" <<EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel run --token $TOKEN
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "🔄 Reloading systemd..."
systemctl daemon-reexec
systemctl daemon-reload

echo "🚀 Enabling and starting service..."
systemctl enable cloudflared
systemctl restart cloudflared

echo "✅ Cloudflare Tunnel is now running!"

echo ""
echo "📊 Useful commands:"
echo "➡️  Check status:   sudo systemctl status cloudflared"
echo "➡️  View logs:     journalctl -u cloudflared -f"
