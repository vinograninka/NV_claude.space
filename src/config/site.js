/*
 * Настройки сайта: бренд и контакты.
 * Если контакты удалить, кнопки «Обсудить задачу» поведут к блоку контактов
 * с нейтральным сообщением, а владелец в превью увидит подсказку.
 */
window.SITE_CONFIG = {
  brand: {
    name: "NV",
    tag: "Claude",
    // Будущий домен — понадобится при переезде (og:image, ссылки).
    domain: "nvclaude.space",
  },

  owner: {
    // Как к вам обращаться. Пустая строка — имя на сайте не показывается.
    name: "",
  },

  contact: {
    // Какой контакт делать основным: "telegram" | "whatsapp" | "phone" | "email" | "booking"
    primary: "telegram",
    // Ник без @
    telegram: "vinograninka",
    // Номер в международном формате, только цифры
    whatsapp: "79853431039",
    phone: "+79853431039",
    // MAX подключён к номеру телефона. Если появится ссылка на профиль (из настроек MAX),
    // впишите её в maxUrl — тогда вместо номера появится кнопка «Написать в MAX».
    maxPhone: "+79853431039",
    maxUrl: "",
    email: "",
    bookingUrl: "",
  },
};

(function (cfg) {
  var c = cfg.contact;
  var links = [];
  if (c.telegram) links.push({ type: "telegram", label: "Написать в Telegram", href: "https://t.me/" + c.telegram.replace(/^@/, "") });
  if (c.maxUrl) links.push({ type: "max", label: "Написать в MAX", href: c.maxUrl });
  if (c.whatsapp) links.push({ type: "whatsapp", label: "Написать в WhatsApp", href: "https://wa.me/" + c.whatsapp.replace(/\D/g, "") });
  if (c.phone) links.push({ type: "phone", label: "Позвонить", href: "tel:" + c.phone.replace(/[^\d+]/g, "") });
  if (c.email) links.push({ type: "email", label: "Написать на почту", href: "mailto:" + c.email });
  if (c.bookingUrl) links.push({ type: "booking", label: "Выбрать время для разговора", href: c.bookingUrl });
  links.sort(function (a, b) { return (b.type === c.primary) - (a.type === c.primary); });

  // Номер для показа: +7 985 343-10-39
  var d = (c.phone || "").replace(/\D/g, "");
  cfg.phoneDisplay = d.length === 11 ? "+" + d[0] + " " + d.slice(1, 4) + " " + d.slice(4, 7) + "-" + d.slice(7, 9) + "-" + d.slice(9) : c.phone;

  cfg.contactLinks = links;
  cfg.isConfigured = function () { return links.length > 0; };
  cfg.primaryHref = function () { return links.length ? links[0].href : "#contact"; };
})(window.SITE_CONFIG);
