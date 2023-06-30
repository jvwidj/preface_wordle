/** Game State (Student) */
const GameState = {
    attemptCount: 0,
    userAttempts: [],
    highlightedRows: [],
    keyboard: getKeyboard(),
    answer: "apple", // Only used for debugging
    status: "in-progress",
    getAttemptCount() {
        return this.attemptCount;
    },
    incrementAttempt() {
        this.attemptCount += 1;
        return this.attemptCount;
    },
    getAnswer() {
        return this.answer;
    },
    getCurrentGuess() {
        let currentGuess = this.userAttempts[this.attemptCount] ?? "";
        return currentGuess;
    },
    getUserAttempt() {
        return this.userAttempts;
    },
    setUserAttempt(currentGuess) {
        this.userAttempts[this.attemptCount] = currentGuess;
        return this.userAttempts;
    },
    getHighlightedRows() {
        return this.highlightedRows;
    },
    setHighlightedRows(highlightedCharacters) {
        this.highlightedRows.push(highlightedCharacters);
        return this.highlightedRows;
    },
    getKeyboard() {
        return this.keyboard;
    },
    setKeyboard(keyboard) {
        this.keyboard = keyboard;
        return this.keyboard;
    },
    getStatus() {
        return this.status;
    },
    setStatus(status) {
        this.status = status;
        return this.status;
    },
    save() {
        saveGame({
            attemptCount: this.attemptCount,
            userAttempts: this.userAttempts,
            highlightedRows: this.highlightedRows,
            keyboard: this.keyboard,
            status: this.status,
            timestamp: new Date().getTime(),
        });
    },
    async loadOrStart(debug) {
        const {
            attemptCount,
            userAttempts,
            highlightedRows,
            keyboard,
            answer,
            status,
        } = await loadOrStartGame(debug);
        this.attemptCount = attemptCount;
        this.userAttempts = userAttempts;
        this.highlightedRows = highlightedRows;
        this.keyboard = keyboard;
        this.answer = answer;
        this.status = status;
    },
};
