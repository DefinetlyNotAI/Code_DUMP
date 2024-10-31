import React, {useState} from 'react';
import './LeetcoinCalculator.css';

const LeetcoinCalculator = () => {
    const [needed, setNeeded] = useState('');
    const [current, setCurrent] = useState('');

    const calculateDays = (rate) => {
        const pointsNeeded = needed - current;
        return pointsNeeded > 0 ? Math.ceil(pointsNeeded / rate) : 0;
    };

    const perfectRate = 415 / 30; // points per day
    const minPerfectRate = 380 / 30; // points per day
    const dailyRate = 11; // points per day
    const worstRate = 1; // points per day

    return (
        <div className="container">
            <h1>Leetcoin Calculator</h1>
            <div>
                <label>
                    Leetcoins Needed:
                    <input type="number" value={needed} onChange={(e) => setNeeded(e.target.value)}/>
                </label>
            </div>
            <div>
                <label>
                    Leetcoins You Have:
                    <input type="number" value={current} onChange={(e) => setCurrent(e.target.value)}/>
                </label>
            </div>
            <div>
                <h2>Results</h2>
                <p>Perfect Rate: {calculateDays(perfectRate)} days</p>
                <p>Min-Perfect Rate: {calculateDays(minPerfectRate)} days</p>
                <p>Daily Rate: {calculateDays(dailyRate)} days</p>
                <p>Worst Rate: {calculateDays(worstRate)} days</p>
            </div>
        </div>
    );
};

export default LeetcoinCalculator;