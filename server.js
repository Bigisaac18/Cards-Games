const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

const lobbies = {};

const jeux = {};

function genererCartesMelangees() {
    const valeurs = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
    const couleurs = ['♠','♥','♦','♣'];
    const cartes = [];

    for (let val of valeurs) {
        for (let coul of couleurs) {
            cartes.push(val + coul);
        }
    }
    cartes.push("JOKER1");
    cartes.push("JOKER2");

    for (let i = cartes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cartes[i], cartes[j]] = [cartes[j], cartes[i]];
    }

    return cartes;
}

io.on("connection", (socket) => {
    socket.on("rejoindre_salle", ({ pseudo, salle }) => {
        socket.join(salle);

        if (!lobbies[salle]) {
            lobbies[salle] = { joueurs: [], hote: socket.id };
        }

        lobbies[salle].joueurs.push({ id: socket.id, pseudo });

        io.to(salle).emit("salle_rejointe", {
            joueurs: lobbies[salle].joueurs,
            hote: lobbies[salle].hote
        });

        io.to(salle).emit("mise_a_jour_joueurs", lobbies[salle].joueurs);
    });

    socket.on("demarrer_partie", (salle) => {
        io.to(salle).emit("redirection", `/president.html?salle=${salle}`);
    });

    socket.on("rejoindre_jeu", ({ jeu, salle }) => {
        socket.join(salle);

        if (jeu === "president") {
            demarrerJeuPresident(salle);
        }
    });

    socket.on("jouer_cartes", (cartes) => {
        const salle = trouverSalleParSocket(socket.id);
        if (!salle || !jeux[salle]) return;

        const jeu = jeux[salle];
        if (socket.id !== jeu.joueurActif) return;

        const main = jeu.cartesParJoueur[socket.id];
        if (!cartes.every(c => main.includes(c))) return;

        if (jeu.pile.length > 0 && cartes.length !== jeu.pile.length) return;
        const valeur = extraireValeur(cartes[0]);
        if (!cartes.every(c => extraireValeur(c) === valeur)) return;

        if (jeu.pile.length > 0) {
            const valPile = extraireValeur(jeu.pile[0]);
            if (valeur <= valPile) return;
        }

        jeu.cartesParJoueur[socket.id] = main.filter(c => !cartes.includes(c));
        jeu.pile = cartes;
        io.to(salle).emit("cartes_posees", { joueur: socket.id, cartes });

        if (jeu.cartesParJoueur[socket.id].length === 0) {
            io.to(salle).emit("partie_terminee", socket.id);
            delete jeux[salle];
            return;
        }

        jeu.joueurActif = joueurSuivant(jeu.ordreJoueurs, jeu.joueurActif);
        io.to(salle).emit("nouveau_tour", {
            joueur: jeu.joueurActif,
            pile: jeu.pile
        });
    });

    socket.on("passer_tour", () => {
        const salle = trouverSalleParSocket(socket.id);
        if (!salle || !jeux[salle]) return;

        const jeu = jeux[salle];
        if (socket.id !== jeu.joueurActif) return;

        jeu.joueurActif = joueurSuivant(jeu.ordreJoueurs, jeu.joueurActif);
        io.to(salle).emit("nouveau_tour", {
            joueur: jeu.joueurActif,
            pile: jeu.pile
        });
    });

    socket.on("disconnect", () => {
        for (const salle in lobbies) {
            const lobby = lobbies[salle];
            lobby.joueurs = lobby.joueurs.filter(j => j.id !== socket.id);
            if (lobby.joueurs.length === 0) delete lobbies[salle];
            else io.to(salle).emit("mise_a_jour_joueurs", lobby.joueurs);
        }
    });
});

function demarrerJeuPresident(salle) {
    const lobby = lobbies[salle];
    if (!lobby) return;

    const joueurs = lobby.joueurs.map(j => j.id);
    const cartes = genererCartesMelangees();
    const cartesParJoueur = {};

    joueurs.forEach((id, i) => {
        cartesParJoueur[id] = cartes.slice(i * Math.floor(cartes.length / joueurs.length), (i + 1) * Math.floor(cartes.length / joueurs.length));
    });

    jeux[salle] = {
        cartesParJoueur,
        ordreJoueurs: joueurs,
        joueurActif: joueurs[0],
        pile: []
    };

    joueurs.forEach(id => {
        io.to(id).emit("cartes_attribuees", cartesParJoueur[id]);
    });

    io.to(salle).emit("nouveau_tour", {
        joueur: jeux[salle].joueurActif,
        pile: []
    });
}

function joueurSuivant(liste, actuel) {
    const i = liste.indexOf(actuel);
    return liste[(i + 1) % liste.length];
}

function extraireValeur(carte) {
    const ordre = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
    return ordre.indexOf(carte.replace(/[^0-9JQKA]/g, ''));
}

function trouverSalleParSocket(id) {
    for (const salle in jeux) {
        if (jeux[salle].cartesParJoueur[id]) return salle;
    }
    return null;
}