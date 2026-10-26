"""Integer 2D computational geometry."""

def cross(first_point: list[int], second_point: list[int], third_point: list[int]) -> int:
    """Check whether three points make a left turn or a right turn.

    Example:
        cross((0, 0), (1, 0), (1, 1))  # 1

    Remember:
        Positive means left, negative means right, zero means straight."""
    return (second_point[0] - first_point[0]) * (third_point[1] - first_point[1]) - (second_point[1] - first_point[1]) * (third_point[0] - first_point[0])

def convex_hull(points: list[list[int]]) -> list[list[int]]:
    """Find the outermost points surrounding a set of 2D points.

    Example:
        convex_hull([[0, 0], [1, 0], [0, 1], [0, 0]])

    Remember:
        Points on straight edges may be omitted."""
    points = sorted(set(map(tuple, points)))
    if len(points) <= 1:
        return points
    lower_boundary = []
    for point in points:
        while len(lower_boundary) >= 2 and cross(lower_boundary[-2], lower_boundary[-1], point) <= 0:
            lower_boundary.pop()
        lower_boundary.append(point)
    upper_boundary = []
    for point in reversed(points):
        while len(upper_boundary) >= 2 and cross(upper_boundary[-2], upper_boundary[-1], point) <= 0:
            upper_boundary.pop()
        upper_boundary.append(point)
    return lower_boundary[:-1] + upper_boundary[:-1]

def polygon_area2(points: list[list[int]]) -> float:
    """Calculate the signed double area of a polygon.

    Example:
        abs(polygon_area2([[0, 0], [1, 0], [1, 1], [0, 1]])) / 2  # 1.0

    Remember:
        Use abs(result) / 2 to get the ordinary area."""
    return sum((points[index][0] * points[(index + 1) % len(points)][1] - points[index][1] * points[(index + 1) % len(points)][0] for index in range(len(points))))
