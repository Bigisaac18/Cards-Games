const socket = io();
let pseudo, salle;

document.getElementById("formLobby").addEventListener("submit", (e) => {
    e.preventDefault();
    pseudo = document.getElementById("pseudo").value;
    salle = document.getElementById("salle").value;

    socket.emit("rejoindre_salle", { pseudo, salle });
});

socket.on("salle_rejointe", ({ joueurs, hote }) => {
    document.getElementById("formLobby").style.display = "none";
    document.getElementById("infoSalle").style.display = "block";
    document.getElementById("nomSalle").textContent = salle;

    mettreAJourListe(joueurs);
    if (socket.id === hote) {
        document.getElementById("btnDemarrer").style.display = "inline-block";
    } else {
        document.getElementById("btnDemarrer").style.display = "none";
    }
});

socket.on("mise_a_jour_joueurs", mettreAJourListe);

function mettreAJourListe(joueurs) {
    const ul = document.getElementById("listeJoueurs");
    ul.innerHTML = "";
    joueurs.forEach(j => {
        const li = document.createElement("li");
        li.textContent = j.pseudo + (j.id === socket.id ? " (toi)" : "");
        ul.appendChild(li);
    });
}

document.getElementById("btnDemarrer").addEventListener("click", () => {
    socket.emit("demarrer_partie", salle);
});