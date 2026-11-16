// Classes communes aux écrans d'administration
export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
export const primaryButton = `inline-flex h-11 items-center justify-center gap-2 rounded-full bg-aube px-5 font-bold text-abysse motion-safe:transition hover:bg-aube-survol disabled:cursor-wait disabled:opacity-60 ${focusRing}`;
export const secondaryButton = `inline-flex h-11 items-center justify-center gap-2 rounded-full border border-contour px-5 font-bold motion-safe:transition hover:bg-stratosphere-haute disabled:opacity-60 ${focusRing}`;
export const smallButton = `inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-contour px-3 text-sm font-bold motion-safe:transition hover:bg-stratosphere-haute disabled:opacity-60 ${focusRing}`;
export const inputClass = `h-11 w-full rounded-champ border border-contour bg-stratosphere-haute px-3 text-neige ${focusRing}`;
export const tableClass = 'w-full text-left text-sm';
export const thClass = 'p-3 font-bold text-brume';
export const tdClass = 'p-3 align-middle';
