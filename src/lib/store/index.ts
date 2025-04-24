import type { User } from "firebase/auth";
import { writable, type Writable } from "svelte/store";

const familyLogin: Writable<User | null> = writable(null);

export { familyLogin };
