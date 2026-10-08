def matches(actual, expected):
    """当前课程按空白分隔的 token 比较，支持 Windows/Unix 换行。"""
    return actual.split() == expected.split()


def verdict(actual, expected):
    if expected is None:
        return "RUN"
    return "AC" if matches(actual, expected) else "WA"
