const { chromium } = require('playwright');
const GAMES = +process.argv[2] || 100, DAYS = +process.argv[3] || 150;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await p.goto('' + (process.env.GAME_URL || 'file://' + require('path').resolve(__dirname, '../web/index.html')) + ''); await p.waitForTimeout(300);
  const res = await p.evaluate(async ([GAMES, DAYS]) => {
    const R = Math.random, pk = a => a[Math.floor(R() * a.length)], A = SS.ACT;
    // mini oyunları anında rastgele sonuçla bitir
    const fakeRes = g => ({ got: [], lost: 0, reason: 'time', score: 0, ok: R() < .7, pay: Math.round(R() * 200), tip: 0, quit: R() < .1, right: 10, wrong: 2, missed: 1, win: R() < .5, kills: 3 });
    for (const k of ['scrap', 'deliver', 'repair', 'sort', 'shooter', 'shield', 'whack', 'memory']) { const orig = SS.Games[k]; SS.Games[k] = (...a) => { const cb = a.find(x => typeof x === 'function'); setTimeout(() => cb && cb(fakeRes(k)), 0); }; }
    const w = () => new Promise(r => setTimeout(r, 0));
    const issues = {}, add = (k, d) => { issues[k] = issues[k] || { n: 0, ex: d }; issues[k].n++; };
    const check = tag => {
      const num = (n, v, lo, hi) => { if (typeof v !== 'number' || !isFinite(v)) add(`${n} geçersiz`, `${v} (${tag})`); else if ((lo != null && v < lo - 1e-6) || (hi != null && v > hi + 1e-6)) add(`${n} aralık dışı`, `${Math.round(v)} (${tag}, gün ${S.day})`); };
      num('cash', S.cash, 0); num('energy', S.energy, 0, SS.maxEnergy()); num('hunger', S.hunger, 0, 100); num('health', S.health, 0, 100); num('morale', S.morale, 0, 100); num('loan', S.loan, 0); num('arrears', S.arrears, 0); num('fuel', S.fuel, 0, SS.tankCap()); num('torps', S.torps, 0);
      for (const id of SS.crewList()) num('bond', S.crew[id].bond, 0, 100);
      for (const kk in S.aff) num('aff', S.aff[kk], 0, 100);
      const t = (document.getElementById('app').innerText || '') + (document.getElementById('modal').innerText || ''); const m = t.match(/.{0,20}(NaN|undefined|\[object|Infinity).{0,20}/); if (m) add('metin', m[0] + ' (' + tag + ')');
    };
    let games = 0, days = 0, acts = 0, overs = {};
    for (let gi = 0; gi < GAMES; gi++) {
      const crew = ['pit', 'ela', 'tolga'].filter(() => R() < .5);
      window.S = SS.newState([0, 1, 2].map(() => Math.floor(R() * 3)), R() < .5 ? 'fun' : 'grim', 'F', crew); S.nextEvent = null; SS.newDay([]); S.tut = null;
      if (R() < .3) S.lic = { deliver: 1, repair: 1, sort: 1, order: 1, scrap2: 1, scrap3: 1 };
      if (R() < .3) S.cash += Math.floor(R() * 30000);
      games++;
      for (let d = 0; d < DAYS && !S.over; d++) {
        for (let a = 0; a < 14; a++) {
          const loc = pk(SS.LOCS).id;
          const choices = [
            () => A.go({ to: loc }),
            () => { SS.refreshBoard(); const b = pk(S.board); b && A.job({ id: b.id }); },
            () => { const b = S.board.find(x => x.type === 'sort' && !x.done); b && A.startSort({ id: b.id }); },
            () => A.scrap({ z: pk(SS.ZONES).id }),
            () => A.eat({ id: pk(SS.FOOD).id }), () => A.drink({ id: pk(SS.DRINKS).id }), () => A.nap(),
            () => { SS.refreshStock(); const it = pk(S.stock); it && SS.buyStock(it.key); },
            () => A.sellAll(), () => S.cargo.length && A.sell({ g: 0, n: 'all' }),
            () => A.upgrade({ id: pk(SS.SHIP).id }), () => A.fuel({ n: Math.floor(R() * 80) }),
            () => A.buyShip({ b: R() < .5 ? '1' : '0' }), () => A.pay({ n: pk([100, 500, 'all']) }), () => S.arrears && A.arrears({}),
            () => A.home(), () => A.extra({ id: pk(SS.EXTRAS).id }), () => crew.length && A.room({ id: pk(crew) }),
            () => (S.decorStore || []).length && A.place && A.place({ i: Math.floor(R() * 6), s: 0 }),
            () => crew.length && A.task({ id: pk(crew), t: pk(['with', 'work', 'rest']) }), () => crew.length && A.ability({ id: pk(crew) }),
            () => A.useInv && Object.keys(S.inv).length && A.useInv({ g: pk(Object.keys(S.inv)), t: pk(crew.concat([undefined])) }),
            () => A.talk({ id: pk(SS.NPCS).id }), () => A.heal && A.heal(), () => A.vax(), () => A.train({ id: pk(SS.SKILLS).id }),
            () => A.lesson({ id: pk(SS.LIC_ORDER) }), () => A.quizAns && A.quizAns({ k: pk(['1', '2', '3']) }),
            () => A.casPlay({ g: pk(['wheel', 'dice', 'race', 'slot', 'cards']) }), () => A.wheelSpin(), () => A.diceRoll({ k: pk(['lo', 'hi', 'seven', 'dbl']) }), () => A.raceGo(), () => A.slotPull(), () => A.cardBet && A.cardBet({ b: 10 }), () => A.cardGuess && A.cardGuess({ g: pk(['hi', 'lo']) }), () => A.cardCash && A.cardCash(),
            () => S.decision && A.decide({ i: Math.floor(R() * 3) }),
            () => S.trial && !S.trial.done && pk([() => A.trialPay(), () => A.trialFight(), () => A.trialTolga()])(),
            () => A.adEnergy && (S.today.ads = (S.today.ads || 0) + 1, S.energy = Math.min(SS.maxEnergy(), S.energy + SS.AD.energy)),
            () => A.paint && A.paint({ p: pk(SS.PAINTS).id }), () => A.tint && A.tint({ t: pk(Object.keys(SS.HOME_TINTS || { std: 1 })) }),
            () => { S.view = pk(['map', 'home', 'jobs', 'hangar', 'market', 'cantina', 'clinic', 'krell', 'academy', 'casino', 'log']); S.loc = S.view === 'map' || S.view === 'log' ? S.loc : S.view; SS.render(); },
          ];
          const f = pk(choices);
          const c0 = S.cash, a0 = S.arrears; try { f(); acts++; } catch (e) { add('istisna: ' + e.message, f.toString().slice(0, 80)); }
          if (isFinite(c0) && !isFinite(S.cash)) add('NaN kaynağı (cash)', f.toString().slice(0, 120)); if (isFinite(a0) && !isFinite(S.arrears)) add('NaN kaynağı (arrears)', f.toString().slice(0, 120));
          await w();
          SS.closeModal();
          check('eylem');
        }
        const c1 = S.cash, a1 = S.arrears; try { const L = SS.ledger(); SS.sleep(R() < .5 ? null : new Set(L.filter(i => !i.req && R() < .5).map(i => i.id))); days++; } catch (e) { add('uyku istisnası: ' + e.message, ''); }
        if (isFinite(c1) && !isFinite(S.cash)) add('NaN kaynağı uyku (cash)', JSON.stringify(SS.ledger().filter(i => !isFinite(i.amt)))); if (isFinite(a1) && !isFinite(S.arrears)) add('NaN kaynağı uyku (arrears)', JSON.stringify(SS.ledger().map(i => i.id + ':' + i.amt)));
        check('uyku');
      }
      if (S.over) overs[S.over] = (overs[S.over] || 0) + 1;
    }
    return { games, days, acts, overs, issues };
  }, [GAMES, DAYS]);
  console.log(JSON.stringify(res, null, 1)); console.log('sayfa hataları:', errs.length, errs.slice(0, 6));
  await b.close();
})();
