/** Wait for Content to load */
document.addEventListener("DOMContentLoaded", async () => {
    /** Constants that contain elements on the screen */
    // Get all 30 tiles
    const TILES = Array.from(document.querySelectorAll(".tile"));
    // Get all 6 rows
    const ROWS = document.querySelectorAll(".row");
    // First get the keyboard
    const KEYBOARD = document.querySelector("#keyboard");
    // Then get each key on the keyboard
    const KEYBOARD_KEYS = KEYBOARD.querySelectorAll("button");

    /** Start the whole game (Student) */
    async function startWebGame() {
        await GameState.loadOrStart();
        paintGameState();
        startInteraction();
    }

    /** Bind events */
    function startInteraction() {
        const keyboardElement = document.getElementById("keyboard");
        keyboardElement.addEventListener("click", handleClickEvent);
        document.addEventListener("keydown", handlePressEvent);
    }

    /** Unbind events during animation */
    function stopInteraction() {
        const keyboardElement = document.getElementById("keyboard");
        keyboardElement.removeEventListener("click", handleClickEvent);
        document.removeEventListener("keydown", handlePressEvent);
    }

    /** Button click events on the keyboard elements */
    function handleClickEvent(event) {
        const button = event.target;
        if (!(button instanceof HTMLButtonElement)) {
            return;
        }
        let key = button.dataset.key;
        if (!key) {
            return;
        }
        pressKey(key);
    }

    /** Keyboard press events on the document */
    function handlePressEvent(event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
            return;
        }
        const key = event.key;
        pressKey(key);
    }

    /** Handle keypress (Student) */
    function pressKey(key) {
        const status = GameState.getStatus();

        if (status !== "in-progress") {
            return;
        }

        const currentGuess = GameState.getCurrentGuess();

        let next = Array.from(TILES).findIndex(
            tileEle => tileEle.innerText === ""
        );

        if (next === -1) {
            next = MAX_ATTEMPTS * WORD_LENGTH;
        }

        const regex = new RegExp("^[a-zA-Z]$");

        if (regex.test(key)) {
            handleAlphabetKey(currentGuess, key, next);
        } else if (key === "Backspace" || key === "Delete") {
            handleDeleteKey(currentGuess, next);
        } else if (key === "Enter") {
            handleSubmitKey(currentGuess, next);
        }
    }

    /** Handle a valid keypress (Student) */
    function handleAlphabetKey(currentGuess, key, next) {
        const currentLength = currentGuess.length;
        if (currentLength === WORD_LENGTH) {
            return;
        }
        const nextTile = TILES[next];
        nextTile.textContent = key;
        nextTile.dataset.status = "tbd";
        nextTile.dataset.animation = "pop";
        // Appends to the last word in user attempts
        // eg. "b" -> "ba" -> "bat"
        GameState.setUserAttempt(currentGuess + key);
    }

    /** Handle delete (Student) */
    function handleDeleteKey(currentGuess, next) {
        if (currentGuess === "") {
            return;
        }
        const currentLength = currentGuess.length;
        const lastTile = TILES[next - 1];
        lastTile.textContent = "";
        lastTile.dataset.status = "empty";
        lastTile.removeAttribute("data-animation");
        // Remove the last character
        // eg. "bat" -> "ba" -> "b" -> ""
        currentGuess = currentGuess.slice(0, currentLength - 1);
        GameState.setUserAttempt(currentGuess);
    }

    /** Handle Submit (Student) */
    async function handleSubmitKey(currentGuess) {
        if (currentGuess.length < WORD_LENGTH) {
            return;
        }

        const answer = GameState.getAnswer();
        const oldKeyboard = GameState.getKeyboard();
        const attemptCount = GameState.getAttemptCount();

        /********* Move code from wordle.js to here ********/
        // 1. Check if word is in word list
        if (isInputCorrect(currentGuess)) {
            // 2. absent (grey), present (yellow), correct (green)
            const highlightedCharacters = getCharactersHighlight(
                currentGuess,
                answer
            );
            GameState.setHighlightedRows(highlightedCharacters);
            // 3. highlight keyboard
            const newKeyboard = updateKeyboardHighlights(
                oldKeyboard,
                currentGuess,
                highlightedCharacters
            );
            GameState.setKeyboard(newKeyboard);
            // 4. update status
            const newStatus = updateGameStatus(
                currentGuess,
                answer,
                attemptCount,
                MAX_ATTEMPTS - 1 // MAX_ATTEMPT is 1-based
            );
            GameState.setStatus(newStatus);
            // 5. Update attempt count
            GameState.incrementAttempt();
            // 6. Save game
            GameState.save();
            /*********************************************/
            // 7. Paint Attempt (can see the changes on website)
            // a. On the attempt row: Flip tile + Color tile
            // b. Color the keyboard
            await paintAttempt(
                attemptCount,
                highlightedCharacters,
                newKeyboard
            );
            // 8. Paint the result of success or failure
            await paintResult(newStatus, answer, attemptCount);

            console.log("GAME_STATE", GameState);
        } else {
            // Handle wrong words
            shakeRow(currentGuess, attemptCount);
        }
    }

    /** Painting One Attempt (Student) */
    async function paintAttempt(attempt, highlightedCharacters) {
        stopInteraction();
        await paintRow(attempt, highlightedCharacters);
        paintKeyboard();
        startInteraction();
    }

    /** Shaking a row on the board (Student) */
    function shakeRow(currentGuess, index) {
        stopInteraction();

        alert(`${currentGuess.toUpperCase()} not in world list`);

        ROWS[index].dataset.status = "invalid";
        ROWS[index].onanimationend = () => {
            ROWS[index].removeAttribute("data-status");
            startInteraction();
        };
    }

    /** Painting a row on the board (Student) */
    async function paintRow(index, evaluation) {
        const row = ROWS[index];
        const tileRow = row.querySelectorAll(".tile");

        return new Promise(resolve => {
            tileRow.forEach((tile, index) => {
                tile.dataset.animation = "flip";
                tile.style.animationDelay = `${index * FLIP_SPEED}ms`;
                tile.onanimationstart = () => {
                    setTimeout(
                        () => (tile.dataset.status = evaluation[index]),
                        FLIP_SPEED / 2
                    );
                };
                if (index === WORD_LENGTH - 1) {
                    tile.onanimationend = resolve;
                }
            });
        });
    }
    /** Handle game status animation (Student) */
    async function paintResult(newStatus, answer, index) {
        if (newStatus === "in-progress") {
            // Game is still in-progress, so nothing to paint or unbind
            return;
        }

        // If success or failed, stop interaction
        stopInteraction();

        if (newStatus === "success") {
            handleSuccessAnimation(index);
        } else {
            alert(`The word was ${answer.toUpperCase()}`);
        }
    }

    /** When game ends and status is success (Student) */
    function handleSuccessAnimation(index) {
        const row = ROWS[index];
        const tileRow = row.querySelectorAll(".tile");

        for (let i = 0; i < WORD_LENGTH; i++) {
            tileRow[i].dataset.animation = "win";
            tileRow[i].style.animationDelay = `${i * 100}ms`;

            if (i === WORD_LENGTH - 1) {
                tileRow[i].onanimationend = () => {
                    console.log("first");
                    alert(`${CONGRATULATIONS[index]}!`);
                };
            }
        }
    }

    /** Highligh keyboard keys (Student) */
    function paintKeyboard() {
        const newKeyboard = GameState.getKeyboard();

        KEYBOARD_KEYS.forEach(keyEl => {
            const key = keyEl.dataset.key;
            const newStatus = newKeyboard[key];
            keyEl.dataset.status = newStatus;
        });
    }

    /** Painting a whole Game State (Student) */
    async function paintGameState() {
        const attemptCount = GameState.getAttemptCount();

        // Start of a new game so game state is empty
        if (attemptCount === 0) {
            return;
        }

        const evaluation = GameState.getHighlightedRows();
        const userAttempts = GameState.getUserAttempt();

        const previousChars = userAttempts.flatMap(word => [...word.split("")]);

        paintKeyboard();

        previousChars.forEach((char, i) => {
            TILES[i].textContent = char;
            TILES[i].dataset.status = "reveal";
        });

        for (let col = 0; col < WORD_LENGTH; col++) {
            for (let row = 0; row < attemptCount; row++) {
                const idx = row * WORD_LENGTH + col;
                TILES[idx].dataset.animation = "flip";
                TILES[idx].style.animationDelay = `${col * FLIP_SPEED}ms`;
                TILES[idx].onanimationstart = () => {
                    setTimeout(() => {
                        TILES[idx].dataset.status = evaluation[row][col];
                    }, FLIP_SPEED / 2);
                };
            }
        }
    }

    await startWebGame();
});
