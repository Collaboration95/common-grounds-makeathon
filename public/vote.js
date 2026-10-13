// "Vote for The Commons": a card that shows up once you've seen a creature come alive (or after a while).
// The link comes from the server (VOTE_URL); no link, no card. Clicking it or closing it hides it for good.
const DONE = 'commons.voteDone';
const done = () => { try { return !!localStorage.getItem(DONE); } catch { return false; } };
const finish = () => { try { localStorage.setItem(DONE, '1'); } catch { /* private mode */ } };
const link = fetch('/api/vote').then((r) => r.json()).then((d) => d.url || null).catch(() => null);

/** Returns show(delayMs): builds the card once and hands it to place(card). */
export function voteCard(place, { className = 'votecard' } = {}) {
  let armed = true;
  return async (delayMs = 0) => {
    if (!armed) return;
    armed = false;
    const url = await link;
    if (!url || done()) return;
    setTimeout(() => {
      const card = document.createElement('div');
      card.className = className;
      card.innerHTML = `<button type="button" class="vclose" aria-label="Close">×</button>
        <b>Enjoying the Commons?</b>
        <img src="/vote-cover.jpg" alt="The Commons: a room that builds itself" width="800" height="451">
        <a class="vbtn" target="_blank" rel="noopener">Vote for “The Commons” →</a>
        <span>No sign-up. Enter your email, type in the OTP, then pick <b>The Commons</b>.</span>`;
      card.querySelector('.vbtn').href = url;
      card.querySelector('.vbtn').addEventListener('click', () => { finish(); setTimeout(() => card.remove(), 400); });
      card.querySelector('.vclose').addEventListener('click', () => { finish(); card.remove(); });
      place(card);
    }, delayMs);
  };
}
