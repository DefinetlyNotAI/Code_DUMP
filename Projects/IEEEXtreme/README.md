# Xtreme Toolkit

A beginner-friendly Python toolbox for programming contests and algorithm practice.

Every algorithm is a normal Python function. You can copy one function into a contest solution, or import it from this folder. No extra packages are required.

## Getting started

Use Python 3.10 or newer. Put the `xtreme_toolkit` folder next to your Python script.

```python
from xtreme_toolkit.algorithms import sliding_window_max
from xtreme_toolkit.strings import kmp_search

numbers = [1, 3, 2, 5]
print(sliding_window_max(numbers, window_size=2))  # [3, 3, 5]

text = "banana"
print(kmp_search(text, pattern="ana"))  # [1, 3]
```

For a graph, each list position represents a node. The list at that position contains its neighboring nodes:

```python
from xtreme_toolkit.graphs import bfs

neighbors = [
    [1],        # Node 0 connects to node 1
    [0, 2],     # Node 1 connects to nodes 0 and 2
    [1],        # Node 2 connects to node 1
]

print(bfs(neighbors, start_node=0))  # [0, 1, 2]
```

## What's inside

| File                     | What it helps you do                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `algorithms.py`          | Binary search, prefix sums, sliding window maximums, coordinate compression                       |
| `dynamic_programming.py` | Knapsack, increasing subsequences, edit distance, shortest round trips                            |
| `geometry.py`            | 2D turns, outer boundaries, polygon areas                                                         |
| `graphs.py`              | Graph traversal, shortest paths, topological order, spanning trees, connected groups              |
| `number_theory.py`       | Prime numbers, greatest common divisors, modular arithmetic                                       |
| `strings.py`             | Text searching, repeating prefixes, palindrome lengths                                            |
| `structures.py`          | Linked lists, binary search trees, tries, union-find, Fenwick and segment trees, heaps, hash maps |
| `trees.py`               | Common ancestors, tree distances, longest paths                                                   |

## How to use an algorithm

1. Open the module for the problem you want to solve.
2. Read the description above the function. It tells you what it solves and shows an example.
3. Copy the example or import the function. Start with small sample inputs.
4. Read the parameters in the function definition and replace the example values with your data.

You can also view the help from Python:

```python
from xtreme_toolkit.strings import manacher
help(manacher)
```

## Common things to remember

- Indices and node numbers start at `0`.
- Graphs generally use adjacency lists. Weighted neighbors are pairs `(neighbor, cost)`.
- `kruskal` expects weighted edges as `(cost, first_node, second_node)`.
- `bellman_ford` expects `(first_node, second_node, cost)`.
- Functions that return several values return a tuple, which you can unpack: `length, start, end = tree_diameter(tree)`.
- Many methods in `structures.py` modify their objects rather than returning a new object.
- Some algorithms have special requirements. For example, Dijkstra needs nonnegative weights and a convex hull needs points in two dimensions.
