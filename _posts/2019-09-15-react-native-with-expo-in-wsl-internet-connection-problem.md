---
title: "[React Native] WSL에서 Expo를 통한 React Native시 인터넷 접속이 끊기는 문제"
date: 2019-09-15 01:39:00 +0900
categories: ReactNative
---

WSL (Windows Subsystem For Linux) 에서 Expo를 통해 React Native를 개발하다가, 인터넷 연결은 제대로 되어있는데 사용이 불가능한 경우가 생긴다.

아무래도 일종의 버그인 것 같은데, (2019년 9월 15일 기준으로) 언제 해결될지는 모르겠지만 재부팅을 하면 돌아온다.

이 글에서는 재부팅을 하지 않고도 이를 해결할 수 있는 방법을 설명하려고 한다.

-----------------------

1. Windows 키 + R키를 눌러 실행 창을 띄우고 **"services.msc"** 입력 (서비스 창 실행)

2. 뜬 창에서 LxssManager를 찾아 **서비스 재시작** 클릭.

3. 기다린 후 사용하면 인터넷을 정상적으로 사용할 수 있음.
