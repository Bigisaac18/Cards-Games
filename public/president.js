const socket = io();
let cartesJoueur = [];
let joueurActif = null;
let pileActuelle = [];

socket.emit("rejoindre_jeu", "president");

socket.on("cartes_attribuees", (cartes) => {
    cartesJoueur = cartes;
    afficherCartes();
});

socket.on("nouveau_tour", ({ joueur, pile }) => {
    joueurActif = joueur;
    pileActuelle = pile;
    afficherCartes();
    afficherPile();
    afficherTour();
});

socket.on("cartes_posees", ({ joueur, cartes }) => {
    pileActuelle = cartes;
    afficherPile();
});

socket.on("nouvelle_manche", () => {
    pileActuelle = [];
    afficherPile();
});

socket.on("partie_terminee", (vainqueur) => {
    alert(`🎉 Le joueur ${vainqueur} a gagné !`);
});

function afficherCartes() {
    const div = document.getElementById("cartes");
    div.innerHTML = "";

    cartesJoueur.forEach((carte) => {
        const label = document.createElement("label");
        label.classList.add("carte");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = carte;
        input.name = "carte";

        label.appendChild(input);
        label.appendChild(document.createTextNode(carte));
        div.appendChild(label);
    });
}

function afficherPile() {
    const div = document.getElementById("pile");
    div.textContent = pileActuelle.length
        ? `Pile : ${pileActuelle.join(", ")}`
        : "Pile vide";
}

function afficherTour() {
    const div = document.getElementById("tour");
    if (joueurActif === socket.id) {
        div.textContent = "🟢 À ton tour de jouer !";
    } else {
        div.textContent = `🔴 En attente du joueur ${joueurActif}`;
    }
}

function getCartesSelectionnees() {
    const checkboxes = document.querySelectorAll('input[name="carte"]:checked');
    return Array.from(checkboxes).map((c) => c.value);
}

function jouer() {
    if (joueurActif !== socket.id) {
        alert("Ce n'est pas ton tour !");
        return;
    }

    const cartes = getCartesSelectionnees();
    if (!cartes.length) {
        alert("Sélectionne une ou plusieurs cartes.");
        return;
    }

    if (!estValideLocal(cartes, pileActuelle)) {
        alert("Combinaison invalide !");
        return;
    }

    socket.emit("jouer_cartes", cartes);
    desactiverBoutons();
}

function passer() {
    if (joueurActif !== socket.id) return;
    socket.emit("passer_tour");
    desactiverBoutons();
}

function desactiverBoutons() {
    document.querySelectorAll('input[name="carte"]').forEach(input => input.disabled = true);
}

function estValideLocal(cartes, pile) {
    if (pile.length === 0) return true;
    if (cartes.length !== pile.length) return false;

    const val = valeurCarte(cartes[0]);
    const valPile = valeurCarte(pile[0]);
    return val > valPile;
}

function valeurCarte(carte) {
    const ordre = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    return ordre.indexOf(carte.replace(/[^0-9JQKA]/g, ''));
}