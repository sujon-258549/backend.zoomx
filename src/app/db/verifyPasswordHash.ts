/**
 * Run: pnpm ts-node src/app/db/verifyPasswordHash.ts
 * Hash theke plain password match kore ki na check kora
 */
import bcrypt from "bcrypt";

const HASH =
  "$2b$12$rvC2cyCEaF0ztAsIukKgH.NWKYPRlIEakgP6GUnETfwrHiW42akoC";
const PLAIN_PASSWORD = "password123";

const check = async () => {
  const isMatch = await bcrypt.compare(PLAIN_PASSWORD, HASH);
  console.log("Hash:", HASH);
  console.log("Plain password:", PLAIN_PASSWORD);
  console.log("Match:", isMatch);
  process.exit(0);
};

check();
