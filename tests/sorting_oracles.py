"""Tiny independent answers, not implementations copied from the reference C."""
def sorting_answer(lesson, stage, tokens):
    if lesson == 'linear.circular_queue':
        if stage == 'exam':
            n, threshold = tokens
            people, result, index = list(range(1, n+1)), [], 0
            while people:
                index = (index+threshold-1) % len(people)
                result.append(people.pop(index))
            return result
        capacity, operations, *commands = tokens
        queue, result, at = [], [], 0
        for _ in range(operations):
            op = commands[at]; at += 1
            if op == 1:
                value = commands[at]; at += 1
                if len(queue) == capacity:
                    result.append('FULL')
                else:
                    queue.append(value)
            else:
                assert op in (2, 3)
                result.append(queue[0] if queue else 'EMPTY')
                if op == 2 and queue:
                    queue.pop(0)
        assert at == len(commands)
        return result
    if lesson == 'sorting.selection_sort' and stage == 'exam':
        assert len(tokens) == 3
        return sorted(tokens)
    n, *values = tokens
    assert n == len(values)
    if lesson == 'sorting.overview':
        if stage == 'practice':
            return [int(all(left <= right for left, right in zip(values, values[1:])))]
        result = sorted(set(values))
        return [len(result)] + result
    if lesson == 'sorting.insertion_sort' and stage == 'exam':
        differences = [abs(right-left) for left, right in zip(values, values[1:])]
        return ['Jolly' if sorted(differences) == list(range(1, n)) else 'Not jolly']
    return sorted(values)
