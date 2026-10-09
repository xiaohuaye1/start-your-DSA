"""Independent list-based answers for the tiny educational cases."""
def bracket_answer(text):
    depth, valid = 0, True
    for char in text.split('@')[0]:
        if char == '(':
            depth += 1
        elif char == ')':
            depth -= 1
            if depth < 0:
                valid = False
    return 'YES' if valid and depth == 0 else 'NO'


def linear_answer(lesson, stage, tokens):
    name = lesson.split('.')[-1]
    if stage == 'practice':
        if name in ('linked_list', 'doubly_list'):
            n, position = tokens[:2]
            if name == 'linked_list':
                value, *items = tokens[2:]
                assert n == len(items) and 1 <= position <= n
                return items[:position] + [value] + items[position:]
            items = tokens[2:]
            assert n == len(items) and 1 <= position <= n
            items.pop(position - 1)
            return items + items[::-1]
        if name == 'circular_list':
            n, count, *items = tokens
            assert n == len(items)
            count %= n
            return items[count:] + items[:count]
        if name in ('stack', 'queue'):
            items, output, at = [], [], 1
            for _ in range(tokens[0]):
                operation = tokens[at]; at += 1
                if operation == 1:
                    items.append(tokens[at]); at += 1
                else:
                    assert items and operation in (2, 3)
                    index = -1 if name == 'stack' else 0
                    output.append(items[index])
                    if operation == 2:
                        items.pop(index)
            assert at == len(tokens)
            return output
    else:
        if name == 'linked_list':
            items, output, at = [1], [], 1
            for _ in range(tokens[0]):
                operation, value = tokens[at:at+2]; at += 2
                index = items.index(value)
                if operation == 1:
                    inserted = tokens[at]; at += 1
                    assert inserted not in items
                    items.insert(index + 1, inserted)
                elif operation == 2:
                    output.append(items[index + 1] if index + 1 < len(items) else 0)
                else:
                    assert operation == 3 and index + 1 < len(items)
                    items.pop(index + 1)
            assert at == len(tokens)
            return output
        if name == 'circular_list':
            n, count = tokens
            items, output, index = list(range(1, n + 1)), [], 0
            while items:
                index = (index + count - 1) % len(items)
                output.append(items.pop(index))
            return output
        if name == 'doubly_list':
            n, items, at = tokens[0], [1], 1
            for value in range(2, n + 1):
                relative, side = tokens[at:at+2]; at += 2
                assert side in (0, 1)
                items.insert(items.index(relative) + side, value)
            count = tokens[at]; at += 1
            assert at + count == len(tokens)
            for value in tokens[at:]:
                if value in items:
                    items.remove(value)
            return items
        if name == 'queue':
            capacity, n, *words = tokens
            assert n == len(words)
            cache, misses = [], 0
            for word in words:
                if word not in cache:
                    misses += 1
                    if len(cache) == capacity:
                        cache.pop(0)
                    cache.append(word)
            return [misses]
    raise AssertionError('Missing linear oracle: ' + lesson)
