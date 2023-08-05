---
title: "[Ubuntu, MariaDB] /tmp/mysql.sock 에러 해결"
date: 2021-07-19 17:04:00 +0900
categories: Ubuntu MariaDB
---

최근 개발 중에 MariaDB 서버를 이용할 일이 있어 사용중인데, 연결시에 ERROR 2002 문제가 발생했다. 

```
2002, "Can't connect to local MySQL server through socket '/tmp/mysql.sock' (2)"
```
이 에러는 서버 데몬이 동작하지 않거나, /tmp/mysql.sock 위치에 MariaDB (MySQL) Socket File이 존재하지 않아서 발생하는 문제인데,

서버 데몬이 멈춰있는 거라면 단순하게 sudo service mysqld start 명령어를 통해 실행하면 되지만 나의 경우에는 Socket File이 존재하지 않는 케이스였다.

이 문제는 이전에도 겪어본 적 있어서 해결책을 기억하고 있긴 하지만 혹시나 해서 글로 다시 작성하려고 한다.

### 방법 1
MariaDB의 기본 소켓 파일 위치인 /var/run/mysqld/mysqld.sock을 Symbolic Link를 만들어 주는 것이다.

```
sudo ln -s /var/run/mysqld/mysqld.sock /tmp/mysql.sock
```

이렇게 하고 다시 실행하면 잘 작동한다.

그러나 이 방법의 문제점은 재부팅하면 Symbolic Link 파일이 날아간다.

### 방법 2
1번 방법과 달리 이 방법은 계속 지속되는데, 바로 MariaDB 설정 파일에서 Socket File의 위치를 변경해주는 것이다.

다만 설정 파일을 건드리는 것이기 때문에 주의해서 작업해야 한다 (잘못 작업해서 생기는 문제는 책임지지 않음)

해당 작업은 root 계정으로 진행해야 한다.

우선 설정 파일을 열어야 한다. 서버 설정 파일인 '50-server.cnf'를 연다.

나의 경우에는 vim으로 열었다.
```
vim /etc/mysql/mariadb.conf.d/50-server.cnf
```

해당 파일을 열어보면 Basic Settings 부분에 socket 부분이 있다.
기본적으로는 아래와 같이 적혀있는 것 같다.

```
...
socket                  = /run/mysqld/mysqld.sock
...
```

여기서 run/mysqld/mysqld.sock 를 지우고 /tmp/mysql.sock로 변경하고 저장한다.

그리고 서버 데몬을 재시작한다
```
service mysqld restart
```

그리고 실행하면 정상적으로 사용이 가능하다.
