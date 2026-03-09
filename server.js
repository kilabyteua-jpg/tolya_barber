require('dotenv').config();
const express = require('express');
const { Bot } = require('grammy');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const cors = require('cors');

// Ініціалізація додатку
const app = express();
app.use(express.json());
app.use(cors());

// Вказуємо, що папка public містить наш фронтенд (index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Підключення до Supabase та Telegram
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Bot(process.env.BOT_TOKEN);

// ==========================================
// 1. ЛОГІКА TELEGRAM БОТА
// ==========================================
bot.command('start', (ctx) => {
    ctx.reply('Привіт! Я бот барбершопу. Натисни кнопку нижче, щоб відкрити додаток і записатися ✂️', {
        reply_markup: {
            inline_keyboard: [[
                // WebApp URL беремо зі змінних середовища Render
                { text: 'Відкрити додаток 💈', web_app: { url: process.env.WEBAPP_URL } }
            ]]
        }
    });
});

// ==========================================
// 2. API ДЛЯ ФРОНТЕНДУ (Зв'язок з Supabase)
// ==========================================

// Отримати всі записи
app.get('/api/bookings', async (req, res) => {
    const { data, error } = await supabase.from('bookings').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Створити новий запис (коли клієнт тисне "Записатись")
app.post('/api/bookings', async (req, res) => {
    const newBooking = req.body;
    const { data, error } = await supabase.from('bookings').insert([newBooking]).select();
    
    if (error) return res.status(500).json({ error: error.message });
    
    // Опціонально: Відправити повідомлення адміну в ТГ про новий запис
    // bot.api.sendMessage(process.env.ADMIN_ID, `Новий запис: ${newBooking.clientName} на ${newBooking.date}`);
    
    res.json(data);
});

// ==========================================
// 3. ЗАПУСК СЕРВЕРА
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на порту ${PORT}`);
    bot.start(); // Запускаємо бота
});
