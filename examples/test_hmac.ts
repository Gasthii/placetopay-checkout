import WebhookVerifier from "../src/services/webhookVerifier";
import { createHmac } from "crypto";

const secret = "MY_SECRET_KEY";
const verifier = new WebhookVerifier(secret);

// Simulate a raw body
const body = JSON.stringify({
    time: "2024-11-14T05:50:15-05:00",
    type: "chargeback.created",
    data: { some: "data" }
});

// Generate valid signature
const validSignature = createHmac("sha256", secret).update(body).digest("hex");

console.log("Testing HMAC Verification...");

// Test 1: Valid Signature
const isValid = verifier.verifyHmac(body, validSignature);
console.log(`Test 1 (Valid): ${isValid ? "PASS" : "FAIL"}`);

// Test 2: Invalid Signature
const isInvalid = verifier.verifyHmac(body, "invalid_signature");
console.log(`Test 2 (Invalid Signature): ${!isInvalid ? "PASS" : "FAIL"}`);

// Test 3: Tampered Body
const tamperedBody = body + " ";
const isTampered = verifier.verifyHmac(tamperedBody, validSignature);
console.log(`Test 3 (Tampered Body): ${!isTampered ? "PASS" : "FAIL"}`);

if (isValid && !isInvalid && !isTampered) {
    console.log("ALL TESTS PASSED");
    process.exit(0);
} else {
    console.error("SOME TESTS FAILED");
    process.exit(1);
}
