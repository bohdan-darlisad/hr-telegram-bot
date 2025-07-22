require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log('✅ Бот запущений!');

// =============================
// ID групи HR
// =============================
const HR_GROUP_CHAT_ID = -4977262255; // 👈 це твоя група HR

// =============================
// Дані вакансій
// =============================
const maleJobs = [
  {
    id: 'helper',
    title: '👨‍🔧 Різноробочий',
    duties:
      '✅ В основні обов’язки входить:\n' +
      '• Допомога біля робочих процесів;\n' +
      '• Запуск або подача ягід на конвеєр.\n\n' +
      '🕒 Графік роботи:\n' +
      '• Позмінний: 2 дні зміна з 8:00 до 19:00 та 2 дні в ніч з 19:00 до 8:00;\n' +
      '• Потім 2 дні вихідних.\n\n' +
      '☕ Перерви:\n' +
      '• Кожні 2 години є перерва 20 хвилин;\n' +
      '• Обідня перерва 30 хвилин.'
  }
];

const femaleJobs = [
  {
    id: 'sorter',
    title: '👩‍🏭 Сортувальниця',
    duties:
      '✅ В основні обов’язки входить:\n' +
      '• Перебирання ягід біля конвеєрних ліній (листя, гілки);\n' +
      '• Калібрування ягоди (ціла від подрібленої).\n\n' +
      '🕒 Графік роботи:\n' +
      '• Позмінний: 2 дні зміна з 8:00 до 19:00 та 2 дні в ніч з 19:00 до 8:00;\n' +
      '• Потім 2 дні вихідних.\n\n' +
      '☕ Перерви:\n' +
      '• Кожні 2 години є перерва 20 хвилин;\n' +
      '• Обідня перерва 30 хвилин.'
  }
];

// =============================
// Стан
// =============================
const userState = {};
const lastSelectedJob = {};

// =============================
// Меню
// =============================
function mainKeyboard() {
  return {
    keyboard: [
      ['👨 Для чоловіків', '👩 Для жінок'],
      ['📍 Наше розташування', '📞 Зв’язатися з HR'],
      ['📝 Залишити заявку']
    ],
    resize_keyboard: true
  };
}

function showMainMenuWithGreeting(chatId, firstName) {
  userState[chatId] = 'main';
  const nameText = firstName ? `Привіт, ${firstName}! 👋` : 'Привіт! 👋';
  const intro = `${nameText}\nМи — компанія Darlisad, провідний виробник заморожених ягід в Україні.`;
  bot.sendMessage(chatId, `${intro}\n\nОберіть категорію:`, {
    parse_mode: 'Markdown',
    reply_markup: mainKeyboard()
  });
}

function showMainMenu(chatId) {
  userState[chatId] = 'main';
  bot.sendMessage(chatId, 'Оберіть категорію:', {
    reply_markup: mainKeyboard()
  });
}

// =============================
// /start
// =============================
bot.onText(/\/start/, (msg) => {
  showMainMenuWithGreeting(msg.chat.id, msg.from.first_name);
});

// =============================
// Обробка повідомлень
// =============================
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userState[chatId] || 'main';

  // 📝 Залишити заявку
  if (text === '📝 Залишити заявку') {
    bot.sendMessage(
      chatId,
      'Будь ласка, надішліть свій номер телефону, щоб наш HR міг вам передзвонити:',
      {
        reply_markup: {
          keyboard: [
            [
              {
                text: '📱 Надіслати свій номер',
                request_contact: true
              }
            ],
            ['⬅️ Назад']
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
    userState[chatId] = 'waiting_contact';
    return;
  }

  // отримали контакт
  if (msg.contact && state === 'waiting_contact') {
    const phoneNumber = msg.contact.phone_number;
    bot.sendMessage(
      chatId,
      `✅ Дякуємо! Ми отримали ваш номер: ${phoneNumber}\nНаш HR зв’яжеться з вами найближчим часом.`,
      { reply_markup: mainKeyboard() }
    );
    userState[chatId] = 'main';

    // Надсилаємо в групу HR
    bot.sendMessage(
      HR_GROUP_CHAT_ID,
      `📲 Нова заявка!\nНомер телефону: ${phoneNumber}\nВід користувача: ${msg.from.first_name} (@${msg.from.username || 'немає юзернейму'})`
    );
    console.log(`📲 Нова заявка: ${phoneNumber} (відправлено в групу HR)`);
    return;
  }

  // 📍 Наше розташування
  if (text === '📍 Наше розташування') {
    bot.sendMessage(
      chatId,
      '📌 Наша адреса:\nФруктова вул, 1, Княгининок, Волинська область, 45630',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🌍 Відкрити в Google Maps',
                url: 'https://www.google.com/maps?q=Фруктова+вул,+1,+Княгининок,+Волинська+область,+45630'
              }
            ]
          ]
        }
      }
    );
    return;
  }

  // 📞 Зв’язатися з HR
  if (text === '📞 Зв’язатися з HR') {
    bot.sendMessage(
      chatId,
      '📞 Контакти нашого HR:\nТелефон: +38 (050) 618 23 41\nEmail: hr@darlissad.com.ua\nМи будемо раді допомогти вам!'
    );
    return;
  }

  // 👨 Для чоловіків
  if (text === '👨 Для чоловіків') {
    userState[chatId] = 'male_menu';
    const buttons = maleJobs.map(j => j.title);
    buttons.push('⬅️ Назад');
    bot.sendMessage(chatId, '📋 Вакансії для чоловіків:', {
      reply_markup: { keyboard: [buttons], resize_keyboard: true }
    });
    return;
  }

  // 👩 Для жінок
  if (text === '👩 Для жінок') {
    userState[chatId] = 'female_menu';
    const buttons = femaleJobs.map(j => j.title);
    buttons.push('⬅️ Назад');
    bot.sendMessage(chatId, '📋 Вакансії для жінок:', {
      reply_markup: { keyboard: [buttons], resize_keyboard: true }
    });
    return;
  }

  // ⬅️ Назад
  if (text === '⬅️ Назад') {
    showMainMenu(chatId);
    return;
  }

  // Натискання вакансій
  if (state === 'male_menu') {
    const job = maleJobs.find(j => j.title === text);
    if (job) {
      if (lastSelectedJob[chatId] === job.title) return;
      lastSelectedJob[chatId] = job.title;
      bot.sendMessage(chatId, job.duties);
    }
    return;
  }

  if (state === 'female_menu') {
    const job = femaleJobs.find(j => j.title === text);
    if (job) {
      if (lastSelectedJob[chatId] === job.title) return;
      lastSelectedJob[chatId] = job.title;
      bot.sendMessage(chatId, job.duties);
    }
    return;
  }
});

// =============================
// Ловимо помилки
// =============================
bot.on('polling_error', (err) => console.error('❌ Помилка polling:', err));
