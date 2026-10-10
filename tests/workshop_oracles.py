"""Independent small-input models for the twelve ADT workshops.

These use Python lists/dicts/deques rather than copying the C pointer algorithms.
Only three short cases are shipped per problem; generated tests are developer-only.
"""
from collections import deque
import heapq


CASES = {
    "intro.struct_review": [
        ("修改成绩、同分比较与删除", "3 8\n1 60\n2 90\n3 90\n4\n1 1 95\n4\n2 1\n3 4 90\n4\n6 1\n5\n"),
        ("零分也是有效记录", "2 7\n4 0\n7 20\n6 4\n3 4 30\n1 8 40\n2 9\n1 4 25\n4\n5\n"),
        ("删空后重新添加", "1 7\n5 70\n2 5\n4\n5\n3 2 80\n3 1 80\n4\n6 2\n"),
    ],
    "linear.arrays": [
        ("表头、表尾插入和连续修改", "3 9\n2 4 6\n1 1 9\n1 5 8\n2 3\n3 8\n4\n5\n6\n1 0 7\n5\n"),
        ("重复值与合法尾插", "4 7\n3 1 3 2\n3 3\n2 1\n1 4 5\n3 9\n5\n2 5\n6\n"),
        ("空表反转与重新插入", "1 8\n0\n2 1\n5\n4\n1 1 7\n1 2 0\n2 1\n5\n6\n"),
    ],
    "linear.linked_list": [
        ("头尾插、删除、反转与快慢指针", "3 10\n2 4 6\n9 1\n10 8\n1 3 9\n2 4\n5\n7 2\n8\n4\n5\n6\n"),
        ("偶数长度的中点和重复值", "4 7\n3 1 3 2\n8\n3 3\n7 4\n2 5\n1 5 0\n7 1\n5\n"),
        ("空链表也能反转和释放", "1 10\n0\n2 1\n4\n5\n8\n7 1\n9 7\n10 9\n1 0 5\n5\n7 2\n"),
    ],
    "linear.circular_list": [
        ("真正循环后还能插入和删除", "3 7\n1 2 3\n3 1\n4\n1 4 9\n2 1\n3 5\n4\n5\n"),
        ("删除尾节点和非法位置", "4 7\n3 1 3 2\n2 4\n1 1 8\n3 4\n4\n2 5\n1 0 9\n5\n"),
        ("头节点自环与重建连接", "1 8\n7\n2 1\n3 3\n4\n5\n1 1 0\n3 4\n4\n5\n"),
    ],
    "linear.doubly_list": [
        ("正反遍历与整表反转", "3 8\n1 2 3\n1 2 9\n3\n4\n2 4\n5\n3\n4\n6\n"),
        ("头尾删除后双向链接一致", "4 7\n4 2 2 1\n2 1\n2 3\n1 3 7\n3\n4\n1 0 9\n6\n"),
        ("空表反转与重新插入", "1 8\n0\n2 1\n5\n3\n4\n1 1 8\n5\n3\n4\n"),
    ],
    "linear.stack": [
        ("满栈、查看和出栈", "3 11\n1 2\n1 0\n1 5\n1 9\n3\n2\n4\n6\n2\n2\n2\n"),
        ("查看不会弹出元素", "2 8\n3\n1 -3\n3\n3\n4\n2\n4\n6\n"),
        ("清空后可以复用", "2 8\n1 7\n1 8\n5\n4\n2\n1 0\n6\n2\n"),
    ],
    "linear.queue": [
        ("挪表避免假满", "3 13\n1 10\n1 20\n1 30\n2\n7\n1 40\n7\n1 50\n5\n3\n2\n2\n2\n"),
        ("空队列和重复查看", "2 9\n2\n3\n1 0\n3\n3\n7\n4\n2\n5\n"),
        ("清空与再次入队", "2 10\n1 7\n1 8\n1 9\n6\n7\n1 5\n1 6\n2\n1 0\n5\n"),
    ],
    "linear.circular_queue": [
        ("保留空槽、下标回绕和满队列", "4 12\n1 10\n1 20\n1 30\n1 40\n2\n2\n1 40\n1 50\n7\n5\n3\n4\n"),
        ("数字零不表示出队失败", "3 9\n2\n1 0\n3\n1 8\n1 9\n2\n1 7\n7\n5\n"),
        ("回绕后清空再复用", "3 11\n1 1\n1 2\n2\n1 3\n7\n6\n7\n1 4\n1 5\n5\n4\n"),
    ],
    "trees.binary_tree": [
        ("前序建树、四种遍历和层数", "ABD##E##C#F##\n"),
        ("只有右孩子的普通链状树", "A#B#C##\n"),
        ("空树无需访问空指针", "#\n"),
    ],
    "graphs.basics": [
        ("Dijkstra 路径与 Floyd 查询", "5 6 1 5 2\n1 2 2\n1 3 8\n2 3 1\n2 4 5\n3 4 1\n4 5 3\n1 5\n2 4\n"),
        ("未连通顶点不能作为下一候选", "5 3 2 5 2\n1 2 4\n2 3 1\n4 5 2\n1 3\n2 5\n"),
        ("零权边也是边", "4 4 1 4 2\n1 2 0\n2 3 2\n3 4 1\n1 4 9\n1 3\n2 4\n"),
    ],
    "graphs.traversal": [
        ("DFS、BFS 的访问顺序不同", "5 5 1\n1 2\n1 3\n2 4\n3 4\n4 5\n"),
        ("从指定起点出发再补遍历其他分量", "6 4 4\n1 2\n2 3\n4 5\n5 6\n"),
        ("带环和孤立顶点", "5 3 2\n1 2\n2 3\n3 1\n"),
    ],
    "comprehensive.training": [
        ("同权节点按编号决定左右孩子", "4\n1 1 2 3\n"),
        ("建立整棵树并回溯编码", "5\n2 3 5 7 9\n"),
        ("只有一个叶子", "1\n7\n"),
    ],
}
LESSONS = frozenset(CASES)


def workshop_answer(lesson, text):
    tokens = iter(text.split())
    def number():
        return int(next(tokens))
    output = []
    def emit(*values):
        output.append(" ".join(map(str, values)))
    def sequence(values):
        emit(*values) if values else emit("EMPTY")

    if lesson == "intro.struct_review":
        n, q = number(), number()
        records = {number(): number() for _ in range(n)}
        for _ in range(q):
            op = number()
            if op in (1, 3):
                key, score = number(), number()
                if op == 1:
                    if key in records: records[key] = score; emit("OK")
                    else: emit("NOT_FOUND")
                elif key in records: emit("EXISTS")
                else: records[key] = score; emit("OK")
            elif op == 2:
                key = number()
                emit(records.pop(key) if key in records else "NOT_FOUND")
            elif op == 4:
                if records:
                    key = min(records, key=lambda key: (-records[key], key))
                    emit(key, records[key])
                else: emit("EMPTY")
            elif op == 5: emit(len(records), sum(records.values()))
            elif op == 6: emit(records.get(number(), "NOT_FOUND"))
            else: raise AssertionError("Unknown record operation")
    elif lesson in ("linear.arrays", "linear.linked_list", "linear.circular_list", "linear.doubly_list"):
        n, q = number(), number()
        values = [number() for _ in range(n)]
        for _ in range(q):
            op = number()
            if op == 1:
                position, value = number(), number()
                if 1 <= position <= len(values) + 1: values.insert(position - 1, value); emit("OK")
                else: emit("INVALID")
            elif op == 2:
                position = number()
                emit(values.pop(position - 1) if 1 <= position <= len(values) else "INVALID")
            elif lesson == "linear.circular_list":
                if op == 3:
                    k = number() % len(values) if values else number()
                    values = values[k:] + values[:k]
                elif op == 4: sequence(values)
                elif op == 5: emit(len(values))
                else: raise AssertionError("Unknown circular list operation")
            elif lesson == "linear.doubly_list":
                if op == 3: sequence(values)
                elif op == 4: sequence(values[::-1])
                elif op == 5: values.reverse()
                elif op == 6: emit(len(values))
                else: raise AssertionError("Unknown doubly list operation")
            elif op == 3:
                value = number()
                emit(values.index(value) + 1 if value in values else 0)
            elif op == 4: values.reverse()
            elif op == 5: sequence(values)
            elif op == 6: emit(len(values))
            elif lesson == "linear.linked_list" and op == 7:
                k = number()
                emit(values[-k] if 1 <= k <= len(values) else "INVALID")
            elif lesson == "linear.linked_list" and op == 8:
                emit(values[len(values) // 2] if values else "EMPTY")
            elif lesson == "linear.linked_list" and op in (9, 10):
                value = number()
                values.insert(0, value) if op == 9 else values.append(value)
                emit("OK")
            else: raise AssertionError("Unknown list operation")
    elif lesson == "linear.stack":
        capacity, q = number(), number()
        values = []
        for _ in range(q):
            op = number()
            if op == 1:
                value = number()
                if len(values) == capacity: emit("FULL")
                else: values.append(value); emit("OK")
            elif op == 2: emit(values.pop() if values else "EMPTY")
            elif op == 3: emit(values[-1] if values else "EMPTY")
            elif op == 4: emit(len(values))
            elif op == 5: values.clear(); emit("OK")
            elif op == 6: sequence(values)
            else: raise AssertionError("Unknown stack operation")
    elif lesson in ("linear.queue", "linear.circular_queue"):
        capacity, q = number(), number()
        ring = lesson == "linear.circular_queue"
        values = deque()
        front = rear = 0
        for _ in range(q):
            op = number()
            if op == 1:
                value = number()
                if len(values) == capacity - int(ring): emit("FULL")
                else:
                    if not ring and rear == capacity: front = 0; rear = len(values)
                    values.append(value)
                    rear = (rear + 1) % capacity if ring else rear + 1
                    emit("OK")
            elif op == 2:
                if not values: emit("EMPTY")
                else:
                    emit(values.popleft())
                    front = (front + 1) % capacity if ring else front + 1
            elif op == 3: emit(values[0] if values else "EMPTY")
            elif op == 4: emit(len(values))
            elif op == 5: sequence(list(values))
            elif op == 6: values.clear(); front = rear = 0; emit("OK")
            elif op == 7: emit(front, rear)
            else: raise AssertionError("Unknown queue operation")
    elif lesson == "trees.binary_tree":
        serial = next(tokens)
        characters = iter(serial)
        def parse():
            key = next(characters)
            return None if key == "#" else (key, parse(), parse())
        tree = parse()
        assert next(characters, None) is None
        def walk(node, mode):
            if node is None: return ""
            key, left, right = node
            a, b = walk(left, mode), walk(right, mode)
            return key + a + b if mode == 0 else a + key + b if mode == 1 else a + b + key
        for mode in range(3): emit(walk(tree, mode) or "EMPTY")
        levels, queue = [], deque([tree] if tree else [])
        while queue:
            layer = []
            for _ in range(len(queue)):
                node = queue.popleft(); layer.append(node[0])
                queue.extend(child for child in node[1:] if child is not None)
            levels.append(layer)
        emit("".join(key for layer in levels for key in layer) or "EMPTY")
        def leaves(node):
            if node is None: return 0
            return 1 if node[1:] == (None, None) else leaves(node[1]) + leaves(node[2])
        emit(len(levels), leaves(tree), sum(map(len, levels)))
    elif lesson == "graphs.basics":
        n, m, source, target, q = [number() for _ in range(5)]
        inf = 10**9
        matrix = [[0 if i == j else inf for j in range(n)] for i in range(n)]
        adjacent = [[] for _ in range(n)]
        for _ in range(m):
            a, b, weight = number() - 1, number() - 1, number()
            matrix[a][b] = matrix[b][a] = weight
            adjacent[a].append((b, weight)); adjacent[b].append((a, weight))
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    matrix[i][j] = min(matrix[i][j], matrix[i][k] + matrix[k][j])
        emit(*(len(row) for row in adjacent))
        emit(*(value if value < inf else "INF" for value in matrix[source - 1]))
        # Heap-based independent path recovery; C uses a matrix/minimum scan.
        distance, parent = [inf] * n, [-1] * n
        distance[source - 1] = 0
        pending = [(0, source - 1)]
        while pending:
            cost, vertex = heapq.heappop(pending)
            if cost != distance[vertex]: continue
            for child, weight in sorted(adjacent[vertex]):
                if cost + weight < distance[child]:
                    distance[child], parent[child] = cost + weight, vertex
                    heapq.heappush(pending, (distance[child], child))
        if distance[target - 1] == inf: emit("NO_PATH")
        else:
            route, current = [], target - 1
            while current != -1: route.append(current + 1); current = parent[current]
            emit(*route[::-1])
        for _ in range(q):
            value = matrix[number() - 1][number() - 1]
            emit(value if value < inf else "INF")
    elif lesson == "graphs.traversal":
        n, m, source = number(), number(), number() - 1
        adjacent = [set() for _ in range(n)]
        for _ in range(m):
            a, b = number() - 1, number() - 1
            adjacent[a].add(b); adjacent[b].add(a)
        roots = [source] + [i for i in range(n) if i != source]
        order, seen = [], set()
        def dfs(vertex):
            seen.add(vertex); order.append(vertex + 1)
            for child in sorted(adjacent[vertex]):
                if child not in seen: dfs(child)
        for root in roots:
            if root not in seen: dfs(root)
        emit(*order)
        order, seen, components = [], set(), 0
        distance = [-1] * n
        for root in roots:
            if root in seen: continue
            components += 1; pending = deque([root]); seen.add(root)
            if root == source: distance[root] = 0
            while pending:
                vertex = pending.popleft(); order.append(vertex + 1)
                for child in sorted(adjacent[vertex]):
                    if child in seen: continue
                    seen.add(child); pending.append(child)
                    if distance[vertex] != -1: distance[child] = distance[vertex] + 1
        emit(*order); emit(components); emit(*distance)
    elif lesson == "comprehensive.training":
        n = number()
        pending = [(number(), i + 1, i + 1) for i in range(n)]
        heapq.heapify(pending)
        serial = n
        while len(pending) > 1:
            a, b = heapq.heappop(pending), heapq.heappop(pending)
            serial += 1
            heapq.heappush(pending, (a[0] + b[0], serial, (a[2], b[2])))
        weight, _, tree = pending[0]
        codes, wpl = {}, 0
        # Recover depths from a tuple tree; sum the original leaf weights.
        weights = list(map(int, text.split()))[1:]
        def visit(node, prefix):
            nonlocal wpl
            if isinstance(node, int):
                codes[node] = prefix or "0"
                wpl += weights[node - 1] * len(prefix)
            else:
                visit(node[0], prefix + "0"); visit(node[1], prefix + "1")
        visit(tree, ""); emit(wpl)
        for i in range(1, n + 1): emit(i, codes[i])
    else:
        raise AssertionError("Unknown workshop: " + lesson)
    assert next(tokens, None) is None, "Unconsumed workshop input"
    return "\n".join(output) + "\n"
