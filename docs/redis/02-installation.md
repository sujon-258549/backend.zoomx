# 2. Redis Installation

এই doc এ Redis install এবং run করার সব way cover করা হয়েছে — local development থেকে production পর্যন্ত।

---

## 📦 Step 1: NPM Package Install

আমাদের project এ **`ioredis`** client use করছি (native `redis` package এর চেয়ে better TypeScript support এবং feature সমৃদ্ধ)।

```bash
cd c:/project/zoomit/server.thezoomit
npm install ioredis
```

> ✅ **Note:** ioredis এর নিজস্ব TypeScript types built-in আছে, তাই আলাদা `@types/ioredis` install করতে হবে না।

Install হওয়ার পর `package.json` এ এভাবে দেখাবে:

```json
{
  "dependencies": {
    "ioredis": "^5.x.x"
  }
}
```

---

## 🖥️ Step 2: Local এ Redis Server Setup

Redis server আপনার machine এ চলতে হবে। তিনটা option আছে:

### Option A: Docker (সবচেয়ে recommended) 🐳

সবচেয়ে সহজ এবং cross-platform:

```bash
docker run -d --name zoomit-redis -p 6379:6379 redis:alpine
```

**Command explain:**
- `-d` → background এ run
- `--name zoomit-redis` → container এর নাম
- `-p 6379:6379` → host এর 6379 port container এর 6379 port এ map
- `redis:alpine` → lightweight Redis image

**Container manage করার commands:**

```bash
# Container চলছে কিনা check
docker ps

# Log দেখতে
docker logs zoomit-redis

# Stop
docker stop zoomit-redis

# আবার start
docker start zoomit-redis

# Remove
docker rm -f zoomit-redis
```

**Data persistent রাখতে (recommended):**

```bash
docker run -d --name zoomit-redis \
  -p 6379:6379 \
  -v zoomit-redis-data:/data \
  redis:alpine redis-server --appendonly yes
```

---

### Option B: Windows এ Native Install

Windows এ native Redis official না, কিন্তু কিছু option আছে:

**1. Memurai (Redis-compatible for Windows):**
- Download: https://www.memurai.com/get-memurai
- Install করলে Windows Service হিসেবে auto-start হয়।

**2. WSL2 (Windows Subsystem for Linux):**

```bash
# WSL এ Ubuntu terminal এ
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

---

### Option C: Linux/Mac Native Install

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis  # boot এ auto-start
```

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

---

## ✅ Step 3: Redis Server Verify করা

Install হওয়ার পর check করুন Redis চলছে কিনা:

```bash
# CLI দিয়ে ping test
redis-cli ping
```

Response আসবে:
```
PONG
```

**Docker container এর ভিতর check:**
```bash
docker exec -it zoomit-redis redis-cli ping
```

---

## 🌐 Step 4: Production এ Redis

Production এ কয়েকটা option:

### 1. **Redis Cloud** (Managed, সবচেয়ে সহজ)
- https://redis.com/try-free/
- Free tier: 30MB
- Auto backup, monitoring, scaling সব managed

### 2. **Upstash** (Serverless Redis, pay-per-request)
- https://upstash.com/
- Free tier: 10,000 commands/day
- Vercel/serverless এর জন্য ideal

### 3. **AWS ElastiCache**
- AWS infrastructure এ থাকলে best fit

### 4. **DigitalOcean Managed Redis**
- Simple pricing, VPS এর সাথে integrate easy

### 5. **Self-hosted (VPS এ install)**
- Full control, কিন্তু maintenance আপনাকেই করতে হবে।

---

## 🔐 Step 5: Environment Variable Setup

`.env` file এ Redis URL add করুন:

### Local development:

```env
# .env
REDIS_URL=redis://localhost:6379
```

### Production:

```env
# .env.production
REDIS_URL=redis://:your_password@your-redis-host.com:6379
```

**Redis Cloud/Upstash এর URL format:**

```env
REDIS_URL=redis://default:PASSWORD@HOST:PORT
# অথবা TLS সহ:
REDIS_URL=rediss://default:PASSWORD@HOST:PORT
```

> ⚠️ **Important:** `.env` file **কখনো** git এ commit করবেন না। `.gitignore` এ থাকা must।

---

## 📖 Next Step

Redis install হয়ে গেছে? এখন project এ setup করার জন্য → [03-setup.md](./03-setup.md)
