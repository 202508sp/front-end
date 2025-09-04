type Entry = {
  id: number;
  focusTarget?: HTMLElement | null;
};

let counter = 0;
const stack: Entry[] = [];

export function pushModal(focusTarget?: HTMLElement | null) {
  const id = ++counter;
  stack.push({ id, focusTarget: focusTarget ?? null });
  applyScrollLock();
  return id;
}

export function popModal(id: number) {
  const idx = stack.findIndex((e) => e.id === id);
  if (idx !== -1) {
    stack.splice(idx, 1);
  }
  applyScrollLock();
  const top = stack[stack.length - 1];
  top?.focusTarget?.focus();
}

export function depth() {
  return stack.length;
}

export function topZ(base = 1000) {
  return base + (stack.length - 1) * 10;
}

function applyScrollLock() {
  const html = document.documentElement;
  if (stack.length > 0) {
    html.classList.add("modal-open");
  } else {
    html.classList.remove("modal-open");
  }
}
