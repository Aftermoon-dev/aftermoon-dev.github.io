---
title: "Java BigDecimal을 기반으로 개발에서 정확한 소숫점 (Decimal Point) 다루는 방법 알아보기"
date: 2026-08-09 13:00:00 +0900
categories: [Decimal, Decimal Point, Floating Point, BigDecimal, Java]
---
# 소수란?
**소수**는 일상에서도 많이 사용되는 수를 표현하는 방식 중 하나다.

오랜만에 **소수**의 정의가 정확히 무엇인가를 짚어보려고 찾아보니, [국립국어원 표준국어대사전](https://stdict.korean.go.kr/search/searchView.do?word_no=444572&searchKeywordTo=3#)에서는 **소수**를 아래와 같이 정의하고 있다.
```text
일의 자리보다 작은 자리의 값을 가진 수. 예를 들면 0.1, 0.23, 4.2, 35.67 따위이다.
```

소수의 예시도 생각나는 걸 정리해보면 아래와 같다.
- 우리나라의 원 (￦) 단위는 평소에 소수로 잘 안 쓰지만, 미국 달러 ($)는 소수로 쓴다. (ex: $1.50)
- 시간을 표현할 때도 1시간 30분을 간단하게 1.5시간이라고 소수로 나타낸다.

이렇듯 일상 속에서는 소수를 되게 자연스럽게, 많은 곳에 사용하고 있다.

여기서 짚고 넘어가야 할 부분이 하나 있는데, **소수**는 수학적으로 **실수(實數)**를 표기하는 방식 중 하나라는 점이다. 실수는 유리수와 무리수를 모두 포함하는 수 전체 집합이고, 소수는 그 실수를 소수점을 이용해 표기한 형태다. 즉 "소수를 다룬다"는 것은 결국 "정수가 아닌 실수를 다룬다"는 것과 같은 의미이며, 앞으로 이 글에서 다루는 float, double 같은 자료형들도 정확히는 **실수를 표현하기 위한 자료형**이다.

# 개발에서 실수를 다루는 방식
개발에서 일반적으로 실수를 다룬다고 했을 때, 바로 떠오르는 자료형은 **float**, **double**같은 자료형들이 있다.

이 두 자료형은 **부동소수점 (Floating Point)** 방식을 사용하여 소수점을 나타내는 방식이다.
- **부동소수점 (Floating Point)**의 부동은 **뜰 부**와 **움직일 동**이라는 한자를 쓰고 있다. 해석하면 **소수점이 고정되어 사용되는 것이 아닌 떠서 다닌다** 라는 의미를 가진다.

이러한 부동소수점 방식 외에도, 고정되어서 사용하는 **고정소수점** 방식도 존재한다.

## 소수점 표현 방식 (고정소수점 vs. 부동소수점)
두 표현 방식의 개념을 먼저 잡고 가보겠다.

### 고정소수점 (Fixed Point)
- 정수부/소수부의 자릿수를 미리 고정해서 저장하는 방식이다.
    - 예: 8bit로 소수점을 저장한다고 했을 때, 4bit는 정수부, 4bit는 소수부 저장하겠다고 정의
- 소수점 위치가 항상 같은 자리에 말 그대로 **고정**되어 있다.
- 이렇게 했을 때 문제는, **<u>딱 정해진 공간만 쓸 수 있어 아주 큰 수나, 혹은 반대로 아주 작은 수를 저장하기가 어려워진다.</u>**

### 부동소수점 (Floating Point)
- 부호 (Sign)와 가수 (Mantissa), 지수 (Exponent)로 나눠서 저장하는 방식이다.
- 지수부의 값에 따라서 소숫점의 위치가 바뀔 수 있다. -> 이를 **부동**하다고 보는 것이다.
- 같은 비트 수를 쓰더라도 지수부 덕분에 아주 큰 수부터 아주 작은 수까지 넓은 범위를 표현할 수 있다. 대신 유효숫자(가수)의 자릿수는 한정되어 있어 값이 커질수록 정밀도는 떨어진다.
- 이러한 부동소수점은 일반적으로 [**IEEE 754**](https://standards.ieee.org/ieee/754/6210/) 표준에 따라 주로 구현되어 있다.

#### IEEE 754가 정의하는 부동소수점 타입들
IEEE 754는 정밀도(비트 수)에 따라 여러 형식을 정의하고 있다. Java의 `float`, `double`이 각각 아래 표의 **Single**, **Double** 형식에 대응한다.

| 형식 | 전체 비트 | Sign | Exponent | Mantissa | Bias | Java 대응 |
|---|---|---|---|---|---|---|
| Half (binary16) | 16bit | 1 | 5 | 10 | 15 | - |
| Single (binary32) | 32bit | 1 | 8 | 23 | 127 | `float` |
| Double (binary64) | 64bit | 1 | 11 | 52 | 1023 | `double` |
| Quadruple (binary128) | 128bit | 1 | 15 | 112 | 16383 | - |

- **Exponent** 비트가 늘어날수록 표현 가능한 값의 범위(지수 범위)가 넓어진다.
- **Mantissa** 비트가 늘어날수록 유효숫자가 늘어나 정밀도가 높아진다.
- 앞서 손으로 계산한 예제는 이 중 **Single (32bit)** 형식 기준이다.

#### IEEE 754 32bit(float) 비트 구성
```text
[1bit 부호] [8bit 지수] [23bit 가수]
  S          EEEEEEEE   MMMMMMMMMMMMMMMMMMMMMMM
 31         30      23  22                    0
```

값은 아래 공식으로 계산된다.
```text
값 = (-1)^S × 1.M × 2^(E - 127)
```
- **S (Sign)**: 0이면 양수, 1이면 음수
- **E (Exponent)**: 실제 지수에 127(bias)을 더해서 저장한다. 음수 지수도 표현하기 위함이다.
- **M (Mantissa)**: 가수. 정규화 시 맨 앞자리는 항상 1이므로 (Implicit Leading Bit) 이 1은 저장하지 않고 소수부만 저장한다.

#### 0.1을 실제로 변환해보기
`0.1`은 2진수로 정확히 떨어지지 않는 무한소수다. 이 값이 `float`에 저장될 때 어떤 오차가 생기는지 직접 따라가보자.

1. `0.1`을 2진수로 변환하면 `0.0001100110011001100110011...` 처럼 `1100`이 무한히 반복된다.
2. 정규화(맨 앞자리를 1로 맞춤)하면 `1.100110011001100110011... × 2^-4` 형태가 된다.
3. 부호: 양수이므로 `S = 0`
4. 지수: 실제 지수 `-4`에 127을 더해 `E = 123` → 2진수로 `01111011`
5. 가수: `23bit`까지만 저장할 수 있어 나머지는 잘려나간다(반올림 발생). `10011001100110011001101`

이를 정리하면 실제로 메모리에 저장되는 비트는 아래와 같다.

| Sign | Exponent | Mantissa |
|---|---|---|
| 0 | 01111011 | 10011001100110011001101 |

무한히 반복되던 `1100`이 23bit에서 잘렸기 때문에, 이 비트를 다시 10진수로 복원하면 정확히 `0.1`이 아니라 `0.100000001490116119384765625`에 근접한 값이 나온다. 바로 이 잘림이 `0.1 + 0.2`가 `0.3`이 아닌 이유다.

## 왜 부동소수점 자료형을 Primitive Type으로 쓰게 됐을까?
위에서 얘기했던 것처럼, **float**과 **double**과 같이 많은 언어에서의 Primitive Type이 부동소수점 방식을 택하게 된 이유는, 최대한 메모리에서의 bit 공간을 아끼면서 넓은 범위의 실수를 표현하기 위해서이다.

**IEEE 754**가 처음 제정되었던 1985년은 지금처럼 메모리 여유가 많지 않은 시대였다. 고정된 32bit, 64bit라는 좁은 공간 안에서 과학/공학 계산에 필요한 아주 큰 수부터 아주 작은 수까지 모두 표현해야 했고, 부동소수점의 지수부 구조가 이 요구에 가장 잘 맞았다.

좀 더 구체적으로는 아래와 같은 이유들이 있다.

- **표현 범위 대비 메모리 효율**: 고정소수점은 정수부/소수부 자릿수를 미리 못박아두기 때문에, 아주 큰 수와 아주 작은 수를 동시에 다루려면 그만큼 비트 수를 많이 확보해둬야 한다. 부동소수점은 지수부 덕분에 같은 비트 수로도 훨씬 넓은 범위(예: `double`은 약 10^-308 ~ 10^308)를 표현할 수 있다.
- **하드웨어 (FPU) 지원**: IEEE 754가 표준으로 자리 잡으면서 CPU 제조사들이 이 형식을 그대로 처리하는 **FPU (Floating Point Unit)**를 하드웨어 차원에서 만들었다. 덕분에 덧셈/곱셈 같은 연산이 CPU 명령어 한 번으로 끝나 매우 빠르다. 반면 임의 정밀도 소수(`BigDecimal` 같은)는 소프트웨어적으로 자릿수를 계산해야 해서 상대적으로 느리다.
- **이식성**: 표준화 이전에는 하드웨어를 만드는 회사, 혹은 각 기종마다 소수 표현 방식이 제각각이어서, 한 컴퓨터에서 계산한 결과가 다른 컴퓨터에서 달라지는 문제가 있었다. IEEE 754로 통일되면서 어떤 하드웨어/언어에서 계산하든 같은 값이 같은 비트로 저장된다는 것이 보장됐다.
- **과학/공학 계산과의 궁합**: 애초에 이 표준이 필요했던 배경 자체가 과학 계산(시뮬레이션, 그래픽스 등)이었고, 이런 분야는 아주 큰/작은 값을 다루되 약간의 오차는 감내 가능한 경우가 많다. 그래서 "정확도보다 범위와 속도"를 우선한 부동소수점이 기본 Primitive Type 자리를 차지하게 됐다.

## 부동소수점 자료형 사용의 문제점
위에서 실수를 다루기 위해 사용하는 방식들인 고정소수점과 주로 사용하고 있는 부동소수점이 어떤 방식으로 동작하고, 어떤 문제가 있을 수 있는지 대략적으로 알아봤다.

하지만, 항상 완벽한 방법은 없는 것처럼 부동소수점을 사용하기 어려운 분야도 존재한다.

특히 **금융**과 같이 한 치의 계산 오차를 허용할 수 없는 곳이 대표적인 예시이다.

그러한 곳은 고정소수점 방식을 통하여 그러한 오차를 최대한 줄이는 방식을 채택할 수밖에 없다.

이러한 문제를 해결하기 위해 Java에서는 고정소수점의 방식을 차용하여 소프트웨어적으로 구현한 **BigDecimal**이라는 자료형을 만들어냈다.

# BigDecimal
Java 공식 문서에 따르면, **BigDecimal**은 임의 정밀도 (Arbitrary-Precision)를 가진 부호 있는 *10진수*라고 정의하고 있다.
- **임의 정밀도 (Arbitrary-Precision)**: 숫자 크기와 상관 없이 메모리를 가변적으로 늘려가며 숫자를 자릿수 제한 없이 숫자를 처리할 수 있는 방식 (물론, 메모리가 허용하는 물리적인 크기까지 한정됨)

위의 소숫점 구현 방식들은 숫자를 *2진수*로 변환하여 사용했던 반면, **BigDecimal**은 *10진수* 방식을 그대로 사용한다.

**BigDecimal**은 두 가지 값으로 데이터를 나누어 저장한다.
- Unscaled Value: 소숫점을 제외한 정수 형태의 값으로, 임의 정밀도를 가져 무한히 커질 수 있다.
- Scale: 32비트 정수로, 소수점 이하의 자리 수를 나타낸다.

실제 실수를 기반으로 저장되는 방식을 보면 아래와 같다.

`29.99`라는 값을 예로 들어보면, `new BigDecimal("29.99")`는 내부적으로 아래와 같이 두 값으로 쪼개서 저장된다.

| 값 | Unscaled Value | Scale |
|---|---|---|
| `29.99` | `2999` | `2` |

값을 복원하는 공식은 아래와 같다.
```text
값 = Unscaled Value × 10^(-Scale)
```

`29.99`를 예로 대입해보면
```text
2999 × 10^(-2) = 2999 / 100 = 29.99
```

즉 소수점을 없앤 정수 `2999`를 그대로 저장해두고, "이 정수에서 소수점을 왼쪽으로 2칸 옮겨서 읽어라"는 의미로 `Scale = 2`만 별도로 들고 있는 것이다. 소수점 이하 값도 결국 정수 연산으로 처리되기 때문에, `float`/`double`처럼 2진수로 변환하는 과정에서 발생하는 손실이 없다.

여기서 **Scale**은 값마다 다르게 가질 수 있다는 점이 눈여겨볼 부분이다. 예를 들어 `29.9`는 `Unscaled Value = 299`, `Scale = 1`로 저장되고, `29.990`은 `Unscaled Value = 29990`, `Scale = 3`으로 저장된다. 자릿수를 미리 못박아두는 전통적인 고정소수점과 달리, BigDecimal은 인스턴스마다 필요한 만큼 Scale을 유동적으로 가져간다는 차이가 있다.

그냥 간단하게 한 문장으로 정리하자면 소숫점 숫자를 그대로 들고있지 않고 실수에서 소숫점을 빼버린 그냥 정수로만 들고있고 (Unscaled Value), 그와 함께 소숫점 위치 정보를 들고 있게 해서 (Scale) 필요할 때마다 위에서의 연산을 거쳐 값을 사용하는 방식인 것이다.

실제로 Java 코드로 확인해보면 아래와 같다.

```java
    BigDecimal a = new BigDecimal("29.99");
    System.out.println(a);
    System.out.println(a.unscaledValue());
    System.out.println(a.scale());
```

```
> Task :Main.main()
29.99
2999
2
```

## double vs BigDecimal 비교
이제 실제로 BigDecimal로 했을 때 정말 정밀하게, 오차 없이 잘 계산되는지 확인해보자.
```java
System.out.println(0.1 + 0.2);

BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));
```

```text
> Task :Main.main()
0.30000000000000004
0.3
```

위처럼, 그냥 바로 double끼리 더해서 출력하니 생각과는 다른 `0.30000000000000004`가, BigDecimal끼리 더한 경우에는 정확하게 `0.3`이 나오는 것을 볼 수 있다.

## 정확도가 높은데 왜 기본으로 BigDecimal을 쓰지 않을까?
BigDecimal은 위에서 봤던 것처럼 실수 그 자체를 저장하는 것이 아닌, 그 실수를 만들기 위한 재료들을 들고있고 필요하면 연산해서 그 수를 만들어내는 방식이다.

그렇기에 BigDecimal을 사용하면 값을 그냥 저장해둔 double, float와 다르게 연산 오버헤드가 발생할 수밖에 없다.
- double/float은 그냥 CPU 레지스터에 값을 넣어두고, 하드웨어 명령어 한 번이면 연산이 끝난다.
- BigDecimal은 Object Type이기 때문에 매 번 새 인스턴스를 만들고, 내부 다중정밀도 연산을 거쳐야한다.

그렇기에 정확도보다는 연산 속도가 빨라야 하는 곳 (그래픽 렌더링, 대규모 통계/머신러닝 등)에서는 기존의 double, float을 사용하는 것이 합리적이다.

## 사용할 때 주의해야 할 사항
### BigDecimal을 초기화할 때 double/float를 그냥 사용하면 의미가 없어진다
위에서 얘기했던 것처럼, BigDecimal은 double/float과 다르게 정확한 실수를 담을 수 있는 자료형이다.

그런데, 이걸 초기화할 때 그냥 `new BigDecimal(29.99)`를 해버리면, 정밀도가 낮은 double `29.99` 값을 넣어버리는 셈이라 예상했던 것과 다른 결과가 나온다.

만약 double 값을 정확하게 BigDecimal로 변환하고 싶다면, `BigDecimal.valueOf()`를 사용하면 내부에서 `toString()`을 사용해 오차를 보정해주는 로직을 탈 수 있도록 써야한다.

아래 실제 코드 결과를 보자.

```java
    BigDecimal a = new BigDecimal(29.99);
    BigDecimal b = new BigDecimal("29.99");
    BigDecimal c = BigDecimal.valueOf(29.99);
    System.out.println(a);
    System.out.println(b);
    System.out.println(c);
```

```
> Task :Main.main()
29.989999999999998436805981327779591083526611328125
29.99
29.99
```

위와 같이 바로 `BigDecimal a = new BigDecimal(29.99)`를 써버리면, 예상과 다른 숫자가 나오게 된다.

### BigDecimal의 연산
BigDecimal은 Primitive Type이 아니기 때문에, 그냥 기존처럼 `+`, `-`, `*`, `/`와 같은 연산자를 바로 쓸 수 없다.

아래처럼 각 메서드를 통해 수행해야 한다.
- 덧셈: `.add()`
- 뺄셈: `.subtract()`
- 곱셈: `.multiply()`
- 나눗셈: `.divide()`

**주의: BigDecimal은 Immutable Object (불변 객체)이므로 연산 결과는 새로운 Object로 반환된다.**

#### 덧셈 / 뺄셈 / 곱셈
덧셈 / 뺄셈 / 곱셈은 아래처럼 실행할 수 있다.
```java
    BigDecimal a = new BigDecimal("0.1");
    BigDecimal b = new BigDecimal("0.2");

    System.out.println(a.add(b)); // 덧셈
    System.out.println(a.subtract(b)); // 뺄셈
    System.out.println(a.multiply(b)); // 곱셈
```

```
> Task :Main.main()
0.3
-0.1
0.02
```

#### 나눗셈
덧셈 / 뺄셈 / 곱셈과 다르게 나눗셈은 그냥 사용하면, 연산 값이 **무한소수**가 되었을 때 `ArithmeticException`가 발생할 수 있다.

BigDecimal이 임의 정밀도를 가진다지만, **무한소수**는 자릿수가 끝없이 이어지기 때문에 유한한 Unscaled Value로는 애초에 정확히 표현할 수 없다. 그렇다고 임의로 잘라서 근사값을 반환하면 **정확한 값**을 보장한다는 BigDecimal의 존재 이유가 깨지기 때문에, 예외를 던져 개발자가 직접 자릿수(Scale)와 반올림 방식(RoundingMode)을 명시하도록 해서 개발자가 의도하지 않은 결과가 나오는 것을 방지한다.

그렇기에, 나눗셈을 할 때에는 소숫점을 얼마나 허용할 것인지 (Scale)과 반올림 모드 (Rounding Mode)를 지정하는 것이 안전하다.

```java
    BigDecimal a = new BigDecimal("0.6");
    BigDecimal b = new BigDecimal("0.5123321");
    System.out.println(a.divide(b, 3, RoundingMode.HALF_UP));
    System.out.println(a.divide(b, 4, RoundingMode.HALF_UP));
    System.out.println(a.divide(b, 5, RoundingMode.HALF_UP));
```

```
> Task :Main.main()
1.171
1.1711
1.17112
```

#### RoundingMode
RoundingMode는 말 그대로, 올림/내림/반올림 등 정해진 Scale을 초과하는 경우 어떻게 처리할 것인지를 정의하는 것이다.

`java.math.RoundingMode`는 아래와 같은 값들을 제공한다.

| 값 | 설명 |
|---|---|
| `UP` | 절댓값이 커지는 방향(0에서 먼 방향)으로 올림 |
| `DOWN` | 0에 가까운 방향으로 버림 |
| `CEILING` | 항상 양의 무한대 방향으로 올림 |
| `FLOOR` | 항상 음의 무한대 방향으로 버림 |
| `HALF_UP` | 반올림, 딱 5일 때는 올림 (일상적으로 흔히 쓰는 반올림) |
| `HALF_DOWN` | 반올림, 딱 5일 때는 버림 |
| `HALF_EVEN` | 반올림, 딱 5일 때는 결과가 짝수가 되는 방향으로 처리 (Banker's Rounding) |
| `UNNECESSARY` | 반올림이 필요 없다고 단언. 만약 나머지가 남으면 `ArithmeticException` 발생 |

특히 `HALF_UP`과 `HALF_EVEN`의 차이가 헷갈리기 쉬운데, 딱 중간값(5)이 걸렸을 때 어느 쪽으로 반올림하느냐에서 갈린다.
- `HALF_UP`은 중간값(5)마다 항상 올리기만 하기 때문에, 계산을 수없이 반복하면 결과값이 조금씩 커지는 쪽으로 누적될 수 있다.
- `HALF_EVEN`은 중간값일 때 올림/버림을 번갈아 상쇄시켜서 이런 누적 오차를 줄여준다.
    - 그래서 금융 계산에서는 `HALF_UP`보다 `HALF_EVEN`을 권장하는 경우가 많다 보니, **Banker's Rounding**이라는 별칭이 붙게 되었다고 한다.

```java
    BigDecimal a = new BigDecimal("2.5");
    BigDecimal b = new BigDecimal("3.5");

    System.out.println(a.setScale(0, RoundingMode.HALF_UP));   // 3
    System.out.println(b.setScale(0, RoundingMode.HALF_UP));   // 4

    System.out.println(a.setScale(0, RoundingMode.HALF_EVEN)); // 2
    System.out.println(b.setScale(0, RoundingMode.HALF_EVEN)); // 4
```

#### 소수점 자리수(Scale) 지정하기
굳이 나눗셈을 할 때가 아니어도 `setScale()`로 언제든 원하는 최대 소수점 자리수를 지정할 수 있다.

기존에 저장된 값을 그대로 유지하면서 자릿수만 늘리거나 줄이는 것으로, 늘릴 때는 뒤에 `0`을 채우고, 줄일 때는 지정한 `RoundingMode`에 따라 반올림/반내림 등이 일어난다.

```java
    BigDecimal a = new BigDecimal("29.99");

    System.out.println(a.setScale(4));                       // 29.9900
    System.out.println(a.setScale(1, RoundingMode.HALF_UP));  // 30.0
    System.out.println(a.setScale(0, RoundingMode.DOWN));     // 29
```

```
> Task :Main.main()
29.9900
30.0
29
```

주의할 점은, 자릿수를 줄이는데 `RoundingMode`를 지정하지 않으면 (`setScale(int)` 한 인자만 있는 오버로드) 내부적으로 `UNNECESSARY`가 적용된다는 것이다. 즉 버려지는 자릿수에 값이 남아있으면 예외가 발생한다.

```java
    BigDecimal a = new BigDecimal("29.99");
    System.out.println(a.setScale(1)); // ArithmeticException: Rounding necessary
```

그래서 어떤 값이 들어올지 알 수 없는 상황(예: 사용자 입력, 외부 API 응답)에서 자릿수를 줄여야 한다면, 항상 `RoundingMode`를 함께 지정해줘야 예외 없이 안전하게 처리할 수 있다.

주로 결제 금액처럼 소수점 둘째 자리까지만 다뤄야 하는 도메인에서는, 값을 저장하거나 반환하기 직전에 `setScale(2, RoundingMode.HALF_UP)`처럼 Scale을 명시적으로 고정해두는 패턴을 많이 사용한다.

# Java 외 언어에서 실수를 다룰 땐?
지금까지 살펴본 문제(부동소수점의 오차)와 해결 방식(정수 + 소수점 위치를 별도로 저장)은 Java만의 이야기가 아니다. 다른 언어들도 각자 방식으로 같은 문제를 해결하고 있다.

### Python
Python의 `float`도 Java의 `double`과 동일하게 IEEE 754 64bit 방식을 사용한다. 그래서 Python에서도 `0.1 + 0.2`는 `0.30000000000000004`가 나온다.

정확한 소수 연산이 필요하면 표준 라이브러리인 `decimal` 모듈의 `Decimal`을 사용하면 된다. 내부적으로 BigDecimal과 유사하게 정수 값과 소수점 위치(지수)를 함께 들고 있는 방식이다.

```python
from decimal import Decimal

print(0.1 + 0.2)                    # 0.30000000000000004
print(Decimal("0.1") + Decimal("0.2"))  # 0.3
```

### JavaScript
JavaScript는 애초에 정수/실수 구분 없이 숫자 타입이 `Number` 하나뿐인데, 이 `Number`가 IEEE 754 64bit(double)로 구현되어 있다. 그래서 정수 계산에서도 부동소수점 오차 문제가 생길 수 있고, `0.1 + 0.2`도 마찬가지로 `0.30000000000000004`가 나온다.

문제는 Java의 BigDecimal, Python의 Decimal 같은 정확한 소수 연산용 표준 타입이 언어 자체에는 없다는 점이다. 그래서 보통 `decimal.js`, `big.js` 같은 서드파티 라이브러리를 사용한다.

```js
console.log(0.1 + 0.2); // 0.30000000000000004

const Decimal = require("decimal.js");
console.log(Decimal("0.1").plus("0.2").toString()); // 0.3
```

### SQL
SQL(RDBMS 표준)은 반대로 처음부터 정확한 소수를 위한 타입이 기본 제공된다. `DECIMAL(precision, scale)` (`NUMERIC`도 동일)이 그것으로, 이름에서 알 수 있듯 정수부+소수부 자릿수(precision)와 소수점 이하 자릿수(scale)를 미리 지정해서 저장하는 고정소수점 타입이다. 즉 BigDecimal의 Unscaled Value + Scale 구조와 사실상 같은 개념을 컬럼 정의 단계에서 강제하는 것이다.

```sql
CREATE TABLE product (
    price DECIMAL(10, 2) -- 정수부 최대 8자리 + 소수부 2자리
);
```

반대로 부동소수점이 필요하면 `FLOAT`, `REAL`, `DOUBLE PRECISION` 같은 타입을 쓸 수 있는데, 금액 같은 컬럼에는 이 타입들을 쓰면 안 된다. 정확도가 생명인 금액/수량 컬럼은 항상 `DECIMAL`/`NUMERIC`을 쓰는 것이 정석이다.

# References
- [Double (Java SE 21 & JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Double.html)
- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (David Goldberg)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)
- [BigDecimal (Java SE 21 & JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html)
