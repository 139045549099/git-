const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// پایگاه داده موقت در حافظه
const users = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret_key_123',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// بررسی و پیکربندی گوگل
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'DUMMY_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'DUMMY_SECRET';

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      passReqToCallback: true
    },
    (req, accessToken, refreshToken, profile, done) => {
      let user = users.find((u) => u.googleId === profile.id);
      if (!user) {
        user = {
          id: users.length + 1,
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails && profile.emails[0] ? profile.emails[0].value : '',
        };
        users.push(user);
      }
      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = users.find((u) => u.id === id);
  done(null, user);
});

// ==========================================
// APIهای بک‌اند
// ==========================================

// ثبت‌نام
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'لطفاً تمامی فیلدها را پر کنید.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'فرمت ایمیل نامعتبر است.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
  }

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'این ایمیل قبلاً ثبت‌نام شده است.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ id: users.length + 1, email, password: hashedPassword });

  res.json({ success: true, message: 'ثبت‌نام با موفقیت انجام شد! می‌توانید وارد شوید.' });
});

// ورود
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'لطفاً ایمیل و رمز عبور را وارد کنید.' });
  }

  const user = users.find((u) => u.email === email);
  if (!user || !user.password) {
    return res.status(400).json({ success: false, message: 'ایمیل یا کلمه عبور اشتباه است.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'ایمیل یا کلمه عبور اشتباه است.' });
  }

  req.session.userId = user.id;
  res.json({ success: true, message: 'ورود با موفقیت انجام شد!' });
});

// مسیرهای اتصال به گوگل
app.get('/auth/google', (req, res, next) => {
  if (GOOGLE_CLIENT_ID === 'DUMMY_ID') {
    return res.send(`
      <div style="font-family:sans-serif; direction:rtl; text-align:center; padding:50px; background:#0d1117; color:#f85149; min-height:100vh;">
        <h2>خطا در تنظیمات گوگل!</h2>
        <p style="color:#c9d1d9;">شما مقادیر GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET را در فایل .env یا کدهای سرور تنظیم نکرده‌اید.</p>
        <a href="/" style="color:#58a6ff;">بازگشت به صفحه اصلی</a>
      </div>
    `);
  }
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
});

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/?error=google_failed' }),
  (req, res) => {
    res.send(`
      <script>
        alert('ورود با حساب گوگل با موفقیت انجام شد!');
        window.location.href = '/';
      </script>
    `);
  }
);

// ==========================================
// فرانت‌اند (HTML + CSS + JS)
// ==========================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سیستم احراز هویت هوشمند</title>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', sans-serif; }
    
    body { 
      background: #090d16; 
      color: #c9d1d9; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      min-height: 100vh; 
      padding: 20px; 
      overflow-x: hidden;
      position: relative;
    }

    /* بک گراند زنده و واکنش‌گرا */
    .bg-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(88,166,255,0.15) 0%, rgba(137,87,229,0.1) 40%, rgba(0,0,0,0) 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: all 0.2s ease-out;
      border-radius: 50%;
      z-index: 0;
    }

    .card { 
      position: relative;
      z-index: 1;
      background: rgba(22, 27, 34, 0.85); 
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1); 
      border-radius: 16px; 
      padding: 32px; 
      width: 100%; 
      max-width: 420px; 
      box-shadow: 0 20px 40px rgba(0,0,0,0.6); 
      transition: transform 0.3s ease;
    }

    h2 { font-size: 22px; text-align: center; margin-bottom: 24px; color: #f0f6fc; font-weight: 700; }

    .btn-google { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 10px; 
      width: 100%; 
      padding: 11px; 
      border-radius: 8px; 
      border: 1px solid #30363d; 
      background: #21262d; 
      color: #c9d1d9; 
      text-decoration: none; 
      font-size: 14px; 
      font-weight: 600; 
      transition: 0.2s ease; 
    }
    .btn-google:hover { background: #30363d; border-color: #8b949e; }
    .btn-google svg { width: 18px; height: 18px; }

    .divider { display: flex; align-items: center; text-align: center; margin: 20px 0; color: #8b949e; font-size: 12px; }
    .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #30363d; }
    .divider::before { margin-left: 10px; }
    .divider::after { margin-right: 10px; }

    .form-group { margin-bottom: 18px; }
    label { display: block; font-size: 13px; margin-bottom: 6px; color: #8b949e; }
    
    .input-wrapper { position: relative; }
    input { 
      width: 100%; 
      padding: 11px 12px; 
      background: #0d1117; 
      border: 1px solid #30363d; 
      border-radius: 8px; 
      color: #c9d1d9; 
      font-size: 14px; 
      outline: none; 
      transition: 0.2s;
    }
    input:focus { border-color: #58a6ff; box-shadow: 0 0 0 3px rgba(88,166,255,0.15); }

    /* سنجش قدرت کلمه عبور */
    .strength-wrapper {
      margin-top: 8px;
      display: none;
    }
    .strength-bar-bg {
      height: 6px;
      width: 100%;
      background: #21262d;
      border-radius: 3px;
      overflow: hidden;
    }
    .strength-bar-fill {
      height: 100%;
      width: 0%;
      border-radius: 3px;
      transition: width 0.3s ease, background-color 0.3s ease;
    }
    .strength-text {
      font-size: 11px;
      margin-top: 4px;
      color: #8b949e;
      display: flex;
      justify-content: space-between;
    }

    .btn-submit { 
      width: 100%; 
      padding: 11px; 
      background: #238636; 
      color: white; 
      border: none; 
      border-radius: 8px; 
      font-size: 14px; 
      font-weight: bold; 
      cursor: pointer; 
      transition: 0.2s; 
      margin-top: 10px; 
    }
    .btn-submit:hover { background: #2ea043; }

    .alert { padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; display: none; }
    .alert-danger { background: rgba(248,81,73,0.15); border: 1px solid #f85149; color: #f85149; }
    .alert-success { background: rgba(46,160,67,0.15); border: 1px solid #2ea043; color: #3fb950; }

    .toggle-text { text-align: center; font-size: 13px; margin-top: 20px; color: #8b949e; }
    .toggle-text a { color: #58a6ff; text-decoration: none; cursor: pointer; font-weight: 600; }
    .toggle-text a:hover { text-decoration: underline; }
  </style>
</head>
<body>

<div class="bg-glow" id="glow"></div>

<div class="card">
  <h2 id="form-title">ورود به حساب کاربری</h2>
  <div id="alert" class="alert"></div>

  <a href="/auth/google" class="btn-google">
    <svg viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
    ورود با حساب گوگل
  </a>

  <div class="divider">یا با ایمیل</div>

  <form id="auth-form">
    <div class="form-group">
      <label>پست الکترونیکی (ایمیل)</label>
      <input type="email" id="email" required placeholder="name@example.com">
    </div>

    <div class="form-group">
      <label>کلمه عبور</label>
      <div class="input-wrapper">
        <input type="password" id="password" required placeholder="******">
      </div>
      
      <!-- نوار سنجش قدرت کلمه عبور -->
      <div class="strength-wrapper" id="strength-wrapper">
        <div class="strength-bar-bg">
          <div class="strength-bar-fill" id="strength-fill"></div>
        </div>
        <div class="strength-text">
          <span>قدرت رمز عبور:</span>
          <strong id="strength-label">ضعیف</strong>
        </div>
      </div>
    </div>

    <button type="submit" class="btn-submit" id="submit-btn">ورود</button>
  </form>

  <div class="toggle-text">
    <span id="toggle-prompt">حساب کاربری ندارید؟</span>
    <a id="toggle-link">ثبت‌نام کنید</a>
  </div>
</div>

<script>
  let isLogin = true;

  const glow = document.getElementById('glow');
  const formTitle = document.getElementById('form-title');
  const submitBtn = document.getElementById('submit-btn');
  const togglePrompt = document.getElementById('toggle-prompt');
  const toggleLink = document.getElementById('toggle-link');
  const authForm = document.getElementById('auth-form');
  const alertBox = document.getElementById('alert');
  const passwordInput = document.getElementById('password');
  const strengthWrapper = document.getElementById('strength-wrapper');
  const strengthFill = document.getElementById('strength-fill');
  const strengthLabel = document.getElementById('strength-label');

  // پس‌زمینه زنده واکنش‌گرا به حرکت ماوس
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    glow.style.left = \`\${x}px\`;
    glow.style.top = \`\${y}px\`;
  });

  // تغییر بین فرم ورود و ثبت‌نام
  toggleLink.addEventListener('click', () => {
    isLogin = !isLogin;
    showAlert('', '');
    passwordInput.value = '';
    strengthWrapper.style.display = 'none';

    if (isLogin) {
      formTitle.textContent = 'ورود به حساب کاربری';
      submitBtn.textContent = 'ورود';
      togglePrompt.textContent = 'حساب کاربری ندارید؟';
      toggleLink.textContent = 'ثبت‌نام کنید';
    } else {
      formTitle.textContent = 'ایجاد حساب کاربری';
      submitBtn.textContent = 'ثبت‌نام';
      togglePrompt.textContent = 'قبلاً ثبت‌نام کرده‌اید؟';
      toggleLink.textContent = 'وارد شوید';
    }
  });

  // محاسبه درجه‌بندی قدرت رمز عبور (فقط در حالت ثبت‌نام)
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    if (isLogin || !val) {
      strengthWrapper.style.display = 'none';
      return;
    }

    strengthWrapper.style.display = 'block';
    let score = 0;

    if (val.length >= 6) score += 1;
    if (val.length >= 10) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;

    switch (score) {
      case 1:
        strengthFill.style.width = '20%';
        strengthFill.style.backgroundColor = '#f85149';
        strengthLabel.textContent = 'خیلی ضعیف';
        strengthLabel.style.color = '#f85149';
        break;
      case 2:
        strengthFill.style.width = '40%';
        strengthFill.style.backgroundColor = '#d29922';
        strengthLabel.textContent = 'ضعیف';
        strengthLabel.style.color = '#d29922';
        break;
      case 3:
        strengthFill.style.width = '65%';
        strengthFill.style.backgroundColor = '#e3b341';
        strengthLabel.textContent = 'متوسط';
        strengthLabel.style.color = '#e3b341';
        break;
      case 4:
        strengthFill.style.width = '85%';
        strengthFill.style.backgroundColor = '#38d430';
        strengthLabel.textContent = 'خوب';
        strengthLabel.style.color = '#38d430';
        break;
      case 5:
        strengthFill.style.width = '100%';
        strengthFill.style.backgroundColor = '#2ea043';
        strengthLabel.textContent = 'عالی';
        strengthLabel.style.color = '#2ea043';
        break;
      default:
        strengthFill.style.width = '0%';
        strengthLabel.textContent = '';
    }
  });

  function showAlert(message, type) {
    if (!message) {
      alertBox.style.display = 'none';
      return;
    }
    alertBox.textContent = message;
    alertBox.className = \`alert alert-\${type}\`;
    alertBox.style.display = 'block';
  }

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;

    const endpoint = isLogin ? '/api/login' : '/api/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        showAlert(data.message, 'success');
        if (!isLogin) {
          setTimeout(() => toggleLink.click(), 1500);
        }
      } else {
        showAlert(data.message, 'danger');
      }
    } catch (err) {
      showAlert('خطایی در ارتباط با سرور رخ داد.', 'danger');
    }
  });
</script>

</body>
</html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`سرور روی آدرس http://localhost:${PORT} اجرا شد.`);
});