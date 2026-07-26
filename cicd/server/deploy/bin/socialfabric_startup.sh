#source ~/.bashrc

cd /home/gaurav/social-fabric/social_fabric_api
sudo docker compose down
sudo docker compose up -d db redis
sudo docker ps

lsof -ti:8081 -sTCP:LISTEN | xargs -r kill -9 || true; lsof -ti:8082 -sTCP:LISTEN | xargs -r kill -9 || true; lsof -ti:3000 -sTCP:LISTEN | xargs -r kill -9 || true; echo "Ports 8081 and 8082 and 3000 are free"

cd /home/gaurav/Desktop/socialfabric
GOOGLE_OAUTH_CLIENT_ID=$GOOGLE_OAUTH_CLIENT_ID GOOGLE_OAUTH_CLIENT_SECRET=$GOOGLE_OAUTH_CLIENT_SECRET GOOGLE_OAUTH_CALLBACK_URL=$GOOGLE_OAUTH_CALLBACK_URL PORT=3000 DATABASE_URL="postgres://postgres:postgres@localhost:5432/social_fabric_db" pnpm --filter @workspace/api-server run dev > cicd/server/deploy/logs/server.log 2>&1 &

pnpm --filter @workspace/mobile exec expo start -c
