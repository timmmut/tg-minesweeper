// Глобальный объект для взаимодействия с Telegram WebApp
let tg = window.Telegram.WebApp;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Сообщить Telegram, что мини-приложение готово к отображению
    tg.ready();
    
    // Установить цвета темы Telegram в CSS переменные
    applyTelegramTheme();
    
    // Установить размер главного экрана
    tg.expand();
});

// Применение цветовой схемы Telegram к приложению
function applyTelegramTheme() {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#3390ec');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
}

// Получение информации о пользователе
function getUserInfo() {
    return tg.initDataUnsafe?.user || { id: 0, first_name: 'Гость' };
}

// Функция для эмуляции вибрации на устройстве пользователя
function vibrate(options) {
    if (tg.isVersionAtLeast('6.1')) {
        tg.HapticFeedback.notificationOccurred(options || 'error');
    }
}

// Функция для будущей интеграции со Звездами Telegram
function initPayments() {
    // Проверяем, поддерживает ли клиент платежи
    if (tg.isVersionAtLeast('6.1') && tg.isPremium) {
        // Здесь будет код для работы со Звездами
        return true;
    }
    return false;
}

// Экспорт функций для использования в основном скрипте
window.telegramAPI = {
    getUserInfo,
    vibrate,
    initPayments
}; 