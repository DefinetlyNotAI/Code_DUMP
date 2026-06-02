HighScores: list[list[str]] = [["" for _ in range(3)] for _ in range(7)]


def ReadData():
    LocalHighScores: list[list[str]] = [["" for _ in range(3)] for _ in range(7)]
    with open("HighScoreTable.txt", "r") as f:
        for i in range(7):
            for j in range(3):
                LocalHighScores[i][j] = f.readline().rstrip("\n")
    return LocalHighScores


def OutputHighScores(array: list[list[str]]):
    for i in range(7):
        print(f"{array[i][0]} reached level {array[i][1]} with a score of {array[i][2]}")


def SortScores(array: list[list[str]]):
    for _ in range(7):
        for i in range(6):
            if array[i][1] < array[i+1][1]:
                array[i], array[i+1] = array[i+1], array[i]
    return array


HighScores = ReadData()
print("Before")
OutputHighScores(HighScores)
HighScores = SortScores(HighScores)
print("After")
OutputHighScores(HighScores)
