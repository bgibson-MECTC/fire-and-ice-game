/* =================================================
   FIRE & ICE – GLOBAL COMPETITIVE LEADERBOARD
   Using Firebase Firestore
   ================================================= */

import { 
    db, collection, addDoc, getDocs, query, orderBy, doc, updateDoc, setDoc 
} from "./firebase.js";

/* =================================================
   FIRE & ICE TITLE SYSTEM
   ================================================= */

function getTitleForScore(score) {
    if (score >= 7000) return "🔥 Inferno Master";
    if (score >= 5000) return "❄️ Ice Queen/King";
    if (score >= 3000) return "⚕️ Clinical Annihilator";
    if (score >= 1500) return "🔥 Firestarter";
    return "🥶 Frostbitten";
}

/* =================================================
   SAVE PLAYER SCORE
   ================================================= */

export async function savePlayerScore(playerName, finalScore) {
    const leaderboardRef = collection(db, "leaderboard");

    // Check if player exists
    const snapshot = await getDocs(leaderboardRef);
    let existingPlayer = null;

    snapshot.forEach(doc => {
        if (doc.data().playerName === playerName) {
            existingPlayer = { id: doc.id, ...doc.data() };
        }
    });

    const newEntry = {
        playerName: playerName,
        highScore: finalScore,
        scores: existingPlayer?.scores || [],
        timestamp: Date.now(),
        title: getTitleForScore(finalScore),
        streak: existingPlayer?.streak || 0
    };

    // Update streak
    if (existingPlayer) {
        if (finalScore > existingPlayer.highScore) {
            newEntry.streak = (existingPlayer.streak || 0) + 1;
        } else {
            newEntry.streak = 0;
        }
        newEntry.scores = [...existingPlayer.scores, finalScore].slice(-5);

        // Update player
        await updateDoc(doc(db, "leaderboard", existingPlayer.id), newEntry);
    } else {
        newEntry.scores = [finalScore];
        newEntry.streak = 1;

        await addDoc(leaderboardRef, newEntry);
    }
}

/* =================================================
   FETCH + RENDER LEADERBOARD
   ================================================= */

export async function loadLeaderboard() {
    const leaderboardRef = collection(db, "leaderboard");
    const snapshot = await getDocs(leaderboardRef);

    let players = [];

    snapshot.forEach(doc => {
        const d = doc.data();
        players.push({
            playerName: d.playerName,
            highScore: d.highScore,
            title: d.title,
            streak: d.streak || 0,
            scores: d.scores || []
        });
    });

    // Sort by highest score first
    players.sort((a, b) => b.highScore - a.highScore);

    // Build leaderboard table
    const container = document.getElementById("leaderboardTable");
    container.innerHTML = "";

    if (players.length === 0) {
        container.innerHTML = "<p>No scores yet! Be the first to claim the throne.</p>";
        return;
    }

    players.forEach((player, index) => {
        const row = document.createElement("div");
        row.classList.add("leaderboard-row");

        row.innerHTML = `
            <div class="rank">#${index + 1}</div>
            <div class="name">${player.playerName}</div>
            <div class="score">${player.highScore}</div>
            <div class="title">${player.title}</div>
            <div class="streak">🔥 Streak: ${player.streak}</div>
            <div class="history">Last 5: ${player.scores.join(" • ")}</div>
        `;

        container.appendChild(row);
    });
}
