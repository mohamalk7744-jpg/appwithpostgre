
// Preconfigured storage helpers for Manus WebDev templates
// Supports Railway Storage and other storage backends

import { ENV } from "./_core/env";
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  // إذا كانت الإعدادات فارغة، نستخدم إعدادات افتراضية لـ Railway
  if (!baseUrl || !apiKey || baseUrl === 'https://storage.railway.com') {
    return { 
      baseUrl: "https://storage.railway.com/v1/storage", 
      apiKey: ENV.storageType === 'railway' ? 'railway-storage' : 'default-key' 
    };
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(baseUrl: string, relKey: string, apiKey: string): Promise<string> {
  const downloadApiUrl = new URL("v1/storage/downloadUrl", ensureTrailingSlash(baseUrl));
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string,
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

// تخزين محلي كاحتياطي
async function saveLocally(relKey: string, data: Buffer): Promise<{ key: string; url: string }> {
  // Fix: Cast process to any to access cwd()
  const uploadDir = path.resolve((process as any).cwd(), ENV.uploadDir || './uploads');
  
  // إنشاء المجلد إذا لم يكن موجوداً
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const key = normalizeKey(relKey);
  const filePath = path.join(uploadDir, key);
  const fileDir = path.dirname(filePath);
  
  // إنشاء المجلدات الفرعية إذا لزم الأمر
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, data);
  
  // إرجاع URL محلي كامل
  const host = process.env.SERVER_URL || 'http://localhost:3000';
  return { 
    key, 
    url: `${host}/uploads/${key}` 
  };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  try {
    const { baseUrl, apiKey } = getStorageConfig();
    const key = normalizeKey(relKey);
    const uploadUrl = buildUploadUrl(baseUrl, key);
    const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
    
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: buildAuthHeaders(apiKey),
      body: formData,
    });

    if (!response.ok) {
      // إذا فشل التخزين السحابي، نستخدم التخزين المحلي
      console.log("Cloud storage failed, using local storage...");
      return saveLocally(relKey, Buffer.from(data));
    }
    
    const url = (await response.json()).url;
    return { key, url };
  } catch (error) {
    // في حالة أي خطأ، نستخدم التخزين المحلي كاحتياطي
    console.log("Storage error, using local storage as fallback...");
    return saveLocally(relKey, Buffer.from(data));
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  try {
    const { baseUrl, apiKey } = getStorageConfig();
    const key = normalizeKey(relKey);
    
    // محاولة الحصول على URL من التخزين السحابي
    const url = await buildDownloadUrl(baseUrl, key, apiKey);
    return { key, url };
  } catch (error) {
    // إذا فشل، نستخدم التخزين المحلي
    const key = normalizeKey(relKey);
    const host = process.env.SERVER_URL || 'http://localhost:3000';
    return { 
      key, 
      url: `${host}/uploads/${key}` 
    };
  }
}
