# ⚡ دليل البدء السريع - نقل التطبيق والنشر

## 🎯 ملخص سريع

هذا الدليل يشرح كيفية:
1. ✅ نقل التطبيق من Manus إلى جهازك
2. ✅ تشغيله محلياً
3. ✅ ربط سيرفر خاص بك
4. ✅ نشره على الإنتاج

---

## 📥 الخطوة 1: نقل التطبيق

### من واجهة Manus:
1. اذهب إلى **Management UI** → **Code**
2. اضغط **Download all files**
3. استخرج الملفات

### أو من Git:
```bash
git clone <your-repo-url>
cd e_learning_mobile_app
```

---

## 🔧 الخطوة 2: التحضير

### تثبيت Node.js:
- اذهب إلى [nodejs.org](https://nodejs.org)
- حمّل النسخة LTS
- ثبّت البرنامج

### تثبيت المكتبات:
```bash
cd e_learning_mobile_app
npm install
# أو
pnpm install
```

---

## 🔗 الخطوة 3: إعدادات البيئة

### أنشئ ملف `.env.local`:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_TIMEOUT=30000

# Database (للسيرفر)
DATABASE_URL=http://localhost:3000

# Gemini AI (احصل على المفتاح من https://ai.google.dev)
GEMINI_API_KEY=your-gemini-api-key-here

# Environment
NODE_ENV=development
```

### احصل على Gemini API Key:
1. اذهب إلى [Google AI Studio](https://ai.google.dev)
2. اضغط **Get API Key**
3. انسخ المفتاح في `.env.local`

---

## 🚀 الخطوة 4: التشغيل المحلي

### تشغيل الكل معاً:
```bash
npm run dev
```

هذا سيشغل:
- ✅ السيرفر على `http://localhost:3000`
- ✅ التطبيق على `http://localhost:8081`

### أو تشغيل منفصل:
```bash
# الطرفية 1: السيرفر
npm run dev:server

# الطرفية 2: التطبيق
npm run dev:metro
```

### الاختبار:
- **الويب**: http://localhost:8081
- **الهاتف**: اسح QR من الطرفية
- **بيانات تجريبية**:
  - البريد: `student@example.com`
  - كلمة المرور: `password123`

---

## 🌐 الخطوة 5: ربط سيرفر خاص

### إذا كان لديك سيرفر خاص:

**تحديث `.env.local`:**
```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

### إذا كنت تريد نشر السيرفر على السحابة:

#### الخيار 1: Heroku (مجاني)

```bash
# 1. ثبّت Heroku CLI
# من https://devcenter.heroku.com/articles/heroku-cli

# 2. تسجيل الدخول
heroku login

# 3. إنشاء تطبيق
heroku create your-app-name

# 4. ضبط متغيرات البيئة
heroku config:set GEMINI_API_KEY=your-key
heroku config:set DATABASE_URL=postgresql://...

# 5. النشر
git push heroku main

# 6. تحديث `.env.local`
EXPO_PUBLIC_API_URL=https://your-app-name.herokuapp.com
```

#### الخيار 2: DigitalOcean ($5/شهر)

```bash
# 1. أنشئ Droplet بـ Ubuntu 22.04

# 2. اتصل بـ SSH
ssh root@your_droplet_ip

# 3. ثبّت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash
sudo apt-get install -y nodejs

# 4. ثبّت PostgreSQL (اختياري)
sudo apt-get install -y postgresql postgresql-contrib

# 5. استنسخ المشروع
git clone your-repo-url
cd e_learning_mobile_app

# 6. ثبّت المكتبات
npm install

# 7. أنشئ `.env.local`
nano .env.local
# أضف المتغيرات

# 8. شغّل باستخدام PM2
npm install -g pm2
pm2 start "npm run dev:server" --name "elearning-api"
pm2 save
pm2 startup

# 9. تحديث `.env.local` على جهازك
EXPO_PUBLIC_API_URL=https://your-droplet-ip:3000
```

#### الخيار 3: Docker

```bash
# 1. ثبّت Docker من https://docker.com

# 2. بناء الصورة
docker build -t elearning-app .

# 3. تشغيل الحاوية
docker run -p 3000:3000 -p 8081:8081 elearning-app

# 4. تحديث `.env.local`
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## 📱 الخطوة 6: التشغيل على الهاتف

### iOS (من Mac):
```bash
npm run dev
# اسح QR بكاميرا الهاتف
```

### Android:
```bash
npm run dev
# اسح QR بتطبيق Expo Go
```

### من أي مكان (Tunnel):
```bash
npx expo start --tunnel
# أبطأ لكن يعمل من أي مكان
```

---

## 🚀 الخطوة 7: النشر على App Store و Google Play

### نشر التطبيق:

```bash
# 1. ثبّت EAS CLI
npm install -g eas-cli

# 2. تسجيل الدخول
eas login

# 3. بناء لـ iOS
eas build --platform ios

# 4. بناء لـ Android
eas build --platform android

# 5. النشر على المتاجر
eas submit --platform ios
eas submit --platform android
```

### المتطلبات:
- حساب Apple Developer ($99/سنة)
- حساب Google Play Developer ($25 لمرة واحدة)
- شهادات التوقيع

---

## 📊 معلومات قاعدة البيانات

### SQLite (للتطوير المحلي):
```env
DATABASE_URL=sqlite:./data.db
```

### PostgreSQL (للإنتاج):
```env
DATABASE_URL=postgresql://username:password@host:5432/elearning_db

# مع SSL
DATABASE_URL=postgresql://username:password@host:5432/elearning_db?sslmode=require
```

---

## 🔐 نصائح الأمان

### 1. لا تنشر `.env.local`:
```bash
# في `.gitignore`
.env.local
.env*.local
```

### 2. استخدم HTTPS:
```bash
# على DigitalOcean
sudo apt-get install certbot
sudo certbot certonly --nginx -d api.yourdomain.com
```

### 3. حماية API:
```typescript
// أضف معدل تحديد الطلبات
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/trpc', limiter);
```

---

## ✅ قائمة التحقق

- [ ] تم تثبيت Node.js
- [ ] تم نسخ المشروع
- [ ] تم تثبيت المكتبات
- [ ] تم إنشاء `.env.local`
- [ ] تم إضافة Gemini API Key
- [ ] يعمل التطبيق محلياً
- [ ] تم اختبار تسجيل الدخول
- [ ] تم ربط السيرفر الخارجي (اختياري)
- [ ] تم نشر السيرفر (اختياري)
- [ ] تم إعداد App Store و Google Play

---

## 🆘 مشاكل شائعة

| المشكلة | الحل |
|--------|------|
| `npm: command not found` | ثبّت Node.js من nodejs.org |
| `Cannot find module` | شغّل `npm install` |
| `Port 3000 already in use` | `lsof -i :3000` ثم `kill -9 <PID>` |
| `API connection failed` | تحقق من `EXPO_PUBLIC_API_URL` |
| `Gemini API error` | تحقق من المفتاح في Google AI Studio |
| `QR Code لا يظهر` | شغّل `npm run dev --clear` |

---

## 📚 المراجع

- 📖 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - دليل النشر الكامل
- 🔍 [DESIGN.md](./DESIGN.md) - تصميم التطبيق
- 📋 [TODO.md](./TODO.md) - قائمة المهام
- 🎮 [README_AR.md](./README_AR.md) - دليل الاستخدام

---

## 📞 الدعم

- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **tRPC**: https://trpc.io
- **Drizzle ORM**: https://orm.drizzle.team

---

**آخر تحديث:** يناير 2026
**الإصدار:** 1.0.0
