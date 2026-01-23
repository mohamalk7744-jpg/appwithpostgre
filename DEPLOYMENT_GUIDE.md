# 📱 دليل نقل التطبيق وتشغيله محلياً والنشر

## 🎯 المحتويات
1. [نقل التطبيق إلى جهازك](#نقل-التطبيق)
2. [ربط السيرفر الخاص بك](#ربط-السيرفر)
3. [التشغيل المحلي](#التشغيل-المحلي)
4. [النشر والإطلاق](#النشر-والإطلاق)

---

## 🔄 نقل التطبيق

### الخطوة 1: تحميل ملفات المشروع

**من واجهة Manus:**
1. اذهب إلى لوحة التحكم → **Code**
2. اضغط على **Download all files**
3. استخرج الملفات في مجلد على جهازك

**أو باستخدام Git (إذا كان المشروع في مستودع):**
```bash
git clone <repository-url>
cd e_learning_mobile_app
```

### الخطوة 2: تثبيت المتطلبات

**تثبيت Node.js و npm:**
- اذهب إلى [nodejs.org](https://nodejs.org)
- حمّل النسخة LTS (Long Term Support)
- ثبّت البرنامج

**التحقق من التثبيت:**
```bash
node --version
npm --version
```

### الخطوة 3: تثبيت المكتبات

```bash
# انتقل إلى مجلد المشروع
cd e_learning_mobile_app

# ثبّت المكتبات
npm install
# أو
pnpm install
```

---

## 🔗 ربط السيرفر الخاص بك

### المعلومات المطلوبة

قبل البدء، تأكد من توفر:

| المعلومة | الوصف | مثال |
|---------|-------|------|
| **API Base URL** | عنوان السيرفر الخاص بك | `http://localhost:3000` أو `https://api.yourdomain.com` |
| **Database URL** | اتصال قاعدة البيانات | `sqlite:./data.db` أو `postgresql://...` |
| **Gemini API Key** | مفتاح Gemini للبوت الذكي | من Google AI Studio |
| **Firebase Config** | إعدادات Firebase (اختياري) | من Firebase Console |

### الخطوة 1: إنشاء ملف .env

في جذر المشروع، أنشئ ملف `.env.local`:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_TIMEOUT=30000

# Database (للسيرفر)
DATABASE_URL=mysql://3pnBLquRto1WXKY.d37829e399e0:FI98bw5a7h1Wbuy2ICbG@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/K2DGTyCZmMizpMnSyggEHE?ssl={"rejectUnauthorized":true}

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Firebase (اختياري)
FIREBASE_API_KEY=your-firebase-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Environment
NODE_ENV=development
```

### الخطوة 2: تحديث إعدادات API

**ملف: `lib/trpc.ts`**

```typescript
// تحديث عنوان السيرفر
export const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.184.5:3000';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
      fetch: async (input, init?) => {
        const fetch = getFetch();
        return fetch(input, {
          ...init,
          credentials: 'include',
        });
      },
    }),
  ],
});
```

### الخطوة 3: تحديث إعدادات السيرفر

**ملف: `server/index.ts`**

```typescript
// تحديث منفذ السيرفر
const PORT = process.env.PORT || 3000;

// تحديث قاعدة البيانات
const dbPath = process.env.DATABASE_URL || 'mysql://root:TVTdqyvaFYOsgPkSBFhtfoMJlSTLNhNl@shinkansen.proxy.rlwy.net:38178/railway';

// تحديث مفتاح Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
```

---

## 🚀 التشغيل المحلي

### الطريقة 1: تشغيل الكل معاً

```bash
# من جذر المشروع
npm run dev

# أو إذا كنت تستخدم pnpm
pnpm dev
```

هذا سيشغل:
- ✅ السيرفر على `http://localhost:3000`
- ✅ تطبيق الويب على `http://localhost:8081`

### الطريقة 2: تشغيل منفصل

**تشغيل السيرفر فقط:**
```bash
npm run dev:server
# أو
pnpm dev:server
```

**تشغيل التطبيق فقط:**
```bash
npm run dev:metro
# أو
pnpm dev:metro
```

### الطريقة 3: تشغيل على جهاز فعلي

#### على iOS (Mac فقط):
```bash
# تثبيت Expo Go من App Store
# ثم اسح رمز QR من الطرفية

npm run dev
# سيظهر رمز QR - اسحه بكاميرا جهازك
```

#### على Android:
```bash
# تثبيت Expo Go من Google Play
# ثم اسح رمز QR من الطرفية

npm run dev
# سيظهر رمز QR - اسحه بكاميرا جهازك
```

#### على الويب:
```bash
# افتح المتصفح على
http://localhost:8081
```

---

## 📊 إعدادات قاعدة البيانات

### SQLite (الافتراضي - للتطوير المحلي)

```bash
# لا تحتاج إلى تثبيت إضافي
# الملف يُنشأ تلقائياً: ./data.db
```

### PostgreSQL (للإنتاج)

**التثبيت:**
```bash
# على macOS
brew install postgresql

# على Windows
# حمّل من https://www.postgresql.org/download/windows/

# على Linux
sudo apt-get install postgresql
```

**الاتصال:**
```bash
# ملف .env
DATABASE_URL=postgresql://username:password@localhost:5432/elearning_db

# أو مع SSL
DATABASE_URL=postgresql://username:password@host:5432/db?sslmode=require
```

### MySQL (بديل)

```bash
# ملف .env
DATABASE_URL=mysql://username:password@localhost:3306/elearning_db
```

---

## 🌐 النشر والإطلاق

### الخيار 1: نشر على Expo (الأسهل)

```bash
# تثبيت Expo CLI
npm install -g eas-cli

# تسجيل الدخول
eas login

# بناء التطبيق
eas build --platform ios
eas build --platform android

# النشر على App Store و Google Play
eas submit --platform ios
eas submit --platform android
```

### الخيار 2: نشر السيرفر على Heroku

```bash
# تثبيت Heroku CLI
# من https://devcenter.heroku.com/articles/heroku-cli

# تسجيل الدخول
heroku login

# إنشاء تطبيق
heroku create your-app-name

# ضبط متغيرات البيئة
heroku config:set GEMINI_API_KEY=your-key
heroku config:set DATABASE_URL=postgresql://...

# النشر
git push heroku main
```

### الخيار 3: نشر على DigitalOcean / AWS / Google Cloud

#### DigitalOcean (الموصى به):

```bash
# 1. أنشئ Droplet بـ Ubuntu 22.04

# 2. اتصل بـ SSH
ssh root@your_droplet_ip

# 3. ثبّت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. ثبّت PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# 5. استنسخ المشروع
git clone your-repo-url
cd e_learning_mobile_app

# 6. ثبّت المكتبات
npm install

# 7. أنشئ ملف .env
nano .env.local

# 8. شغّل باستخدام PM2
npm install -g pm2
pm2 start "npm run dev:server" --name "elearning-api"
pm2 save
pm2 startup

# 9. استخدم Nginx كـ reverse proxy
sudo apt-get install -y nginx
# ثم اضبط الإعدادات
```

**إعدادات Nginx:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### الخيار 4: نشر على Docker

**ملف: `Dockerfile`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000 8081

CMD ["npm", "run", "dev"]
```

**بناء وتشغيل:**
```bash
docker build -t elearning-app .
docker run -p 3000:3000 -p 8081:8081 elearning-app
```

---

## 📋 قائمة التحقق قبل النشر

- [ ] تم تحديث `EXPO_PUBLIC_API_URL` بعنوان السيرفر الفعلي
- [ ] تم إضافة مفتاح Gemini API
- [ ] تم اختبار التطبيق محلياً على iOS و Android و Web
- [ ] تم التحقق من جميع الأزرار والميزات
- [ ] تم تحديث `app.config.ts` باسم التطبيق والشعار
- [ ] تم إنشاء حساب على App Store و Google Play
- [ ] تم إعداد شهادات SSL للسيرفر
- [ ] تم عمل نسخة احتياطية من قاعدة البيانات

---

## 🔐 نصائح الأمان

### 1. استخدام متغيرات البيئة
```bash
# لا تضع المفاتيح مباشرة في الكود
# استخدم .env.local ولا تنشره على GitHub
```

### 2. إضافة .gitignore
```bash
.env.local
.env*.local
node_modules/
data.db
dist/
build/
```

### 3. تفعيل HTTPS
```bash
# استخدم Let's Encrypt للحصول على شهادة مجانية
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d api.yourdomain.com
```

### 4. حماية API
```typescript
// أضف معدل تحديد الطلبات (Rate Limiting)
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // 100 طلب لكل IP
});

app.use('/trpc', limiter);
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا يمكن الاتصال بالسيرفر

```bash
# تحقق من أن السيرفر يعمل
curl http://localhost:3000

# تحقق من عنوان API في .env
echo $EXPO_PUBLIC_API_URL

# تحقق من جدار الحماية
sudo ufw allow 3000
```

### المشكلة: خطأ في قاعدة البيانات

```bash
# أعد تهيئة قاعدة البيانات
rm data.db
npm run dev:server

# تحقق من صلاحيات الملفات
chmod 644 data.db
```

### المشكلة: Gemini API لا يعمل

```bash
# تحقق من المفتاح
echo $GEMINI_API_KEY

# اختبر الاتصال
curl -X POST https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=$GEMINI_API_KEY
```

---

## 📞 الدعم والمساعدة

- **توثيق Expo**: https://docs.expo.dev
- **توثيق React Native**: https://reactnative.dev
- **توثيق tRPC**: https://trpc.io
- **توثيق Drizzle ORM**: https://orm.drizzle.team

---

**آخر تحديث:** يناير 2026
**الإصدار:** 1.0.0
