# Roulette Wheel

## Spin The Wheel Application

This is a web application that allows users to spin a wheel to randomly select a winner based on weighted entries.

### Features

- **Spin the Wheel**: A visual representation of a wheel that spins to select a winner.
- **Dark Mode Support**: The application supports dark mode based on the user's system preferences.
- **Loading Animation**: A loading animation is displayed while fetching data.
- **SweetAlert2 Integration**: Custom alerts are shown to announce the winner.

### Technologies Used

- **Python**: Backend logic using Flask.
- **JavaScript**: Frontend logic for spinning the wheel.
- **HTML/CSS**: Structure and styling of the web page.
- **Chart.js**: For rendering the wheel.
- **SweetAlert2**: For custom alert messages.

### Setup Instructions

1. **Clone the repository**:
    ```sh
    git clone https://github.com/DefinetlyNotAI/Roulette
    cd Roulette
    ```

2. **Install dependencies**:
    ```sh
    pip install -r requirements.txt
    ```

3. **Create a CSV file**:
   Create a file named `data.csv` in the root directory with the following structure:
    ```csv
    Name,Weight
    Alice,10
    Bob,20
    Charlie,30
    ```

4. **Run the application**:
    ```sh
    python app.py
    ```

5. **Open the application**:
   Open your web browser and navigate to `http://127.0.0.1:5000/`.

### Example CSV File

Create a file named `data.csv` with the following content:

```csv
Name,Weight
Alice,10
Bob,20
Charlie,30
```

This CSV file contains the names of participants and their corresponding weight, which determine their chances of
winning when the wheel is spun.
