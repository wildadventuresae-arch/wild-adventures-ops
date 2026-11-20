// Messages fixes envoyés aux clients, dans leur langue (détectée par l'agent IA).
// Les réponses de conversation sont rédigées par l'agent IA ; ceux-ci sont les messages "officiels".

const T = {
  en: {
    confirm: (o) => `Hello ${o.name}, your Wild Adventures booking is confirmed ✅\n📅 ${o.date} at ${o.time}\n🏜️ ${o.activity}${o.options ? '\n➕ ' + o.options : ''}\n💰 ${o.rest > 0 ? 'Remaining to pay on site: ' + o.restTxt : 'Fully paid'}\n📍 Wild Adventures, Al Badayer\nSee you soon!`,
    feedback: (o) => `Hi ${o.name}, thank you for riding with Wild Adventures today! 🏜️ How was your experience? Just reply to this message.`,
    review: (url) => `It would mean a lot to us if you could share your experience on Google:\n${url}`,
    textOnly: () => 'Thanks for your message! Could you please write your request as text? A team member will also get back to you.',
  },
  fr: {
    confirm: (o) => `Bonjour ${o.name}, votre réservation Wild Adventures est confirmée ✅\n📅 ${o.date} à ${o.time}\n🏜️ ${o.activity}${o.options ? '\n➕ ' + o.options : ''}\n💰 ${o.rest > 0 ? 'Reste à payer sur place : ' + o.restTxt : 'Entièrement payé'}\n📍 Wild Adventures, Al Badayer\nÀ très vite !`,
    feedback: (o) => `Bonjour ${o.name}, merci d'avoir roulé avec Wild Adventures aujourd'hui ! 🏜️ Comment s'est passée votre expérience ? Répondez simplement à ce message.`,
    review: (url) => `Un petit avis Google nous aiderait énormément :\n${url}`,
    textOnly: () => "Merci pour votre message ! Pouvez-vous écrire votre demande en texte ? Un membre de l'équipe vous répondra aussi.",
  },
  ru: {
    confirm: (o) => `Здравствуйте, ${o.name}! Ваше бронирование в Wild Adventures подтверждено ✅\n📅 ${o.date}, ${o.time}\n🏜️ ${o.activity}${o.options ? '\n➕ ' + o.options : ''}\n💰 ${o.rest > 0 ? 'Оплата на месте: ' + o.restTxt : 'Полностью оплачено'}\n📍 Wild Adventures, Al Badayer\nДо встречи!`,
    feedback: (o) => `Здравствуйте, ${o.name}! Спасибо, что выбрали Wild Adventures сегодня! 🏜️ Как вам поездка? Просто ответьте на это сообщение.`,
    review: (url) => `Будем очень благодарны за отзыв в Google:\n${url}`,
    textOnly: () => 'Спасибо за сообщение! Напишите, пожалуйста, ваш запрос текстом. Наша команда также свяжется с вами.',
  },
  ar: {
    confirm: (o) => `مرحباً ${o.name}، تم تأكيد حجزك لدى Wild Adventures ✅\n📅 ${o.date} الساعة ${o.time}\n🏜️ ${o.activity}${o.options ? '\n➕ ' + o.options : ''}\n💰 ${o.rest > 0 ? 'المبلغ المتبقي في الموقع: ' + o.restTxt : 'مدفوع بالكامل'}\n📍 Wild Adventures، البداير\nنراك قريباً!`,
    feedback: (o) => `مرحباً ${o.name}، شكراً لاختيارك Wild Adventures اليوم! 🏜️ كيف كانت تجربتك؟ يكفي الرد على هذه الرسالة.`,
    review: (url) => `يسعدنا كثيراً أن تشاركنا رأيك على Google:\n${url}`,
    textOnly: () => 'شكراً لرسالتك! هل يمكنك كتابة طلبك نصاً؟ سيتواصل معك أحد أعضاء الفريق أيضاً.',
  },
};

export const LANGS = Object.keys(T);
export const tx = (lang) => T[LANGS.includes(lang) ? lang : 'en'];
