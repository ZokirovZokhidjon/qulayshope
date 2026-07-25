const { Telegraf, Markup } = require('telegraf');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');

// Firebase конфигурацияси
const firebaseConfig = {
  apiKey: "AIzaSyCWvhr3ifXiadeSlAmjeHHz_JJY87B1DY0",
  authDomain: "qulaymarket777bot.firebaseapp.com",
  databaseURL: "https://qulaymarket777bot-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "qulaymarket777bot",
  storageBucket: "qulaymarket777bot.firebasestorage.app",
  messagingSenderId: "345858908913",
  appId: "1:345858908913:web:143399f5068359ad123f50",
  measurementId: "G-HKY0VZDF04"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Бот токени
const bot = new Telegraf('8613406633:AAEWDnNS0hPj1pKELLw5-G44friQxCswIVE');

// /start командаси
bot.start((ctx) => {
    ctx.reply(
        "Ассалому алайкум! Қарздорлигингизни кўриш учун пастдаги **'📞 Телефон рақамимни юбориш'** тугмасини босинг:",
        Markup.keyboard([
            [Markup.button.contactRequest("📞 Телефон рақамимни юбориш")]
        ]).resize()
    );
});

// Телефон рақам келганда ишлайдиган қисм (Автоматик боғлаш)
bot.on('contact', async (ctx) => {
    const contact = ctx.message.contact;
    const chatId = ctx.from.id.toString();
    
    // Рақамни тозалаш (+ белгисисиз ва форматга келтириш)
    let userPhone = contact.phone_number.replace(/\D/g, ''); 

    try {
        const debtsRef = ref(db, 'debts');
        const snapshot = await get(debtsRef);

        if (!snapshot.exists()) {
            return ctx.reply("Ҳозирча базада ҳеч қандай маълумот йўқ.");
        }

        const data = snapshot.val();
        let found = false;

        // Mijozlar bazasidan qidirish
        if (data.mijoz) {
            for (let [id, val] of Object.entries(data.mijoz)) {
                let dbPhone = (val.phone || '').replace(/\D/g, '');
                if (dbPhone.includes(userPhone) || userPhone.includes(dbPhone)) {
                    // Telegram ID ni avtomatik yozib qo'yamiz
                    await update(ref(db, `debts/mijoz/${id}`), { chatid: chatId });
                    
                    ctx.reply(
                        `Ҳурматли ${val.name || 'Мижоз'}, рақамингиз база билан муваффақиятли боғланди!\n\n` +
                        `🛒 Товарлар: ${val.items || 'Йўқ'}\n` +
                        `📅 Сана: ${val.date || 'Йўқ'}\n` +
                        `💰 Қарз суммаси: ${Number(val.amount || 0).toLocaleString()} сўм`,
                        Markup.removeKeyboard()
                    );
                    found = true;
                    break;
                }
            }
        }

        // Dukon bazasidan qidirish (agar mijozlardan topilmasa)
        if (!found && data.dukon) {
            for (let [id, val] of Object.entries(data.dukon)) {
                let dbPhone = (val.phone || '').replace(/\D/g, '');
                if (dbPhone.includes(userPhone) || userPhone.includes(dbPhone)) {
                    await update(ref(db, `debts/dukon/${id}`), { chatid: chatId });
                    
                    ctx.reply(
                        `Ҳурматли ${val.name || 'Дўкон'}, рақамингиз база билан боғланди!\n\n` +
                        `💰 Қарз суммаси: ${Number(val.amount || 0).toLocaleString()} сўм`,
                        Markup.removeKeyboard()
                    );
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            ctx.reply("Бу телефон рақам бўйича базада қарздорлик топилмади. Илтимос, дўкон раҳбарига мурожаат қилинг.");
        }

    } catch (error) {
        console.error(error);
        ctx.reply("Маълумотларни текширишда хатолик юз берди.");
    }
});

// Ботни ишга тушириш
bot.launch();
console.log("Бот муваффақиятли ишга тушди!");

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));