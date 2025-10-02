// userState.js
// Simple in-memory user/session management

const userState = {};

function getUser(from) {
    if (!userState[from]) userState[from] = {};
    return userState[from];
}

function setUser(from, data) {
    userState[from] = { ...userState[from], ...data };
}

function resetUser(from) {
    userState[from] = {};
}

module.exports = { userState, getUser, setUser, resetUser };
