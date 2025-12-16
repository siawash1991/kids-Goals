/**
 * Kids Goals - Persian Task Gamification App
 * Liquid Glass Design System
 * With Google Sheets Integration
 */

// =====================================================
// DATA & CONSTANTS
// =====================================================

const STORAGE_KEY = 'kidsGoalsData';

// Lead collection webhook - always sends registration data here
const LEAD_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzFw9OkHBpEYdHGoRzUBQ6TPJwzbRRTfLlqB0V99Zggp7-VA6ymXzU_8sFG7omNHe264w/exec';

const DEFAULT_DATA = {
    // Parent info
    parentName: '',
    mobileNumber: '',
    email: '',
    // Child info
    childName: '',
    prizeName: '',
    targetXP: 100,
    currentXP: 0,
    setupComplete: false,
    // Google Sheets integration
    webhookUrl: '',
    // Timestamps
    createdAt: null,
    lastUpdated: null
};

// Updated tasks based on user request
const TASKS = [
    { id: 1, emoji: '🍽️', name: 'تنهایی غذا خوردن', xp: 3 },
    { id: 2, emoji: '📚', name: 'انجام دادن تکالیف', xp: 3 },
    { id: 3, emoji: '🧼', name: 'شستن دست و مسواک زدن', xp: 2 },
    { id: 4, emoji: '🧸', name: 'جمع کردن اسباب‌بازی', xp: 2 },
    { id: 5, emoji: '👕', name: 'جمع کردن لباس', xp: 2 },
    { id: 6, emoji: '🏃', name: 'ورزش کردن', xp: 2 },
    { id: 7, emoji: '📖', name: 'کتاب خوندن', xp: 2 },
    { id: 8, emoji: '🍴', name: 'کمک در جمع و انداختن سفره', xp: 2 }
];

const MESSAGES = [
    { min: 0, max: 20, text: 'تشنمه! بهم امتیاز بده!' },
    { min: 21, max: 40, text: 'دارم جون می‌گیرم...' },
    { min: 41, max: 60, text: 'آفرین! ادامه بده!' },
    { min: 61, max: 80, text: 'خیلی نزدیکیم!' },
    { min: 81, max: 99, text: 'فقط یکم دیگه!' },
    { min: 100, max: 100, text: 'رسیدیم! 🎉' }
];

const CONFETTI_COLORS = ['#FFC107', '#4CAF50', '#E91E63', '#00BCD4', '#9C27B0', '#FF5722'];
const CELEBRATION_EMOJIS = ['🎉', '🎊', '🥳', '✨', '🌟', '💫'];

// =====================================================
// STATE MANAGEMENT
// =====================================================

let appData = { ...DEFAULT_DATA };
let coinSound = null;
let celebrationShown = false;

// =====================================================
// DOM ELEMENTS
// =====================================================

const elements = {
    // Screens
    setupScreen: document.getElementById('setup-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),

    // Setup Form
    setupForm: document.getElementById('setup-form'),
    parentNameInput: document.getElementById('parent-name'),
    mobileNumberInput: document.getElementById('mobile-number'),
    emailInput: document.getElementById('email'),
    childNameInput: document.getElementById('child-name'),
    prizeNameInput: document.getElementById('prize-name'),
    targetXPInput: document.getElementById('target-xp'),
    targetXPDisplay: document.getElementById('target-xp-display'),

    // Dashboard
    displayName: document.getElementById('display-name'),
    currentXPHeader: document.getElementById('current-xp-header'),
    targetXPHeader: document.getElementById('target-xp-header'),
    currentXPDisplay: document.getElementById('current-xp-display'),
    targetXPDisplayDashboard: document.getElementById('target-xp-display-dashboard'),
    prizeDisplay: document.getElementById('prize-display'),
    speechBubble: document.getElementById('speech-bubble'),
    cactusMessage: document.getElementById('cactus-message'),
    cactusFill: document.getElementById('cactus-fill'),
    progressBar: document.getElementById('progress-bar'),
    tasksGrid: document.getElementById('tasks-grid'),

    // Buttons
    settingsBtn: document.getElementById('settings-btn'),
    resetBtn: document.getElementById('reset-btn'),

    // Settings Modal
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    settingsForm: document.getElementById('settings-form'),
    editParentName: document.getElementById('edit-parent-name'),
    editMobile: document.getElementById('edit-mobile'),
    editEmail: document.getElementById('edit-email'),
    editChildName: document.getElementById('edit-child-name'),
    editPrizeName: document.getElementById('edit-prize-name'),
    editTargetXP: document.getElementById('edit-target-xp'),
    editTargetXPDisplay: document.getElementById('edit-target-xp-display'),
    clearDataBtn: document.getElementById('clear-data-btn'),

    // Confirm Modal
    confirmModal: document.getElementById('confirm-modal'),
    confirmCancel: document.getElementById('confirm-cancel'),
    confirmYes: document.getElementById('confirm-yes'),

    // Celebration Modal
    celebrationModal: document.getElementById('celebration-modal'),
    celebrationEmoji: document.getElementById('celebration-emoji'),
    celebrationPrize: document.getElementById('celebration-prize'),
    celebrationClose: document.getElementById('celebration-close'),
    confettiContainer: document.getElementById('confetti-container'),

    // Audio
    coinSoundEl: document.getElementById('coin-sound')
};

// =====================================================
// STORAGE FUNCTIONS
// =====================================================

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            appData = { ...DEFAULT_DATA, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Error loading data:', e);
        appData = { ...DEFAULT_DATA };
    }
}

function saveData() {
    try {
        appData.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

function clearData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        appData = { ...DEFAULT_DATA };
    } catch (e) {
        console.error('Error clearing data:', e);
    }
}

// =====================================================
// GOOGLE SHEETS INTEGRATION
// =====================================================

async function sendToGoogleSheets(action = 'update') {
    const payload = {
        action: action,
        timestamp: new Date().toISOString(),
        parentName: appData.parentName,
        mobileNumber: appData.mobileNumber,
        email: appData.email,
        childName: appData.childName,
        prizeName: appData.prizeName,
        targetXP: appData.targetXP,
        currentXP: appData.currentXP,
        progress: Math.round((appData.currentXP / appData.targetXP) * 100),
        createdAt: appData.createdAt
    };

    // Always send registration data to lead collection webhook
    if (action === 'registration' && LEAD_WEBHOOK_URL) {
        try {
            await fetch(LEAD_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            console.log('Lead data sent to Google Sheets');
        } catch (e) {
            console.error('Error sending lead data:', e);
        }
    }

    // Also send to user's custom webhook if configured
    if (appData.webhookUrl) {
        try {
            await fetch(appData.webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            console.log('Data sent to custom webhook');
        } catch (e) {
            console.error('Error sending to custom webhook:', e);
        }
    }
}

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================

function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =====================================================
// UI UPDATE FUNCTIONS
// =====================================================

function showScreen(screenName) {
    elements.setupScreen.classList.add('hidden');
    elements.dashboardScreen.classList.add('hidden');

    if (screenName === 'setup') {
        elements.setupScreen.classList.remove('hidden');
    } else if (screenName === 'dashboard') {
        elements.dashboardScreen.classList.remove('hidden');
    }
}

function updateDashboard() {
    // Update text displays
    elements.displayName.textContent = appData.childName;
    elements.currentXPHeader.textContent = appData.currentXP;
    elements.targetXPHeader.textContent = appData.targetXP;
    elements.currentXPDisplay.textContent = appData.currentXP;
    elements.targetXPDisplayDashboard.textContent = appData.targetXP;
    elements.prizeDisplay.textContent = appData.prizeName;

    // Calculate progress percentage
    const progress = Math.min((appData.currentXP / appData.targetXP) * 100, 100);

    // Update progress bar
    elements.progressBar.style.width = `${progress}%`;

    // Update cactus fill
    updateCactus(progress);

    // Update message
    updateMessage(progress);
}

function updateCactus(progress) {
    const cactusFill = elements.cactusFill;
    const maxHeight = 150; // Height of cactus body
    const fillHeight = (progress / 100) * maxHeight;
    const yPosition = 160 - fillHeight;

    cactusFill.setAttribute('height', fillHeight);
    cactusFill.setAttribute('y', yPosition);

    // Update cactus color based on progress
    if (progress >= 100) {
        cactusFill.style.fill = '#2E7D32';
    } else if (progress >= 60) {
        cactusFill.style.fill = '#4CAF50';
    } else if (progress >= 30) {
        cactusFill.style.fill = '#81C784';
    } else {
        cactusFill.style.fill = '#A5D6A7';
    }

    // Animate mouth based on progress
    const mouth = document.getElementById('cactus-mouth');
    if (mouth) {
        if (progress >= 80) {
            mouth.setAttribute('d', 'M55 55 Q60 65 65 55'); // Big smile
        } else if (progress >= 50) {
            mouth.setAttribute('d', 'M55 55 Q60 62 65 55'); // Medium smile
        } else if (progress >= 20) {
            mouth.setAttribute('d', 'M55 58 Q60 58 65 58'); // Neutral
        } else {
            mouth.setAttribute('d', 'M55 60 Q60 55 65 60'); // Sad
        }
    }
}

function updateMessage(progress) {
    let message = MESSAGES[0].text;

    for (const m of MESSAGES) {
        if (progress >= m.min && progress <= m.max) {
            message = m.text;
            break;
        }
    }

    elements.cactusMessage.textContent = message;
}

function renderTasks() {
    elements.tasksGrid.innerHTML = '';

    TASKS.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.tabIndex = 0;
        taskCard.setAttribute('role', 'button');
        taskCard.setAttribute('aria-label', `${task.name} - ${task.xp} امتیاز`);

        taskCard.innerHTML = `
            <span class="task-emoji">${task.emoji}</span>
            <span class="task-name">${task.name}</span>
            <span class="task-xp">+${task.xp} 💧</span>
        `;

        taskCard.addEventListener('click', (e) => handleTaskClick(task, e));
        taskCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTaskClick(task, e);
            }
        });

        elements.tasksGrid.appendChild(taskCard);
    });
}

// =====================================================
// EVENT HANDLERS
// =====================================================

function handleTaskClick(task, event) {
    // Add XP
    appData.currentXP += task.xp;
    saveData();

    // Send to Google Sheets
    sendToGoogleSheets('task_complete');

    // Play sound
    playSound();

    // Animate card
    const card = event.currentTarget;
    card.classList.add('clicked');
    setTimeout(() => card.classList.remove('clicked'), 400);

    // Show floating XP popup
    showXPPopup(task.xp, event);

    // Update dashboard
    updateDashboard();

    // Check for celebration
    checkCelebration();
}

function showXPPopup(xp, event) {
    const popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.textContent = `+${xp} 💧`;

    // Position near the clicked element
    const rect = event.currentTarget.getBoundingClientRect();
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top}px`;

    document.body.appendChild(popup);

    // Remove after animation
    setTimeout(() => popup.remove(), 1000);
}

function playSound() {
    if (elements.coinSoundEl) {
        elements.coinSoundEl.currentTime = 0;
        elements.coinSoundEl.play().catch(() => {
            // Audio play failed, likely due to autoplay policy
        });
    }
}

function checkCelebration() {
    if (appData.currentXP >= appData.targetXP && !celebrationShown) {
        celebrationShown = true;
        sendToGoogleSheets('goal_reached');
        showCelebration();
    }
}

function showCelebration() {
    elements.celebrationPrize.textContent = appData.prizeName;

    // Animate emoji
    let emojiIndex = 0;
    const emojiInterval = setInterval(() => {
        elements.celebrationEmoji.textContent = CELEBRATION_EMOJIS[emojiIndex % CELEBRATION_EMOJIS.length];
        emojiIndex++;
    }, 300);

    // Create confetti
    createConfetti();

    // Show modal
    elements.celebrationModal.classList.remove('hidden');

    // Stop emoji animation after a while
    setTimeout(() => {
        clearInterval(emojiInterval);
        elements.celebrationEmoji.textContent = '🎉';
    }, 3000);
}

function createConfetti() {
    elements.confettiContainer.innerHTML = '';

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.animationDuration = `${2 + Math.random() * 2}s`;

        elements.confettiContainer.appendChild(confetti);
    }
}

function hideCelebration() {
    elements.celebrationModal.classList.add('hidden');
    elements.confettiContainer.innerHTML = '';
}

function showModal(modal) {
    modal.classList.remove('hidden');
}

function hideModal(modal) {
    modal.classList.add('hidden');
}

// =====================================================
// FORM HANDLERS
// =====================================================

function validateMobileNumber(number) {
    // Iranian mobile number format: 09XXXXXXXXX
    const pattern = /^09[0-9]{9}$/;
    return pattern.test(number);
}

function convertPersianToEnglishDigits(str) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    for (let i = 0; i < 10; i++) {
        str = str.replace(new RegExp(persianDigits[i], 'g'), i);
        str = str.replace(new RegExp(arabicDigits[i], 'g'), i);
    }
    return str;
}

function handleSetupSubmit(e) {
    e.preventDefault();

    // Get and convert mobile number
    const mobileNumber = convertPersianToEnglishDigits(elements.mobileNumberInput.value.trim());

    // Validate mobile number
    if (!validateMobileNumber(mobileNumber)) {
        showToast('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود', 'error');
        elements.mobileNumberInput.focus();
        return;
    }

    // Save data
    appData.parentName = elements.parentNameInput.value.trim();
    appData.mobileNumber = mobileNumber;
    appData.email = elements.emailInput.value.trim();
    appData.childName = elements.childNameInput.value.trim();
    appData.prizeName = elements.prizeNameInput.value.trim();
    appData.targetXP = parseInt(elements.targetXPInput.value, 10);
    appData.currentXP = 0;
    appData.setupComplete = true;
    appData.createdAt = new Date().toISOString();

    saveData();

    // Send to Google Sheets
    sendToGoogleSheets('registration');

    celebrationShown = false;
    renderTasks();
    updateDashboard();
    showScreen('dashboard');

    showToast('خوش آمدی! بیا شروع کنیم 🌱', 'success');
}

function handleSettingsSubmit(e) {
    e.preventDefault();

    const newTargetXP = parseInt(elements.editTargetXP.value, 10);
    const oldTargetXP = appData.targetXP;
    const mobileNumber = convertPersianToEnglishDigits(elements.editMobile.value.trim());

    // Validate mobile number if provided
    if (mobileNumber && !validateMobileNumber(mobileNumber)) {
        showToast('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود', 'error');
        elements.editMobile.focus();
        return;
    }

    appData.parentName = elements.editParentName.value.trim();
    appData.mobileNumber = mobileNumber;
    appData.email = elements.editEmail.value.trim();
    appData.childName = elements.editChildName.value.trim();
    appData.prizeName = elements.editPrizeName.value.trim();
    appData.targetXP = newTargetXP;

    // Reset celebration flag if target changed
    if (newTargetXP !== oldTargetXP) {
        celebrationShown = appData.currentXP >= newTargetXP;
    }

    saveData();

    // Send update to Google Sheets
    sendToGoogleSheets('settings_update');

    updateDashboard();
    hideModal(elements.settingsModal);
    showToast('تنظیمات ذخیره شد ✓', 'success');
}

function openSettings() {
    elements.editParentName.value = appData.parentName;
    elements.editMobile.value = appData.mobileNumber;
    elements.editEmail.value = appData.email;
    elements.editChildName.value = appData.childName;
    elements.editPrizeName.value = appData.prizeName;
    elements.editTargetXP.value = appData.targetXP;
    elements.editTargetXPDisplay.textContent = appData.targetXP;
    showModal(elements.settingsModal);
}

function handleReset() {
    showModal(elements.confirmModal);
}

function confirmReset() {
    appData.currentXP = 0;
    celebrationShown = false;
    saveData();

    // Send reset to Google Sheets
    sendToGoogleSheets('progress_reset');

    updateDashboard();
    hideModal(elements.confirmModal);
    showToast('امتیازات صفر شد. از اول شروع کن! 💪', 'success');
}

function handleClearData() {
    if (confirm('همه چیز پاک بشه و از اول شروع کنیم؟')) {
        clearData();
        celebrationShown = false;
        showScreen('setup');
        hideModal(elements.settingsModal);

        // Reset form
        elements.parentNameInput.value = '';
        elements.mobileNumberInput.value = '';
        elements.emailInput.value = '';
        elements.childNameInput.value = '';
        elements.prizeNameInput.value = '';
        elements.targetXPInput.value = 100;
        elements.targetXPDisplay.textContent = '100';
    }
}

// =====================================================
// RANGE SLIDER UPDATES
// =====================================================

function setupRangeListeners() {
    elements.targetXPInput.addEventListener('input', () => {
        elements.targetXPDisplay.textContent = elements.targetXPInput.value;
    });

    elements.editTargetXP.addEventListener('input', () => {
        elements.editTargetXPDisplay.textContent = elements.editTargetXP.value;
    });
}

// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {
    // Setup form
    elements.setupForm.addEventListener('submit', handleSetupSubmit);

    // Dashboard buttons
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.resetBtn.addEventListener('click', handleReset);

    // Settings modal
    elements.closeSettings.addEventListener('click', () => hideModal(elements.settingsModal));
    elements.settingsForm.addEventListener('submit', handleSettingsSubmit);
    elements.clearDataBtn.addEventListener('click', handleClearData);

    // Confirm modal
    elements.confirmCancel.addEventListener('click', () => hideModal(elements.confirmModal));
    elements.confirmYes.addEventListener('click', confirmReset);

    // Celebration modal
    elements.celebrationClose.addEventListener('click', hideCelebration);

    // Modal overlays (close on click)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal && modal !== elements.celebrationModal) {
                hideModal(modal);
            }
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!elements.settingsModal.classList.contains('hidden')) {
                hideModal(elements.settingsModal);
            }
            if (!elements.confirmModal.classList.contains('hidden')) {
                hideModal(elements.confirmModal);
            }
            if (!elements.celebrationModal.classList.contains('hidden')) {
                hideCelebration();
            }
        }
    });

    // Range sliders
    setupRangeListeners();

    // Auto-convert Persian digits in mobile input
    elements.mobileNumberInput.addEventListener('input', (e) => {
        e.target.value = convertPersianToEnglishDigits(e.target.value);
    });

    if (elements.editMobile) {
        elements.editMobile.addEventListener('input', (e) => {
            e.target.value = convertPersianToEnglishDigits(e.target.value);
        });
    }
}

// =====================================================
// INITIALIZATION
// =====================================================

function init() {
    loadData();
    setupEventListeners();

    if (appData.setupComplete) {
        renderTasks();
        updateDashboard();
        showScreen('dashboard');

        // Check if already at goal
        celebrationShown = appData.currentXP >= appData.targetXP;
    } else {
        showScreen('setup');
    }

    // Preload audio
    if (elements.coinSoundEl) {
        elements.coinSoundEl.load();
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
