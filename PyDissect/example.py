def is_empty_tuple_truthy():
    return not()

def weird_addition():
    x = sum(range(ord(min(str(not())))))
    return chr(x)

def greet():
    print("ඞ", weird_addition())

class Impostor:
    def __init__(self):
        self.suspicious = True

    def act_normal(self):
        if self.suspicious:
            print("Nothing to see here...")
        else:
            print("I'm just doing tasks.")

greet()
