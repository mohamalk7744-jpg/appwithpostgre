# 📋 قائمة إعدادات التطبيق الكاملة

## 🎯 المعلومات المطلوبة

### 1️⃣ معلومات API والسيرفر

| المعلومة | القيمة الحالية | القيمة الجديدة |
|---------|----------------|----------------|
| **API Base URL** | `http://localhost:3000` | _________________ |
| **API Timeout** | `30000` ms | _________________ |
| **Database Type** | SQLite | _________________ |
| **Database URL** | `sqlite:./data.db` | _________________ |

### 2️⃣ مفاتيح الخدمات الخارجية

| الخدمة | المفتاح | الحالة |
|-------|--------|--------|
| **Gemini API** | _________________ | ⬜ مطلوب |
| **Firebase** | _________________ | ⬜ اختياري |
| **Stripe** (للدفع) | _________________ | ⬜ اختياري |

### 3️⃣ معلومات النشر

| المنصة | المعلومات | الحالة |
|--------|----------|--------|
| **App Store** | Bundle ID: _________________ | ⬜ اختياري |
| **Google Play** | Package Name: _________________ | ⬜ اختياري |
| **Heroku** | App Name: _________________ | ⬜ اختياري |
| **DigitalOcean** | Droplet IP: _________________ | ⬜ اختياري |

---

## 🔑 الحصول على المفاتيح المطلوبة

### Gemini API Key (مطلوب للبوت الذكي)

**الخطوات:**
1. اذهب إلى [Google AI Studio](https://ai.google.dev)
2. اضغط **Get API Key**
3. اختر **Create API key in new project**
4. انسخ المفتاح

**الاستخدام:**
```env
GEMINI_API_KEY=AIzaSyD_your_key_here
```

---

### Firebase Config (اختياري - للإشعارات)

**الخطوات:**
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. أنشئ مشروع جديد
3. اختر **Web** كمنصة
4. انسخ الإعدادات

**الاستخدام:**
```env
FIREBASE_API_KEY=AIzaSyD_...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
```

---

### Stripe API Key (اختياري - للدفع)

**الخطوات:**
1. اذهب إلى [Stripe Dashboard](https://dashboard.stripe.com)
2. اذهب إلى **Developers** → **API Keys**
3. انسخ **Publishable Key** و **Secret Key**

**الاستخدام:**
```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🌐 خيارات النشر

### الخيار 1: Heroku (الأسهل والأسرع)

**المميزات:**
- ✅ مجاني (مع حدود)
- ✅ سهل التشغيل
- ✅ دعم PostgreSQL

**الخطوات:**
```bash
# 1. ثبّت Heroku CLI
# من https://devcenter.heroku.com/articles/heroku-cli

# 2. تسجيل الدخول
heroku login

# 3. إنشاء تطبيق
heroku create your-app-name

# 4. ضبط المتغيرات
heroku config:set GEMINI_API_KEY=your-key

# 5. النشر
git push heroku main

# 6. عرض السجلات
heroku logs --tail
```

**الرابط:**
```
https://your-app-name.herokuapp.com
```

---

### الخيار 2: DigitalOcean (الموصى به)

**المميزات:**
- ✅ $5/شهر
- ✅ أداء عالي
- ✅ تحكم كامل

**الخطوات:**

```bash
# 1. أنشئ حساب على https://digitalocean.com

# 2. أنشئ Droplet:
#    - اختر Ubuntu 22.04
#    - اختر $5/شهر
#    - اختر منطقة قريبة

# 3. اتصل بـ SSH
ssh root@your_droplet_ip

# 4. تحديث النظام
apt update && apt upgrade -y

# 5. ثبّت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash
apt-get install -y nodejs

# 6. ثبّت PostgreSQL
apt-get install -y postgresql postgresql-contrib

# 7. استنسخ المشروع
git clone your-repo-url
cd e_learning_mobile_app

# 8. ثبّت المكتبات
npm install

# 9. أنشئ `.env.local`
nano .env.local
# أضف المتغيرات

# 10. شغّل باستخدام PM2
npm install -g pm2
pm2 start "npm run dev:server" --name "elearning-api"
pm2 save
pm2 startup

# 11. ثبّت Nginx
apt-get install -y nginx

# 12. أنشئ إعدادات Nginx
nano /etc/nginx/sites-available/default
```

**إعدادات Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

**الرابط:**
```
http://your-droplet-ip:3000
أو
https://your-domain.com (بعد إعداد SSL)
```

---

### الخيار 3: AWS (الأقوى)

**المميزات:**
- ✅ مستوى مجاني
- ✅ قابل للتوسع
- ✅ موثوق جداً

**الخطوات:**
1. أنشئ حساب على [AWS](https://aws.amazon.com)
2. استخدم **EC2** لـ Droplet
3. استخدم **RDS** لـ Database
4. استخدم **S3** لـ File Storage

---

### الخيار 4: Docker

**الخطوات:**
```bash
# 1. ثبّت Docker من https://docker.com

# 2. بناء الصورة
docker build -t elearning-app .

# 3. تشغيل الحاوية
docker run -p 3000:3000 -p 8081:8081 \
  -e GEMINI_API_KEY=your-key \
  elearning-app

# 4. أو استخدم Docker Compose
docker-compose up
```

---

## 📱 نشر التطبيق على المتاجر

### App Store (iOS)

**المتطلبات:**
- حساب Apple Developer ($99/سنة)
- Mac أو Hackintosh
- Xcode

**الخطوات:**
```bash
# 1. ثبّت EAS CLI
npm install -g eas-cli

# 2. تسجيل الدخول
eas login

# 3. بناء التطبيق
eas build --platform ios

# 4. النشر
eas submit --platform ios
```

---

### Google Play (Android)

**المتطلبات:**
- حساب Google Play Developer ($25 لمرة واحدة)
- شهادة التوقيع

**الخطوات:**
```bash
# 1. ثبّت EAS CLI
npm install -g eas-cli

# 2. تسجيل الدخول
eas login

# 3. بناء التطبيق
eas build --platform android

# 4. النشر
eas submit --platform android
```

---

## 🗄️ إعدادات قاعدة البيانات

### SQLite (الافتراضي)

```env
DATABASE_URL=sqlite:./data.db
```

**المميزات:**
- ✅ سهل للتطوير
- ✅ لا يحتاج تثبيت
- ❌ ليس جيد للإنتاج

---

### PostgreSQL (الموصى به للإنتاج)

**التثبيت المحلي:**
```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql

# Windows
# من https://www.postgresql.org/download/windows/
```

**الاتصال:**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/elearning_db

# مع SSL (للإنتاج)
DATABASE_URL=postgresql://username:password@host:5432/db?sslmode=require
```

**إنشاء قاعدة البيانات:**
```bash
# تسجيل الدخول
psql -U postgres

# إنشاء مستخدم
CREATE USER elearning WITH PASSWORD 'your-password';

# إنشاء قاعدة البيانات
CREATE DATABASE elearning_db OWNER elearning;

# منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE elearning_db TO elearning;
```

---

### MySQL (بديل)

```env
DATABASE_URL=mysql://username:password@localhost:3306/elearning_db
```

---

## 🔐 نصائح الأمان

### 1. متغيرات البيئة
```bash
# لا تضع المفاتيح في الكود
# استخدم `.env.local` ولا تنشره
echo ".env.local" >> .gitignore
```

### 2. HTTPS
```bash
# استخدم Let's Encrypt (مجاني)
sudo apt-get install certbot
sudo certbot certonly --nginx -d api.yourdomain.com
```

### 3. معدل تحديد الطلبات
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/trpc', limiter);
```

### 4. CORS
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
```

---

## ✅ قائمة التحقق النهائية

### قبل النشر:
- [ ] تم تحديث `EXPO_PUBLIC_API_URL`
- [ ] تم إضافة Gemini API Key
- [ ] تم اختبار التطبيق محلياً
- [ ] تم اختبار تسجيل الدخول
- [ ] تم اختبار البوت الذكي
- [ ] تم اختبار جميع الأزرار
- [ ] تم تحديث `app.config.ts`
- [ ] تم إنشاء شهادات SSL
- [ ] تم عمل نسخة احتياطية من قاعدة البيانات

### بعد النشر:
- [ ] تم اختبار التطبيق على الإنتاج
- [ ] تم مراقبة السجلات
- [ ] تم إعداد النسخ الاحتياطية التلقائية
- [ ] تم إعداد المراقبة والتنبيهات

---

## 📞 الدعم والمراجع

| المورد | الرابط |
|--------|--------|
| **Expo Docs** | https://docs.expo.dev |
| **React Native** | https://reactnative.dev |
| **tRPC** | https://trpc.io |
| **Drizzle ORM** | https://orm.drizzle.team |
| **Heroku** | https://heroku.com |
| **DigitalOcean** | https://digitalocean.com |
| **Firebase** | https://firebase.google.com |
| **Google AI Studio** | https://ai.google.dev |

---

**آخر تحديث:** يناير 2026
**الإصدار:** 1.0.0
