function calculateDays() {
    const currentCoins = document.getElementById('current-coins').value;
    const goalCoins = document.getElementById('goal-coins').value;

    if (!currentCoins || !goalCoins) {
        alert("Please enter both current and goal LeetCoins.");
        return;
    }

    const deficit = goalCoins - currentCoins;

    const perfectRateDays = (deficit / 415) * 30;
    const minPerfectRateDays = (deficit / 380) * 30;
    const dailyRateDays = deficit / 11;
    const worstRateDays = deficit;

    document.getElementById('perfect-rate').innerText = `Perfect Rate*: ${Math.ceil(perfectRateDays)} days`;
    document.getElementById('min-perfect-rate').innerText = `Min-Perfect* Rate: ${Math.ceil(minPerfectRateDays)} days`;
    document.getElementById('daily-rate').innerText = `Daily RATE: ${Math.ceil(dailyRateDays)} days`;
    document.getElementById('worst-rate').innerText = `Worst Rate: ${Math.ceil(worstRateDays)} days`;
    document.getElementById('disclaimer').innerText = "*This assumes no skips in a daily monthly time to get the bonus monthly coins.";
}