# 9. Module Integrations

কোন কোন module এ Redis cache add করা হয়েছে, key structure এবং invalidation strategy — সব একসাথে documented।

---

## ✅ Currently Integrated Modules

| Module | Path | Cache File |
|--------|------|-----------|
| Blog | [src/app/modules/blog/](../../src/app/modules/blog/) | [blog.cache.ts](../../src/app/modules/blog/blog.cache.ts) |
| DynamicContent | [src/app/modules/dynamicContent/](../../src/app/modules/dynamicContent/) | [dynamicContent.cache.ts](../../src/app/modules/dynamicContent/dynamicContent.cache.ts) |
| Case Study | [src/app/modules/case-study/](../../src/app/modules/case-study/) | [case-study.cache.ts](../../src/app/modules/case-study/case-study.cache.ts) |
| Review | [src/app/modules/review/](../../src/app/modules/review/) | [review.cache.ts](../../src/app/modules/review/review.cache.ts) |
| Country | [src/app/modules/country/](../../src/app/modules/country/) | [country.cache.ts](../../src/app/modules/country/country.cache.ts) |
| Media Library | [src/app/modules/media-library/](../../src/app/modules/media-library/) | [media-library.cache.ts](../../src/app/modules/media-library/media-library.cache.ts) |

প্রতিটা module এ same pattern follow করা হয়েছে:

- **`<module>.cache.ts`** file — TTL constants, key builders, invalidation helper একসাথে
- **Read endpoint** — `withCache()` wrap
- **Write endpoint** (create/update/delete) — শেষে `invalidate<Module>Cache()` call

---

## 📰 Blog Module

### Cache TTLs

| Data | TTL | Reason |
|------|-----|--------|
| Single blog | 10 min | Content rarely changes after publish |
| List/Category/Author list | 3 min | New blog publish হলে দ্রুত দেখাবে |
| Category aggregation | 15 min | Aggregation expensive, change slow |
| Author aggregation | 15 min | Same |

### Key Structure

```
blog:slug:<slug>
blog:list:<queryHash>
blog:cat:<category>:<queryHash>
blog:author:<username>:<queryHash>
blog:categories:all
blog:authors:all
```

### Cached Read Endpoints

- `getAllBlogs()` → `blog:list:*`
- `getSingleBlog(slug)` → `blog:slug:<slug>`
- `getCategoryList()` → `blog:categories:all`
- `getBlogsByCategory(category)` → `blog:cat:*`
- `getBlogsByAuthor(username)` → `blog:author:*`
- `getAllAuthors()` → `blog:authors:all`

### Invalidation Triggers

সব write op এ `invalidateBlogCache(slug?)` call হয়:

- `createBlog()` → সব list + categories + authors clear
- `updateBlog()` → এই slug + list + categories + authors clear (slug change হলে দুই slug ই)
- `deleteBlog()` → same as update
- `updateStatus()` → same as update

---

## 🎨 DynamicContent Module

Frontend এর homepage banner, about page copy, hero section — এসব "editable" content এই module handle করে। Cache hit rate সবচেয়ে বেশি এখানে হবে (frequently read, rarely written)।

### Cache TTLs

| Data | TTL | Reason |
|------|-----|--------|
| Group content (public) | 15 min | Frontend heavy read, rare write |
| Content map | 15 min | Same |
| Admin list | 2 min | Admin panel এ freshness জরুরি |
| Content history | 5 min | Audit log, near-realtime না হলেও চলে |

### Key Structure

```
dc:group:<group>
dc:map:all
dc:map:group:<group>
dc:admin:list:<queryHash>
dc:history:<key>:<take>
```

### Cached Read Endpoints

- `getContentsByGroup(group)` → `dc:group:<group>`
- `getContentsMap(group?)` → `dc:map:all` বা `dc:map:group:<group>`
- `getAllContents(query)` → `dc:admin:list:*`
- `getContentHistory(key, take)` → `dc:history:<key>:<take>`

### Invalidation Triggers

- `upsertContent()` → `invalidateDynamicContentCache(key, group)` (both old + new group যদি group change হয়)
- `bulkUpsertContents()` → প্রতি item এ same
- `deleteContent()` → same
- `bulkDeleteContents()` → broad invalidation (group unknown across bulk)

---

## 🧪 Case Study Module

Portfolio / project showcase pages। SEO-heavy public page, তাই aggressive caching benefit বেশি।

### Cache TTLs

| Data | TTL | Reason |
|------|-----|--------|
| Single case study (admin) | 10 min | Full doc, less frequent write |
| Single case study (web) | 10 min | Public read, SEO critical |
| Web list | 5 min | Portfolio list, moderate change |
| Admin list | 2 min | Admin panel freshness |

### Key Structure

```
casestudy:slug:<slug>              ← admin single
casestudy:web:slug:<slug>          ← public single (published only)
casestudy:admin:list:<queryHash>
casestudy:web:list:<queryHash>
```

**Note:** Admin আর Web এর জন্য আলাদা key কারণ query filter (`status: true`, `is_deleted: { $ne: true }`) আলাদা।

### Cached Read Endpoints

- `getAllCaseStudy(params)` → admin list
- `getWebViewCaseStudy(params)` → public list
- `getSingleCaseStudy(slug)` → admin single
- `getWebViewSingleCaseStudy(slug)` → public single

### Invalidation Triggers

- `createCaseStudy()` → invalidate everything for that slug + all lists
- `updateSingleCaseStudy()` → old slug + new slug
- `updateCaseStudySerial()` → this slug + all lists
- `deleteCaseStudy()` → same

---

---

## ⭐ Review Module

Customer testimonials/reviews। Public site এ published list frequently read।

### Cache TTLs

| Data | TTL | Reason |
|------|-----|--------|
| Single review | 10 min | Content rarely changes |
| Admin list | 3 min | Admin panel freshness |
| Published list (public) | 10 min | Frontend heavy read |

### Key Structure

```
review:id:<id>
review:list:<queryHash>
review:published:all
```

### Cached Read Endpoints

- `getAllReviews(query)` → admin list
- `getPublishedReviews()` → public published
- `getReviewById(id)` → single

### Invalidation Triggers

সব write op এ instant invalidation:

- `createReview()` → list + published clear
- `updateReview(id)` → id + list + published clear
- `deleteReview(id)` → same

---

## 🌍 Country Module

Country data with drag-drop serial ordering। Serial change এ multiple docs shift হয়।

### Cache TTLs

| Data | TTL | Reason |
|------|-----|--------|
| Single country | 15 min | Country data change খুব rare |
| List | 10 min | Same |

### Key Structure

```
country:id:<id>
country:list:<queryHash>
```

### Cached Read Endpoints

- `getAllCountries(params)` → paginated list
- `getCountryById(id)` → single

### Invalidation Triggers

- `createCountry()` → list clear
- `updateCountry(id)` → id + list
- `deleteCountry(id)` → id + list (serial shift এ list caches ই দরকার)
- `toggleCountryStatus(id)` → id + list
- `updateCountrySerial(id)` → id + list (multiple docs shift, but list cache clear ই যথেষ্ট)

---

---

## 🖼️ Media Library Module

Uploaded files (image/video/audio/document) list করে filesystem থেকে। প্রতি image এ `imageSize` call হয় dimensions বের করতে — সেটা expensive। Caching এ বিশাল benefit।

### Cache TTLs

| Data | TTL | Reason |
|------|-----|--------|
| List | 5 min | Upload/delete/rename এ invalidate হয়, তাছাড়া stable |

### Key Structure

```
media:list:<queryHash>
```

### Cached Read Endpoints

- `getAllMedia(query)` → paginated list with search/type filter

### Why এটা Especially Valuable

`getAllMedia` প্রতি request এ:
1. **Recursive directory scan** — সব file collect করা
2. **`fs.stat`** — প্রতি file এর জন্য
3. **`imageSize`** — প্রতি image file পুরো read করে dimension calculate

Cache hit এ এই সব skip হয়। 20-50 images এর folder এ **500ms → 3ms** speed improvement।

### Invalidation Triggers

সব write op এ instant invalidation:

- `uploadMedia()` → নতুন file add হলে
- `deleteMedia()` → file remove হলে
- `renameMedia()` → filename change হলে

---

## 🔧 Shared Utilities

সব cache file এ same shape:

```typescript
// module.cache.ts এর pattern
export const XXX_CACHE = { /* TTL constants */ } as const;
export const XXX_KEYS = { /* key builders */ } as const;
export const hashQuery = (obj) => /* stable string from query params */;
export const invalidateXxxCache = async (id?) => { /* delByPattern + delKey */ };
```

Redis client এবং helpers → [src/app/shared/redis.ts](../../src/app/shared/redis.ts):

- `redis` — default export (Redis instance)
- `setJson(key, value, ttl?)` — safe JSON set (error swallowed)
- `getJson<T>(key)` — safe JSON get (returns null on error)
- `delKey(...keys)` — safe multi-key delete
- `delByPattern(pattern)` — SCAN-based safe pattern delete
- `withCache({ key, ttl }, fetcher)` — cache-aside wrapper

---

## 🧪 Local Testing

Cache actually কাজ করছে কিনা verify করতে:

### 1. Redis MONITOR চালু করুন

```bash
redis-cli MONITOR
```

### 2. Endpoint hit করুন

```bash
# প্রথমবার — cache miss, MongoDB query হবে
curl http://localhost:5000/api/blog

# দ্বিতীয়বার — cache hit, MongoDB এ query যাবে না
curl http://localhost:5000/api/blog
```

MONITOR terminal এ দেখতে পাবেন:

```
"SET" "blog:list:...=..." "..." "EX" "180"   ← প্রথমবার (miss)
"GET" "blog:list:...=..."                     ← দ্বিতীয়বার (hit)
```

### 3. Write op এর পর invalidation verify

```bash
# Blog update
curl -X PATCH http://localhost:5000/api/blog/my-slug -d '{"title":"New"}'
```

MONITOR এ দেখবেন `SCAN` চলছে এবং matching keys delete হচ্ছে।

### 4. Manual key inspection

```bash
redis-cli

> KEYS blog:*      # dev এ ঠিক, production এ SCAN use করবেন
> GET blog:slug:my-blog
> TTL blog:slug:my-blog
> DEL blog:slug:my-blog     # manual invalidate
```

---

## 🚀 Adding Cache to a New Module

নতুন module এ cache add করার steps:

### Step 1: `<module>.cache.ts` বানান

```typescript
// src/app/modules/service/service.cache.ts
import { delByPattern, delKey } from "../../shared/redis";

export const SERVICE_CACHE = {
  SINGLE_TTL: 60 * 10,
  LIST_TTL: 60 * 5,
} as const;

export const SERVICE_KEYS = {
  single: (slug: string) => `service:slug:${slug}`,
  list: (queryHash: string) => `service:list:${queryHash}`,
} as const;

export const hashQuery = (obj: Record<string, unknown>): string => {
  const sorted = Object.keys(obj)
    .sort()
    .map((k) => `${k}=${String(obj[k] ?? "")}`)
    .join("&");
  return sorted || "default";
};

export const invalidateServiceCache = async (slug?: string) => {
  const tasks: Promise<unknown>[] = [delByPattern("service:list:*")];
  if (slug) tasks.push(delKey(SERVICE_KEYS.single(slug)));
  await Promise.all(tasks);
};
```

### Step 2: Service এ import + wrap

```typescript
import { withCache } from "../../shared/redis";
import { SERVICE_CACHE, SERVICE_KEYS, hashQuery, invalidateServiceCache } from "./service.cache";

const getSingleService = async (slug: string) => {
  const cached = await withCache(
    { key: SERVICE_KEYS.single(slug), ttl: SERVICE_CACHE.SINGLE_TTL },
    async () => Service.findOne({ slug })
  );
  if (!cached) throw new AppError(404, "Not found");
  return cached;
};

const updateService = async (slug: string, payload: any) => {
  const updated = await Service.findOneAndUpdate({ slug }, payload, { new: true });
  await invalidateServiceCache(slug);
  return updated;
};
```

### Step 3: এই doc এর table এ add করুন

---

## 📊 Expected Performance Gain

Real-world estimation (আমাদের existing endpoint অনুযায়ী):

| Endpoint | Before | After (cache hit) | Improvement |
|----------|--------|------------------|-------------|
| GET /api/blog (list) | 200-500ms | 3-8ms | ~50x |
| GET /api/blog/:slug | 80-150ms | 2-5ms | ~30x |
| GET /api/blog/categories | 500ms+ | 3-5ms | ~100x |
| GET /api/dynamic-content?group=home | 100-200ms | 2-5ms | ~40x |
| GET /api/case-study/:slug | 150-300ms | 3-8ms | ~40x |

**Cache hit rate target:** >80% on public read endpoints।

---

## 📖 Back to Index

সব doc → [README](../README.md)
