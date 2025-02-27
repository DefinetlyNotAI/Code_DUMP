# Colortomata

Colortomata is a mix between **Color** and Au**tomata** and is exactly the mixture of these 2 words,
I was inspired by a random YouTube short showcasing an idea of an automata for colors that generate intricate designs

This application generates a dynamic grid of colored cells based on customizable rules. 
It uses a Flask web server to allow users to interact with the grid's generation, evolution, 
and manipulation. Here's how to use it:

### 1. **Run the Application**

If you want to use locally:

To start the application, run the following command in your terminal:

```bash
python Colortomata.py
```

This will start the Flask server on `http://127.0.0.1:5000/`. 
You can access the app through any web browser.

### 2. **Access the Application**

Once the application is running, open a browser and navigate to:

```
http://127.0.0.1:5000/
```

### 3. **Configure the Grid**

You can configure the following parameters before generating the grid:

- **Grid Size:** Determines the dimensions of the grid (default is 500).
- **Theta:** Controls the threshold variation when applying rules (default is 0.8).
- **Delta:** Adds noise to the rule application (default is 0.1).
- **Lambda (Cluster Bias):** Controls the bias for color clustering (default is 0.7).
- **Seed:** The seed used for random number generation (default is 42).
- **Custom Rule Order:** You can specify the order in which the colors' rules are applied (e.g., `["Red", "Blue", "Green"]`).

### 4. **Generate the Grid**

After setting the parameters, press the **Generate Grid** button to initialize the grid. 
The app will return a base64-encoded PNG image of the grid, 
which you can view directly in your browser.

### 5. **Evolve the Grid**

Click on the **Evolve Grid** button to start the grid evolution process. 
The grid will evolve dynamically over time based on the defined rules. 
The evolution process will run in the background and automatically stop after 60 seconds 
(or the specified time limit).

---

# Logic Explanation

This application implements a complex cellular automaton system with dynamic rules
for color propagation and grid evolution. The system is based on an array of cells, 
each containing a color, and evolves according to a series of rules, 
applying various constraints and probabilistic factors to simulate interactions between cells.

## 1. **Grid Initialization**

Upon starting, the grid is initialized randomly, 
where each cell is assigned one of the colors from a predefined palette (excluding black and white).
The initialization is performed using the following steps:

- **Random Color Assignment:** Each cell is assigned a color from the available colors (excluding `White`).
- **Cluster Bias (λ):** To introduce bias towards certain colors, a `lambda_` parameter influences the probability of certain colors being chosen. This ensures that some colors are more likely to appear than others.

The probability distribution for color selection is weighted by `lambda_`, 
ensuring that certain colors (especially those near the start of the custom rule order) 
have a higher chance of appearing.

```python
from Colortomata import np, COLOR_KEYS, lambda_


def generate_cluster_bias():
    base_prob = np.ones(len(COLOR_KEYS) - 1) / (len(COLOR_KEYS) - 1)
    base_prob *= lambda_
    base_prob /= base_prob.sum()
    return base_prob
```

## 2. **Color Rule Logic**

The most intricate part of this system is how colors evolve. 
The grid undergoes periodic updates (every time step) based on its neighboring cells' 
colors and a set of rules that govern the propagation of color.

Each cell has **eight neighbors** (in a 3x3 square centered on the cell), and the next state of a cell 
is determined by its neighbors' colors and how well they align with certain predefined rules.

The **rules** for each color are complex and depend on the combination of neighboring colors. 
Below is a breakdown of how each color's rule is applied.

### **Red Rule**
Red cells can evolve if:

1. **Threshold Variation:** If the red cells are surrounded by at least 5 other red cells (adjusted by a random threshold determined by `theta`), they maintain their color.
2. **Red and Yellow/Orange Combo:** If there are at least 3 red cells and at least 2 orange or yellow cells in the neighborhood, the cell becomes red.

### **Orange Rule**
Orange cells are applied if:

- There are at least 2 red cells and at least 2 yellow cells in the neighborhood.

### **Yellow Rule**
Yellow cells are more likely to propagate if:

1. There are at least 4 orange cells in the neighborhood.
2. Alternatively, if there are at least 3 yellow cells and at least 2 green cells, the yellow cell rule applies.

### **Green Rule**
Green cells are influenced by:

1. At least 3 blue cells in the neighborhood.
2. Alternatively, at least 3 yellow cells in the neighborhood.

### **Blue Rule**
Blue cells evolve if:

1. There are at least 5 blue cells in the neighborhood.
2. Alternatively, if there are at least 3 blue cells and at least 2 purple cells, a blue cell will emerge.

### **Purple Rule**
Purple cells are quite rare and are applied if:

1. There are at least 3 blue cells and at least 3 pink cells in the neighborhood, excluding black cells.
2. Alternatively, purple can form if there are enough connections between blue and pink cells, combined with the absence of too many black cells.

### **Pink Rule**
Pink cells propagate under two conditions:

1. There are at least 4 pink cells around.
2. Alternatively, if red and magenta cells are present, and there are no more than 3 black cells in the neighborhood, the pink rule can be triggered.

### **Magenta Rule**
Magenta is a rare, often hard-to-form color. It requires:

1. At least 3 purple cells.
2. At least 2 pink cells.

### **Black Rule (Always Last)**
If none of the above rules apply, the cell turns black.
Indicating death.

## 3. **Noise and Randomness (Delta and Theta)**

The grid evolution is not purely deterministic. 
We introduce randomness through **delta** and **theta** parameters:

- **Theta (θ):** Determines the threshold for when a rule should apply. 
  - It's a variation factor that makes the system more unpredictable by introducing a random deviation when deciding whether the rule should be applied.
- **Delta (δ):** Introduces noise, affecting how likely a cell is to remain in a certain state or change based on neighboring conditions.

## 4. **Grid Evolution and Time Limit**

The grid evolves by continuously applying the rules iteratively until the maximum allowed time 
(`MAX_TIME`) is reached. The evolution is time-sensitive to prevent excessive computational load 
and ensure that the app runs efficiently.

## 5. **Neighboring and Boundary Conditions**

Each cell is surrounded by its **eight neighbors** in a square arrangement. 
The boundary conditions are handled by:

**Edge Handling:** Cells on the edge of the grid wrap around to the opposite side, 
creating a toroidal grid. This means that the grid's edges connect to each other, 
allowing for continuous evolution without boundary issues.

## 6. **Image Generation**

After the grid is evolved, the final image is generated 
by translating the grid’s color values into an image using **PIL (Python Imaging Library)**. 
The image is then converted to a **base64-encoded string** for easy display in a browser.

---

## Conclusion

This application combines cellular automata with dynamic, 
customizable rules to create an engaging, visually appealing grid of evolving colors. 
The interplay of color rules, randomness, and grid size creates a unique and constantly evolving pattern, 
which can be adjusted and customized by the user for endless possibilities.
