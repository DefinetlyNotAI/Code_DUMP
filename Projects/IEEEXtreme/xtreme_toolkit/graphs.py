"""Graphs use 0-based vertices, adjacency lists. Weighted edges are (v, weight)."""
from collections import deque
from heapq import heappush, heappop
try:
    from .structures import DSU
except ImportError:
    from structures import DSU

def bfs(neighbors: list[list[int]], start_node: int) -> list[int]:
    """Explore a graph breadth-first and find distances in edge counts.

    Example:
        bfs([[1], [0, 2], [1]], 0)  # [0, 1, 2]

    Remember:
        Unreachable vertices have distance -1."""
    distances = [-1] * len(neighbors)
    distances[start_node] = 0
    queue = deque([start_node])
    while queue:
        current_node = queue.popleft()
        for next_node in neighbors[current_node]:
            if distances[next_node] == -1:
                distances[next_node] = distances[current_node] + 1
                queue.append(next_node)
    return distances

def dfs_order(neighbors: list[list[int]], start_node: int) -> list[int]:
    """Visit graph vertices using depth-first search.

    Example:
        dfs_order([[1], [0, 2], [1]], 0)

    Remember:
        Returns the order in which vertices are first visited."""
    seen = [False] * len(neighbors)
    stack, order = ([start_node], [])
    while stack:
        current_node = stack.pop()
        if seen[current_node]:
            continue
        seen[current_node] = True
        order.append(current_node)
        stack.extend(reversed(neighbors[current_node]))
    return order

def dijkstra(weighted_neighbors: list[list[tuple[int, int]]], start_node: int) -> list[float | int]:
    """Find shortest distances in a graph with nonnegative edge weights.

    Example:
        dijkstra([[(1, 4)], [(2, 2)], []], 0)  # [0, 4, 6]

    Remember:
        Each edge is (neighbor, cost). Never use negative edge weights."""
    distances = [float('inf')] * len(weighted_neighbors)
    distances[start_node] = 0
    heap = [(0, start_node)]
    while heap:
        cost, current_node = heappop(heap)
        if cost != distances[current_node]:
            continue
        for next_node, weight in weighted_neighbors[current_node]:
            if cost + weight < distances[next_node]:
                distances[next_node] = cost + weight
                heappush(heap, (distances[next_node], next_node))
    return distances

def topological_sort(neighbors: list[list[int]]) -> list[int] | None:
    """Order tasks so prerequisites come before dependent tasks.

    Example:
        topological_sort([[1], [2], []])  # [0, 1, 2]

    Remember:
        Returns None if the graph has a directed cycle."""
    indeg = [0] * len(neighbors)
    for edges in neighbors:
        for next_node in edges:
            indeg[next_node] += 1
    queue = deque((index for index, d in enumerate(indeg) if d == 0))
    order = []
    while queue:
        current_node = queue.popleft()
        order.append(current_node)
        for next_node in neighbors[current_node]:
            indeg[next_node] -= 1
            if indeg[next_node] == 0:
                queue.append(next_node)
    return order if len(order) == len(neighbors) else None

def kruskal(count: int, edges: list[tuple[int, int, int]]) -> tuple[int, list[tuple[int, int, int]]]:
    """Find a minimum spanning forest using the cheapest available edges.

    Example:
        kruskal(3, [(2, 0, 1), (3, 1, 2), (9, 0, 2)])  # total cost 5

    Remember:
        Edges are (cost, first_node, second_node). The graph is undirected."""
    dsu = DSU(count)
    chosen: list[tuple[int, int, int]] = []
    total = 0
    for weight, current_node, next_node in sorted(edges):
        if dsu.union(current_node, next_node):
            total += weight
            chosen.append((weight, current_node, next_node))
    return (total, chosen)

def bellman_ford(node_count: int, edges: list[tuple[int, int, int]], start_node: int) -> tuple[list[float | int], bool]:
    """Find shortest paths even when some edge costs are negative.

    Example:
        bellman_ford(3, [(0, 1, 2), (1, 2, -1)], 0)

    Remember:
        Also reports whether a reachable negative cycle exists."""
    distances = [float('inf')] * node_count
    distances[start_node] = 0
    for _ in range(node_count - 1):
        changed = False
        for current_node, next_node, weight in edges:
            if distances[current_node] != float('inf') and distances[current_node] + weight < distances[next_node]:
                distances[next_node] = distances[current_node] + weight
                changed = True
        if not changed:
            break
    neg = any((distances[current_node] != float('inf') and distances[current_node] + weight < distances[next_node] for current_node, next_node, weight in edges))
    return (distances, neg)

def strongly_connected_components(neighbors: list[list[int]]) -> list[int]:
    """Group directed vertices that can all reach one another.

    Example:
        strongly_connected_components([[1], [0], []])

    Remember:
        Returns a group ID for every vertex."""
    count = len(neighbors)
    reverse = [[] for _ in range(count)]
    for current_node in range(count):
        for next_node in neighbors[current_node]:
            reverse[next_node].append(current_node)
    seen = [False] * count
    order = []
    for start_index in range(count):
        if seen[start_index]:
            continue
        seen[start_index] = True
        stack = [(start_index, 0)]
        while stack:
            current_node, index = stack[-1]
            if index == len(neighbors[current_node]):
                order.append(current_node)
                stack.pop()
            else:
                next_node = neighbors[current_node][index]
                stack[-1] = (current_node, index + 1)
                if not seen[next_node]:
                    seen[next_node] = True
                    stack.append((next_node, 0))
    comp = [-1] * count
    count = 0
    for start_index in reversed(order):
        if comp[start_index] != -1:
            continue
        stack = [start_index]
        comp[start_index] = count
        while stack:
            current_node = stack.pop()
            for next_node in reverse[current_node]:
                if comp[next_node] == -1:
                    comp[next_node] = count
                    stack.append(next_node)
        count += 1
    return comp
