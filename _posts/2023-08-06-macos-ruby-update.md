---
title: "[macOS, Ruby] macOS에서 최신 버전의 Ruby 설치하고 활성화하기"
date: 2023-08-06 16:09:00 +0900
categories: macOS Ruby
---

GitHub Pages와 Jekyll를 사용한 블로그를 새로 세팅하면서, 테스트를 위해 Local 환경에서 Bundle과 Jekyll를 설치하려고 했더니 현재 설치된 Ruby 버전이 낮아 설치되지 않는 에러가 발생하였다.

맥 기본으로 설치되어 있는 Ruby가 2.6.10p210 버전이었는데, 작년 4월 버전인 것 같다. ([https://www.ruby-lang.org/en/news/2022/04/12/ruby-2-6-10-released/](https://www.ruby-lang.org/en/news/2022/04/12/ruby-2-6-10-released/))

![macOS Ruby Default Version](/assets/_posts/2023-08-06-macos-ruby-update/ruby_version.png)

그래서 어떻게 하면 Ruby를 업데이트 할 수 있는지 찾아본 결과를 아래에 정리해본다.

## Homebrew를 이용하여 rbenv 설치하기
최근에는 rbenv라는 애플리케이션으로 Ruby 버전을 관리하는 것이 일반적인 것 같다. (아주 예전에 rvm이라는걸 본 적 있었던 것 같은데 이젠 이걸 많이 쓰는 듯 하다.. ~~점점 옛날사람이 되어가는건가~~)
rub
rbenv를 쉽게 설치하려면, Homebrew를 이용하는게 가장 쉬운 것 같다.

나는 Homebrew를 macOS 초기 세팅할 때부터 설치를 해놨어서, 여기서는 별도로 Homebrew 설치를 다루진 않고 넘어가도록 하겠다.

우선 rbenv를 설치하기 전에, Homebrew가 사용하고 있는 저장소들의 최신 정보를 불러오기 위해 update 명령어를 실행한다.
```shell
brew update
```

update 명령어가 끝나면, 아래 명령어로 rbenv를 설치한다.
```shell
brew install rbenv
```

## rbenv에서 설치한 Ruby를 사용할 수 있도록 환경변수 설정하기
단순히 rbenv 설치를 완료한다고 즉시 rbenv를 통해 설치한 Ruby를 바로 사용할 수는 없다.

왜냐하면, macOS에서 기본으로 설치되어 있는 Ruby가 기본적으로 `ruby` 명령어에 매핑되어 있기 때문이다.

자신이 사용하고 있는 Shell의 환경변수 설정이 먼저 이루어져야 rbenv에서 설치한 Ruby를 사용할 수 있다.

rbenv에서는 이를 사용자들이 쉽게 설정할 수 있도록 `init` 명령어를 제공하고 있다.
```shell
rbenv init
```

해당 명령어를 입력하면, (아마도) 현재 사용중인 Shell에 맞는 환경변수 적용 방법을 출력해서 보여준다.

![rbenv init](/assets/_posts/2023-08-06-macos-ruby-update/rbenv_init.png)

이미지에서 보이는 것처럼 나는 zsh를 사용하고 있기 때문에 `.zshrc` 파일에다가 `eval "$(rbenv init - zsh)"`을 추가해야 한다.

(다른 Shell이어도 비슷하겠지만 아래는 zsh 기준으로 작성하였다)

두 가지 방법이 존재하는데,

1. vim 에디터로 `.zshrc`를 열고 수정

    a. vim으로 나의 홈 디렉토리의 `.zshrc`를 열고
    ```shell
    vim ~/.zshrc
    ```

    b. 아래 내용을 맨 아래줄로 이동해서 복사하고, 저장하고 종료 (wq)
    ```shell
    eval "$(rbenv init - zsh)"
    ```

    c. 터미널을 종료하고 다시 열거나, 아래 명령어로 신규 환경변수 반영 (택 1)
    ```shell
    source ~/.zshrc
    ```


2. `echo` 명령어와 `>>` 연산자로 파일 맨 아래에 넣는 방법

    <b><span style="color: red">해당 연산자를 잘못 사용하면 `.zshrc` 내용이 통째로 날아갈 수 있으니 사용에 주의해야 한다.</span></b> ~~(사실 내가 날려먹어서 쓴 주의사항이다..)~~

    ```shell
    cp .zshrc .zshrc-backup # .zshrc 파일 백업
    echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc # .zshrc 파일 맨 아랫줄에 rbenv init 명령어 삽입
    source ~/.zshrc # 신규 환경변수 반영
    ```

이렇게 하면 이제 터미널을 열 때 rbenv의 초기화가 항상 이루어져서, rbenv에서 터미널의 Ruby 버전을 제어하게 된다.

## rbenv로 최신 버전의 Ruby 설치하기
rbenv에서 현재 설치에 사용할 수 있는 버전을 확인하려면 아래 명령어를 입력해야 한다.
```shell
rbenv install -l
```
![rbenv install -l](/assets/_posts/2023-08-06-macos-ruby-update/rbenv_install.png)

install은 설치 옵션이고, -l은 아마 list를 줄여서 쓰는거니 해석하면 rbenv에서 설치할 수 있는 목록을 출력하라는 의미다.

이제 여기서 가장 최신 버전으로 보이는 3.2.2를 설치하려면, 앞서 작성했던 install 명령어에서 -l 대신 버전명을 입력하면 된다.

**최신버전은 이 글을 보는 시점에 따라 달라질 수 있으니, 꼭 위의 명령어를 통해 가장 최신 버전을 확인하는 것이 좋다.**

```shell
rbenv install 3.2.2
```

이 후 설치한 버전을 전역적으로 사용하려면, `rbenv global` 명령어로 설정이 필요하다.
```shell
rbenv global 3.2.2
```

이렇게 하면 이제 rbenv를 통해 설치한 최신 버전의 Ruby를 사용할 수 있다!

## References
[https://codecamper.me/blog/122/](https://codecamper.me/blog/122/)