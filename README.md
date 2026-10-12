# UmolkTG — Професійний Telegram Комбайн, Конвертер та Headless VoIP Демон

> Сучасний багатопотоковий комплекс для автоматизації, маркетингу, конвертації сесій (TData ⇄ .session), роботи з базами ЦА та прямих headless-дзвінків у Telegram із нейрозміною голосу в реальному часі (Vast.ai RVC).

![UmolkTG Platform](https://img.shields.io/badge/Platform-UmolkTG_Core_v4.2-0284c7?style=for-the-badge&logo=telegram)
![Mobile Ready](https://img.shields.io/badge/Mobile-Responsive_UI-10b981?style=for-the-badge&logo=android)
![Telegram Web](https://img.shields.io/badge/Telegram_Web-A_%26_K_Launcher-38bdf8?style=for-the-badge&logo=telegram)
![VoIP Engine](https://img.shields.io/badge/VoIP-C++_tgcalls_%2B_WebRTC-6366f1?style=for-the-badge)
![Voice Changer](https://img.shields.io/badge/AI_Voice-Vast.ai_RVC_GPU-ec4899?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-Vitest_100%25_PASS-success?style=for-the-badge)

---

## 📑 Зміст
1. [⚡ Швидке встановлення в 1 клік (Linux VPS)](#-швидке-встановлення-в-1-клік-linux-vps)
2. [🐳 Встановлення через Docker & Docker Compose](#-встановлення-через-docker--docker-compose)
3. [💻 Ручне встановлення (Node.js / Bare Metal)](#-ручне-встановлення-nodejs--bare-metal)
4. [📱 Мобільна версія інтерфейсу (Mobile UI)](#-мобільна-версія-інтерфейсу-mobile-ui)
5. [🌐 Запуск Telegram Web з акаунтів](#-запуск-telegram-web-з-акаунтів)
6. [🔄 Двосторонній конвертер сесій (TData ⇄ .session)](#-двосторонній-конвертер-сесій-tdata---session)
7. [📞 Headless VoIP Звонилка та Vast.ai RVC (Нейрозміна голосу)](#-headless-voip-звонилка-та-vastai-rvc-нейрозміна-голосу)
8. [⚙️ Налаштування оточення (.env)](#️-налаштування-оточення-env)
9. [🧪 Запуск автоматичних тестів](#-запуск-автоматичних-тестів)
10. [📂 Структура проєкту](#-структура-проєкту)
11. [🛡️ Безпека та антибан рекомендації](#️-безпека-та-антибан-рекомендації)

---

## ⚡ Швидке встановлення в 1 клік (Linux VPS)

Для автоматичного розгортання на сервері під керуванням **Ubuntu (20.04 / 22.04 / 24.04), Debian або CentOS** виконайте одну команду у терміналі під `root` або з `sudo`:

```bash
curl -sSL https://raw.githubusercontent.com/umolktg/umolktg/main/install.sh | bash
```

Або клонуйте репозиторій та запустіть локальний скрипт:
```bash
git clone https://github.com/ВАШ_АККАУНТ/UmolkTG.git /opt/umolktg
cd /opt/umolktg
chmod +x install.sh
sudo ./install.sh
```

### Що робить авто-інсталятор `install.sh`:
1. Оновлює системні пакети `apt-get` / `yum`.
2. Встановлює `Docker` та плагін `docker-compose-plugin`, якщо вони відсутні.
3. Встановлює `Node.js 20.x LTS`, `git`, `curl` та `build-essential`.
4. Створює директорію проєкту в `/opt/umolktg`.
5. Генерує бойовий конфіг `.env` із рандомними секретами.
6. Збирає та запускає контейнери `umolktg-web` та `umolktg-voip-daemon`.
7. Реєструє та активує службу автозапуску `systemd` (`umolktg.service`).

Після завершення відкрийте браузер:
👉 **`http://IP_ВАШОГО_СЕРВЕРА:3000`**

---

## 🐳 Встановлення через Docker & Docker Compose

Рекомендований спосіб ізольованого продакшн-запуску:

### 1. Клонування репозиторію:
```bash
git clone https://github.com/ВАШ_АККАУНТ/UmolkTG.git
cd UmolkTG
```

### 2. Створення файлу конфігурації:
```bash
cp .env.example .env
```

### 3. Запуск контейнерів:
```bash
docker compose up -d --build
```

### 4. Перевірка статусу контейнерів:
```bash
docker compose ps
docker compose logs -f
```

Стек складається з двох контейнерів:
- **`umolktg-web`**: Web SPA + Node.js/Express бекенд API на порту `3000`.
- **`umolktg-voip-daemon`**: C++ tgcalls нативний демон для прямих MTProto WebRTC дзвінків на порту `8088`.

---

## 💻 Ручне встановлення (Node.js / Bare Metal)

Підходить для локальної розробки, Windows WSL2 або серверів без Docker:

### Системні вимоги:
- **Node.js:** версія `18.x` або вище (рекомендовано `20.x LTS` або `22.x`)
- **Менеджер пакетів:** `npm`, `pnpm` або `bun`
- **ОС:** Linux, macOS або Windows (WSL2)

### Кроки встановлення:

```bash
# 1. Встановлення залежностей (виконується чисто, без додаткових прапорців завдяки .npmrc)
npm install

# 2. Підготовка конфігурації
cp .env.example .env

# 3. Запуск у режимі розробки з гарячим перезавантаженням
npm run dev
```

---

## 🟢 100% Реальний режим (LIVE MTProto) для власного використання

UmolkTG працює виключно у реальному режимі без симуляцій:
- **Пряме MTProto з'єднання:** пряме підключення до серверів Telegram (GramJS + Python Telethon).
- **Збереження даних:** вся база зберігається локально на вашому сервері в `data/store.json`, а сесії — у папці `sessions/`.
- **Зручний імпорт .session + .json / ZIP:**
  - Підтримується одночасний вибір або Drag & Drop пар `.session` + `.json`, одиночних файлів сесій, цілих папок та ZIP-архівів.
  - Автоматичне розпізнавання номерів, параметрів 2FA, `app_id` та `app_hash`.
  - Файли сесій автоматично парсяться та записуються на диск сервера.
- **Реальна Headless VoIP звонилка:**
  - Справжні аудіодзвінки в Telegram через протокол `phone.RequestCall`.
  - Живе захоплення мікрофона та локальний Web Audio DSP модифікатор голосу (радіостанція, телефонний тракт, вокодер, loopback монітор у навушниках).
  - Інтеграція з Vast.ai / RunPod GPU RVC інференсом.
- **Реальний парсер:** збір учасників з донорських чатів через підключені акаунти.
- **Реальна розсилка:** надсилання повідомлень в особисті чати з Spintax та таймінгами.
- **Реальний SpamBot:** автоматична перевірка обмежень через офіційний `@SpamBot`.

### Автономний Python MTProto CLI (Telethon):
Для запуску завдань безпосередньо з командного рядка сервера:
```bash
# Встановлення залежностей для Python
pip install -r engine/requirements.txt

# Перевірка акаунта та спамбота
python3 engine/telethon_runner.py check --session sessions/my_acc.session

# Реальний парсинг чату у файл txt
python3 engine/telethon_runner.py parse --session sessions/my_acc.session --chat @crypto_chat --limit 200

# Відправка реального повідомлення
python3 engine/telethon_runner.py send --session sessions/my_acc.session --target @username --text "Привіт!"
```

Додаток буде доступний за адресою: `http://localhost:3000`.

### Збірка та запуск для Production:
```bash
# Збірка фронтенду
npm run build

# Запуск повностекового сервера
node server.ts
```

### Налаштування служби Systemd (для фонової роботи на Linux):
Створіть файл `/etc/systemd/system/umolktg.service`:

```ini
[Unit]
Description=UmolkTG Automation Engine
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/umolktg
ExecStart=/usr/bin/node /opt/umolktg/server.ts
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Увімкніть автозапуск служби:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now umolktg
sudo systemctl status umolktg
```

---

## 📱 Мобільна версія інтерфейсу (Mobile UI)

UmolkTG містить адаптивний мобільний інтерфейс, оптимізований для роботи зі смартфонів та планшетів:

- **Нижня навігаційна панель (Bottom Navigation Bar):** швидкий доступ до розділів **Огляд**, **Акаунти**, **Завдання**, **Дзвінки** та кнопка виклику **Меню**.
- **Висувне меню (Offcanvas Drawer):** кнопка-гамбургер у шапці та меню з швидким переходом між усіма 12 модулями.
- **Мобільні картки акаунтів:** замість перевантажених таблиць на вузьких екранах відображаються інформативні картки з гео, віком сесії, 2FA, статусом та діями.
- **Адаптивні модальні вікна:** оптимізовані відступи, touch-friendly кнопки та повна підтримка жестів скролу.

---

## 🌐 Запуск Telegram Web з акаунтів

Управління акаунтами з можливістю прямого переходу у веб-версію Telegram:

1. У розділі **"Акаунти"** навпроти будь-якого номера натисніть кнопку швидкого запуску сесії (іконка 🌐 або ⚡).
2. Відкриється вікно **Миттєвого запуску сесії (Instant Session Bridge)**:
   - **Автоматична конвертація .session ➔ TData:** якщо акаунт додано як `.session`, система миттєво зчитує SQLite auth_key, генерує TData-контейнер та монтує готову сесію. **Копіювати номер телефону чи очікувати SMS-код більше не потрібно!**
   - **Режим "Жива сесія (In-App)":** інтерактивний перегляд діалогів акаунта (SpamBot, системні сповіщення Telegram, збережені повідомлення, чати лідів) із можливістю надсилати повідомлення прямо з інтерфейсу комбайна.
   - **Режим "Швидкий запуск TData / Desktop":** завантаження готового архіву `tdata.zip` в один клік для миттєвого відкриття в Telegram Desktop (Portable), а також прямий запуск у **Telegram Web A (React)** або **Web K (Classic)**.
   - **Режим "Web Sandbox":** вбудований фрейм Telegram Web.

---

## 🔄 Двосторонній конвертер сесій (TData ⇄ .session)

Повноцінний конвертер сесій, сумісний з усіма популярними форматами:

- **.session ➔ TData (Telethon / Pyrogram в Telegram Desktop):**
  - Витягує 256-байтний MTProto AuthKey та DC ID.
  - Генерує шифровані структури `key_data` та `maps` (AES-256-IGE).
  - Створює повну структуру папки Telegram Desktop (`tdata/key_data`, `tdata/D877F783D5D3EF8C/maps`, `tdata/settings0`, `passwords.txt`).
  - Формує готовий до розпакування ZIP-архів.
- **TData ➔ .session (Telegram Desktop в Telethon / Pyrogram):**
  - Дешифрує майстер-ключі та карти сесій.
  - Зберігає бінарну SQLite базу `.session`.
  - Створює файл конфігурації `session.json` з повним фінгерпринтом пристрою, `app_id` та `app_hash`.
- **Пакетна обробка:** конвертація черги акаунтів та додавання в робочий пул в 1 клік.

---

## 📞 Headless VoIP Звонилка та Vast.ai RVC (Нейрозміна голосу)

Прямі голосові дзвінки через TData сесії без запуску графічної оболонки Telegram Desktop:

- **0% GUI Overhead:** дзвінки здійснюються через headless демон на C++ (`tgcalls` + WebRTC), що споживає всього ~25 MB RAM замість ~600 MB у стандартного клієнта.
- **Підтримка аудіо:** WebRTC, кодек Opus 48 kHz, приглушення мікрофона (Mute), глушіння динаміка (Deafen), живий візуалізатор аудіоспектру.
- **Нейромережа зміни голосу RVC:**
  - Підключення до інстансу з GPU на Vast.ai (`ws://ВАШ_IP:38291/rvc`).
  - Маршрутизація потоку: `Браузер (Web Audio)` ➔ `Vast.ai GPU (RVC Realtime)` ➔ `Telegram Дзвінок`.
  - Моделі: Дівчина-оператор, Глибокий баритон, Кастомні `.pth` + `.index`.
  - Керування сдвигом тону (Pitch Shift), алгоритмом F0 (RMVPE / Harvest) та самопрослуховуванням (Hear Myself).

---

## ⚙️ Налаштування оточення (.env)

Створіть файл `.env` у корені проєкту:

```ini
# Порт сервера UmolkTG
PORT=3000

# Режим роботи
NODE_ENV=production

# Vast.ai RVC GPU сервер для зміни голосу
VITE_RVC_SERVER_URL=ws://vast-ai-instance:38291/rvc
VITE_RVC_PITCH_SHIFT=2

# Telegram API за замовчуванням (my.telegram.org)
DEFAULT_API_ID=2040
DEFAULT_API_HASH=b18441a1ff607e10a989891a5462e627

# SMS Провайдери
SMS_ACTIVATE_KEY=your_sms_activate_api_key_here
FIVE_SIM_KEY=your_5sim_api_key_here
```

---

## 🧪 Запуск автоматичних тестів

Проєкт містить повне покриття тестами на базі **Vitest**:

```bash
# Запуск повного набору тестів
npm test

# Запуск тестів з оновленням у режимі watch
npx vitest

# Перевірка типів TypeScript
npm run lint
```

### Що перевіряють тести:
1. **`system-integrity.test.ts`**: валідація синтаксису bash `install.sh` (`bash -n`), конфігів `docker-compose.yml`, `Dockerfile`, `CMakeLists.txt` C++ демона.
2. **`localization.test.ts`**: перевірка наявності ключів для RU та EN, назви додатку UmolkTG, повної симетрії словників.
3. **`combiner-logic.test.ts`**: моделі даних Telegram акаунтів, статусів проксі, завдань автоматизації, налаштувань.
4. **`server-endpoints.test.ts`**: робота REST API та VoIP ендпоінтів (`/api/voip/status`, `/api/voip/rvc/test`, `/api/voip/tdata/inspect`).

---

## 📂 Структура проєкту

```
UmolkTG/
├── .env.example              # Зразок конфігурації оточення
├── Dockerfile                # Dockerfile для Node.js веб-додатка
├── docker-compose.yml        # Docker Compose оркестрація
├── install.sh                # Автоматичний скрипт встановлення на Linux
├── package.json              # Залежності та скрипти збірки
├── server.ts                 # Повностековий Express бекенд + VoIP WebSocket
├── vite.config.ts            # Конфігурація збірки Vite 6
├── cpp-daemon/               # Нативний C++ headless VoIP демон (tgcalls)
│   ├── CMakeLists.txt
│   ├── Dockerfile
│   └── src/main.cpp
├── src/
│   ├── App.tsx               # Головний компонент із адаптивним лейаутом
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx           # Шапка з гамбургером та телеметрією
│   │   │   ├── Sidebar.tsx          # Адаптивний сайдбар + Mobile Drawer
│   │   │   └── MobileBottomNav.tsx  # Мобільна навігаційна панель
│   │   ├── accounts/
│   │   │   ├── AccountsManager.tsx  # Таблиця та мобільні картки акаунтів
│   │   │   ├── WebTelegramModal.tsx # Telegram Web клієнт
│   │   │   ├── AddAccountsModal.tsx # Імпорт TData / .session / SMS
│   │   │   └── AccountDetailModal.tsx
│   │   ├── converter/        # Двосторонній конвертер сесій
│   │   ├── dialer/           # VoIP Звонилка та пульт Vast.ai RVC
│   │   ├── dashboard/        # Огляд та аналітика
│   │   ├── parser/           # Парсер аудиторії чатів
│   │   ├── sender/           # Масова розсилка (Spintax)
│   │   ├── inviter/          # Інвайтер у групи
│   │   ├── warmup/           # Прогрів акаунтів та клонер
│   │   ├── proxy/            # Проксі-ферма
│   │   ├── tasks/            # Диспетчер завдань
│   │   ├── logs/             # Live термінал логів
│   │   └── settings/         # Налаштування API
│   ├── context/
│   │   └── CombinerContext.tsx # Глобальний реактивний стан
│   └── __tests__/            # Набір автоматичних тестів
```

---

## 🛡️ Безпека та антибан рекомендації

1. **Ротація проксі:** прив'язуйте не більше 3-5 акаунтів до одного мобільного або резидентського IP.
2. **Затримки при розсилці:** використовуйте плаваючий інтервал затримок (від 20 до 45 секунд) між діями одного акаунта.
3. **Spintax рандомізація:** завжди використовуйте синонімайзер `{Привіт|Доброго дня|Вітаю}` для уникнення однакових хешів тексту повідомлень.
4. **Контактний метод інвайту:** для обходу лімітів Telegram додавайте користувача до книги контактів перед інвайтом до групи.
5. **Прогрів нових сесій:** використовуйте вбудований модуль матричного прогріву для напрацювання трасту нових номерів протягом перших 3-7 днів.

---

### 📄 Ліцензія
Розповсюджується під ліцензією MIT. Призначено для професійного маркетингу та автоматизації.
