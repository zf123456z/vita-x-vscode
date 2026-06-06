# V 语言 0.1 草案 — 为认知计算而生的语言

> **核心理念**: 万物皆向量。
> 现有语言（Python/Java/C）是为"计算"设计的 — 变量是数字和字符串，操作是加减乘除。
> V 语言是为"思考"设计的 — 变量是超维向量 (10,000维)，操作是认知操作 (bind/bundle/permute/resonate)。

---

## 一、语言哲学

### 1.1 为什么需要新的语言？

```python
# Python 表达"红苹果"的概念：
apple = "苹果"
red_apple = f"红{apple}"  # 字符串拼接，没有语义
```

```v
// V 语言表达"红苹果"的概念：
let Apple = symbol("苹果")
let Red = symbol("红色")
let red_apple = bind(Red, Apple)   // 语义组合：红⊕苹果
```

**区别**: Python 操作的是字符串（符号的表面形式），V 操作的是向量（符号的语义本质）。
在 V 中，"红苹果"不只是一个字符串，它是一个 10,000 维的超维向量，携带了"红色"和"苹果"的所有语义信息。

### 1.2 核心设计原则

1. **变量即向量** — 所有数据都是 10,000 维超维向量
2. **操作即认知** — 基本操作映射认知过程（绑定=组合，捆扎=抽象，置换=时序）
3. **事件即思维** — 控制流基于事件驱动，而非顺序执行
4. **记忆即代码** — 程序和数据不分家，记忆可以直接作为逻辑执行
5. **最少关键字** — 整个语言只需要 5 个关键字

---

## 二、语法规范

### 2.1 注释

```v
// 单行注释
/* 多行注释 */

#! 文档注释（用于概念和能力）
#! 这个函数把文本编码为超维向量
```

### 2.2 变量与类型

V 语言只有一种类型：`vec`（10,000 维超维向量）。

```v
let x = symbol()           // 创建一个随机超维符号
let greeting = symbol("你好")  // 创建并命名符号
let apple = symbol("苹果")
let fruit = symbol()        // 匿名符号

// 类型别名（仅为可读性，编译后都是 vec）
type Name = vec
type Concept = vec
type Pattern = vec
```

### 2.3 核心操作

#### 绑定 (bind) — 组合两个概念

```v
let red_apple = bind(Red, Apple)    // 红苹果 = 红色 ⊕ 苹果
let flying_bird = bind(Fly, Bird)   // 飞鸟 = 飞 ⊕ 鸟

// 解绑：从组合中提取
let extracted_red = unbind(red_apple, Apple)  // 提取"红色"
```

#### 捆扎 (bundle) — 创建概念集合

```v
let fruits = bundle(Apple, Banana, Orange)     // 水果 = {苹果,香蕉,橙子}
let pets = bundle(Cat, Dog, Fish)              // 宠物 = {猫,狗,鱼}

// 捆扎结果是"原型" — 与集合成员相似但不等于任何成员
let is_fruit = similarity(Apple, fruits)       // ~0.5（随机向量 ~0.0）
```

#### 置换 (permute) — 编码顺序和结构

```v
let love = "爱"
let i_love_you = bundle(
    permute(symbol("我")),      // 位置1
    permute(love, 1),           // 位置2  
    permute(symbol("你"), 2)    // 位置3
)
// 置换保证"我爱你"≠"你爱我"
```

#### 共振 (resonate) — 联想和检索

```v
let thoughts = resonate(query, memory)  // 在记忆中找最相似的概念
// 返回 [(概念, 相似度), ...] 按相似度降序
```

#### 类比 (analogize) — 推理

```v
// 国王 : 男人 = 女王 : ?
let result = analogize(King, Man, Queen, memory)
// result → Woman (相似度最高)
```

### 2.4 程序结构

V 语言程序由四种基本单元组成：

#### 概念 (concept)

```v
concept Greeting = "你好"
concept Farewell = "再见"
concept Fruit = bundle(Apple, Banana, Orange)
```

#### 能力 (capability)

```v
// 能力 = 函数
capability greet(name) {
    let template = bind(symbol("你好"), name)
    return template
}

capability classify(text, categories) -> vec {
    let query = encode(text)
    let best = categories[0]
    let best_sim = -1.0
    
    for cat in categories {
        let sim = similarity(query, cat)
        if sim > best_sim {
            best_sim = sim
            best = cat
        }
    }
    return best
}
```

#### 技能 (skill)

```v
// 技能 = 事件处理器
skill on_hello {
    let response = bind(symbol("你好！我是"), Vita)
    emit response
}

skill on_help {
    emit bundle(
        symbol("我可以帮你"),
        symbol("搜索、写代码、分析数据")
    )
}
```

#### 心智模型 (mind)

```v
// 心智 = 完整的认知架构
mind Vita {
    // 预加载的概念
    concept Greeting = "你好"
    concept Help = "帮助"
    
    // 技能注册
    skill on_hello
    skill on_help
    skill on_farewell
    
    // 初始化记忆
    memory Greeting -> "你好！我是 Vita。"
    memory Help -> bundle(Search, Code, Analyze)
}
```

### 2.5 事件系统

```v
// 发送事件
emit "greeting.received", {
    "text": "你好",
    "time": now()
}

// 监听事件
on "greeting.received" {
    let reply = bind(symbol("你好！"), symbol("我是Vita"))
    emit reply
}

// 链式事件
on "error.occurred" -> "heal" {
    // 自动链接：错误发生后触发修复
}
```

### 2.6 记忆操作

```v
// 存储
memorize concept Red          // 记住"红色"
memorize pattern Greeting     // 记住问候模式

// 召回
let result = recall(query)     // 联想检索
let similar = recall(query, top=5)

// 遗忘
forget threshold=0.1          // 遗忘低强度记忆
forget pattern Greeting       // 遗忘特定模式

// 融合
let pets = merge(Cat, Dog)    // 融合两个概念
```

---

## 三、内存模型

### 3.1 三层存储

```
L1: 概念缓存 (2000个最近概念)      — 毫秒级访问
L2: 超维记忆 (10,000条活跃记忆)    — 微秒级共振
L3: 持久存储 (SSD/磁盘)           — 秒级加载
```

### 3.2 向量存储格式

```binary
[类型: 1byte][维度: 4bytes][数据: N bytes][强度: 4bytes]
```

所有向量在内存中以 int8 数组存储（每个维度 1 byte），10,000 维 = 10KB。

---

## 四、编译目标

### 4.1 编译器架构

```
V 源码 (.v)
  │
  ▼
解析器 → AST → 语义分析 → 中间表示 (IR)
  │
  ▼
代码生成
  ├── Python后端 （原型/教学）
  ├── C后端     （生产/嵌入式）
  └── HD原生    （理论最优）
```

### 4.2 示例编译

```v
// V 源码
let Apple = symbol("苹果")
let Red = symbol("红色")  
let RedApple = bind(Red, Apple)
```

```python
# 编译为 Python
import numpy as np
Apple = np.random.choice([-1, 1], size=10000)
Red = np.random.choice([-1, 1], size=10000)
RedApple = Red * Apple
```

```c
// 编译为 C
int8_t Apple[10000];
int8_t Red[10000];
int8_t RedApple[10000];
// 每个维度只需要一条 SIMD 指令
for (int i = 0; i < 10000; i++) {
    RedApple[i] = (Red[i] == Apple[i]) ? 1 : -1;
}
```

---

## 五、标准库设计

```v
// 核心库 (core.v)
capability similarity(a, b) -> float
capability bind(a, b) -> vec
capability bundle(list) -> vec
capability permute(v, n) -> vec
capability resonate(query, memory, k) -> list
capability analogize(a, b, c, memory) -> list

// 文本库 (text.v)
capability encode(text) -> vec
capability tokenize(text) -> list
capability generate(pattern) -> text

// 记忆库 (memory.v)
capability memorize(concept)
capability recall(query, k) -> list
capability forget(threshold)

// 技能库 (skills.v)
capability register_skill(event, handler)
capability execute_skill(name, args) -> result
```

---

## 六、Roadmap

| 版本 | 目标 | 时间 |
|------|------|------|
| 0.1 | 语言规范 + Python 原型编译器 | 本次 |
| 0.2 | 语法解析器 + AST | 未来 |
| 0.3 | 完整 Python 后端 + 运行时代码生成 | 未来 |
| 0.4 | C 后端 + SIMD 优化 | 未来 |
| 1.0 | 自举（V 编译器用 V 写） | 终极目标 |

---

## 七、设计原则总结

```v
// 最少的代码，最多的可能性
// 5个关键字 = 无限种认知程序
// 1种类型   = 万物皆向量
// 5种操作   = 所有认知过程
// 3层记忆   = 永不遗忘的智能
```

> **设计者**: 妈祖 & 主人
> **日期**: 2026-06-06
> **版本**: 0.1 草案
