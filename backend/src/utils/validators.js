// Registration & password validation helpers

const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@&#_]+$/;
const COUNTRY_CODES = ["+91", "+1", "+44", "+61"];

function normalizeRegistrationInput(body = {}) {
    return {
        username: String(body.username || "").trim(),
        email: String(body.email || "").trim().toLowerCase(),
        countryCode: String(body.countryCode || "").trim(),
        phone: String(body.phone || "").trim(),
        password: String(body.password || ""),
        confirmPassword: String(body.confirmPassword || "")
    };
}

function validateRegistration(data) {
    const errors = [];
    const { username, email, countryCode, phone, password, confirmPassword } = data;

    if (!username) {
        errors.push("Username is required");
    } else if (!USERNAME_REGEX.test(username)) {
        errors.push("Username must contain only alphanumeric characters");
    }

    if (!email) {
        errors.push("Email is required");
    } else if (!EMAIL_REGEX.test(email)) {
        errors.push("Invalid email format");
    }

    if (!countryCode || !COUNTRY_CODES.includes(countryCode)) {
        errors.push("Invalid country code");
    }

    if (!phone) {
        errors.push("Phone number is required");
    } else if (!PHONE_REGEX.test(phone)) {
        errors.push("Phone number must contain exactly 10 digits");
    }

    if (!password) {
        errors.push("Password is required");
    } else if (!PASSWORD_REGEX.test(password)) {
        errors.push("Password must contain alphabets, numbers, and only special characters @, &, _, #");
    }

    if (!confirmPassword) {
        errors.push("Confirm password is required");
    } else if (password !== confirmPassword) {
        errors.push("Passwords do not match");
    }

    return errors;
}

function normalizeLoginInput(body = {}) {
    return {
        username: String(body.username || "").trim(),
        password: String(body.password || "")
    };
}

function validateLogin(data) {
    const errors = [];
    if (!data.username) errors.push("Username is required");
    if (!data.password) errors.push("Password is required");
    return errors;
}

module.exports = {
    USERNAME_REGEX,
    EMAIL_REGEX,
    PHONE_REGEX,
    PASSWORD_REGEX,
    COUNTRY_CODES,
    normalizeRegistrationInput,
    validateRegistration,
    normalizeLoginInput,
    validateLogin
};
