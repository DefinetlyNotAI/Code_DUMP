class Card:
    def __init__(self, Number: int, Colour: str):
        self.__Colour: str = Colour
        self.__Number: int = Number

    def GetNumber(self):
        return self.__Number

    def GetColour(self):
        return self.__Colour


class Hand:
    def __init__(self, cards: list[Card]):
        self.__Cards: list[Card] = [Card(0, "") for _ in range(10)]
        for i in range(len(cards)):
            self.__Cards[i] = cards[i]

        self.__FirstCard: int = 1
        self.__NumberCards: int = len(cards)

    def GetCard(self, index: int) -> Card:
        return self.__Cards[index]


def CalculateValue(playerHand: Hand):
    score = 0
    for i in range(5):
        colour: str = playerHand.GetCard(i).GetColour()
        number: int = playerHand.GetCard(i).GetNumber()
        if colour == "red":
            score += 5
        elif colour == "blue":
            score += 10
        elif colour == "yellow":
            score += 15
        score += number
    return score


card1 = Card(1, "red")
card2 = Card(2, "red")
card3 = Card(3, "red")
card4 = Card(4, "red")
card5 = Card(5, "red")

card6 = Card(1, "blue")
card7 = Card(2, "blue")
card8 = Card(3, "blue")
card9 = Card(4, "blue")
card10 = Card(5, "blue")

card11 = Card(1, "yellow")
card12 = Card(2, "yellow")
card13 = Card(3, "yellow")
card14 = Card(4, "yellow")
card15 = Card(5, "yellow")


player1: Hand = Hand([card1, card2, card3, card4, card11])
player2: Hand = Hand([card12, card13, card14, card15, card6])

p1Score = CalculateValue(player1)
p2Score = CalculateValue(player2)
if p1Score == p2Score:
    print("DRAW!")
elif p1Score > p2Score:
    print("Player 1 wins!")
else:
    print("Player 2 wins!")
