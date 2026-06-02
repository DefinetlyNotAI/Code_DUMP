# TOTAL: 22/22

WordArray: list[str] = []  # 1 mark
Count: int = 0


# 6/6, 1/1
def ReadWords(fileName: str):  # 1 mark
    global WordArray, Count
    with open(fileName, "r") as f:  # 1 mark  # 1 mark
        WordArray = f.readlines()
        for i in range(len(WordArray)):
            WordArray[i] = WordArray[i].strip("\n")  # 1 mark   # 1 mark
    Count = len(WordArray) - 1  # 1 mark
    Play()  # 1 mark


# 6/6, 3/3
def Play():  # 1 mark
    global WordArray, Count

    words: list[str | None] = WordArray.copy()
    mainWord = words.pop(0)
    correct = 0

    print(f"The word is '{mainWord}'")
    print(f"There is {Count} valid answers")

    while correct < Count:
        answer = input("Input a new word that uses the main word's letters: ")

        if answer == "no":  # 1 mark
            break

        if answer in words:  # 1 mark
            correct += 1  # 1 mark
            words[words.index(answer)] = None  # 1 mark
            print(f"Correct! [{correct}/{Count}]")
        else:
            print("Wrong, Try Again!")  # 1 mark

    print(f"Percentage of answers correct/solved: {(correct / Count) * 100}")  # 1 mark
    unansweredWords = []
    for i in range(len(words)):
        if words[i] is not None:  # 1 mark
            unansweredWords.append(words[i])
    print(f"Available answers you didn't answer: {', '.join(unansweredWords)}")  # 1 mark


# 4/4
while True:
    diff = input("Select difficulty (easy, medium, hard): ").strip().lower()  # 1 mark  # 1 mark
    if diff in ["easy", "medium", "hard"]:
        break
    print("Invalid selection, please try again.")

ReadWords(f"{diff.capitalize()}.txt")  # 1 mark  # 1 mark

# 1/1
"""
Select difficulty (easy, medium, hard): easy
The word is 'house'
There is 14 valid answers
Input a new word that uses the main word's letters: she
Correct! [1/14]
Input a new word that uses the main word's letters: out
Wrong, Try Again!
Input a new word that uses the main word's letters: no
Percentage of answers correct/solved: 7.142857142857142
Available answers you didn't answer: hues, hose, hoes, shoe, sou, ohs, ose, oes, sue, use, hue, hoe, hes
"""

# 1/1
"""
Select difficulty (easy, medium, hard): hard
The word is 'fainted'
There is 97 valid answers
Input a new word that uses the main word's letters: fine
Correct! [1/97]
Input a new word that uses the main word's letters: fined
Correct! [2/97]
Input a new word that uses the main word's letters: idea
Correct! [3/97]
Input a new word that uses the main word's letters: no
Percentage of answers correct/solved: 3.0927835051546393
Available answers you didn't answer: defiant, detain, fadein, nidate, anted, fated, tined, defat, feint, teind, entia, fetid, tenia, faint, fiend, tinea, adit, daft, defi, diet, dite, fain, fend, neif, tend, aide, date, deft, dine, edit, fane, feta, nide, tide, ante, deaf, deni, dint, fate, fiat, naif, nite, tied, anti, dean, dent, dita, fade, feat, find, neat, tain, tine, aft, and, ate, die, eat, fad, fen, fin, nit, tea, tin, aid, ane, dan, dif, eft, fan, fet, fit, tad, ted, ain, ani, def, din, end, fat, fid, nae, tae, ten, ait, ant, den, dit, eta, fed, fie, net, tan, tie
"""