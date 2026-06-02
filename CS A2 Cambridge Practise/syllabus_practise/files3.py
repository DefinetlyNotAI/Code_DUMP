players: list[list] = [["", -1] for _ in range(10)]


def ReadHighScores():
    global players
    try:
        with open("HighScore.txt", "r") as f:
            for i in range(len(players)):
                players[i][0] = f.readline()[:3].strip("\n")
                players[i][1] = int(f.readline().strip("\n"))
    except FileNotFoundError:
        print("Error: File not found")
    except ValueError:
        print("Invalid score type (must be int)")


def OutputHighScores():
    global players
    for i in range(len(players)):
        if players[i][1] != -1:
            print(f"{players[i][0]} {players[i][1]}")


def Top10(name: str, score: int):
    global players
    players.append([name, score])
    for i in range(len(players)):
        for j in range(len(players) - 1):
            if players[j][1] < players[j + 1][1]:
                players[j], players[j + 1] = players[j + 1], players[j]
    players.pop(len(players) - 1)


def WriteTopTen():
    try:
        with open("NewHighScore.txt", "w") as f:
            for i in range(len(players)):
                f.write(f"{players[i][0]}\n{players[i][1]}\n")
    except Exception:
        print("Error occurred when writing the values")


ReadHighScores()
OutputHighScores()

username = input("Input username (only first 3 letters will be saved): ")[:3].strip()
while True:
    inputScore = int(input("Input score: "))
    if 1 <= inputScore <= 100_000:
        break
    print("Invalid score, must be 1-100k")

Top10(username, inputScore)
OutputHighScores()
WriteTopTen()
