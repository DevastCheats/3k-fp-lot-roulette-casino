function createStars(count) {
    const starsContainer = document.querySelector('.stars');
    starsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.style.position = 'absolute';
        star.style.width = '4px';
        star.style.height = `${Math.random() * 6 + 4}px`;
        star.style.background = 'linear-gradient(to bottom, #fff, rgba(255, 255, 255, 0))';
        star.style.boxShadow = '0 0 8px #fff';
        star.style.borderRadius = '50%';

        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * -1;
        const duration = Math.random() * 3 + 2;

        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        star.style.animation = `fall ${duration}s linear infinite`;

        starsContainer.appendChild(star);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Проверка Telegram Web App с задержкой для инициализации
    setTimeout(() => {
        if (!window.Telegram || !window.Telegram.WebApp) {
            document.body.innerHTML = '<h1 style="color: white; text-align: center;">Доступ возможен только через Telegram</h1>';
            return;
        }

        Telegram.WebApp.ready();
        Telegram.WebApp.expand();

        const grid = document.getElementById('grid');
        const trapCountElement = document.getElementById('trapCount');
        const decreaseButton = document.getElementById('decrease');
        const increaseButton = document.getElementById('increase');
        const mineButton = document.getElementById('mineButton');
        const menuButton = document.getElementById('menuButton');
        const errorMessage = document.getElementById('errorMessage');
        const modal = document.getElementById('inputModal');
        const modalInput = document.getElementById('modalUserInput');
        const modalSubmit = document.getElementById('modalSubmit');
        const modalError = document.getElementById('modalError');
        const chargeCountElement = document.getElementById('chargeCount');
        let trapCount = 1;
        const allowedTraps = [1, 3, 5, 7];
        let isLoading = false;
        let userText = '';
        let hasPlayed = false;
        let charges = 5;

        function loadCharges() {
            const saved = localStorage.getItem('minesCharges');
            const lastReset = localStorage.getItem('minesLastReset');
            const now = Date.now();
            if (saved && lastReset && (now - lastReset < 30 * 60 * 1000)) {
                charges = parseInt(saved);
            } else {
                charges = 5;
                localStorage.setItem('minesCharges', charges);
                localStorage.setItem('minesLastReset', now);
            }
            updateChargeDisplay();
        }

        function saveCharges() {
            localStorage.setItem('minesCharges', charges);
        }

        function updateChargeDisplay() {
            chargeCountElement.textContent = charges;
            if (charges === 0) {
                mineButton.classList.add('disabled');
            }
        }

        setInterval(() => {
            const lastReset = localStorage.getItem('minesLastReset');
            const now = Date.now();
            if (now - lastReset >= 30 * 60 * 1000) {
                charges = 5;
                localStorage.setItem('minesCharges', charges);
                localStorage.setItem('minesLastReset', now);
                mineButton.classList.remove('disabled');
                updateChargeDisplay();
            }
        }, 60000);

        modal.classList.add('active');
        mineButton.classList.add('disabled');

        function updateGrid() {
            grid.innerHTML = '';
            for (let i = 0; i < 25; i++) {
                const button = document.createElement('button');
                button.className = 'grid-button';
                grid.appendChild(button);
            }
        }

        function checkModalInput() {
            const inputValue = modalInput.value.trim();
            if (!inputValue) {
                modalError.textContent = 'Введите ссылку для продолжения!';
                modalError.style.display = 'block';
                return false;
            }
            if (inputValue.length < 6) {
                modalError.textContent = 'Ссылка должна содержать минимум 6 символов!';
                modalError.style.display = 'block';
                return false;
            }
            const cyrillicPattern = /[а-яА-ЯёЁ]/;
            if (cyrillicPattern.test(inputValue)) {
                modalError.textContent = 'Ссылка не должна содержать русские символы!';
                modalError.style.display = 'block';
                return false;
            }
            const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*(\?[\w=&-]*)?\/?$/;
            if (!urlPattern.test(inputValue)) {
                modalError.textContent = 'Введите корректную ссылку!';
                modalError.style.display = 'block';
                return false;
            }
            modalError.style.display = 'none';
            return true;
        }

        function getStarCount(trapCount) {
            switch (trapCount) {
                case 1: return 6;
                case 3: return 5;
                case 5: return 4;
                case 7: return 2;
                default: return 0;
            }
        }

        decreaseButton.addEventListener('click', () => {
            const currentIndex = allowedTraps.indexOf(trapCount);
            if (currentIndex > 0) {
                trapCount = allowedTraps[currentIndex - 1];
                trapCountElement.textContent = trapCount;
            }
        });

        increaseButton.addEventListener('click', () => {
            const currentIndex = allowedTraps.indexOf(trapCount);
            if (currentIndex < allowedTraps.length - 1) {
                trapCount = allowedTraps[currentIndex + 1];
                trapCountElement.textContent = trapCount;
            }
        });

        modalSubmit.addEventListener('click', () => {
            if (checkModalInput()) {
                userText = modalInput.value.trim();
                modal.classList.remove('active');
                mineButton.classList.remove('disabled');
                if (hasPlayed) {
                    hasPlayed = false;
                }
            }
        });

        modalInput.addEventListener('input', checkModalInput);

        mineButton.addEventListener('click', () => {
            if (isLoading || mineButton.classList.contains('disabled') || charges === 0) return;

            if (hasPlayed) {
                modalInput.value = '';
                modal.classList.add('active');
                mineButton.classList.add('disabled');
                return;
            }

            charges--;
            saveCharges();
            updateChargeDisplay();

            isLoading = true;
            mineButton.classList.add('loading');
            const buttons = grid.getElementsByClassName('grid-button');
            for (let button of buttons) {
                button.classList.remove('active');
            }

            const starCount = getStarCount(trapCount);
            const trapIndices = new Set();
            while (trapIndices.size < starCount) {
                const randomIndex = Math.floor(Math.random() * buttons.length);
                trapIndices.add(randomIndex);
            }

            let delay = 0;
            const trapArray = Array.from(trapIndices);
            trapArray.forEach((index, i) => {
                setTimeout(() => {
                    buttons[index].classList.add('active');
                    if (i === trapArray.length - 1) {
                        mineButton.classList.remove('loading');
                        isLoading = false;
                        hasPlayed = true;
                        userText = '';
                    }
                }, delay);
                delay += 500;
            });

            createStars(6);
        });

        menuButton.addEventListener('click', () => {
            Telegram.WebApp.close();
        });

        document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });

        createStars(6);
        updateGrid();
        loadCharges();
    }, 500); // Задержка 500мс для инициализации Telegram Web App
});