WordArray: list[str | None] = []
NumberWords: int = 0


def ReadWords(filename: str):
    global NumberWords
    global WordArray

    with open(filename) as f:
        for line in f:
            WordArray.append(line.strip())

    NumberWords = len(WordArray) - 1
    Play()


def Play():
    global NumberWords
    global WordArray

    print(f"Number of words (excluding main word): {NumberWords}")
    print(f"The word to use is: {WordArray[0]}")

    unanswered: list[str] = WordArray.copy()
    unanswered.remove(unanswered[0])
    correct_int = 0
    answer = input(f"Write a word that uses the letters of {WordArray[0]} ('no' to stop): ").strip().lower()

    while answer != 'no' or correct_int == NumberWords:
        if answer in WordArray:
            correct_int += 1
            WordArray[WordArray.index(answer)] = None
            unanswered.remove(answer)
            print(f"Correct! Current Score: {correct_int}/{NumberWords}")
        else:
            print("Wrong!")
        answer = input(f"Write a word that uses the letters of {WordArray[0]} ('no' to stop): ").strip().lower()

    print(f"Percentage: {correct_int / NumberWords * 100}% (Score: {correct_int}/{NumberWords})")
    print(f"Unanswered Words: {', '.join(unanswered)}") if len(unanswered) > 0 else print("All words were answered!")


if __name__ == "__main__":
    diff = input('Type "easy", "medium" or "hard" to select difficulty: ').strip().lower()

    while diff not in ['easy', 'medium', 'hard']:
        print('Invalid input. Please try again.')
        diff = input('Type "easy", "medium" or "hard" to select difficulty: ').strip().lower()

    ReadWords(f"{diff}.txt")
