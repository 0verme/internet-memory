/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  RECORD_IMAGES: R2Bucket;
}
