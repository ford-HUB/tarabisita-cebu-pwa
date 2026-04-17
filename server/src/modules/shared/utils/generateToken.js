import crypto from "crypto";
import VerificationCode from "../../auth/VerificationCode.model.js";

export const generateToken = async () => {
    while (true) {
        const genToken = crypto.randomInt(100000, 1000000).toString();
        const existingToken = await VerificationCode.exists({ code: genToken });
        if (!existingToken) {
            return genToken;
        }
    }
};

export const generateResetToken = async () => {
    while (true) {
        const genToken = crypto.randomInt(100000, 1000000).toString();
        const existingToken = await ResetPassword.exists({ token: genToken });
        if (!existingToken) {
            return genToken;
        }
    }
};

export const generateSessionToken = async () => {
    while (true) {
        const genToken = crypto.randomBytes(64).toString('hex');
        const existingToken = await VerificationCode.exists({ sessionToken: genToken });
        if (!existingToken) {
            return genToken;
        }
    }
};