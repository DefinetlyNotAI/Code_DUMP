from performance_manager import test


def compute():
    total = 0
    for i in range(1000000):
        if i % 2 == 0:
            total += i
        else:
            total -= i
    return total


def func1():
    return sum([i for i in range(10000)])


def func2():
    x = 0
    while x < 10000:
        if x % 100 == 0 or x % 3 == 0:
            x += 2
        else:
            x += 1
    return x


def main():
    func1()
    func2()
    return compute()


if __name__ == "__main__":
    test(main, cover_time=True, cover_cpu=True, cover_lines=True)
