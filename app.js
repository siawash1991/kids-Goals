/**
 * Kids Goals - Persian Task Gamification App
 * Liquid Glass Design System
 */

// =====================================================
// DATA & CONSTANTS
// =====================================================

const STORAGE_KEY = 'kidsGoalsData';

const DEFAULT_DATA = {
    childName: '',
    prizeName: '',
    targetXP: 100,
    currentXP: 0,
    setupComplete: false
};

const TASKS = [
    { id: 1, emoji: '🛏️', name: 'مرتب کردن تخت', xp: 1 },
    { id: 2, emoji: '👕', name: 'پوشیدن لباس', xp: 1 },
    { id: 3, emoji: '🧸', name: 'جمع کردن اسباب‌بازی', xp: 2 },
    { id: 4, emoji: '🦷', name: 'مسواک زدن', xp: 1 },
    { id: 5, emoji: '🍽️', name: 'چیدن میز', xp: 2 },
    { id: 6, emoji: '🌵', name: 'آبیاری گل', xp: 3 }
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

function handleSetupSubmit(e) {
    e.preventDefault();

    appData.childName = elements.childNameInput.value.trim();
    appData.prizeName = elements.prizeNameInput.value.trim();
    appData.targetXP = parseInt(elements.targetXPInput.value, 10);
    appData.currentXP = 0;
    appData.setupComplete = true;

    saveData();
    celebrationShown = false;
    renderTasks();
    updateDashboard();
    showScreen('dashboard');
}

function handleSettingsSubmit(e) {
    e.preventDefault();

    const newTargetXP = parseInt(elements.editTargetXP.value, 10);
    const oldTargetXP = appData.targetXP;

    appData.childName = elements.editChildName.value.trim();
    appData.prizeName = elements.editPrizeName.value.trim();
    appData.targetXP = newTargetXP;

    // Reset celebration flag if target changed
    if (newTargetXP !== oldTargetXP) {
        celebrationShown = appData.currentXP >= newTargetXP;
    }

    saveData();
    updateDashboard();
    hideModal(elements.settingsModal);
}

function openSettings() {
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
    updateDashboard();
    hideModal(elements.confirmModal);
}

function handleClearData() {
    if (confirm('همه چیز پاک بشه و از اول شروع کنیم؟')) {
        clearData();
        celebrationShown = false;
        showScreen('setup');
        hideModal(elements.settingsModal);

        // Reset form
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
