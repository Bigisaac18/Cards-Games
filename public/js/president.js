const socket = io();
const params = new URLSearchParams(window.location.search);
const salle = params.get("salle");

socket.emit("rejoindre_jeu", { jeu: "president", salle });

socket.on("cartes_attribuees", (cartes) => {
    afficherCartes(cartes);
});

socket.on("nouveau_tour", ({ joueur, pile }) => {
    document.getElementById("currentTurn").textContent = joueur;
    afficherPile(pile);
});

socket.on("cartes_posees", ({ joueur, cartes }) => {
    console.log(`${joueur} a posé les cartes :`, cartes);
    afficherPile(cartes);
});

socket.on("mise_a_jour_joueurs", (joueurs) => {
    afficherJoueurs(joueurs);
});

socket.on("partie_terminee", (gagnantId) => {
    alert("Le gagnant est : " + gagnantId);
});

function afficherCartes(cartes) {
    const container = document.getElementById("playerCards");
    container.innerHTML = "";
    cartes.forEach(carte => {
        const div = document.createElement("div");
        div.classList.add("card");
        div.textContent = carte;
        div.onclick = () => selectionnerCarte(carte);
        container.appendChild(div);
    });
}

function afficherPile(pile) {
    const container = document.getElementById("cardPile");
    container.innerHTML = "";
    pile.forEach(carte => {
        const div = document.createElement("div");
        div.classList.add("card");
        div.textContent = carte;
        container.appendChild(div);
    });
}

function afficherJoueurs(joueurs) {
    const ul = document.getElementById("playerList");
    ul.innerHTML = "";
    joueurs.forEach(joueur => {
        const li = document.createElement("li");
        li.textContent = joueur.pseudo;
        ul.appendChild(li);
    });
}

let cartesSelectionnees = [];

function selectionnerCarte(carte) {
    const index = cartesSelectionnees.indexOf(carte);
    if (index === -1) {
        cartesSelectionnees.push(carte);
    } else {
        cartesSelectionnees.splice(index, 1);
    }
    updateSelectedCardsDisplay();
}

function updateSelectedCardsDisplay() {
    const selectedCardsDiv = document.getElementById("selectedCards");
    selectedCardsDiv.innerHTML = "";
    cartesSelectionnees.forEach(carte => {
        const div = document.createElement("div");
        div.classList.add("card-selected");
        div.textContent = carte;
        selectedCardsDiv.appendChild(div);
    });

    const playButton = document.getElementById("playCards");
    playButton.disabled = cartesSelectionnees.length === 0;
}

document.getElementById("playCards").addEventListener("click", () => {
    socket.emit("jouer_cartes", cartesSelectionnees);
    cartesSelectionnees = [];
    updateSelectedCardsDisplay();
});

document.getElementById("passTurn").addEventListener("click", () => {
    socket.emit("passer_tour");
});

socket.on("partie_terminee", (gagnantId) => {
    alert("Le gagnant est : " + gagnantId);
});

window.onload = function() {
    document.getElementById("playerName").textContent = "Votre pseudo";
};