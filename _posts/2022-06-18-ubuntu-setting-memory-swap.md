---
title: "[Ubuntu] 메모리 Swap 설정하기"
date: 2022-06-18 09:00:00 +0900
categories: Ubuntu
---

> 이 글은 [UMC (University MakeUs Challenge)](https://makeus.in/umc) 활동 중 부원들과 개발 지식을 나누기 위해 작성했던 글을  일부 수정하여 블로그로 옮겨온 글입니다. 

# 메모리 Swap 설정하기
대부분 처음 서버 공부를 시작하실 때, 가격 부담이 없는 무료 요금제 (ex. AWS 프리티어 등)을 이용하고 계실 겁니다.

그러나 이러한 무료 요금제들은 메모리 용량이 크지 않기 때문에, 백엔드 서버를 가동할 경우 거의 모든 메모리를 사용하게 되어 다른 작업을 하기에는 부담스러운 경우가 많습니다.

당장의 추가 요금을 매달 내는 것도 부담스러운 경우에는 남는 데이터 공간을 메모리처럼 사용하는 Swap 설정을 진행하면 실제 RAM보다는 느리지만 추가 메모리를 할당해줄 수 있습니다.

아래의 내용은 AWS EC2에서 설정할 때를 기준으로 작성하였지만, 명령어는 Ubuntu라면 동일하게 적용될 것입니다.

## 설정하기

### 1. Swap 파일 존재 여부 확인
- SSH에서 `free -m` 을 입력하여 기존에 설정되어 있는 Swap 확인

    ![free -m]({{site.baseurl | prepend: site.url}}/assets/posts/2022-06-18-ubuntu-setting-memory-swap/free.png)

    - 다음과 같이 Swap의 모든 항목이 0으로 나온다면 설정되지 않았으므로 계속 진행
    - 그렇지 않다면, Swap이 이미 적용된 상태 (굳이 따라하지 않으셔도 됩니다)
        - 만약 용량을 늘리고 싶다면, `/etc/fstab` 에서 Swap 파일 이름 (예: `/swapfile`)을 찾아서 Swap 적용 해제
            - 해제 명령어 : `sudo swapoff -v swap파일명`
            - 해제 완료 후, `/etc/fstab` 안에 있는 Swap 파일 관련 내용 주석처리하거나 삭제
                - 내용 예시 : `/swapfile swap swap defaults 0 0`
                - 다른 내용은 건드리지 않음

### 2. 서버 용량 확인
- SSH에서 `df -H` 를 입력하여 현재 용량 확인

    ![df -H]({{site.baseurl | prepend: site.url}}/assets/posts/2022-06-18-ubuntu-setting-memory-swap/df.png)
    
    - `/dev/root` 의 용량이 충분한지 확인
        - 전체 사이즈가 20GB 정도 있을 경우 설정하는 것을 추천하며, 20GB 이하일 경우 아래 글을 보고 용량 확장 필요
            - [EC2 EBS 확장 아마존 AWS 서버 용량 늘리기](https://vlog.tion.co.kr/ec2-ebs-%ED%99%95%EC%9E%A5-%EC%95%84%EB%A7%88%EC%A1%B4-aws-%EC%84%9C%EB%B2%84-%EC%9A%A9%EB%9F%89-%EB%8A%98%EB%A6%AC%EA%B8%B0/)
            - 프리티어의 최대 용량은 **30GB**이므로 그 이상 설정하면 요금이 부과될 수 있으니 주의하시기 바랍니다.

### 3. Swap 파일 생성하기
- 다음 명령어를 통해 디스크의 일부 용량을 차지하는 파일 생성
    - `sudo fallocate -l 4G /swapfile`
        - 4GB의 용량을 차지하는 파일을 생성
    - 혹시라도 다른 용량을 원한다면 4G부분을 수정하여 용량 변경 가능
        - ex. 2G, 8G…
- 명령어를 통해 Swap 파일에 대한 권한 변경하기
    `sudo chmod 600 /swapfile`
    
- 만든 파일을 Swap에 사용하도록 설정
    `sudo mkswap /swapfile`
    
- Swap 활성화
    `sudo swapon /swapfile`
    

### 4. Swap 적용 여부 확인
- `free -m` 으로 Swap 부분 확인
    
    ![free -m after Swap]({{site.baseurl | prepend: site.url}}/assets/posts/2022-06-18-ubuntu-setting-memory-swap/free_afterswap.png)

    - 정상적으로 적용되었다면 다음과 같이 Swap 부분이 0이 아닌, 용량 (MB) 단위로 바뀜

### 5. 부팅 시마다 자동 적용시키기
- `/etc/fstab` 파일 수정하기
    - 맨 아랫줄에 다음 내용 추가
        `/swapfile swap swap defaults 0 0`
        
- EC2 콘솔에서 인스턴스를 재시작시켜 4번과 똑같이 `free -m` 으로 Swap 적용 되었는지 확인

## References
- [https://crd.kr/2021/04/05/%EC%9A%B0%EB%B6%84%ED%88%AC-%EC%8A%A4%EC%99%91%ED%8C%8C%EC%9D%BCswapfile-%EC%83%9D%EC%84%B1-%EC%82%AD%EC%A0%9C/](https://crd.kr/2021/04/05/%EC%9A%B0%EB%B6%84%ED%88%AC-%EC%8A%A4%EC%99%91%ED%8C%8C%EC%9D%BCswapfile-%EC%83%9D%EC%84%B1-%EC%82%AD%EC%A0%9C/)