const socket = io();

function rejoindreSalle(nomJeu) {
    socket.emit('rejoindre_jeu', nomJeu);
    window.location.href = `${nomJeu}.html`;
}