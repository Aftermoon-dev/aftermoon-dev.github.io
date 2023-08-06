---
title: "[Nginx] Nginx 서브도메인 별 설정 파일 나누기"
date: 2022-06-28 09:00:00 +0900
categories: Nginx
---

> 이 글은 [UMC (University MakeUs Challenge)](https://makeus.in/umc) 활동 중 부원들과 개발 지식을 나누기 위해 작성했던 글을  일부 수정하여 블로그로 옮겨온 글입니다. 

Nginx에서 서브도메인 (www, prod, dev…)를 적용할 때, `/etc/nginx/sites-available/default` 파일에 모두 한 번에 작성해 연결하는 경우가 많았습니다.

그러나 점점 서브도메인이 많아질 경우 단일 파일에 모든 서브도메인 정보를 작성하면, 파일이 너무 복잡해져 에러가 발생하면 걷잡을 수 없게 되는 경우가 발생할 위험이 있습니다.

이번 글에서는 `default` 파일을 수정하지 않고, 추가로 파일을 만들어 서브도메인 연결 정보를 작성해 이를 통해서 관리하는 방법을 배워보도록 합니다.

## 원리
nginx의 `sites-available` 폴더는 서버 블록들의 정보가 담겨있는 파일들을 저장하는 폴더로, `default` 파일의 경우에는 기본값에 대한 설정을 지정하는 파일입니다.

서버 블록 설정 파일의 경우에는 여러 개가 가능하고 정해진 파일명 규칙은 없습니다.

그러나, 해당 폴더에서 파일을 생성하기만 하면 적용이 되지 않으며 `sites-enabled` 폴더에 Symbolic Link (윈도우의 바로가기 역할 느낌)로 연결해야만 실제로 nginx에 반영이 이루어집니다.

## 방법
- **기존에 default 파일에 적용하려는 서브도메인에 대한 설정이 적혀있다면, 해당 부분을 제거하고 진행해주세요.**
- 기존에 SSL 인증서를 적용했다면, 다시 한 번 적용을 해보시는 것을 추천합니다.

### 1. 새로운 파일 만들기
- `/etc/nginx/sites-available/` 에 새로운 텍스트 파일을 생성합니다.
    - NANO, VIM 등 자신이 편한 에디터를 사용하시면 됩니다.
    - `.txt` 등의 확장자는 따로 필요 없습니다.
    - 파일 이름은 자유지만, 어떤 도메인인지 확인할 수 있는 이름을 적어주세요. **(본인 확인 목적도 있지만, 협업시에 모든 서버 개발자들이 확인할 수 있어야 합니다)**
        - 권장: 연결하려는 도메인 풀 네임 (예: 연결할 도메인이 `prod.aftermoon.dev` 일 경우 파일 이름도 `prod.aftermoon.dev``)
    
            
### 2. 파일 내용 입력
- `default`에서 작성했던 것과 똑같은 형태로 아래와 같이 서브도메인의 정보, 연결할 폴더 등을 작성해주고 파일을 저장합니다.
    * Reverse Proxy 등의 추가적인 내용은 자신의 환경에 따라 변경하여 작성해야 합니다.

```
server {
        server_name 도메인명;

        root /var/www/dev;
        index index.html;

        location / {
                try_files $uri $uri/ =404;
        }
}
```

### 3. Symbolic Link (바로가기 생성)

- 아래 명령어를 입력하여 `sites-enabled` 폴더에 바로가기를 생성해 해당 설정 파일을 nginx가 읽을 수 있도록 해줍니다.
    
    ```bash
    sudo ln -s /etc/nginx/sites-available/작성파일명 /etc/nginx/sites-enabled
    ```
    
    - `ln` 명령어 : Link를 의미하는 명령어로, 바로가기를 생성합니다.
        - `-s` 옵션 : Symbolic Link (바로가기) 형태로 만들겠다고 선언
            - 원본이 삭제되면 파일을 사용할 수 없음

### 4. Nginx Reload

- 아래 명령어를 입력하여 새로운 설정파일을 nginx가 읽어들이도록 함
    
    ```bash
    sudo service nginx reload
    ```
    
    - 만약 해당 명령어가 실패한다면, `sites-available` 에서 작성한 내용에 오류가 있을 경우가 높으니 다시 한 번 문법을 점검해보시기 바랍니다.