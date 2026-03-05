
document.addEventListener('DOMContentLoaded', () => {
    const btnAuto = document.getElementById('btn-auto');
    const btnManual = document.getElementById('btn-manual');
    const btnPrint = document.getElementById('btn-print');
    const manualArea = document.getElementById('manual-input-area');
    const btnSubmitManual = document.getElementById('btn-submit-manual');
    const cardGrid = document.getElementById('card-grid');
    const wordCount = document.getElementById('word-count');
    const statsBar = document.getElementById('stats-bar');

    // Toggle Manual Area
    btnManual.addEventListener('click', () => {
        manualArea.classList.toggle('hidden');
    });

    // Auto-generate click - random selection + alphabetical sort
    btnAuto.addEventListener('click', () => {
        const random50 = getRandomSelection(VOCABULARY_DATA, 50);
        random50.sort((a, b) => a.word.localeCompare(b.word));
        generateCards(random50);
    });

    // Manual Submit
    btnSubmitManual.addEventListener('click', () => {
        const text = document.getElementById('manual-text').value;
        const manualData = parseManualInput(text);
        if (manualData.length > 0) {
            manualData.sort((a, b) => a.word.localeCompare(b.word));
            generateCards(manualData);
            manualArea.classList.add('hidden');
        } else {
            alert('請輸入正確格式的單字內容喔！');
        }
    });

    // Print
    btnPrint.addEventListener('click', () => {
        window.print();
    });

    // Auto-generate on load - random selection + alphabetical sort
    const initialRandom50 = getRandomSelection(VOCABULARY_DATA, 50);
    initialRandom50.sort((a, b) => a.word.localeCompare(b.word));
    generateCards(initialRandom50);

    /**
     * Fisher-Yates Shuffle Algorithm
     */
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        const newArray = [...array]; // Work on a copy

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
        }
        return newArray;
    }

    /**
     * Get a random selection of N items from an array
     */
    function getRandomSelection(array, count) {
        const shuffled = shuffle(array);
        return shuffled.slice(0, count);
    }

    function parseManualInput(text) {
        const lines = text.split('\n');
        const results = [];

        lines.forEach(line => {
            if (!line.trim()) return;
            const parts = line.split('/');
            const head = parts[0] || "";
            const sample = parts[1] || "";

            const wordMatch = head.match(/^([^\[]+)/);
            const ipaMatch = head.match(/\[([^\]]+)\]/);
            const chiMatch = head.replace(/^[^\[]+(\[[^\]]+\])?/, "").trim();

            if (wordMatch) {
                results.push({
                    word: wordMatch[0].trim(),
                    ipa: ipaMatch ? `[${ipaMatch[1]}]` : "",
                    chinese: chiMatch || "無翻譯",
                    sentence: sample.trim().split(/[。！？\s]/)[0] || "No sentence.",
                    translation: sample.trim().replace(/^.+?[\.\?\!]\s*/, "") || ""
                });
            }
        });
        return results;
    }

    function generateCards(data) {
        cardGrid.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'vocab-card';
            card.innerHTML = `
                <div class="word-header">
                    <span class="word-main clickable-text">${item.word}</span>
                    <span class="word-ipa">${item.ipa}</span>
                </div>
                <div class="word-chinese">${item.chinese}</div>
                <div class="sentence-eng clickable-text">${item.sentence}</div>
                <div class="sentence-chi">${item.translation}</div>
            `;

            // Speak word on header click
            card.querySelector('.word-main').addEventListener('click', (e) => {
                e.stopPropagation();
                speak(item.word);
            });

            // Speak sentence on sentence click
            card.querySelector('.sentence-eng').addEventListener('click', (e) => {
                e.stopPropagation();
                speak(item.sentence);
            });

            // General card click = speak word (default behavior)
            card.addEventListener('click', () => {
                speak(item.word);
            });

            cardGrid.appendChild(card);
        });

        wordCount.textContent = data.length;
        statsBar.classList.remove('hidden');

        if (data.length > 0) {
            window.scrollTo({ top: statsBar.offsetTop - 20, behavior: 'smooth' });
        }
    }

    function speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }
});
