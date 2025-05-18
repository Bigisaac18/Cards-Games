let player1Score = 0;
let player2Score = 0;

const statusDiv = document.getElementById("status");
const playBtn = document.getElementById("play-btn");
const player1CardDiv = document.getElementById("player1Card");
const player2CardDiv = document.getElementById("player2Card");
const scoreDiv = document.getElementById("score");
const carterestantej1Div = document.getElementById("carterestantej1");
const carterestantej2Div = document.getElementById("carterestantej2");

let deck = [];

function deck52() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = [
        { value: '2', rank: 2 },
        { value: '3', rank: 3 },
        { value: '4', rank: 4 },
        { value: '5', rank: 5 },
        { value: '6', rank: 6 },
        { value: '7', rank: 7 },
        { value: '8', rank: 8 },
        { value: '9', rank: 9 },
        { value: '10', rank: 10 },
        { value: 'J', rank: 11 },
        { value: 'Q', rank: 12 },
        { value: 'K', rank: 13 },
        { value: 'A', rank: 14 },
    ];

    deck = [];

    for (let suit of suits) {
        for (let val of values) {
            deck.push({
                value: val.value,
                rank: val.rank,
                symbol: suit
            });
        }
    }

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

deck52();

let player1Deck = deck.slice(0, 26);
let player2Deck = deck.slice(26);

// Fonction pour gérer la bataille (égalité)
function bataille(player1Deck, player2Deck, cardsInPlay) {
    // Chaque joueur doit poser 3 cartes face cachée + 1 carte face visible
    const cardsNeeded = 4;

    if (player1Deck.length < cardsNeeded || player2Deck.length < cardsNeeded) {
        // Si un joueur n'a pas assez de cartes, il perd la bataille (ou la partie)
        if (player1Deck.length < cardsNeeded && player2Deck.length < cardsNeeded) {
            statusDiv.textContent = "Match nul, pas assez de cartes pour continuer la bataille.";
            playBtn.disabled = true;
            return null;
        } else if (player1Deck.length < cardsNeeded) {
            statusDiv.textContent = "Adversaire gagne, vous n'avez pas assez de cartes pour la bataille.";
            playBtn.disabled = true;
            return null;
        } else {
            statusDiv.textContent = "Vous gagnez, l'adversaire n'a pas assez de cartes pour la bataille.";
            playBtn.disabled = true;
            return null;
        }
    }

    // On pioche 3 cartes face cachée + 1 face visible pour chaque joueur
    const p1BattleCards = player1Deck.splice(0, cardsNeeded);
    const p2BattleCards = player2Deck.splice(0, cardsNeeded);

    // On ajoute ces cartes au pot
    cardsInPlay.push(...p1BattleCards, ...p2BattleCards);

    // Cartes face visibles à comparer
    const p1FaceUp = p1BattleCards[3];
    const p2FaceUp = p2BattleCards[3];

    // Affichage des cartes face visibles dans l'interface
    player1CardDiv.textContent += ` | ${p1FaceUp.value} ${p1FaceUp.symbol}`;
    player2CardDiv.textContent += ` | ${p2FaceUp.value} ${p2FaceUp.symbol}`;

    if (p1FaceUp.rank > p2FaceUp.rank) {
        player1Score += cardsInPlay.length; // par exemple, on ajoute le nombre de cartes gagnées
        player1Deck.push(...cardsInPlay);
        statusDiv.textContent = `🔥 Vous gagnez la bataille ! +${cardsInPlay.length} cartes`;
        return 'player1';
    } else if (p1FaceUp.rank < p2FaceUp.rank) {
        player2Score += cardsInPlay.length;
        player2Deck.push(...cardsInPlay);
        statusDiv.textContent = `💥 L'adversaire gagne la bataille ! +${cardsInPlay.length} cartes`;
        return 'player2';
    } else {
        // Nouvelle bataille en cas d'égalité
        statusDiv.textContent = "⚖️ Bataille prolongée !";
        return bataille(player1Deck, player2Deck, cardsInPlay);
    }
}

playBtn.addEventListener("click", () => {
    if (player1Deck.length === 0 || player2Deck.length === 0) {
        statusDiv.textContent = "La partie est terminée.";
        playBtn.disabled = true;
        return;
    }

    const player1Card = player1Deck.shift();
    const player2Card = player2Deck.shift();

    player1CardDiv.textContent = `${player1Card.value} ${player1Card.symbol}`;
    player2CardDiv.textContent = `${player2Card.value} ${player2Card.symbol}`;

    let cardsInPlay = [player1Card, player2Card];

    if (player1Card.rank > player2Card.rank) {
        player1Score++;
        player1Deck.push(...cardsInPlay);
        statusDiv.textContent = "✅ Vous gagnez ce tour !";
    } else if (player1Card.rank < player2Card.rank) {
        player2Score++;
        player2Deck.push(...cardsInPlay);
        statusDiv.textContent = "❌ L'adversaire gagne ce tour.";
    } else {
        // Egalité => on lance la bataille
        const winner = bataille(player1Deck, player2Deck, cardsInPlay);

        if (winner === null) {
            // Partie arrêtée à cause du manque de cartes
            playBtn.disabled = true;
        }
    }

    scoreDiv.textContent = `Score - Joueur: ${player1Score} | Adversaire: ${player2Score}`;
    carterestantej1Div.textContent = `Nombre de cartes restantes - Joueur: ${player1Deck.length}`;
    carterestantej2Div.textContent = `Nombre de cartes restantes - Adversaire: ${player2Deck.length}`;

    if (player1Deck.length === 0 || player2Deck.length === 0) {
        let winner = player1Score > player2Score ? "🎉 Vous avez gagné !" :
                     player1Score < player2Score ? "😢 L'adversaire a gagné." :
                     "🤝 Égalité parfaite !";

        statusDiv.textContent = `Fin de partie. ${winner}`;
        playBtn.disabled = true;
    }
});