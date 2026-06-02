class TreasureChest:
    def __init__(self, question: str, answer: int, points: int):
        self.__points: int = points
        self.__answer: int = answer
        self.__question: str = question

    def getQuestion(self):
        return self.__question

    def checkAnswer(self, answer: int):
        return self.__answer == answer

    def getPoints(self, attempts: int):
        if attempts in [1, 2]:
            return self.__points / attempts
        if attempts in [3, 4]:
            return self.__points / 4
        return 0


def readData() -> list[TreasureChest] | None:
    try:
        arrayTreasure: list[TreasureChest] = []
        with open("TreasureChestData.txt", "r") as f:
            for n in range(5):
                q = f.readline().strip("\n").removesuffix(" question")
                a = int(f.readline().strip("\n").removesuffix(" answer"))
                p = int(f.readline().strip("\n").removesuffix(" point"))
                arrayTreasure.append(TreasureChest(q, a, p))
        return arrayTreasure
    except FileNotFoundError:
        print("File does not exist")
    except ValueError:
        print("Invalid answer/point type - must be int with answer/point suffix")


isCorrect = False
attemptsInQ = 0
arr = readData()
if arr is None:
    exit(1)

while True:
    try:
        qNum = int(input("What question do you want (1-5): "))
        if 0 <= qNum <= 5:
            break
        print("Invalid number")
    except ValueError:
        print("Invalid number")
qNum -= 1
print(arr[qNum].getQuestion())

while not isCorrect:
    try:
        ans = int(input(f"What is your answer (attempt number {attemptsInQ}): "))
        attemptsInQ += 1
        isCorrect = arr[qNum].checkAnswer(ans)
        if not isCorrect:
            print("Wrong answer")
    except ValueError:
        print("Invalid number")
print("Correct answer")
print(f"You got {arr[qNum].getPoints(attemptsInQ)} points")
