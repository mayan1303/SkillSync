#!/usr/bin/env bash
# One-command launcher for the Workforce Intelligence app.  Usage:  bash start.sh
cd "$(dirname "$0")" || exit 1
say(){ printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
for c in docker java mvn node npm curl lsof; do command -v "$c" >/dev/null || { echo "Missing tool: $c"; exit 1; }; done
docker info >/dev/null 2>&1 || { echo "Docker isn't running. Open Docker Desktop, wait until it's ready, then run this again."; exit 1; }

say "Preparing secrets and AI key"
[ -f .secrets ] || { echo "JWT_SECRET=$(openssl rand -hex 32)" > .secrets; echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)" >> .secrets; }
set -a; . ./.secrets; set +a
KEY="${GEMINI_API_KEY:-}"; [ -z "$KEY" ] && [ -f .ai-key ] && KEY="$(cat .ai-key)"
if [ -z "$KEY" ]; then
  read -r -p "Paste your free Gemini API key (aistudio.google.com/app/apikey) or press Enter to skip AI: " KEY
  [ -n "$KEY" ] && echo "$KEY" > .ai-key
fi
[ -f .bot-url ] && export CUSTOM_BOT_URL="$(cat .bot-url)"
export GEMINI_API_KEY="$KEY" MONGODB_URI=mongodb://localhost:27018/wie_ds SEED_DEMO=true

say "Starting MongoDB (own container: wie-mongo on port 27018)"
docker start wie-mongo >/dev/null 2>&1 || docker run -d --name wie-mongo -p 27018:27017 mongo >/dev/null || { echo "Could not start MongoDB"; exit 1; }

say "Freeing ports 8080 and 5174"
for p in 8080 5174; do lsof -ti :$p | xargs kill 2>/dev/null; done; sleep 1
cleanup(){ say "Stopping app"; for p in 8080 5174; do lsof -ti :$p | xargs kill 2>/dev/null; done; }
trap cleanup EXIT INT TERM

say "Starting backend (first run downloads dependencies, can take a few minutes)"
( cd backend && mvn -q clean spring-boot:run > ../backend.log 2>&1 ) &
say "Starting frontend"
( cd frontend && npm install --silent > ../frontend.log 2>&1 && npm run dev >> ../frontend.log 2>&1 ) &

up=0; for i in $(seq 1 150); do curl -s -o /dev/null http://localhost:8080/api/auth/me && { up=1; break; }; sleep 2; done
[ $up = 1 ] || { echo "Backend did not start. Last log lines:"; tail -30 backend.log; exit 1; }
up=0; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:5174 && { up=1; break; }; sleep 2; done
[ $up = 1 ] || { echo "Frontend did not start. Last log lines:"; tail -30 frontend.log; exit 1; }

say "Ready: http://localhost:5174"
echo "Demo logins (password Demo@12345): riya@demo.com | aryan@demo.com | recruiter@demo.com | agency@demo.com"
[ -z "$GEMINI_API_KEY" ] && echo "AI key skipped: chatbot and custom-skill assessments are off. Delete nothing, just run again and paste a key."
open http://localhost:5174 2>/dev/null
echo "Press Ctrl+C here to stop everything. Logs: backend.log, frontend.log"
wait
