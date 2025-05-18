const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const deck = [];
const players = [];
let pile = [];
let pileType = null;
let currentPlayerIndex = 0;
let selectedCards = [];

let lastPairRank = null; // Pour règle "ou rien"
let consecutivePairsCount = 0;

let ranking = [];

function createDeck() {
  deck.length = 0;
  ['♠', '♥', '♦', '♣'].forEach(suit => {
    ranks.forEach(rank => {
      deck.push(rank + suit);
    });
  });
}

function shuffle(array) {
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getRank(card) {
  return card.slice(0, card.length - 1);
}

function isSameRank(cards) {
  if (cards.length === 0) return false;
  const r = getRank(cards[0]);
  return cards.every(c => getRank(c) === r);
}

function startGame() {
  const num = parseInt(document.getElementById('numPlayers').value);
  if (num < 2 || num > 5) {
    alert("Choisis entre 2 et 5 joueurs.");
    return;
  }
  players.length = 0;
  ranking = [];
  createDeck();
  shuffle(deck);

  for(let i=0; i<num; i++) {
    players.push({
      name: 'Joueur ' + (i+1),
      hand: [],
      finished: false,
      hasPassed: false,
    });
  }

  let idx = 0;
  deck.forEach(card => {
    players[idx].hand.push(card);
    idx = (idx +1) % num;
  });

  players.forEach(p => {
    p.hand.sort((a,b) => ranks.indexOf(getRank(a)) - ranks.indexOf(getRank(b)));
  });

  currentPlayerIndex = 0;
  pile = [];
  pileType = null;
  selectedCards = [];
  lastPairRank = null;
  consecutivePairsCount = 0;

  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('game').style.display = 'none';
  showWaitScreen();
}

function showWaitScreen() {
  document.getElementById('waitScreen').style.display = 'block';
  document.getElementById('game').style.display = 'none';
  document.getElementById('playerName').textContent = players[currentPlayerIndex].name;
  document.getElementById('info').textContent = '';
}

function startTurn() {
  document.getElementById('waitScreen').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  displayGame();
}

function displayGame() {
  const player = players[currentPlayerIndex];
  document.getElementById('currentPlayer').textContent = player.name;

  if (pile.length === 0) {
    document.getElementById('pile').textContent = "Tas : Aucun";
  } else {
    document.getElementById('pile').textContent = "Tas : " + pile.join(' ');
  }

  const handDiv = document.getElementById('hand');
  handDiv.innerHTML = '';
  player.hand.forEach((card, i) => {
    const btn = document.createElement('button');
    btn.textContent = card;
    btn.onclick = () => {
      if (selectedCards.includes(i)) {
        selectedCards = selectedCards.filter(x => x !== i);
        btn.classList.remove('selected');
      } else {
        selectedCards.push(i);
        btn.classList.add('selected');
      }
    };
    handDiv.appendChild(btn);
  });
  document.getElementById('info').textContent = '';
}

function removeCardsFromHand(player, cards) {
  cards.forEach(card => {
    const index = player.hand.indexOf(card);
    if (index !== -1) player.hand.splice(index,1);
  });
}

function playSelectedCards() {
  const player = players[currentPlayerIndex];
  if (selectedCards.length === 0) {
    alert("Sélectionne au moins une carte.");
    return;
  }
  const selected = selectedCards.map(i => player.hand[i]);

  if (!isSameRank(selected)) {
    alert("Les cartes sélectionnées doivent être de même valeur.");
    return;
  }
  const rank = getRank(selected[0]);
  const selRankIndex = ranks.indexOf(rank);
  
  if (pile.length === 0) {
    applyPlay(player, selected, rank);
    lastPairRank = null;
    consecutivePairsCount = 0;
    return;
  }

  const pileRank = getRank(pile[0]);
  const pileRankIndex = ranks.indexOf(pileRank);

  if (pileRank === rank && pile.length + selected.length === 4 && isSameRank(pile.concat(selected))) {
    pile = pile.concat(selected);
    removeCardsFromHand(player, selected);
    pileType = null;
    pile = [];
    alert("Carré complété ! Tour terminé.");
    resetPasses();
    lastPairRank = null;
    consecutivePairsCount = 0;
    goToNextTurn(currentPlayerIndex);
    return;
  }

  if (pile.length === 2) {
    if (selected.length === 2 && rank === lastPairRank) {
      consecutivePairsCount++;
    } else if (selected.length === 2) {
      lastPairRank = rank;
      consecutivePairsCount = 1;
    } else if (consecutivePairsCount >= 2) {
      alert(`Règle du "ou rien" : tu dois jouer une paire de ${lastPairRank} ou compléter un carré.`);
      return;
    }
  } else {
    lastPairRank = null;
    consecutivePairsCount = 0;
  }

  if (selected.length !== pile.length) {
    alert("Tu dois jouer le même nombre de cartes que le tas.");
    return;
  }

  if (selRankIndex < pileRankIndex) {
    alert("Tu dois jouer plus fort que le tas !");
    return;
  }
  if (selRankIndex === pileRankIndex && !(pile.length === 2 && consecutivePairsCount >= 1)) {
    alert("Tu dois jouer plus fort que le tas !");
    return;
  }

  applyPlay(player, selected, rank);
}

function applyPlay(player, selected, rank) {
  removeCardsFromHand(player, selected);
  pile = selected;
  pileType = selected.length;
  selectedCards = [];
  player.hasPassed = false;

  if (player.hand.length === 0 && !player.finished) {
    player.finished = true;
    ranking.push(player);
    alert(`${player.name} a terminé sa main !`);

    if (ranking.length === players.length - 1) {
      const lastPlayer = players.find(p => !p.finished);
      ranking.push(lastPlayer);
      endRound();
      return;
    }
    pile = [];
    pileType = null;
    resetPasses();
    goToNextTurn(findNextActivePlayer(currentPlayerIndex));
    return;
  }

  if (rank === '2' || pile.length === 4) {
    alert(rank === '2' ? "2 joué ! Fin du tour." : "Carré joué ! Fin du tour.");
    pile = [];
    pileType = null;
    resetPasses();
    goToNextTurn(currentPlayerIndex);
  } else {
    goToNextTurn(findNextActivePlayer(currentPlayerIndex + 1));
  }
}

function findNextActivePlayer(start) {
  let i = start % players.length;
  while (players[i].finished || players[i].hasPassed) {
    i = (i + 1) % players.length;
    if (i === start % players.length) break;
  }
  return i;
}

function goToNextTurn(nextPlayerIndex) {
  currentPlayerIndex = nextPlayerIndex;
  selectedCards = [];
  showWaitScreen();
}

function passTurn() {
  players[currentPlayerIndex].hasPassed = true;

  const activePlayers = players.filter(p => !p.finished);
  const passedCount = activePlayers.filter(p => p.hasPassed).length;
  if (passedCount === activePlayers.length - 1) {
    const lastPlayer = activePlayers.find(p => !p.hasPassed);
    currentPlayerIndex = players.indexOf(lastPlayer);
    pile = [];
    pileType = null;
    resetPasses();
    alert("Fin du tour, nouveau tour commence !");
  } else {
    currentPlayerIndex = findNextActivePlayer(currentPlayerIndex + 1);
  }
  selectedCards = [];
  showWaitScreen();
}

function resetPasses() {
  players.forEach(p => p.hasPassed = false);
}

function endRound() {
  alert("Round terminé ! Classement : " + ranking.map(p => p.name).join(", "));
  document.getElementById('game').style.display = 'none';
  document.getElementById('setupScreen').style.display = 'block';
}