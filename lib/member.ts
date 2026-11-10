import { getUser, saveUser, type UserState } from "./store";
import { FIRST_USER, opening } from "./prompt";

export async function loadUser(email: string, nombre: string): Promise<UserState> {
  const u = await getUser(email);
  if (u) return u;
  const nuevo: UserState = {
    email,
    nombre,
    diagnosticos: [],
    chat: [
      { role: "user", content: FIRST_USER },
      { role: "assistant", content: opening(nombre, false) },
    ],
  };
  await saveUser(nuevo);
  return nuevo;
}

/** Messages the person has written in the current conversation (the first one is ours). */
export const usados = (u: UserState) => u.chat.filter((m) => m.role === "user").length - 1;
