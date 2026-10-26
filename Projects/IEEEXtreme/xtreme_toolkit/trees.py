"""Tree techniques. Inputs are 0-based undirected adjacency lists."""

class LCA:
    """
    Use when:
        You need to answer many questions about family-like relationships in a tree.
        Find the closest ancestor shared by two nodes, find a node's ancestor,
        or count the edges between two nodes.

    Inputs:
        neighbors: List of neighbors for every node in an undirected tree.
        root: Node treated as the top of the tree (default 0).

    Returns:
        An LCA object with kth_ancestor(u, k), lca(u, v), and
        distance(u, v). Nodes are numbered 0 through len(adj)-1.

    Example:
        tree = LCA([[1, 2], [0, 3], [0], [1]])
        tree.lca(3, 2)     # 0
        tree.distance(3, 2)  # 3

    Speed:
        O(n log n) time and memory to prepare.
        O(log n) per query.
    """

    def __init__(self, neighbors: list[list[int]], root_node: int=0) -> None:
        """
        Use when:
            Prepare an undirected tree so ancestor and distance queries are fast.
            The graph must be connected and contain no cycles.

        Inputs:
            neighbors: Every node's neighbors; each edge appears in both directions.
            root_node: Starting node that becomes the tree's root (default 0).

        Returns:
            Initializes self.depth and self.up. No separate return value.
            Raises ValueError if the tree is empty or disconnected.

        Example:
            tree = LCA([[1, 2], [0], [0]], root_node=0)
            tree.depth  # [0, 1, 1]

        Speed:
            O(n log n) time and memory.
        """
        count = len(neighbors)
        if count == 0:
            raise ValueError('empty tree')
        self.depth = [0] * count
        levels = max(1, count.bit_length())
        self.up = [[0] * count for _ in range(levels)]
        parent = [-1] * count
        parent[root_node] = root_node
        stack = [root_node]
        while stack:
            current_node = stack.pop()
            self.up[0][current_node] = parent[current_node]
            for next_node in neighbors[current_node]:
                if next_node != parent[current_node] and parent[next_node] == -1:
                    parent[next_node] = current_node
                    self.depth[next_node] = self.depth[current_node] + 1
                    stack.append(next_node)
        if any((prime == -1 for prime in parent)):
            raise ValueError('tree must be connected')
        for steps in range(1, levels):
            for next_node in range(count):
                self.up[steps][next_node] = self.up[steps - 1][self.up[steps - 1][next_node]]

    def kth_ancestor(self, current_node: int, steps: int) -> int:
        """
        Use when:
            Find the node k steps above another node in the rooted tree.
            Use when questions ask for parents, grandparents, or distant ancestors.

        Inputs:
            u: Node to begin at.
            k: Number of parent steps to move up (nonnegative integer).

        Returns:
            Ancestor's node number. Returns the root if k is larger
            than the number of steps from u to the root.

        Example:
            tree = LCA([[1], [0, 2], [1]])
            tree.kth_ancestor(2, 1)  # 1
            tree.kth_ancestor(2, 5)  # 0

        Speed:
            O(log n) time; no significant extra memory.
        """
        steps = min(steps, self.depth[current_node])
        for index in range(len(self.up)):
            if steps & 1 << index:
                current_node = self.up[index][current_node]
        return current_node

    def lca(self, current_node: int, next_node: int) -> int:
        """
        Use when:
            Find the lowest common ancestor of two tree nodes.
            This is their nearest shared parent, which can be either node itself.

        Inputs:
            u: First node.
            v: Second node.

        Returns:
            Node number of their closest shared ancestor.

        Example:
            tree = LCA([[1, 2], [0, 3], [0], [1]])
            tree.lca(3, 2)  # 0
            tree.lca(1, 3)  # 1

        Speed:
            O(log n) time; no significant extra memory.
        """
        if self.depth[current_node] < self.depth[next_node]:
            current_node, next_node = (next_node, current_node)
        current_node = self.kth_ancestor(current_node, self.depth[current_node] - self.depth[next_node])
        if current_node == next_node:
            return current_node
        for index in range(len(self.up) - 1, -1, -1):
            if self.up[index][current_node] != self.up[index][next_node]:
                current_node, next_node = (self.up[index][current_node], self.up[index][next_node])
        return self.up[0][current_node]

    def distance(self, current_node: int, next_node: int) -> int:
        """
        Use when:
            Count how many edges are on the only path between two tree nodes.
            Use for unweighted distances, not roads with different costs.

        Inputs:
            u: Starting node.
            v: Destination node.

        Returns:
            Number of edges between u and v.

        Example:
            tree = LCA([[1, 2], [0, 3], [0], [1]])
            tree.distance(3, 2)  # 3

        Speed:
            O(log n) time; no significant extra memory.
        """
        weight = self.lca(current_node, next_node)
        return self.depth[current_node] + self.depth[next_node] - 2 * self.depth[weight]

def tree_diameter(neighbors: list[list[int]]) -> tuple[int, int | None, int | None]:
    """Find the longest path in an undirected, unweighted tree.

    Example:
        tree_diameter([[1], [0, 2], [1]])  # (2, 2, 0) or equivalent

    Remember:
        Returns (distance, one endpoint, other endpoint)."""
    from collections import deque
    if not neighbors:
        return (0, None, None)

    def farthest(start_node: int) -> tuple[int, int]:
        """
        Use when:
            Internal helper: from one node, find the farthest node in the tree
            using a queue. Usually call tree_diameter() instead.

        Inputs:
            s: Starting node number.

        Returns:
            (node, distance): The farthest node and its distance in edges.

        Example:
            For a chain 0 -- 1 -- 2, farthest(0) gives (2, 2).

        Speed:
            O(n) time and O(n) memory.
        """
        distances = [-1] * len(neighbors)
        distances[start_node] = 0
        queue = deque([start_node])
        farthest_node = start_node
        while queue:
            current_node = queue.popleft()
            if distances[current_node] > distances[farthest_node]:
                farthest_node = current_node
            for next_node in neighbors[current_node]:
                if distances[next_node] == -1:
                    distances[next_node] = distances[current_node] + 1
                    queue.append(next_node)
        return (farthest_node, distances[farthest_node])
    first, _ = farthest(0)
    second, d = farthest(first)
    return (d, first, second)
