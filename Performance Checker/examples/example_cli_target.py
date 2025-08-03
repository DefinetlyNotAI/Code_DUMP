def do_math():
    x = 0
    for i in range(10_000):
        if i % 7 == 0:
            x += i
        elif i % 11 == 0:
            x -= i
    return x


def logical_mess():
    a = True
    b = False
    if (a and not b) or (a and b):
        return "hello"
    return "bye"


class TestClass:
    @staticmethod
    def run():
        for i in range(1000):
            pass


def main():
    do_math()
    logical_mess()
    t = TestClass()
    t.run()


main()
