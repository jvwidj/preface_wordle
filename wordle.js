const testWordList = [
    "apple",
    "alley",
    "paper",
    "melon",
    "zebra",
    "books",
    "cheap",
];

let wordList = {valid: [], playable: []};

const rating = {
    unknown: 0,
    absent: 1,
    present: 2,
    correct: 3,
};

function startGame(round) {
    // 8. load or start the game
    let {
        attemptCount,
        userAttempts,
        highlightedRows,
        keyboard,
        answer,
        status,
    } = loadOrStartGame();

    // 6. stop game if user reached maximum rounds or status is failure or success
    while (attemptCount <= round && status === "in-progress") {
        let currentGuess = prompt("Guess a five letter word: ");
        // 1. Check if word is in word list
        if (isInputCorrect(currentGuess)) {
            // 2. absent (grey), present (yellow), correct (green)
            const highlightedCharacters = getCharactersHighlight(
                currentGuess,
                answer
            );
            highlightedRows.push(highlightedCharacters);
            // 3. highlight keyboard
            keyboard = updateKeyboardHighlights(
                keyboard,
                currentGuess,
                highlightedCharacters
            );
            // 4. update status
            status = updateGameStatus(
                currentGuess,
                answer,
                attemptCount,
                round - 1
            );
            // 5. Update attempt count
            attemptCount = attemptCount + 1;
            // 6. save game
            saveGame({
                attemptCount,
                userAttempts,
                highlightedRows,
                keyboard,
                status,
            });
        } else {
            retry(currentGuess);
        }
    }
    if (status === "success") {
        alert("Congratulations");
    } else {
        alert(`The word is ${answer}`);
    }
}

function isInputCorrect(word) {
    return wordList.playable.includes(word) || wordList.valid.includes(word);
}

function retry(word) {
    alert(`${word} is not in word list`);
}

function getCharactersHighlight(word, answer) {
    // 1. split word into characters
    const charactersArray = word.split("");
    const result = [];

    // 2. check order of characters
    charactersArray.forEach((character, index) => {
        if (character === answer[index]) {
            // 2a. correct = index of word equal index of answer
            result.push("correct");
        } else if (answer.includes(character)) {
            // 2b. present = if not correct, character is part of answer
            result.push("present");
        } else {
            // 2c. absent = else, it must be absent
            result.push("absent");
        }
    });

    return result;
}

function getKeyboard() {
    const alphabets = "abcdefghijklmnopqrstuvwxyz".split("");
    const entries = [];
    for (const alphabet of alphabets) {
        entries.push([alphabet, "unknown"]);
    }
    return Object.fromEntries(entries);
}

function updateKeyboardHighlights(
    keyboard,
    currentGuess,
    highlightedCharacter
) {
    // 5a. use currentGuess ("apple") highlightedCharacters (["correct", "present"...])
    // 5b. compare keyboard["a"] with "correct",
    // if keyboard status < "correct", update keyboard
    const newKeyboard = Object.assign({}, keyboard);

    for (let i = 0; i < highlightedCharacter.length; i++) {
        const character = currentGuess[i]; // R
        const nextStatus = highlightedCharacter[i]; // absent
        const nextRating = rating[nextStatus]; // 1
        const previousStatus = newKeyboard[character]; // unknown
        const previousRating = rating[previousStatus]; // 0

        if (nextRating > previousRating) {
            newKeyboard[character] = nextStatus;
        }
    }

    return newKeyboard;
}

function updateGameStatus(currentGuess, answer, attemptCount, round) {
    if (currentGuess === answer) {
        return "success";
    }
    if (attemptCount === round) {
        return "failure";
    }
    return "in-progress";
}

function saveGame(gameState) {
    window.localStorage.setItem("PREFACE_WORDLE", JSON.stringify(gameState));
}

function getTodaysAnswer() {
    // Starting point of your game
    const offsetFromDate = new Date(2023, 0, 1).getTime();
    // Get today
    const today = new Date().getTime();
    // Calculate ms offset
    const msOffset = today - offsetFromDate;
    // Calculate how many days has pass
    const daysOffset = msOffset / 1000 / 60 / 60 / 24;
    const answerIndex = Math.floor(daysOffset);
    return wordList.playable[answerIndex];
}

function isToday(timestamp) {
    const today = new Date();
    const check = new Date(timestamp);
    return today.toDateString() === check.toDateString();
}

async function loadOrStartGame(debug) {
    wordList = await fetch("./src/fixtures/words.json")
        .then(response => {
            return response.json();
        })
        .then(json => {
            return json;
        });

    let answer;

    if (debug) {
        answer = testWordList[0];
    } else {
        answer = getTodaysAnswer();
    }
    const prevGame = JSON.parse(window.localStorage.getItem("PREFACE_WORDLE"));

    if (prevGame && isToday(prevGame.timestamp)) {
        return {
            ...prevGame,
            answer,
        };
    }
    return {
        attemptCount: 0,
        userAttempts: [],
        highlightedRows: [],
        keyboard: getKeyboard(),
        answer,
        status: "in-progress",
    };
}
